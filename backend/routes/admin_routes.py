from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import (
    User, Deposit, Withdrawal, GameSettings, SystemSettings,
    NotificationCreate, Notification, TransactionType, TransactionStatus, Transaction
)
from auth import get_current_admin
from email_service import email_service
from typing import List, Optional
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/admin", tags=["Admin"])

def get_db() -> AsyncIOMotorDatabase:
    from server import db
    return db


@router.get("/health/db")
async def admin_db_health(
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Deployment health check: verifies DB connection, key collections, and indexes exist."""

    collection_names = await db.list_collection_names()

    required_collections = [
        "users",
        "deposits",
        "withdrawals",
        "transactions",
        "bets",
        "system_settings",
    ]

    missing_collections = [c for c in required_collections if c not in collection_names]

    # Index checks (non-fatal if missing, but helpful post-deploy)
    users_indexes = await db.users.index_information()
    system_settings_indexes = await db.system_settings.index_information() if "system_settings" in collection_names else {}

    users_has_email_unique = any(
        idx.get("key") == [("email", 1)] and idx.get("unique")
        for idx in users_indexes.values()
    )

    system_settings_has_setting_key_unique = any(
        idx.get("key") == [("setting_key", 1)] and idx.get("unique")
        for idx in system_settings_indexes.values()
    )

    return {
        "ok": len(missing_collections) == 0,
        "db_name": db.name,
        "required_collections": required_collections,
        "missing_collections": missing_collections,
        "indexes": {
            "users_email_unique": users_has_email_unique,
            "system_settings_setting_key_unique": system_settings_has_setting_key_unique,
        },
    }

# Dashboard Stats
@router.get("/stats/dashboard")
async def get_dashboard_stats(
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get admin dashboard statistics"""
    # Get today's date range
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    # Total users
    total_users = await db.users.count_documents({"role": "user"})
    active_users = await db.users.count_documents({"role": "user", "is_active": True})
    
    # Pending approvals
    pending_deposits = await db.deposits.count_documents({"status": "pending"})
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    pending_kyc = await db.users.count_documents({"kyc_status": "pending"})
    
    # Today's transactions
    deposits_pipeline = [
        {"$match": {"status": "approved", "approved_at": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    deposits_result = await db.deposits.aggregate(deposits_pipeline).to_list(1)
    today_deposits = deposits_result[0]["total"] if deposits_result else 0.0
    
    withdrawals_pipeline = [
        {"$match": {"status": "approved", "approved_at": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    withdrawals_result = await db.withdrawals.aggregate(withdrawals_pipeline).to_list(1)
    today_withdrawals = withdrawals_result[0]["total"] if withdrawals_result else 0.0
    
    # Calculate winning ratio
    winning_ratio = (today_withdrawals / today_deposits * 100) if today_deposits > 0 else 0.0
    
    # Total bets today
    bets_pipeline = [
        {"$match": {"created_at": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}}},
        {"$group": {"_id": None, "total": {"$sum": "$bet_amount"}, "count": {"$sum": 1}}}
    ]
    bets_result = await db.bets.aggregate(bets_pipeline).to_list(1)
    today_bets = bets_result[0]["total"] if bets_result else 0.0
    today_bets_count = bets_result[0]["count"] if bets_result else 0
    
    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "pending_approvals": {
            "deposits": pending_deposits,
            "withdrawals": pending_withdrawals,
            "kyc": pending_kyc
        },
        "today": {
            "deposits": today_deposits,
            "withdrawals": today_withdrawals,
            "winning_ratio": round(winning_ratio, 2),
            "total_bets": today_bets,
            "bets_count": today_bets_count
        }
    }

# User Management
@router.get("/users", response_model=List[User])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all users"""
    query = {"role": "user"}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"full_name": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    return [User(**u) for u in users]

@router.put("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Suspend user account"""
    result = await db.users.update_one(
        {"id": user_id, "role": "user"},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User suspended successfully"}

@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Activate user account"""
    result = await db.users.update_one(
        {"id": user_id, "role": "user"},
        {"$set": {"is_active": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User activated successfully"}


@router.put("/users/{user_id}/freeze")
async def freeze_user(
    user_id: str,
    reason: str = "Frozen by admin",
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Freeze user account (suspicious activity)"""
    result = await db.users.update_one(
        {"id": user_id, "role": "user"},
        {
            "$set": {
                "is_frozen": True,
                "frozen_reason": reason,
                "frozen_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User frozen"}


@router.put("/users/{user_id}/unfreeze")
async def unfreeze_user(
    user_id: str,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Unfreeze user account"""
    result = await db.users.update_one(
        {"id": user_id, "role": "user"},
        {
            "$set": {
                "is_frozen": False,
                "frozen_reason": None,
                "frozen_at": None,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User unfrozen"}

# Deposit Management
@router.get("/deposits/pending", response_model=List[Deposit])
async def get_pending_deposits(
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all pending deposits"""
    deposits = await db.deposits.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Deposit(**d) for d in deposits]

@router.put("/deposits/{deposit_id}/approve")
async def approve_deposit(
    deposit_id: str,
    background_tasks: BackgroundTasks,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Approve deposit request"""
    # Get deposit
    deposit = await db.deposits.find_one({"id": deposit_id, "status": "pending"}, {"_id": 0})
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found or already processed")
    
    # Get user
    user = await db.users.find_one({"id": deposit["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Apply promotions + wagering (Phase 2)
    from services.deposit_approval_service import approve_deposit_apply_promotions

    await approve_deposit_apply_promotions(db, deposit, current_admin["user_id"])
    
    # Update deposit status
    await db.deposits.update_one(
        {"id": deposit_id},
        {
            "$set": {
                "status": "approved",
                "approved_at": datetime.now(timezone.utc).isoformat(),
                "approved_by": current_admin["user_id"]
            }
        }
    )
    
    # Transactions (deposit + bonus) are created in approve_deposit_apply_promotions
    
    # Send email notification to user
    background_tasks.add_task(
        email_service.send_deposit_approved_email,
        user_email=user["email"],
        amount=deposit["amount"]
    )
    
    return {"message": "Deposit approved successfully"}

@router.put("/deposits/{deposit_id}/reject")
async def reject_deposit(
    deposit_id: str,
    reason: str,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Reject deposit request"""
    result = await db.deposits.update_one(
        {"id": deposit_id, "status": "pending"},
        {
            "$set": {
                "status": "rejected",
                "rejection_reason": reason,
                "approved_at": datetime.now(timezone.utc).isoformat(),
                "approved_by": current_admin["user_id"]
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Deposit not found or already processed")
    
    return {"message": "Deposit rejected successfully"}

# Withdrawal Management
@router.get("/withdrawals/pending", response_model=List[Withdrawal])
async def get_pending_withdrawals(
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all pending withdrawals"""
    withdrawals = await db.withdrawals.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Withdrawal(**w) for w in withdrawals]

@router.put("/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(
    withdrawal_id: str,
    background_tasks: BackgroundTasks,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Approve withdrawal request"""
    # Get withdrawal
    withdrawal = await db.withdrawals.find_one({"id": withdrawal_id, "status": "pending"}, {"_id": 0})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found or already processed")
    
    # Get user
    user = await db.users.find_one({"id": withdrawal["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check balance again
    if user.get("wallet_balance", 0.0) < withdrawal["amount"]:
        raise HTTPException(status_code=400, detail="Insufficient user balance")
    
    # Update user balance (Phase 2 trust model: approved withdrawal releases locked funds)
    locked = user.get("locked_balance", 0.0)
    if locked < withdrawal["amount"]:
        raise HTTPException(status_code=400, detail="User does not have enough locked funds")

    new_locked = locked - withdrawal["amount"]
    new_total_withdrawals = user.get("total_withdrawals", 0.0) + withdrawal["amount"]

    await db.users.update_one(
        {"id": withdrawal["user_id"]},
        {
            "$set": {
                "locked_balance": new_locked,
                "total_withdrawals": new_total_withdrawals,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Update withdrawal status
    await db.withdrawals.update_one(
        {"id": withdrawal_id},
        {
            "$set": {
                "status": "approved",
                "approved_at": datetime.now(timezone.utc).isoformat(),
                "approved_by": current_admin["user_id"]
            }
        }
    )
    
    # Create transaction record
    transaction = Transaction(
        user_id=withdrawal["user_id"],
        type=TransactionType.WITHDRAWAL,
        amount=withdrawal["amount"],
        status=TransactionStatus.COMPLETED,
        description=f"Withdrawal approved (secure processing) - JazzCash {withdrawal['jazzcash_number']}",
        balance_before=user.get("wallet_balance", 0.0),
        balance_after=user.get("wallet_balance", 0.0)
    )
    
    transaction_dict = transaction.model_dump()
    transaction_dict["created_at"] = transaction_dict["created_at"].isoformat()
    transaction_dict["updated_at"] = transaction_dict["updated_at"].isoformat()
    
    await db.transactions.insert_one(transaction_dict)
    
    # Send email notification to user
    background_tasks.add_task(
        email_service.send_withdrawal_approved_email,
        user_email=user["email"],
        amount=withdrawal["amount"],
        jazzcash_number=withdrawal["jazzcash_number"]
    )
    
    return {"message": "Withdrawal approved and processed successfully"}

@router.put("/withdrawals/{withdrawal_id}/reject")
async def reject_withdrawal(
    withdrawal_id: str,
    reason: str,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Reject withdrawal request"""
    result = await db.withdrawals.update_one(
        {"id": withdrawal_id, "status": "pending"},
        {
            "$set": {
                "status": "rejected",
                "rejection_reason": reason,
                "approved_at": datetime.now(timezone.utc).isoformat(),
                "approved_by": current_admin["user_id"]
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Withdrawal not found or already processed")
    
    return {"message": "Withdrawal rejected successfully"}

# Game Settings Management
@router.get("/games", response_model=List[GameSettings])
async def get_all_game_settings(
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all game settings"""
    games = await db.game_settings.find({}, {"_id": 0}).to_list(100)
    return [GameSettings(**g) for g in games]

@router.put("/games/{game_id}")
async def update_game_settings(
    game_id: str,
    settings: GameSettings,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update game settings"""
    settings_dict = settings.model_dump()
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.game_settings.update_one(
        {"game_id": game_id},
        {"$set": settings_dict},
        upsert=True
    )

    return {"message": "Game settings updated successfully"}

# Notification Management
@router.post("/notifications")
async def create_notification(
    notification_data: NotificationCreate,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create and send notification"""
    notification = Notification(
        **notification_data.model_dump(),
        created_by=current_admin["user_id"]
    )
    
    notification_dict = notification.model_dump()
    notification_dict["created_at"] = notification_dict["created_at"].isoformat()
    if notification_dict.get("expires_at"):
        notification_dict["expires_at"] = notification_dict["expires_at"].isoformat()
    
    await db.notifications.insert_one(notification_dict)
    
    return {"message": "Notification created successfully", "notification_id": notification.id}

@router.get("/notifications", response_model=List[Notification])
async def get_all_notifications(
    skip: int = 0,
    limit: int = 100,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all notifications (1 year history)"""
    one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
    
    notifications = await db.notifications.find(
        {"created_at": {"$gte": one_year_ago.isoformat()}},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [Notification(**n) for n in notifications]
