from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/wallet", tags=["Wallet"])


def get_db() -> AsyncIOMotorDatabase:
    from server import db

    return db


@router.post("/unlock")
async def unlock_funds(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Move funds from locked_balance -> wallet_balance (Phase 2 trust step)."""
    amount = float(payload.get("amount", 0))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    locked = float(user.get("locked_balance", 0.0))
    if locked < amount:
        raise HTTPException(status_code=400, detail="Insufficient locked balance")

    new_locked = locked - amount
    new_wallet = float(user.get("wallet_balance", 0.0)) + amount

    await db.users.update_one(
        {"id": current_user["user_id"]},
        {
            "$set": {
                "locked_balance": new_locked,
                "wallet_balance": new_wallet,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    return {
        "message": "Funds unlocked",
        "currency": "PKR",
        "wallet_balance": new_wallet,
        "locked_balance": new_locked,
    }
