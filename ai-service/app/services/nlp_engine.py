import re
from typing import List, Dict, Set, Optional, Tuple
from app.schemas.ai_advanced import (
    ParsedSearchIntent,
    ReviewItem,
    ReviewSentimentItem,
    ReviewSummaryResponse,
)

# Common e-commerce color and attribute tokens
COLORS = {
    "black", "white", "red", "blue", "green", "grey", "gray",
    "yellow", "brown", "navy", "pink", "purple", "orange", "beige"
}

USE_CASES = {
    "running", "gym", "workout", "college", "daily", "formal", "casual",
    "office", "sports", "gaming", "travel", "outdoor"
}

POSITIVE_WORDS = {
    "great", "excellent", "amazing", "love", "perfect", "good", "high quality",
    "comfortable", "fast", "durable", "worth", "fantastic", "satisfied",
    "recommend", "superb", "brilliant", "impressed", "pleased", "smooth"
}

NEGATIVE_WORDS = {
    "terrible", "horrible", "worst", "broke", "poor", "bad", "disappointed",
    "waste", "defective", "slow", "uncomfortable", "returned", "damaged",
    "fake", "regret", "awful", "useless", "flimsy", "subpar", "cheap"
}

NEGATIONS = {"not", "never", "no", "isn't", "isnt", "aren't", "arent", "doesn't", "doesnt", "don't", "dont", "barely", "hardly"}


class NLPEngine:
    """
    NLP and Text Processing Engine for E-Commerce.
    Pure Python, highly performant, deterministic, and 100% grounded in real inputs.
    """

    def parse_search_query(
        self,
        query: str,
        known_categories: Optional[List[str]] = None,
        known_brands: Optional[List[str]] = None,
    ) -> ParsedSearchIntent:
        original = query.strip()
        text = original.lower()
        is_natural = False

        max_price: Optional[float] = None
        min_price: Optional[float] = None
        min_rating: Optional[float] = None
        target_category: Optional[str] = None
        target_brand: Optional[str] = None
        attributes: Dict[str, str] = {}

        # 1. Price constraint extraction
        # e.g., "between 1000 and 3000", "between ₹1000 - ₹3000"
        between_match = re.search(r"between\s*(?:₹|\$|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(?:₹|\$|rs\.?|inr)?\s*(\d+(?:\.\d+)?)", text)
        if between_match:
            min_price = float(between_match.group(1))
            max_price = float(between_match.group(2))
            is_natural = True
            text = text.replace(between_match.group(0), " ")

        # e.g., "under 3000", "below ₹2500", "less than $50", "max 4000"
        under_match = re.search(r"(?:under|below|less than|max|within|upto|up to)\s*(?:₹|\$|rs\.?|inr)?\s*(\d+(?:\.\d+)?)", text)
        if under_match and max_price is None:
            max_price = float(under_match.group(1))
            is_natural = True
            text = text.replace(under_match.group(0), " ")

        # e.g., "above 1000", "over 2000", "more than 500", "min 1000"
        above_match = re.search(r"(?:above|over|more than|min|starting from)\s*(?:₹|\$|rs\.?|inr)?\s*(\d+(?:\.\d+)?)", text)
        if above_match and min_price is None:
            min_price = float(above_match.group(1))
            is_natural = True
            text = text.replace(above_match.group(0), " ")

        # 2. Rating extraction
        # e.g., "4 star", "4+ rating", "high rating", "top rated", "best rated"
        if re.search(r"\b(?:top rated|best rated|highest rated|high ratings?)\b", text):
            min_rating = 4.0
            is_natural = True
            text = re.sub(r"\b(?:top rated|best rated|highest rated|high ratings?)\b", " ", text)
        else:
            star_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:\+|plus)?\s*(?:stars?|ratings?)", text)
            if star_match:
                min_rating = min(5.0, float(star_match.group(1)))
                is_natural = True
                text = text.replace(star_match.group(0), " ")

        # 3. Size extraction (e.g. "size 9", "size 10", "size M")
        size_match = re.search(r"\bsize\s*([0-9]+|[a-z]{1,3})\b", text)
        if size_match:
            attributes["size"] = size_match.group(1).upper()
            is_natural = True
            text = text.replace(size_match.group(0), " ")

        # 4. Color extraction
        for color in COLORS:
            if re.search(rf"\b{color}\b", text):
                attributes["color"] = color
                is_natural = True
                text = re.sub(rf"\b{color}\b", " ", text)
                break

        # 5. Use case extraction
        for uc in USE_CASES:
            if re.search(rf"\b{uc}\b", text):
                attributes["use_case"] = uc
                is_natural = True

        # 6. Brand extraction from known catalog brands
        if known_brands:
            for b in known_brands:
                b_clean = b.strip().lower()
                if re.search(rf"\b{re.escape(b_clean)}\b", text):
                    target_brand = b_clean
                    is_natural = True
                    text = re.sub(rf"\b{re.escape(b_clean)}\b", " ", text)
                    break

        # 7. Category extraction from known catalog categories
        if known_categories:
            for c in known_categories:
                c_clean = c.strip().lower()
                if re.search(rf"\b{re.escape(c_clean)}\b", text):
                    target_category = c_clean
                    is_natural = True
                    break

        # Common stop/filler words to strip from core clean query
        fillers = {"for", "with", "and", "the", "in", "a", "an", "of", "to", "show", "me", "find", "get", "need", "want"}
        tokens = [w for w in text.split() if w not in fillers and len(w) > 1]
        cleaned_query = " ".join(tokens).strip()

        # If clean query became empty, preserve original without filler words
        if not cleaned_query:
            cleaned_query = " ".join([w for w in original.lower().split() if w not in fillers]).strip() or original

        return ParsedSearchIntent(
            original_query=original,
            cleaned_query=cleaned_query,
            target_category=target_category,
            target_brand=target_brand,
            max_price=max_price,
            min_price=min_price,
            min_rating=min_rating,
            attributes=attributes,
            extracted_keywords=tokens,
            is_natural_language=is_natural,
            confidence=0.92 if is_natural else 0.75,
        )

    def analyze_review_sentiment(self, review: ReviewItem) -> ReviewSentimentItem:
        text = f"{review.title or ''} {review.comment}".lower()
        words = re.findall(r"\b\w+\b", text)

        pos_count = 0
        neg_count = 0

        for i, word in enumerate(words):
            # Check for negation in 2-word lookback
            negated = (i > 0 and words[i - 1] in NEGATIONS) or (i > 1 and words[i - 2] in NEGATIONS)
            if word in POSITIVE_WORDS:
                if negated:
                    neg_count += 1.5
                else:
                    pos_count += 1.0
            elif word in NEGATIVE_WORDS:
                if negated:
                    pos_count += 1.0
                else:
                    neg_count += 1.5

        # Incorporate star rating as prior
        rating_bias = (review.rating - 3.0) / 2.0  # -1.0 to 1.0
        text_bias = (pos_count - neg_count) / max(pos_count + neg_count, 1.0)
        final_score = (0.5 * rating_bias) + (0.5 * text_bias)
        final_score = max(-1.0, min(1.0, round(final_score, 2)))

        if final_score > 0.15:
            sentiment = "POSITIVE"
        elif final_score < -0.15:
            sentiment = "NEGATIVE"
        else:
            sentiment = "NEUTRAL"

        # Moderation Checks
        flag = "CLEAN"
        flag_reason = None

        # 1. URL / Link spam
        if re.search(r"(?:https?://|www\.|bit\.ly|t\.me|\.com|\.xyz)", text):
            flag = "SPAM"
            flag_reason = "Contains unauthorized external URL or promotional link."
        # 2. Suspicious character repetition
        elif re.search(r"([a-z!?.])\1{5,}", text):
            flag = "SUSPICIOUS_REPETITION"
            flag_reason = "Contains excessive repetitive characters."
        # 3. Profanity / abusive terms
        elif re.search(r"\b(?:scam|fraud|hate|idiot|fake store|cheat)\b", text):
            flag = "ABUSIVE"
            flag_reason = "Flagged for abusive or accusatory language."

        return ReviewSentimentItem(
            review_id=review.id,
            sentiment=sentiment,
            sentiment_score=final_score,
            flag=flag,
            flag_reason=flag_reason,
        )

    def summarize_reviews(self, product_id: str, reviews: List[ReviewItem]) -> ReviewSummaryResponse:
        total = len(reviews)
        if total < 3:
            return ReviewSummaryResponse(
                product_id=product_id,
                total_reviews_analyzed=total,
                overall_sentiment="INSUFFICIENT_DATA",
                average_rating=round(sum(r.rating for r in reviews) / total, 1) if total > 0 else 0.0,
                sentiment_distribution={"positive": 0, "neutral": 0, "negative": 0},
                pros=[],
                cons=[],
                common_topics=[],
                insufficient_data=True,
                insufficient_data_reason="At least 3 customer reviews are required to generate an authentic AI review summary.",
            )

        sentiments: List[ReviewSentimentItem] = [self.analyze_review_sentiment(r) for r in reviews]
        distribution = {"positive": 0, "neutral": 0, "negative": 0}
        for s in sentiments:
            if s.sentiment == "POSITIVE":
                distribution["positive"] += 1
            elif s.sentiment == "NEGATIVE":
                distribution["negative"] += 1
            else:
                distribution["neutral"] += 1

        avg_rating = round(sum(r.rating for r in reviews) / total, 1)

        if distribution["positive"] > (distribution["negative"] + distribution["neutral"]):
            overall = "PREDOMINANTLY_POSITIVE"
        elif distribution["negative"] > distribution["positive"]:
            overall = "PREDOMINANTLY_NEGATIVE"
        else:
            overall = "MIXED_FEEDBACK"

        # Aspect extraction for pros and cons
        pros: List[str] = []
        cons: List[str] = []
        topic_counts: Dict[str, int] = {}

        for r in reviews:
            sentences = re.split(r"[.!?\n]+", r.comment)
            for sentence in sentences:
                clean_s = sentence.strip()
                if len(clean_s) < 10:
                    continue
                s_lower = clean_s.lower()

                # Aspect phrases
                if any(w in s_lower for w in ["quality", "material"]):
                    topic_counts["Build Quality"] = topic_counts.get("Build Quality", 0) + 1
                if any(w in s_lower for w in ["fit", "size", "sizing"]):
                    topic_counts["Size & Fit"] = topic_counts.get("Size & Fit", 0) + 1
                if any(w in s_lower for w in ["comfort", "comfortable", "cushion"]):
                    topic_counts["Comfort"] = topic_counts.get("Comfort", 0) + 1
                if any(w in s_lower for w in ["sound", "audio", "bass"]):
                    topic_counts["Audio Performance"] = topic_counts.get("Audio Performance", 0) + 1
                if any(w in s_lower for w in ["battery", "charge", "charging"]):
                    topic_counts["Battery Life"] = topic_counts.get("Battery Life", 0) + 1
                if any(w in s_lower for w in ["price", "value", "worth"]):
                    topic_counts["Value for Money"] = topic_counts.get("Value for Money", 0) + 1

                # Pros classification
                if any(pw in s_lower for w in POSITIVE_WORDS if (pw := w) in s_lower) and not any(nw in s_lower for nw in NEGATIVE_WORDS):
                    if len(pros) < 4 and clean_s not in pros:
                        pros.append(clean_s)

                # Cons classification
                if any(nw in s_lower for w in NEGATIVE_WORDS if (nw := w) in s_lower) and not any(pw in s_lower for pw in POSITIVE_WORDS):
                    if len(cons) < 4 and clean_s not in cons:
                        cons.append(clean_s)

        sorted_topics = sorted(topic_counts.keys(), key=lambda t: topic_counts[t], reverse=True)[:5]

        return ReviewSummaryResponse(
            product_id=product_id,
            total_reviews_analyzed=total,
            overall_sentiment=overall,
            average_rating=avg_rating,
            sentiment_distribution=distribution,
            pros=pros[:3],
            cons=cons[:3],
            common_topics=sorted_topics,
            insufficient_data=False,
            insufficient_data_reason=None,
        )


nlp_engine = NLPEngine()
