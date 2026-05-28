from __future__ import annotations

import datetime as dt
import os
from typing import Any
from uuid import uuid4


def _s3_key(env: str, data_type: str, filename: str) -> str:
    return f"{env}/{data_type}/{dt.datetime.now(dt.timezone.utc):%Y-%m-%d}/{filename}"


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    _ = context
    env = os.getenv("APP_ENV", "staging")
    source = event.get("source", "sentinel")
    filename = f"{source}-{uuid4()}.tif"

    return {
        "request_id": str(uuid4()),
        "status": "queued",
        "raw_s3_key": _s3_key(env, "raw-imagery", filename),
        "tile_s3_prefix": _s3_key(env, "preprocessed-tiles", ""),
        "next_step": "trigger_preprocessing_lambda",
    }
