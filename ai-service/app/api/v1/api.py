from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.smart_search import router as smart_search_router
from app.api.v1.product_understanding import router as product_ai_router
from app.api.v1.review_intelligence import router as review_ai_router
from app.api.v1.assistant import router as assistant_router

api_router = APIRouter()

# Mount health routes under /api/v1
api_router.include_router(health_router, prefix="", tags=["health"])

# Mount recommendations routes under /api/v1
api_router.include_router(recommendations_router, prefix="", tags=["recommendations"])

# Mount Phase 9 Advanced AI routes
api_router.include_router(smart_search_router, prefix="", tags=["smart-search"])
api_router.include_router(product_ai_router, prefix="/ai", tags=["product-understanding"])
api_router.include_router(review_ai_router, prefix="/ai", tags=["review-intelligence"])
api_router.include_router(assistant_router, prefix="/ai", tags=["shopping-assistant"])
