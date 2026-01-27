from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import (
    DepositRequest, Deposit, WithdrawalRequest, Withdrawal,
    Transaction, TransactionType, TransactionStatus
)
from auth import get_current_user
from email_service import email_service
from typing import List
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/payment", tags=["Payment"])

def get_db() -> AsyncIOMotorDatabase:
    from server import db
    return db

@router.post("/deposit")
async def create_deposit_request(
    deposit_data: DepositRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create deposit request"""
    if deposit_data.amount < 300:
        raise HTTPException(status_code=400, detail="Minimum deposit amount is PKR 300")

    if deposit_data.amount > 50000:
        raise HTTPException(status_code=400, detail="Maximum deposit amount is PKR 50,000")
    
    # Get user info
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create deposit record
    deposit = Deposit(
        user_id=current_user["user_id"],
        amount=deposit_data.amount,
        jazzcash_number=deposit_data.jazzcash_number
    )
    
    deposit_dict = deposit.model_dump()
    deposit_dict["created_at"] = deposit_dict["created_at"].isoformat()
    
    await db.deposits.insert_one(deposit_dict)
    
    # Send email notification to admin
    background_tasks.add_task(
        email_service.send_deposit_notification,
        user_email=user["email"],
        user_name=user.get("full_name", ""),
        amount=deposit_data.amount,
        jazzcash_number=deposit_data.jazzcash_number,
        deposit_id=deposit.id
    )
    
    return {
        "message": "Deposit request submitted successfully",
        "deposit_id": deposit.id,
        "status": "pending"
    }

@router.get("/deposits", response_model=List[Deposit])
async def get_deposits(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get user deposit history (last 3 months)"""
    three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
    
    deposits = await db.deposits.find(
        {
            "user_id": current_user["user_id"],
            "created_at": {"$gte": three_months_ago.isoformat()}
        },
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [Deposit(**d) for d in deposits]

@router.post("/withdrawal")
async def create_withdrawal_request(
    withdrawal_data: WithdrawalRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create withdrawal request"""
    # Get user
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check KYC
    if user.get("kyc_status") != "approved":
        raise HTTPException(
            status_code=400,
            detail="KYC verification required before withdrawal"
        )
    
    # Check balance
    if user.get("wallet_balance", 0) < withdrawal_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    if withdrawal_data.amount < 300:
        raise HTTPException(status_code=400, detail="Minimum withdrawal amount is PKR 300")

    if withdrawal_data.amount > 30000:
        raise HTTPException(status_code=400, detail="Maximum withdrawal amount is PKR 30,000")
    
    # Create withdrawal record
    withdrawal = Withdrawal(
        user_id=current_user["user_id"],
        amount=withdrawal_data.amount,
        jazzcash_number=withdrawal_data.jazzcash_number
    )
    
    withdrawal_dict = withdrawal.model_dump()
    withdrawal_dict["created_at"] = withdrawal_dict["created_at"].isoformat()
    
    await db.withdrawals.insert_one(withdrawal_dict)
    
    # Send email notification to admin
    background_tasks.add_task(
        email_service.send_withdrawal_notification,
        user_email=user["email"],
        user_name=user.get("full_name", ""),
        amount=withdrawal_data.amount,
        jazzcash_number=withdrawal_data.jazzcash_number,
        withdrawal_id=withdrawal.id
    )
    
    return {
        "message": "Withdrawal request submitted successfully",
        "withdrawal_id": withdrawal.id,
        "status": "pending"
    }

@router.get("/withdrawals", response_model=List[Withdrawal])
async def get_withdrawals(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get user withdrawal history (last 3 months)"""
    three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
    
    withdrawals = await db.withdrawals.find(
        {
            "user_id": current_user["user_id"],
            "created_at": {"$gte": three_months_ago.isoformat()}
        },
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [Withdrawal(**w) for w in withdrawals]
