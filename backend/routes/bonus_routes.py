from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from auth import get_current_user
from services.download_bonus_service import try_grant_download_bonus

router = APIRouter(prefix="/bonus", tags=["Bonus"])


def get_db() -> AsyncIOMotorDatabase:
    from server import db

    return db


@router.post("/app-download/claim")
async def claim_app_download_bonus(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    res = await try_grant_download_bonus(db, user)
    # Silent failure: always return ok, UI can just refresh balance
    return {"granted": bool(res), "data": res}
