from __future__ import annotations

from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from app.config import Settings
from app.database import MonsterSetsDatabase


@pytest.fixture
def database(tmp_path: Path) -> MonsterSetsDatabase:
    return MonsterSetsDatabase(
        Settings(
            database_path=tmp_path / "monster_sets.sqlite3",
            timezone_name="Europe/Warsaw",
            timezone=ZoneInfo("Europe/Warsaw"),
        )
    )
