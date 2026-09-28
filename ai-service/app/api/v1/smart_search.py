from fastapi import APIRouter, status
from app.schemas.ai_advanced import SmartSearchParseRequest, ParsedSearchIntent
from app.services.nlp_engine import nlp_engine

router = APIRouter(prefix="/search", tags=["smart-search"])


@router.post(
    "/parse-query",
    response_model=ParsedSearchIntent,
    status_code=status.HTTP_200_OK,
    summary="Parse natural language search query",
    description="Extracts price bounds, category, brand, attributes, and core keywords from raw search text.",
)
async def parse_query(request: SmartSearchParseRequest):
    return nlp_engine.parse_search_query(
        query=request.query,
        known_categories=request.known_categories,
        known_brands=request.known_brands,
    )
