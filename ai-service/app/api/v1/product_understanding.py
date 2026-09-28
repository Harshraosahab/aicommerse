from fastapi import APIRouter, status
from app.schemas.ai_advanced import (
    ProductAnalysisRequest,
    ProductAnalysisResponse,
    DescriptionDraftRequest,
    DescriptionDraftResponse,
)
from app.services.product_ai_engine import product_ai_engine

router = APIRouter(prefix="/product", tags=["product-understanding"])


@router.post(
    "/analyze",
    response_model=ProductAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Suggest categories and tags from product attributes",
    description="Analyzes product name, specs, and description to predict category and generate verified tags.",
)
async def analyze_product(request: ProductAnalysisRequest):
    return product_ai_engine.analyze_product(request)


@router.post(
    "/description",
    response_model=DescriptionDraftResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate grounded product description draft",
    description="Drafts descriptions and SEO keywords grounded strictly in supplied product attributes.",
)
async def draft_description(request: DescriptionDraftRequest):
    return product_ai_engine.draft_description(request)
