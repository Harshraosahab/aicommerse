from fastapi import APIRouter, status
from app.schemas.ai_advanced import (
    ReviewAnalysisRequest,
    ReviewAnalysisResponse,
    ReviewSummaryRequest,
    ReviewSummaryResponse,
)
from app.services.nlp_engine import nlp_engine

router = APIRouter(prefix="/reviews", tags=["review-intelligence"])


@router.post(
    "/analyze",
    response_model=ReviewAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Batch sentiment and moderation analysis of real reviews",
    description="Scores sentiment (-1.0 to 1.0) and checks moderation flags (spam, abusive, repetition).",
)
async def analyze_reviews(request: ReviewAnalysisRequest):
    results = [nlp_engine.analyze_review_sentiment(r) for r in request.reviews]
    return ReviewAnalysisResponse(results=results, total=len(results))


@router.post(
    "/summarize",
    response_model=ReviewSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Aspect-based review summarization",
    description="Generates pros, cons, and common topics from real customer reviews with insufficient data checks.",
)
async def summarize_reviews(request: ReviewSummaryRequest):
    return nlp_engine.summarize_reviews(request.product_id, request.reviews)
