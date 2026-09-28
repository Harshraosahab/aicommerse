from fastapi import APIRouter, HTTPException, status
from app.models.recommendation import (
    PersonalizedRecommendRequest,
    SimilarProductsRequest,
    RecommendationResponse,
    ModelInfoResponse,
)
from app.services.recommendation_engine import recommendation_engine
from app.core.logging import logger

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post(
    "/personalized",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate personalized recommendations",
    description="Calculates user affinity scores from real interactions and ranks candidate products.",
)
async def get_personalized_recommendations(request: PersonalizedRecommendRequest):
    try:
        response = recommendation_engine.compute_personalized_recommendations(
            interactions=request.interactions,
            candidate_products=request.candidate_products,
            limit=request.limit,
            exclude_product_ids=request.exclude_product_ids,
        )
        return response
    except Exception as e:
        logger.error(f"Error computing personalized recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Personalization error: {str(e)}",
        )


@router.post(
    "/similar",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate similar product recommendations",
    description="Calculates multi-feature content-based similarity between target product and candidates.",
)
async def get_similar_products(request: SimilarProductsRequest):
    try:
        response = recommendation_engine.compute_similar_products(
            target_product=request.target_product,
            candidate_products=request.candidate_products,
            limit=request.limit,
        )
        return response
    except Exception as e:
        logger.error(f"Error computing similar products: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Content similarity error: {str(e)}",
        )


@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve recommendation engine model telemetry",
    description="Returns active recommendation model version, algorithms, and feature weights.",
)
async def get_model_info():
    return ModelInfoResponse()
