from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import random


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


DEFAULT_FIRST_DEPOSIT_108_CONFIG: List[Dict[str, Any]] = [
    {"min": 100, "max": 299, "bonus_fixed": 108},
    {"min": 300, "max": 999, "bonus_fixed": 229},
    {"min": 1000, "max": 4999, "bonus_min": 301, "bonus_max": 349},
    {"min": 5000, "max": 14999, "bonus_min": 350, "bonus_max": 500},
    {"min": 15000, "max": 24999, "bonus_min": 501, "bonus_max": 999},
    {"min": 25000, "max": 34999, "bonus_min": 1000, "bonus_max": 1999},
    {"min": 35000, "max": 44999, "bonus_min": 2000, "bonus_max": 2999},
    {"min": 45000, "max": None, "bonus_min": 3000, "bonus_max": 3999},
]


def compute_first_deposit_108_bonus(amount: float, config: List[Dict[str, Any]]) -> float:
    a = float(amount)
    for r in config:
        rmin = float(r["min"])
        rmax = r.get("max")
        if rmax is None:
            in_range = a >= rmin
        else:
            in_range = (a >= rmin) and (a <= float(rmax))

        if not in_range:
            continue

        if "bonus_fixed" in r:
            return float(r["bonus_fixed"])
        return float(random.randint(int(r["bonus_min"]), int(r["bonus_max"])))

    return 0.0


async def get_first_deposit_108_config(db) -> List[Dict[str, Any]]:
    doc = await db.promotion_configs.find_one({"key": "first_deposit_108"}, {"_id": 0})
    if doc and isinstance(doc.get("config"), list):
        return doc["config"]
    return DEFAULT_FIRST_DEPOSIT_108_CONFIG


async def set_first_deposit_108_config(db, config: List[Dict[str, Any]], admin_id: str) -> None:
    await db.promotion_configs.update_one(
        {"key": "first_deposit_108"},
        {
            "$set": {
                "key": "first_deposit_108",
                "config": config,
                "updated_by": admin_id,
                "updated_at": _now_iso(),
            }
        },
        upsert=True,
    )
