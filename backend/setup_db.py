# WinPKR Backend Setup Script
# Run this script to create initial admin user and game settings

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from models import User, UserRole, GameSettings, GameCategory
from auth import get_password_hash
import uuid
from datetime import datetime, timezone

load_dotenv(Path(__file__).parent / '.env')

async def setup_database():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("\n=== WinPKR Database Setup ===")
    
    # Create admin user
    print("\nCreating admin user...")
    admin_email = "admin@winpkr.com"
    admin_password = "Admin@123"  # Change this!
    
    existing_admin = await db.users.find_one({"email": admin_email}, {"_id": 0})
    
    if existing_admin:
        print(f"Admin user already exists: {admin_email}")
    else:
        admin_user = User(
            id=str(uuid.uuid4()),
            email=admin_email,
            role=UserRole.ADMIN,
            full_name="Admin User",
            is_verified=True
        )
        
        admin_dict = admin_user.model_dump()
        admin_dict["password_hash"] = get_password_hash(admin_password)
        admin_dict["created_at"] = admin_dict["created_at"].isoformat()
        admin_dict["updated_at"] = admin_dict["updated_at"].isoformat()
        
        await db.users.insert_one(admin_dict)
        print(f"\n✓ Admin user created successfully!")
        print(f"  Email: {admin_email}")
        print(f"  Password: {admin_password}")
        print(f"  ⚠️  PLEASE CHANGE THIS PASSWORD IMMEDIATELY!")
    
    # Create game settings
    print("\nCreating game settings...")
    
    games = [
        {
            "game_id": "wingo-1min",
            "game_name": "Win Go 1 Min",
            "category": GameCategory.LOTTERY,
            "min_bet": 10.0,
            "max_bet": 10000.0,
            "rtp_percentage": 97.0,
            "description": "Color and number prediction game with 1-minute rounds"
        },
        {
            "game_id": "wingo-3min",
            "game_name": "Win Go 3 Min",
            "category": GameCategory.LOTTERY,
            "min_bet": 10.0,
            "max_bet": 10000.0,
            "rtp_percentage": 97.0,
            "description": "Color and number prediction game with 3-minute rounds"
        },
        {
            "game_id": "wingo-5min",
            "game_name": "Win Go 5 Min",
            "category": GameCategory.LOTTERY,
            "min_bet": 10.0,
            "max_bet": 10000.0,
            "rtp_percentage": 97.0,
            "description": "Color and number prediction game with 5-minute rounds"
        },
        {
            "game_id": "aviator",
            "game_name": "Aviator",
            "category": GameCategory.POPULAR,
            "min_bet": 10.0,
            "max_bet": 50000.0,
            "rtp_percentage": 97.0,
            "description": "Watch the plane fly and cash out before it crashes"
        },
        {
            "game_id": "crash",
            "game_name": "Crash",
            "category": GameCategory.POPULAR,
            "min_bet": 10.0,
            "max_bet": 50000.0,
            "rtp_percentage": 97.0,
            "description": "Multiplier increases until crash - cash out before!"
        },
        {
            "game_id": "plinko",
            "game_name": "Plinko",
            "category": GameCategory.POPULAR,
            "min_bet": 10.0,
            "max_bet": 25000.0,
            "rtp_percentage": 98.0,
            "description": "Drop the ball and win based on where it lands"
        },
        {
            "game_id": "mines",
            "game_name": "Mines",
            "category": GameCategory.POPULAR,
            "min_bet": 10.0,
            "max_bet": 25000.0,
            "rtp_percentage": 97.0,
            "description": "Reveal tiles without hitting mines"
        },
        {
            "game_id": "spin-wheel",
            "game_name": "Spin Wheel",
            "category": GameCategory.POPULAR,
            "min_bet": 10.0,
            "max_bet": 25000.0,
            "rtp_percentage": 96.0,
            "description": "Spin the wheel for multiplier wins"
        },
        {
            "game_id": "slots",
            "game_name": "Slots",
            "category": GameCategory.CASINO,
            "min_bet": 5.0,
            "max_bet": 10000.0,
            "rtp_percentage": 96.0,
            "description": "Classic 3-reel slot machine"
        },
        {
            "game_id": "roulette",
            "game_name": "Roulette",
            "category": GameCategory.CASINO,
            "min_bet": 10.0,
            "max_bet": 100000.0,
            "rtp_percentage": 97.3,
            "description": "Classic European roulette"
        },
        {
            "game_id": "teen-patti",
            "game_name": "Teen Patti",
            "category": GameCategory.CARDS,
            "min_bet": 20.0,
            "max_bet": 50000.0,
            "rtp_percentage": 97.0,
            "description": "Popular Indian card game"
        },
        {
            "game_id": "dice",
            "game_name": "Dice",
            "category": GameCategory.LOTTERY,
            "min_bet": 10.0,
            "max_bet": 25000.0,
            "rtp_percentage": 98.0,
            "description": "Predict dice roll outcomes"
        }
    ]
    
    games_created = 0
    for game_data in games:
        existing_game = await db.game_settings.find_one({"game_id": game_data["game_id"]}, {"_id": 0})
        if not existing_game:
            game = GameSettings(**game_data)
            game_dict = game.model_dump()
            game_dict["created_at"] = game_dict["created_at"].isoformat()
            game_dict["updated_at"] = game_dict["updated_at"].isoformat()
            await db.game_settings.insert_one(game_dict)
            games_created += 1
    
    print(f"✓ {games_created} game settings created")
    
    print("\n=== Setup Complete! ===")
    print("\nYou can now:")
    print("1. Login to admin panel with the credentials above")
    print("2. Configure game settings")
    print("3. Start accepting user registrations")
    print("\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_database())
