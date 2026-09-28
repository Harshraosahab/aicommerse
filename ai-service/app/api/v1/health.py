import platform
import sys
from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Returns AI service health status and runtime diagnostics.
    """
    return HealthResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
        system={
            "python_version": sys.version,
            "platform": platform.platform(),
            "architecture": platform.machine(),
        },
    )
