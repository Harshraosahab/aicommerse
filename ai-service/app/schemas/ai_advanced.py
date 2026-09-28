from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


# 1. Smart Search Schemas
class SmartSearchParseRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    known_categories: Optional[List[str]] = Field(default_factory=list)
    known_brands: Optional[List[str]] = Field(default_factory=list)


class ParsedSearchIntent(BaseModel):
    original_query: str
    cleaned_query: str
    target_category: Optional[str] = None
    target_brand: Optional[str] = None
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    min_rating: Optional[float] = None
    attributes: Dict[str, str] = Field(default_factory=dict)
    extracted_keywords: List[str] = Field(default_factory=list)
    is_natural_language: bool = False
    confidence: float = 1.0


# 2. Product Understanding Schemas
class ProductAttributeItem(BaseModel):
    name: str
    value: str


class ProductAnalysisRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    brand: Optional[str] = ""
    specifications: Optional[List[ProductAttributeItem]] = Field(default_factory=list)
    attributes: Optional[List[ProductAttributeItem]] = Field(default_factory=list)
    existing_tags: Optional[List[str]] = Field(default_factory=list)


class ProductAnalysisResponse(BaseModel):
    suggested_category: str
    suggested_subcategory: Optional[str] = None
    suggested_tags: List[str]
    suggested_highlights: List[str]
    confidence: float = 0.9


class DescriptionDraftRequest(BaseModel):
    name: str
    brand: Optional[str] = ""
    category: Optional[str] = ""
    specifications: Optional[List[ProductAttributeItem]] = Field(default_factory=list)
    attributes: Optional[List[ProductAttributeItem]] = Field(default_factory=list)
    tags: Optional[List[str]] = Field(default_factory=list)
    target_audience: Optional[str] = "general shoppers"


class DescriptionDraftResponse(BaseModel):
    title_suggestion: str
    short_description: str
    full_description: str
    feature_bullet_points: List[str]
    seo_keywords: List[str]


# 3. Review Intelligence Schemas
class ReviewItem(BaseModel):
    id: str
    rating: int
    title: Optional[str] = ""
    comment: str
    is_verified_purchase: Optional[bool] = False


class ReviewSentimentItem(BaseModel):
    review_id: str
    sentiment: str  # POSITIVE, NEUTRAL, NEGATIVE
    sentiment_score: float  # -1.0 to 1.0
    flag: str  # CLEAN, SPAM, ABUSIVE, SUSPICIOUS_REPETITION
    flag_reason: Optional[str] = None


class ReviewAnalysisRequest(BaseModel):
    reviews: List[ReviewItem]


class ReviewAnalysisResponse(BaseModel):
    results: List[ReviewSentimentItem]
    total: int


class ReviewSummaryRequest(BaseModel):
    product_id: str
    reviews: List[ReviewItem]


class ReviewSummaryResponse(BaseModel):
    product_id: str
    total_reviews_analyzed: int
    overall_sentiment: str
    average_rating: float
    sentiment_distribution: Dict[str, int]  # positive, neutral, negative counts
    pros: List[str]
    cons: List[str]
    common_topics: List[str]
    insufficient_data: bool = False
    insufficient_data_reason: Optional[str] = None


# 4. Shopping Assistant Schemas
class ChatMessageItem(BaseModel):
    role: str  # user, assistant, system
    content: str


class AssistantContext(BaseModel):
    user_name: Optional[str] = None
    is_authenticated: bool = False
    cart_item_count: Optional[int] = 0
    recent_category_interests: Optional[List[str]] = Field(default_factory=list)


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    conversation_history: List[ChatMessageItem] = Field(default_factory=list)
    context: Optional[AssistantContext] = None


class ToolCallAction(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]


class AssistantChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = Field(default_factory=list)
    tool_calls: List[ToolCallAction] = Field(default_factory=list)
