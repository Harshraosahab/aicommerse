from app.core.config import settings


def test_settings_loaded():
    assert settings.PROJECT_NAME is not None
    assert settings.PORT == 8000
    assert settings.ENVIRONMENT in ["development", "test", "production"]
    assert settings.API_V1_STR == "/api/v1"
