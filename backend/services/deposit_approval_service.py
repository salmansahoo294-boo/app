from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from models import Transaction, TransactionType, TransactionStatus
from services.wagering_service import new_wagering_record
from services.promotion_service import compute_first_deposit_108_bonus, get_first_deposit_108_config
from services.time_service import pk_date_str


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _create_wagering_for_bonus(db, user_id: str, source: str, source_id: str, amount: float):
    rec = new_wagering_record(
        user_id=user_id,
        source=source,
        source_id=source_id,
        principal_amount=float(amount),
        multiplier=35.0,
        priority=1,
    )
    await db.wagering.insert_one(rec)


async def _create_wagering_for_deposit(db, user_id: str, deposit_id: str, amount: float, multiplier: float):
    rec = new_wagering_record(
        user_id=user_id,
        source="deposit",
        source_id=deposit_id,
        principal_amount=float(amount),
        multiplier=float(multiplier),
        priority=2,
    )
    await db.wagering.insert_one(rec)


async def approve_deposit_apply_promotions(db, deposit: Dict[str, Any], admin_id: str) -> Dict[str, Any]:
    """Apply promotions, create wagering records, and credit single wallet balance."""

    user = await db.users.find_one({"id": deposit["user_id"]}, {"_id": 0})
    if not user:
        raise ValueError("User not found")

    deposit_amount = float(deposit["amount"])
    promo_key = deposit.get("promotion_key")

    bonus_amount = 0.0

    # Daily 8% first deposit bonus (optional)
    if promo_key == "daily_first_deposit_8":
        today = pk_date_str()
        last = user.get("daily_first_deposit_bonus_last_date")
        if last != today:
            bonus_amount = round(deposit_amount * 0.08, 2)
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"daily_first_deposit_bonus_last_date": today, "updated_at": _now_iso()}},
            )

    # First deposit lifetime bonus 108% (strict)
    if promo_key == "first_deposit_108":
        # If the deposit has this promotion key, it means it was eligible when created
        # The eligibility was already consumed at deposit creation time
        cfg = await get_first_deposit_108_config(db)
        bonus_amount = float(compute_first_deposit_108_bonus(deposit_amount, cfg))

    # Referral bonus etc will be applied elsewhere

    # Credit wallet (single display)
    wallet_before = float(user.get("wallet_balance", 0.0))
    wallet_after = wallet_before + deposit_amount + bonus_amount

    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "wallet_balance": wallet_after,
                "total_deposits": float(user.get("total_deposits", 0.0)) + deposit_amount,
                "updated_at": _now_iso(),
            }
        },
    )

    # Deposit wagering (randomized multiplier locked at request time)
    dep_mult = float(deposit.get("deposit_wagering_multiplier") or 3.0)
    await _create_wagering_for_deposit(db, user["id"], deposit["id"], deposit_amount, dep_mult)

    # Bonus wagering (35x)
    if bonus_amount > 0:
        await _create_wagering_for_bonus(db, user["id"], "bonus", f"{deposit['id']}:bonus", bonus_amount)

        # Track bonus in internal field (not shown separately in UI)
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$inc": {"bonus_balance": bonus_amount},
                "$set": {"updated_at": _now_iso()},
            },
        )

    # Deposit transaction
    deposit_tx = Transaction(
        user_id=user["id"],
        type=TransactionType.DEPOSIT,
        amount=deposit_amount,
        status=TransactionStatus.COMPLETED,
        description=f"Deposit approved (secure processing) - JazzCash {deposit['jazzcash_number']}",
        metadata={
            "deposit_id": deposit["id"],
            "promotion_key": promo_key,
            "deposit_wagering_multiplier": dep_mult,
            "bonus_amount": bonus_amount,
        },
        balance_before=wallet_before,
        balance_after=wallet_before + deposit_amount,
    )
    d = deposit_tx.model_dump()
    d["created_at"] = d["created_at"].isoformat()
    d["updated_at"] = d["updated_at"].isoformat()
    await db.transactions.insert_one(d)

    if bonus_amount > 0:
        bonus_tx = Transaction(
            user_id=user["id"],
            type=TransactionType.BONUS,
            amount=bonus_amount,
            status=TransactionStatus.COMPLETED,
            description=f"Bonus credited (secure processing) - {promo_key}",
            metadata={"deposit_id": deposit["id"], "promotion_key": promo_key},
            balance_before=wallet_before + deposit_amount,
            balance_after=wallet_after,
        )
        bd = bonus_tx.model_dump()
        bd["created_at"] = bd["created_at"].isoformat()
        bd["updated_at"] = bd["updated_at"].isoformat()
        await db.transactions.insert_one(bd)

    return {"wallet_after": wallet_after, "bonus_amount": bonus_amount, "deposit_multiplier": dep_mult}
