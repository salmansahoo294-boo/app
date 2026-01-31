from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from auth import get_current_admin
from typing import Any, Dict, List
from services.promotion_service import get_first_deposit_108_config, set_first_deposit_108_config

router = APIRouter(prefix="/promotions", tags=["Promotions"])


def get_db() -> AsyncIOMotorDatabase:
    from server import db

    return db


@router.get("/first-deposit-108/config")
async def first_deposit_108_config(db: AsyncIOMotorDatabase = Depends(get_db)):
    return {"key": "first_deposit_108", "config": await get_first_deposit_108_config(db)}


@router.post("/admin/first-deposit-108/config")
async def set_first_deposit_108_config_admin(
    payload: Dict[str, Any],
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    config = payload.get("config")
    if not isinstance(config, list):
        raise HTTPException(status_code=400, detail="config must be a list")

    await set_first_deposit_108_config(db, config, current_admin["user_id"])
    return {"message": "Config updated"}
