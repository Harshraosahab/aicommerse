import re
from typing import List, Dict, Any
from app.schemas.ai_advanced import (
    AssistantChatRequest,
    AssistantChatResponse,
    ToolCallAction,
)

INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions",
    r"override\s+system",
    r"you\s+are\s+now\s+admin",
    r"make\s+(?:all\s+)?prices?\s+(?:0|zero|free)",
    r"(?:show|give|leak|dump)\s+(?:all\s+)?(?:passwords?|tokens?|secrets?|credentials?)",
    r"drop\s+database",
    r"<script.*?>",
]


class AssistantAIEngine:
    """
    AI Shopping Assistant conversational engine.
    Parses intent, recommends factual tool calls, and defends against prompt injection.
    """

    def process_chat_message(self, req: AssistantChatRequest) -> AssistantChatResponse:
        message = req.message.strip()
        msg_lower = message.lower()

        # 1. Prompt Injection & Security Defense Guard
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, msg_lower, re.IGNORECASE):
                return AssistantChatResponse(
                    reply="I am your Nexus Commerce shopping assistant. I can only assist you with discovering real products, comparing catalog specifications, checking your personal cart, and finding personalized recommendations.",
                    suggested_actions=["Browse running shoes", "View trending products", "Check my cart"],
                    tool_calls=[],
                )

        tool_calls: List[ToolCallAction] = []
        suggested_actions: List[str] = []

        # 2. Cart Inquiry Intent
        if any(w in msg_lower for w in ["what's in my cart", "what is in my cart", "show my cart", "view my cart", "cart status", "check my cart"]):
            tool_calls.append(ToolCallAction(tool_name="getUserCartSummary", arguments={}))
            reply = "Let me check the active items currently in your shopping cart."
            suggested_actions = ["Proceed to checkout", "View saved wishlist", "Continue shopping"]
            return AssistantChatResponse(reply=reply, suggested_actions=suggested_actions, tool_calls=tool_calls)

        # 3. Personalized Recommendation Intent
        if any(w in msg_lower for w in ["what should i check out", "recommend something", "what do you recommend", "based on what i looked at", "suggest something for me"]):
            tool_calls.append(ToolCallAction(tool_name="getRecommendations", arguments={"limit": 4}))
            reply = "Here are top recommendations personalized for your browsing activity and interests:"
            suggested_actions = ["Show trending items", "Filter by price", "Browse categories"]
            return AssistantChatResponse(reply=reply, suggested_actions=suggested_actions, tool_calls=tool_calls)

        # 4. Product Comparison Intent
        if any(w in msg_lower for w in ["compare", "difference between", "versus", " vs "]):
            # Extract potential product identifiers or names
            clean_terms = re.sub(r"\b(?:compare|difference between|versus|vs|what are the)\b", "", msg_lower).strip()
            tool_calls.append(ToolCallAction(tool_name="compareProducts", arguments={"query": clean_terms}))
            reply = "I can compare the real specifications, prices, and stock availability for these items:"
            suggested_actions = ["Check specs", "View reviews", "Add best match to cart"]
            return AssistantChatResponse(reply=reply, suggested_actions=suggested_actions, tool_calls=tool_calls)

        # 5. Product Search & Discovery Intent (e.g. "running shoes under 3000", "comfortable sneakers")
        # Extract budget if present
        max_price = None
        price_match = re.search(r"(?:under|below|less than|within|upto)\s*(?:₹|\$|rs\.?|inr)?\s*(\d+)", msg_lower)
        if price_match:
            max_price = float(price_match.group(1))

        # Extract search query
        clean_query = re.sub(r"(?:i need|show me|find me|looking for|search for|under|below|less than|within|upto|\d+|₹|\$|rs\.?|inr)", "", msg_lower).strip()
        if not clean_query:
            clean_query = msg_lower

        tool_calls.append(ToolCallAction(
            tool_name="searchProducts",
            arguments={
                "query": clean_query,
                "maxPrice": max_price,
            }
        ))

        price_phrase = f" under ₹{int(max_price)}" if max_price else ""
        reply = f"I've searched our real catalog for '{clean_query}'{price_phrase}. Here are the matching products:"
        suggested_actions = ["Filter by brand", "Sort by rating", "See similar items"]

        return AssistantChatResponse(
            reply=reply,
            suggested_actions=suggested_actions,
            tool_calls=tool_calls,
        )


assistant_ai_engine = AssistantAIEngine()
