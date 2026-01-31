from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from auth import get_current_admin

router = APIRouter(prefix="/admin/bonuses", tags=["Admin Bonuses"])


def get_db() -> AsyncIOMotorDatabase:
    from server import db

    return db


@router.get("/app-download")
async def list_app_download_bonus_claims(
    skip: int = 0,
    limit: int = 100,
    phone: str | None = None,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query = {"bonus_type": "app_download"}
    if phone:
        query["phone"] = phone

    claims = await db.bonus_claims.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return claims


@router.get("/wagering")
async def list_wagering_records(
    skip: int = 0,
    limit: int = 200,
    user_id: str | None = None,
    status: str | None = None,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if status:
        query["status"] = status

    records = await db.wagering.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return records
