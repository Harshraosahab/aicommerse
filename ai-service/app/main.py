from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import logger
from app.api.v1.api import api_router
from app.api.v1.health import router as root_health_router


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
    )

    # CORS configuration
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS if isinstance(settings.ALLOWED_ORIGINS, list) else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handler
    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled error processing {request.method} {request.url}: {str(exc)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred in AI service.",
                },
            },
        )

    # Include root health check and versioned API router
    application.include_router(root_health_router, prefix="", tags=["root-health"])
    application.include_router(api_router, prefix=settings.API_V1_STR)

    return application


app = create_application()

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting {settings.PROJECT_NAME} on port {settings.PORT}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
