from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional, List
import uuid


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_wagering_record(
    user_id: str,
    source: str,  # bonus|deposit|referral|rebate
    source_id: str,
    principal_amount: float,
    multiplier: float,
    priority: int,
) -> Dict[str, Any]:
    target = round(float(principal_amount) * float(multiplier), 2)
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "source": source,
        "source_id": source_id,
        "multiplier": float(multiplier),
        "principal_amount": float(principal_amount),
        "target_amount": target,
        "wagered_amount": 0.0,
        "status": "active",  # active|completed
        "priority": int(priority),  # lower is higher priority
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        "completed_at": None,
    }


async def get_active_wagering(db, user_id: str) -> List[Dict[str, Any]]:
    return await db.wagering.find({"user_id": user_id, "status": "active"}, {"_id": 0}).sort("priority", 1).to_list(200)


async def wagering_status(db, user_id: str) -> Dict[str, Any]:
    active = await get_active_wagering(db, user_id)
    total_target = sum(float(r.get("target_amount", 0)) for r in active)
    total_wagered = sum(float(r.get("wagered_amount", 0)) for r in active)
    remaining = max(0.0, round(total_target - total_wagered, 2))

    return {
        "has_active_wagering": len(active) > 0,
        "total_target": round(total_target, 2),
        "total_wagered": round(total_wagered, 2),
        "remaining": remaining,
        "records": active,
        "can_withdraw": remaining <= 0.0,
    }


async def apply_wagering_progress(db, user_id: str, bet_amount: float) -> Dict[str, Any]:
    """Apply bet amount to active wagering records (bonus first by priority)."""
    remaining_bet = float(bet_amount)
    if remaining_bet <= 0:
        return await wagering_status(db, user_id)

    active = await get_active_wagering(db, user_id)

    for r in active:
        if remaining_bet <= 0:
            break

        target = float(r.get("target_amount", 0.0))
        wagered = float(r.get("wagered_amount", 0.0))
        remaining_target = max(0.0, target - wagered)
        if remaining_target <= 0:
            continue

        add = min(remaining_bet, remaining_target)
        new_wagered = round(wagered + add, 2)
        new_status = "completed" if new_wagered >= target else "active"
        update: Dict[str, Any] = {
            "wagered_amount": new_wagered,
            "status": new_status,
            "updated_at": _now_iso(),
        }
        if new_status == "completed":
            update["completed_at"] = _now_iso()

        await db.wagering.update_one({"id": r["id"]}, {"$set": update})
        remaining_bet -= add

    return await wagering_status(db, user_id)
