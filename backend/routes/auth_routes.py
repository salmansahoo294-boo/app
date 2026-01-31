from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import UserCreate, UserLogin, TokenResponse, User, UserRole
from auth import get_password_hash, verify_password, create_access_token
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_db() -> AsyncIOMotorDatabase:
    from server import db
    return db

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user object
    user = User(**user_data.model_dump(exclude={"password", "referral_code"}))
    user_dict = user.model_dump()
    user_dict["password_hash"] = hashed_password
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    # Handle referral (apply only at signup)
    if user_data.referral_code:
        referrer = await db.users.find_one({"referral_code": user_data.referral_code}, {"_id": 0})
        if referrer and referrer.get("id") != user.id:
            user_dict["referred_by"] = referrer["id"]

            # Create referral record (pending)
            from services.referral_service import create_referral_record

            await create_referral_record(
                db,
                referrer_user_id=referrer["id"],
                referred_user_id=user.id,
                code=user_data.referral_code,
                signals={
                    "device_fingerprint": user_dict.get("device_fingerprint"),
                    "app_install_id": user_dict.get("app_install_id"),
                    "fraud_flags": [],
                },
            )
    
    # Insert user
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    })
    
    return TokenResponse(access_token=access_token, user=user)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Login user"""
    # Find user
    user_dict = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_dict.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user_dict.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended"
        )
    
    # Remove password hash from response
    user_dict.pop("password_hash", None)
    user = User(**user_dict)
    
    # Create access token
    access_token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    })
    
    return TokenResponse(access_token=access_token, user=user)

@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Admin login"""
    # Find user
    user_dict = await db.users.find_one({"email": credentials.email, "role": "admin"}, {"_id": 0})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_dict.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )
    
    # Remove password hash from response
    user_dict.pop("password_hash", None)
    user = User(**user_dict)
    
    # Create access token
    access_token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    })
    
    return TokenResponse(access_token=access_token, user=user)
