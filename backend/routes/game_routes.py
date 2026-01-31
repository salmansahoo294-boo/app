from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from auth import get_current_user, get_current_admin
from models import Bet, BetStatus, Transaction, TransactionType, TransactionStatus
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
import hashlib
import hmac
import secrets

router = APIRouter(prefix="/games", tags=["Games"])


def get_db() -> AsyncIOMotorDatabase:
    from server import db

    return db


# -------------------------
# Settings helpers (DB)
# -------------------------
DEFAULT_SETTINGS: Dict[str, Any] = {
    "currency": "PKR",
    "deposit_min": 300,
    "deposit_max": 50000,
    "withdraw_min": 300,
    "withdraw_max": 30000,
    "daily_bet_limit": 100000,  # user confirmed default
    "crash_house_edge": 0.03,  # 3%
    "crash_min_bet": 50,
    "crash_max_bet": 50000,
    "crash_enabled": True,
}


async def get_setting(db: AsyncIOMotorDatabase, key: str) -> Any:
    doc = await db.system_settings.find_one({"setting_key": key}, {"_id": 0})
    if doc and "setting_value" in doc:
        return doc["setting_value"]
    return DEFAULT_SETTINGS.get(key)


async def get_settings(db: AsyncIOMotorDatabase, keys: List[str]) -> Dict[str, Any]:
    docs = await db.system_settings.find({"setting_key": {"$in": keys}}, {"_id": 0}).to_list(100)
    out = {k: DEFAULT_SETTINGS.get(k) for k in keys}
    for d in docs:
        out[d["setting_key"]] = d.get("setting_value")
    return out


# -------------------------
# Provably fair Crash
# -------------------------

def _sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def _crash_point_from_seed(server_seed: str, client_seed: str, nonce: int, house_edge: float) -> float:
    # Deterministic, verifiable mapping from seeds -> crash point
    msg = f"{client_seed}:{nonce}".encode("utf-8")
    digest = hmac.new(server_seed.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    # Use first 52 bits (13 hex chars) -> integer
    r = int(digest[:13], 16)
    two_52 = 2 ** 52

    # Classic crash-style formula with house edge (expected return ~= 1 - edge)
    # crash = max(1.0, (1-edge) * (2^52 / (r + 1)))
    crash = (1.0 - float(house_edge)) * (two_52 / (r + 1))
    crash = max(1.0, min(float(crash), 100.0))
    return round(crash, 2)


@router.get("/crash/fairness")
async def crash_fairness_info(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Public info for verifying crash rounds."""
    s = await get_settings(db, ["crash_house_edge"])
    return {
        "algorithm": "HMAC-SHA256(server_seed, client_seed:nonce) => 52-bit => crash formula",
        "house_edge": s["crash_house_edge"],
        "verify_endpoint": "/api/games/crash/verify",
    }


@router.get("/crash/verify")
async def crash_verify(server_seed: str, client_seed: str, nonce: int, db: AsyncIOMotorDatabase = Depends(get_db)):
    s = await get_settings(db, ["crash_house_edge"])
    crash_point = _crash_point_from_seed(server_seed, client_seed, nonce, s["crash_house_edge"])
    return {
        "server_seed_hash": _sha256_hex(server_seed),
        "client_seed": client_seed,
        "nonce": nonce,
        "crash_point": crash_point,
    }


async def _daily_bet_total(db: AsyncIOMotorDatabase, user_id: str) -> float:
    since = datetime.now(timezone.utc) - timedelta(days=1)
    pipeline = [
        {"$match": {"user_id": user_id, "created_at": {"$gte": since.isoformat()}}},
        {"$group": {"_id": None, "total": {"$sum": "$bet_amount"}}},
    ]
    res = await db.bets.aggregate(pipeline).to_list(1)
    return float(res[0]["total"]) if res else 0.0


async def _should_auto_freeze(db: AsyncIOMotorDatabase, user_id: str) -> bool:
    # Suspicious: repeated rejected bet attempts in short window
    ten_min_ago = datetime.now(timezone.utc) - timedelta(minutes=10)
    count = await db.security_events.count_documents(
        {
            "user_id": user_id,
            "type": "bet_limit_violation",
            "created_at": {"$gte": ten_min_ago.isoformat()},
        }
    )
    return count >= 3


@router.post("/crash/bet")
async def crash_place_bet(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Place a crash bet. Supports auto cashout target for Phase 2."""
    amount = float(payload.get("amount", 0))
    cashout_multiplier = float(payload.get("cashout_multiplier", 0))
    client_seed = str(payload.get("client_seed") or current_user["user_id"])

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid bet amount")
    if cashout_multiplier < 1.01 or cashout_multiplier > 100:
        raise HTTPException(status_code=400, detail="Invalid cashout multiplier")

    settings = await get_settings(
        db,
        [
            "crash_enabled",
            "crash_min_bet",
            "crash_max_bet",
            "crash_house_edge",
            "daily_bet_limit",
        ],
    )

    if not settings["crash_enabled"]:
        raise HTTPException(status_code=400, detail="Crash game is currently disabled")

    if amount < float(settings["crash_min_bet"]):
        raise HTTPException(status_code=400, detail=f"Minimum bet is PKR {settings['crash_min_bet']}")
    if amount > float(settings["crash_max_bet"]):
        raise HTTPException(status_code=400, detail=f"Maximum bet is PKR {settings['crash_max_bet']}")

    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="User account is not active")
    if user.get("is_frozen"):
        raise HTTPException(status_code=403, detail="Account is frozen. Contact support.")

    daily_total = await _daily_bet_total(db, current_user["user_id"])
    if daily_total + amount > float(settings["daily_bet_limit"]):
        await db.security_events.insert_one(
            {
                "id": secrets.token_hex(8),
                "user_id": current_user["user_id"],
                "type": "bet_limit_violation",
                "detail": {
                    "attempt_amount": amount,
                    "daily_total": daily_total,
                    "daily_limit": settings["daily_bet_limit"],
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

        if await _should_auto_freeze(db, current_user["user_id"]):
            await db.users.update_one(
                {"id": current_user["user_id"]},
                {
                    "$set": {
                        "is_frozen": True,
                        "frozen_reason": "Suspicious activity detected",
                        "frozen_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                },
            )

        raise HTTPException(status_code=400, detail="Daily betting limit reached")

    available = float(user.get("wallet_balance", 0.0))
    locked = float(user.get("locked_balance", 0.0))

    if available < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Create a round (Phase 2: one bet -> one round, instantly settled)
    server_seed = secrets.token_hex(32)
    server_seed_hash = _sha256_hex(server_seed)

    nonce = int(payload.get("nonce") or secrets.randbelow(1_000_000_000))
    crash_point = _crash_point_from_seed(server_seed, client_seed, nonce, settings["crash_house_edge"])

    # Deduct bet immediately
    new_balance = available - amount
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"wallet_balance": new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    # Record bet
    won = cashout_multiplier <= crash_point
    payout = round(amount * cashout_multiplier, 2) if won else 0.0

    bet = Bet(
        user_id=current_user["user_id"],
        game_id="crash",
        game_name="Crash",
        bet_amount=amount,
        bet_data={
            "cashout_multiplier": cashout_multiplier,
            "client_seed": client_seed,
            "nonce": nonce,
            "server_seed_hash": server_seed_hash,
        },
        multiplier=cashout_multiplier if won else 0.0,
        payout=payout,
        status=BetStatus.WON if won else BetStatus.LOST,
        result_data={
            "crash_point": crash_point,
            "server_seed": server_seed,  # revealed after settlement
            "server_seed_hash": server_seed_hash,
        },
        settled_at=datetime.now(timezone.utc),
    )

    bet_dict = bet.model_dump()
    bet_dict["created_at"] = bet_dict["created_at"].isoformat()
    bet_dict["settled_at"] = bet_dict["settled_at"].isoformat() if bet_dict.get("settled_at") else None
    await db.bets.insert_one(bet_dict)

    # Transaction: bet
    bet_txn = Transaction(
        user_id=current_user["user_id"],
        type=TransactionType.BET,
        amount=amount,
        status=TransactionStatus.COMPLETED,
        description="Crash bet",
        metadata={"bet_id": bet.id},
        balance_before=available,
        balance_after=new_balance,
    )
    bet_txn_dict = bet_txn.model_dump()
    bet_txn_dict["created_at"] = bet_txn_dict["created_at"].isoformat()
    bet_txn_dict["updated_at"] = bet_txn_dict["updated_at"].isoformat()
    await db.transactions.insert_one(bet_txn_dict)

    # Update user totals
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {
            "$inc": {"total_bets": amount},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
        },
    )

    # Apply wagering progress (bets count even on losses)
    from services.wagering_service import apply_wagering_progress
    await apply_wagering_progress(db, current_user["user_id"], amount)

    # If win: credit payout and add win transaction
    if won and payout > 0:
        credited_balance = new_balance + payout
        await db.users.update_one(
            {"id": current_user["user_id"]},
            {
                "$set": {"wallet_balance": credited_balance, "updated_at": datetime.now(timezone.utc).isoformat()},
                "$inc": {"total_wins": payout},
            },
        )

        win_txn = Transaction(
            user_id=current_user["user_id"],
            type=TransactionType.WIN,
            amount=payout,
            status=TransactionStatus.COMPLETED,
            description="Crash win",
            metadata={"bet_id": bet.id},
            balance_before=new_balance,
            balance_after=credited_balance,
        )
        win_txn_dict = win_txn.model_dump()
        win_txn_dict["created_at"] = win_txn_dict["created_at"].isoformat()
        win_txn_dict["updated_at"] = win_txn_dict["updated_at"].isoformat()
        await db.transactions.insert_one(win_txn_dict)

    return {
        "bet_id": bet.id,
        "status": bet.status,
        "amount": amount,
        "cashout_multiplier": cashout_multiplier,
        "crash_point": crash_point,
        "payout": payout,
        "currency": "PKR",
        "provably_fair": {
            "server_seed_hash": server_seed_hash,
            "server_seed": server_seed,
            "client_seed": client_seed,
            "nonce": nonce,
            "verify": f"/api/games/crash/verify?server_seed={server_seed}&client_seed={client_seed}&nonce={nonce}",
        },
        "balances": {
            "available_balance": new_balance + (payout if won else 0.0),
            "locked_balance": locked,
        },
    }


# Admin helper endpoints (simple for Phase 2)
@router.get("/settings")
async def get_game_settings_public(db: AsyncIOMotorDatabase = Depends(get_db)):
    keys = ["currency", "crash_house_edge", "crash_min_bet", "crash_max_bet", "crash_enabled"]
    return await get_settings(db, keys)


@router.get("/admin/settings")
async def get_settings_admin(
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    keys = list(DEFAULT_SETTINGS.keys())
    return await get_settings(db, keys)


@router.post("/admin/settings")
async def update_settings_admin(
    payload: Dict[str, Any],
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    allowed = set(DEFAULT_SETTINGS.keys())
    updates = {k: payload[k] for k in payload.keys() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid settings provided")

    now = datetime.now(timezone.utc).isoformat()
    for k, v in updates.items():
        await db.system_settings.update_one(
            {"setting_key": k},
            {
                "$set": {
                    "setting_key": k,
                    "setting_value": v,
                    "description": "Phase 2 system setting",
                    "updated_by": current_admin["user_id"],
                    "updated_at": now,
                }
            },
            upsert=True,
        )

    return {"message": "Settings updated", "updated": updates}
