from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

SAMPLE_CANDIDATES = [
    {
        "id": "prod_1",
        "name": "Wireless Noise-Cancelling Headphones",
        "description": "High fidelity audio with active noise cancellation and bluetooth",
        "category_id": "cat_audio",
        "brand_id": "brand_sony",
        "tags": ["audio", "wireless", "headphones", "bluetooth"],
        "price": 299.99,
        "rating": 4.8,
        "review_count": 120,
    },
    {
        "id": "prod_2",
        "name": "Wireless Bluetooth Earbuds",
        "description": "True wireless earbuds with long battery life",
        "category_id": "cat_audio",
        "brand_id": "brand_sony",
        "tags": ["audio", "wireless", "earbuds", "bluetooth"],
        "price": 149.99,
        "rating": 4.5,
        "review_count": 85,
    },
    {
        "id": "prod_3",
        "name": "Organic Cotton T-Shirt",
        "description": "Eco-friendly crew neck t-shirt made of 100% organic cotton",
        "category_id": "cat_clothing",
        "brand_id": "brand_nike",
        "tags": ["clothing", "organic", "cotton", "casual"],
        "price": 29.99,
        "rating": 4.2,
        "review_count": 40,
    },
    {
        "id": "prod_4",
        "name": "Running Athletic Shoes",
        "description": "Lightweight breathable running sneakers with cushioned soles",
        "category_id": "cat_footwear",
        "brand_id": "brand_nike",
        "tags": ["footwear", "running", "shoes", "sports"],
        "price": 119.99,
        "rating": 4.6,
        "review_count": 95,
    },
]


def test_model_info():
    response = client.get("/api/v1/recommendations/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "v1.0.0-hybrid"
    assert "algorithms" in data
    assert "feature_weights" in data
    assert data["feature_weights"]["category_affinity"] == 0.35


def test_personalized_recommendations_cold_start():
    # Cold start with empty interactions
    payload = {
        "user_id": "new_user_123",
        "interactions": [],
        "candidate_products": SAMPLE_CANDIDATES,
        "limit": 5,
    }
    response = client.post("/api/v1/recommendations/personalized", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["cold_start"] is True
    assert data["recommendations"] == []


def test_personalized_recommendations_with_history():
    # User interacted heavily with audio & Sony
    payload = {
        "user_id": "user_audio_lover",
        "interactions": [
            {
                "product_id": "prod_1",
                "action": "PURCHASE",
                "weight": 5.0,
                "metadata": {
                    "category_id": "cat_audio",
                    "brand_id": "brand_sony",
                    "tags": ["audio", "wireless"],
                },
            },
            {
                "product_id": "prod_2",
                "action": "ADD_TO_CART",
                "weight": 4.0,
                "metadata": {
                    "category_id": "cat_audio",
                    "brand_id": "brand_sony",
                    "tags": ["audio", "bluetooth"],
                },
            },
        ],
        "candidate_products": SAMPLE_CANDIDATES,
        "limit": 3,
        "exclude_product_ids": ["prod_1"],  # Already purchased prod_1
    }
    response = client.post("/api/v1/recommendations/personalized", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["cold_start"] is False
    assert len(data["recommendations"]) > 0

    # prod_1 should be excluded
    rec_ids = [r["product_id"] for r in data["recommendations"]]
    assert "prod_1" not in rec_ids

    # prod_2 (Sony, audio, wireless) must be ranked highest
    top_rec = data["recommendations"][0]
    assert top_rec["product_id"] == "prod_2"
    assert top_rec["score"] > 0.5
    assert "category_affinity" in top_rec["match_factors"]
    assert top_rec["match_factors"]["category_affinity"] > 0


def test_similar_products_content_based():
    payload = {
        "target_product": SAMPLE_CANDIDATES[0],  # prod_1 (Sony audio headphones)
        "candidate_products": SAMPLE_CANDIDATES,
        "limit": 3,
    }
    response = client.post("/api/v1/recommendations/similar", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["recommendations"]) > 0

    # Target product itself must not be in recommendations
    rec_ids = [r["product_id"] for r in data["recommendations"]]
    assert "prod_1" not in rec_ids

    # prod_2 shares category (audio), brand (sony), tags (wireless, bluetooth)
    # It must score higher than prod_3 (t-shirt)
    scores = {r["product_id"]: r["score"] for r in data["recommendations"]}
    assert scores["prod_2"] > scores.get("prod_3", 0.0)


def test_recommendations_invalid_payload():
    # Missing required target_product
    response = client.post("/api/v1/recommendations/similar", json={"candidate_products": []})
    assert response.status_code == 422
