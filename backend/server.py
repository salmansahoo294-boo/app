from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from middleware.https_redirect_fix import HttpsRedirectFixMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import routes AFTER loading environment variables
from routes import auth_routes, user_routes, payment_routes, admin_routes, game_routes, wallet_routes, admin_settings_routes, wagering_routes, promotion_routes, device_routes, bonus_routes

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="WINPKRHUB API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check
@api_router.get("/")
async def root():
    return {"message": "WINPKRHUB API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "winpkr-hub-api"}

# Include all route modules
api_router.include_router(auth_routes.router)
api_router.include_router(user_routes.router)
api_router.include_router(payment_routes.router)
api_router.include_router(admin_routes.router)
api_router.include_router(game_routes.router)
api_router.include_router(wallet_routes.router)
api_router.include_router(admin_settings_routes.router)
api_router.include_router(wagering_routes.router)
api_router.include_router(promotion_routes.router)
api_router.include_router(device_routes.router)
api_router.include_router(bonus_routes.router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(HttpsRedirectFixMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("WINPKRHUB API starting up...")
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("referral_code", unique=True)
    await db.deposits.create_index("user_id")
    await db.withdrawals.create_index("user_id")
    await db.transactions.create_index("user_id")
    await db.bets.create_index("user_id")
    await db.system_settings.create_index("setting_key", unique=True)
    await db.security_events.create_index("user_id")
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("WINPKRHUB API shutting down...")
