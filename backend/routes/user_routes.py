from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import User, UserUpdate, Transaction, Bet
from auth import get_current_user
from typing import List
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/user", tags=["User"])

def get_db() -> AsyncIOMotorDatabase:
    from server import db
    return db

@router.get("/profile", response_model=User)
async def get_profile(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get current user profile"""
    user_dict = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_dict)

@router.put("/profile", response_model=User)
async def update_profile(update_data: UserUpdate, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Update user profile"""
    update_dict = {k: v for k, v in update_data.model_dump(exclude_unset=True).items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": update_dict}
    )
    
    user_dict = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    return User(**user_dict)

@router.get("/wallet/balance")
async def get_wallet_balance(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get wallet balance"""
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "wallet_balance": 1, "locked_balance": 1, "bonus_balance": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    available = user.get("wallet_balance", 0.0)
    locked = user.get("locked_balance", 0.0)
    bonus = user.get("bonus_balance", 0.0)

    return {
        "currency": "PKR",
        "wallet_balance": available,
        "locked_balance": locked,
        "bonus_balance": bonus,
        "available_balance": available,
        "total_balance": available + locked + bonus
    }

@router.get("/transactions", response_model=List[Transaction])
async def get_transactions(skip: int = 0, limit: int = 50, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get user transaction history (last 3 months)"""
    three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
    
    transactions = await db.transactions.find(
        {
            "user_id": current_user["user_id"],
            "created_at": {"$gte": three_months_ago.isoformat()}
        },
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [Transaction(**t) for t in transactions]

@router.get("/bets", response_model=List[Bet])
async def get_betting_history(skip: int = 0, limit: int = 50, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get user betting history (last 3 months)"""
    three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
    
    bets = await db.bets.find(
        {
            "user_id": current_user["user_id"],
            "created_at": {"$gte": three_months_ago.isoformat()}
        },
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [Bet(**b) for b in bets]

@router.get("/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get user statistics"""
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "total_deposits": user.get("total_deposits", 0.0),
        "total_withdrawals": user.get("total_withdrawals", 0.0),
        "total_bets": user.get("total_bets", 0.0),
        "total_wins": user.get("total_wins", 0.0),
        "profit_loss": user.get("total_wins", 0.0) - user.get("total_bets", 0.0),
        "vip_level": user.get("vip_level", 0)
    }
