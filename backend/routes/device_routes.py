from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/device", tags=["Device"])


def get_db() -> AsyncIOMotorDatabase:
    from server import db

    return db


@router.post("/register")
async def register_device(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Store device identifiers for anti-abuse (web/pwa)."""
    app_install_id = payload.get("app_install_id")
    device_fingerprint = payload.get("device_fingerprint")

    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if app_install_id:
        update["app_install_id"] = str(app_install_id)
    if device_fingerprint:
        update["device_fingerprint"] = str(device_fingerprint)

    await db.users.update_one({"id": current_user["user_id"]}, {"$set": update})

    return {"message": "Device registered"}
