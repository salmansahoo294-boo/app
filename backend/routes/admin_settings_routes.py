from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from auth import get_current_admin
from datetime import datetime, timezone
from typing import Any, Dict

router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])


def get_db() -> AsyncIOMotorDatabase:
    from server import db

    return db


DEFAULTS: Dict[str, Any] = {
    "deposit_min": 300,
    "deposit_max": 50000,
    "withdraw_min": 300,
    "withdraw_max": 30000,
    "daily_bet_limit": 100000,
    "crash_house_edge": 0.03,
    "crash_min_bet": 50,
    "crash_max_bet": 50000,
    "crash_enabled": True,
}


@router.get("/")
async def get_admin_settings(
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    keys = list(DEFAULTS.keys())
    docs = await db.system_settings.find({"setting_key": {"$in": keys}}, {"_id": 0}).to_list(200)
    out = {k: DEFAULTS[k] for k in keys}
    for d in docs:
        out[d["setting_key"]] = d.get("setting_value")
    return out


@router.post("/")
async def update_admin_settings(
    payload: Dict[str, Any],
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    allowed = set(DEFAULTS.keys())
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
                    "description": "Admin configurable settings",
                    "updated_by": current_admin["user_id"],
                    "updated_at": now,
                }
            },
            upsert=True,
        )

    return {"message": "Settings updated", "updated": updates}
