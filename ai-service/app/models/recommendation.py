from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class InteractionItem(BaseModel):
    product_id: str
    action: str
    weight: Optional[float] = None
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ProductFeature(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    category_id: Optional[str] = ""
    brand_id: Optional[str] = ""
    tags: List[str] = Field(default_factory=list)
    price: float = 0.0
    rating: Optional[float] = 0.0
    review_count: Optional[int] = 0
    specifications: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class PersonalizedRecommendRequest(BaseModel):
    user_id: Optional[str] = None
    interactions: List[InteractionItem] = Field(default_factory=list)
    candidate_products: List[ProductFeature] = Field(default_factory=list)
    limit: int = Field(default=10, ge=1, le=50)
    exclude_product_ids: Optional[List[str]] = Field(default_factory=list)


class SimilarProductsRequest(BaseModel):
    target_product: ProductFeature
    candidate_products: List[ProductFeature] = Field(default_factory=list)
    limit: int = Field(default=8, ge=1, le=50)


class RecommendationItem(BaseModel):
    product_id: str
    score: float
    reason: str
    match_factors: Dict[str, float] = Field(default_factory=dict)


class RecommendationResponse(BaseModel):
    success: bool = True
    model_version: str = "v1.0.0-hybrid"
    algorithm: str
    recommendations: List[RecommendationItem] = Field(default_factory=list)
    total_candidates: int = 0
    cold_start: bool = False


class ModelInfoResponse(BaseModel):
    model_name: str = "Nexus E-Commerce Hybrid Recommender"
    version: str = "v1.0.0-hybrid"
    status: str = "active"
    algorithms: List[str] = Field(default_factory=lambda: ["user_interaction_affinity", "content_multi_feature_similarity"])
    feature_weights: Dict[str, float] = Field(
        default_factory=lambda: {
            "category_affinity": 0.35,
            "brand_affinity": 0.20,
            "tag_similarity": 0.25,
            "price_proximity": 0.10,
            "rating_prior": 0.10,
        }
    )
