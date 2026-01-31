from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid
import random


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _random_download_bonus_amount() -> int:
    # Strict: between Rs33 and Rs43 inclusive
    return random.randint(33, 43)


async def try_grant_download_bonus(db, user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Auto grant app download bonus once per real device/install/phone. Admin cannot modify.

    NOTE: User-facing messaging should be minimal; backend simply doesn't grant if not eligible.
    """

    if user.get("has_download_bonus"):
        return None

    # Strict: phone required to grant. If missing -> deny silently.
    phone = user.get("phone")
    if not phone:
        return None

    device_fingerprint = user.get("device_fingerprint")
    app_install_id = user.get("app_install_id")
    if not device_fingerprint or not app_install_id:
        return None

    # Hard block if any identifier already claimed
    exists = await db.bonus_claims.find_one(
        {
            "bonus_type": "app_download",
            "$or": [
                {"device_fingerprint": device_fingerprint},
                {"app_install_id": app_install_id},
                {"phone": phone},
                {"user_id": user["id"]},
            ],
        },
        {"_id": 0},
    )
    if exists:
        return None

    amount = float(_random_download_bonus_amount())

    # Credit bonus into single wallet
    new_balance = float(user.get("wallet_balance", 0.0)) + amount

    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "has_download_bonus": True,
                "download_bonus_amount": amount,
                "download_bonus_at": _now_iso(),
                "wallet_balance": new_balance,
                "updated_at": _now_iso(),
            }
        },
    )

    claim = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "bonus_type": "app_download",
        "device_fingerprint": device_fingerprint,
        "app_install_id": app_install_id,
        "phone": phone,
        "amount": amount,
        "created_at": _now_iso(),
        "source": "system_auto",
    }
    await db.bonus_claims.insert_one(claim)

    return {"amount": amount, "new_balance": new_balance}
