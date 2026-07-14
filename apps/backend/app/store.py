"""Simple thread-safe in-memory job store for the demo API.

In production this would be backed by Aurora/Redis; for the demo flow it
lets /analyze persist a result that /heatmap and /report can read back.
"""
from __future__ import annotations

import threading
from typing import Dict, Optional
from uuid import UUID


class JobStore:
    def __init__(self) -> None:
        self._jobs: Dict[str, dict] = {}
        self._lock = threading.Lock()

    def save(self, job_id: UUID, result: dict) -> None:
        with self._lock:
            self._jobs[str(job_id)] = result

    def get(self, job_id: UUID) -> Optional[dict]:
        with self._lock:
            return self._jobs.get(str(job_id))


store = JobStore()
