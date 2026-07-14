from __future__ import annotations

from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, model_validator


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class BoundingBox(BaseModel):
    min_lon: float = Field(ge=-180, le=180)
    min_lat: float = Field(ge=-90, le=90)
    max_lon: float = Field(ge=-180, le=180)
    max_lat: float = Field(ge=-90, le=90)
    crs: str = Field(default="EPSG:4326")

    @model_validator(mode="after")
    def _check_order(self) -> "BoundingBox":
        if self.max_lon <= self.min_lon:
            raise ValueError("max_lon must be greater than min_lon")
        if self.max_lat <= self.min_lat:
            raise ValueError("max_lat must be greater than min_lat")
        return self


class AnalyzeRequest(BaseModel):
    bbox: BoundingBox
    include_fault_lines: bool = True


class AnalyzeResponse(BaseModel):
    request_id: UUID = Field(default_factory=uuid4)
    job_id: UUID = Field(default_factory=uuid4)
    status: str = "completed"
    mean_probability: float
    confidence: float
    overall_risk: RiskLevel


class WellRecord(BaseModel):
    well_id: str
    lat: float
    lon: float
    depth_m: Optional[float] = None
    production_type: Optional[str] = None


class WellsResponse(BaseModel):
    request_id: UUID = Field(default_factory=uuid4)
    wells: List[WellRecord]


class ZoneInsight(BaseModel):
    zone_id: str
    confidence: float = Field(ge=0, le=1)
    depth_min_m: float
    depth_max_m: float
    risk: RiskLevel


class HeatmapFeatureCollection(BaseModel):
    request_id: UUID = Field(default_factory=uuid4)
    type: str = "FeatureCollection"
    features: list


class ReportResponse(BaseModel):
    request_id: UUID = Field(default_factory=uuid4)
    job_id: UUID
    summary: str
    mean_probability: float
    confidence: float
    overall_risk: RiskLevel
    recommendations: List[ZoneInsight]
