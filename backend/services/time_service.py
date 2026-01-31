from datetime import datetime
from zoneinfo import ZoneInfo


PK_TZ = ZoneInfo("Asia/Karachi")


def pk_date_str(dt: datetime | None = None) -> str:
    d = dt or datetime.now(tz=PK_TZ)
    return d.date().isoformat()
