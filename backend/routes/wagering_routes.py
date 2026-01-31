from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from auth import get_current_user
from services.wagering_service import wagering_status

router = APIRouter(prefix="/wagering", tags=["Wagering"])


def get_db() -> AsyncIOMotorDatabase:
    from server import db

    return db


@router.get("/status")
async def get_wagering_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await wagering_status(db, current_user["user_id"])
