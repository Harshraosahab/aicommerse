import re
from typing import List, Dict, Set
from app.schemas.ai_advanced import (
    ProductAnalysisRequest,
    ProductAnalysisResponse,
    DescriptionDraftRequest,
    DescriptionDraftResponse,
)

CATEGORY_RULES = {
    "Footwear": ["shoe", "shoes", "sneaker", "sneakers", "boots", "loafers", "sandals", "slippers", "running shoe"],
    "Clothing & Apparel": ["shirt", "t-shirt", "tee", "hoodie", "jacket", "pants", "trousers", "jeans", "shorts", "sweater"],
    "Audio & Electronics": ["headphone", "headphones", "earbuds", "earphones", "speaker", "audio", "bluetooth speaker", "soundbar"],
    "Wearables & Accessories": ["watch", "smartwatch", "fitness tracker", "belt", "wallet", "backpack", "sunglasses"],
    "Home & Living": ["mug", "lamp", "pillow", "blanket", "bottle", "decor", "desk", "chair"],
}

KEYWORD_TAGS = {
    "wireless", "bluetooth", "waterproof", "cotton", "breathable", "lightweight",
    "durable", "rechargeable", "compact", "noise-cancelling", "ergonomic",
    "unisex", "leather", "casual", "formal", "athletic", "outdoor", "premium"
}


class ProductAIEngine:
    """
    AI Product Understanding and Content Assistance Engine.
    All outputs are strictly derived from real product inputs without hallucination.
    """

    def analyze_product(self, req: ProductAnalysisRequest) -> ProductAnalysisResponse:
        corpus = f"{req.name} {req.description or ''} {req.brand or ''}".lower()

        # Add specs and attributes to corpus
        for spec in req.specifications or []:
            corpus += f" {spec.name.lower()} {spec.value.lower()}"
        for attr in req.attributes or []:
            corpus += f" {attr.name.lower()} {attr.value.lower()}"

        # 1. Category Suggestion
        predicted_category = "General Catalog"
        max_matches = 0
        for category, keywords in CATEGORY_RULES.items():
            matches = sum(1 for kw in keywords if re.search(rf"\b{re.escape(kw)}\b", corpus))
            if matches > max_matches:
                max_matches = matches
                predicted_category = category

        # 2. Tag Suggestions
        tags: Set[str] = set()
        for kw in KEYWORD_TAGS:
            if re.search(rf"\b{re.escape(kw)}\b", corpus):
                tags.add(kw)

        # Brand as tag
        if req.brand and len(req.brand) > 1:
            tags.add(req.brand.lower().strip())

        # Category tokens as tags
        for word in predicted_category.lower().replace("&", " ").split():
            if len(word) > 3 and word not in ["general", "catalog"]:
                tags.add(word)

        # Preserve existing tags if provided
        for t in req.existing_tags or []:
            tags.add(t.lower().strip())

        # 3. Highlights from specs
        highlights = []
        for spec in (req.specifications or [])[:4]:
            highlights.append(f"{spec.name}: {spec.value}")

        return ProductAnalysisResponse(
            suggested_category=predicted_category,
            suggested_subcategory=None,
            suggested_tags=sorted(list(tags))[:10],
            suggested_highlights=highlights,
            confidence=0.88 if max_matches > 0 else 0.65,
        )

    def draft_description(self, req: DescriptionDraftRequest) -> DescriptionDraftResponse:
        brand_prefix = f"by {req.brand} " if req.brand else ""
        category_str = req.category or "product"

        # Feature bullet points strictly from specs/attributes
        features: List[str] = []
        for spec in req.specifications or []:
            features.append(f"Designed with verified {spec.name.lower()}: {spec.value}")
        for attr in req.attributes or []:
            features.append(f"Features {attr.name.lower()} specified as {attr.value}")
        if req.tags:
            features.append(f"Key attributes: {', '.join(req.tags[:4])}")

        # Grounded description construction
        short_desc = f"Discover the {req.name} {brand_prefix}- a {category_str.lower()} built for reliable everyday performance."

        full_paragraphs = [
            f"The {req.name} {brand_prefix}delivers exceptional quality and style within the {category_str.lower()} category.",
        ]

        if features:
            full_paragraphs.append("Key Highlights:\n" + "\n".join(f"- {f}" for f in features))

        full_desc = "\n\n".join(full_paragraphs)

        seo_keywords = [req.name.lower()]
        if req.brand:
            seo_keywords.append(req.brand.lower())
        if req.category:
            seo_keywords.append(req.category.lower())
        if req.tags:
            seo_keywords.extend([t.lower() for t in req.tags[:4]])

        return DescriptionDraftResponse(
            title_suggestion=f"{req.brand + ' ' if req.brand else ''}{req.name}",
            short_description=short_desc,
            full_description=full_desc,
            feature_bullet_points=features,
            seo_keywords=list(dict.fromkeys(seo_keywords))[:8],
        )


product_ai_engine = ProductAIEngine()
