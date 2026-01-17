from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    BET = "bet"
    WIN = "win"
    BONUS = "bonus"
    REFERRAL = "referral"
    REBATE = "rebate"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"

class KYCStatus(str, Enum):
    NOT_SUBMITTED = "not_submitted"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class GameCategory(str, Enum):
    LOTTERY = "lottery"
    POPULAR = "popular"
    CASINO = "casino"
    CARDS = "cards"
    SPORTS = "sports"
    FISHING = "fishing"

class BetStatus(str, Enum):
    PENDING = "pending"
    WON = "won"
    LOST = "lost"
    CANCELLED = "cancelled"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: UserRole = UserRole.USER
    is_active: bool = True
    is_verified: bool = False
    kyc_status: KYCStatus = KYCStatus.NOT_SUBMITTED
    wallet_balance: float = 0.0
    bonus_balance: float = 0.0
    total_deposits: float = 0.0
    total_withdrawals: float = 0.0
    total_bets: float = 0.0
    total_wins: float = 0.0
    referral_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    referred_by: Optional[str] = None
    vip_level: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserUpdate(BaseModel):
    phone: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

# KYC Models
class KYCDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    document_type: str  # "cnic", "passport", etc.
    document_number: str
    document_image_url: Optional[str] = None
    status: KYCStatus = KYCStatus.PENDING
    rejection_reason: Optional[str] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None

# Transaction Models
class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: TransactionType
    amount: float
    status: TransactionStatus
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    balance_before: float
    balance_after: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DepositRequest(BaseModel):
    amount: float
    jazzcash_number: str

class Deposit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    jazzcash_number: str
    status: TransactionStatus = TransactionStatus.PENDING
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None

class WithdrawalRequest(BaseModel):
    amount: float
    jazzcash_number: str

class Withdrawal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    jazzcash_number: str
    status: TransactionStatus = TransactionStatus.PENDING
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None

# Game Models
class GameSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    game_id: str
    game_name: str
    category: GameCategory
    is_enabled: bool = True
    min_bet: float = 10.0
    max_bet: float = 100000.0
    rtp_percentage: float = 97.0  # Return to Player
    odds: Optional[Dict[str, Any]] = None
    demo_enabled: bool = True
    description: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Bet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    game_id: str
    game_name: str
    bet_amount: float
    bet_data: Dict[str, Any]  # Game-specific bet details
    multiplier: float = 0.0
    payout: float = 0.0
    status: BetStatus = BetStatus.PENDING
    result_data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    settled_at: Optional[datetime] = None

# Notification Models
class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    type: str  # "system", "promotion", "bonus", "maintenance", "warning"
    target_audience: str  # "all", "selected", "user_group"
    target_user_ids: Optional[List[str]] = None
    channels: List[str]  # ["app", "web", "email"]
    is_read: bool = False
    expires_at: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str
    target_audience: str = "all"
    target_user_ids: Optional[List[str]] = None
    channels: List[str] = ["web", "app"]
    expires_at: Optional[datetime] = None

# Bonus & Reward Models
class Bonus(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # "welcome", "deposit", "referral", "rebate", "daily"
    amount: float
    description: str
    is_claimed: bool = False
    claimed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Admin Settings Models
class SystemSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    setting_key: str
    setting_value: Any
    description: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: str

class WinningRatioSettings(BaseModel):
    min_ratio: float = 20.0  # Minimum 20%
    max_ratio: float = 26.0  # Maximum 26%
    current_ratio: float = 23.0

# Chat/Support Models
class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    message: str
    is_bot: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    message: str

# Response Models
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class MessageResponse(BaseModel):
    message: str
    data: Optional[Any] = None
