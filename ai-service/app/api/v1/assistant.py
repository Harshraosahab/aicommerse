from fastapi import APIRouter, status
from app.schemas.ai_advanced import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_ai_engine import assistant_ai_engine

router = APIRouter(prefix="/assistant", tags=["shopping-assistant"])


@router.post(
    "/chat",
    response_model=AssistantChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Process shopping assistant message",
    description="Understands user discovery queries and generates safe tool invocation proposals.",
)
async def assistant_chat(request: AssistantChatRequest):
    return assistant_ai_engine.process_chat_message(request)
