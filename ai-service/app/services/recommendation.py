# Recommendation Service Foundation
# In accordance with Phase 1 strict rules:
# No fake recommendation data, no hardcoded models.
# Model training and inference will be implemented in Phase 9.


class RecommendationEngineInterface:
    """
    Interface definition for the AI recommendation engine.
    Implementation scheduled for Phase 9.
    """

    async def get_recommendations_for_user(self, user_id: str, limit: int = 10):
        raise NotImplementedError(
            "AI Recommendation Engine is not implemented in Phase 1 (Foundation). "
            "Real ML model integration is scheduled for Phase 9."
        )

    async def get_similar_products(self, product_id: str, limit: int = 10):
        raise NotImplementedError(
            "Similar products recommendation model is scheduled for Phase 9."
        )
