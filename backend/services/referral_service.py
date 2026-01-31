from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_referral_record(db, referrer_user_id: str, referred_user_id: str, code: str, signals: Dict[str, Any]):
    rec = {
        "id": str(uuid.uuid4()),
        "referrer_user_id": referrer_user_id,
        "referred_user_id": referred_user_id,
        "referral_code": code,
        "referral_status": "pending",  # pending|valid|rejected|flagged
        "deposit_verified": False,
        "first_wager_completed": False,
        "referral_reward_paid": False,
        "total_deposit_commission_earned": 0.0,
        "total_rebate_earned": 0.0,
        "fraud_flags": signals.get("fraud_flags", []),
        "signals": signals,
        "system_decision_timestamp": None,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    await db.referrals.insert_one(rec)


async def flag_referral(db, referred_user_id: str, flags: list[str]):
    await db.referrals.update_one(
        {"referred_user_id": referred_user_id},
        {
            "$set": {"referral_status": "flagged", "updated_at": _now_iso(), "system_decision_timestamp": _now_iso()},
            "$addToSet": {"fraud_flags": {"$each": flags}},
        },
    )


async def reject_referral(db, referred_user_id: str, flags: list[str]):
    await db.referrals.update_one(
        {"referred_user_id": referred_user_id},
        {
            "$set": {"referral_status": "rejected", "updated_at": _now_iso(), "system_decision_timestamp": _now_iso()},
            "$addToSet": {"fraud_flags": {"$each": flags}},
        },
    )


async def mark_deposit_verified(db, referred_user_id: str):
    await db.referrals.update_one(
        {"referred_user_id": referred_user_id},
        {"$set": {"deposit_verified": True, "updated_at": _now_iso()}},
    )


async def mark_first_wager(db, referred_user_id: str):
    await db.referrals.update_one(
        {"referred_user_id": referred_user_id},
        {"$set": {"first_wager_completed": True, "updated_at": _now_iso()}},
    )


async def get_referral_by_referred(db, referred_user_id: str) -> Optional[Dict[str, Any]]:
    return await db.referrals.find_one({"referred_user_id": referred_user_id}, {"_id": 0})
