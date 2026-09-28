from pydantic import BaseModel
from typing import Optional, Dict, Any


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    timestamp: str
    system: Dict[str, Any]


class ErrorResponse(BaseModel):
    success: bool = False
    error: Dict[str, Any]
