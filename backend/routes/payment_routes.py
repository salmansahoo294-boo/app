from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import (
    DepositRequest, Deposit, WithdrawalRequest, Withdrawal,
    Transaction, TransactionType, TransactionStatus
)
from auth import get_current_user
from email_service import email_service
from typing import List, Any
from datetime import datetime, timezone, timedelta


async def _get_setting(db: AsyncIOMotorDatabase, key: str, default: Any) -> Any:
    doc = await db.system_settings.find_one({"setting_key": key}, {"_id": 0})
    if doc and "setting_value" in doc:
        return doc["setting_value"]
    return default

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
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.get("is_active", True) or user.get("is_frozen"):
        raise HTTPException(status_code=403, detail="Account is not eligible for transactions")

    deposit_min = float(await _get_setting(db, "deposit_min", 300))
    deposit_max = float(await _get_setting(db, "deposit_max", 50000))

    if deposit_data.amount < deposit_min:
        raise HTTPException(status_code=400, detail=f"Minimum deposit amount is PKR {int(deposit_min)}")

    if deposit_data.amount > deposit_max:
        raise HTTPException(status_code=400, detail=f"Maximum deposit amount is PKR {int(deposit_max)}")
    
    # User already loaded above
    
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
    if not user.get("is_active", True) or user.get("is_frozen"):
        raise HTTPException(status_code=403, detail="Account is not eligible for transactions")
    
    # Check KYC
    if user.get("kyc_status") != "approved":
        raise HTTPException(
            status_code=400,
            detail="KYC verification required before withdrawal"
        )
    
    withdraw_min = float(await _get_setting(db, "withdraw_min", 300))
    withdraw_max = float(await _get_setting(db, "withdraw_max", 30000))

    # Check balance (available balance only)
    if user.get("wallet_balance", 0) < withdrawal_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    if withdrawal_data.amount < withdraw_min:
        raise HTTPException(status_code=400, detail=f"Minimum withdrawal amount is PKR {int(withdraw_min)}")

    if withdrawal_data.amount > withdraw_max:
        raise HTTPException(status_code=400, detail=f"Maximum withdrawal amount is PKR {int(withdraw_max)}")
    
    # Lock funds for withdrawal (Phase 2 trust model)
    available = float(user.get("wallet_balance", 0.0))
    locked = float(user.get("locked_balance", 0.0))

    new_available = available - float(withdrawal_data.amount)
    new_locked = locked + float(withdrawal_data.amount)

    await db.users.update_one(
        {"id": current_user["user_id"]},
        {
            "$set": {
                "wallet_balance": new_available,
                "locked_balance": new_locked,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    # Create withdrawal record
    withdrawal = Withdrawal(
        user_id=current_user["user_id"],
        amount=withdrawal_data.amount,
        jazzcash_number=withdrawal_data.jazzcash_number,
    )

    withdrawal_dict = withdrawal.model_dump()
    withdrawal_dict["created_at"] = withdrawal_dict["created_at"].isoformat()

    await db.withdrawals.insert_one(withdrawal_dict)

    # Create transaction record (pending)
    txn = Transaction(
        user_id=current_user["user_id"],
        type=TransactionType.WITHDRAWAL,
        amount=withdrawal_data.amount,
        status=TransactionStatus.PENDING,
        description=f"Withdrawal initiated (secure processing) - JazzCash {withdrawal_data.jazzcash_number}",
        metadata={"withdrawal_id": withdrawal.id},
        balance_before=available,
        balance_after=new_available,
    )

    txn_dict = txn.model_dump()
    txn_dict["created_at"] = txn_dict["created_at"].isoformat()
    txn_dict["updated_at"] = txn_dict["updated_at"].isoformat()
    await db.transactions.insert_one(txn_dict)
    
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
        "message": "Withdrawal initiated successfully",
        "withdrawal_id": withdrawal.id,
        "status": "pending",
        "currency": "PKR"
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
