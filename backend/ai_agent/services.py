"""
AI Agent services — image-to-text captioning (BLIP) + description generation.

Model: Salesforce/blip-image-captioning-base
Loaded lazily on first request and cached for subsequent calls.
"""

from PIL import Image

_caption_pipeline = None


def _get_caption_pipeline():
    global _caption_pipeline
    if _caption_pipeline is None:
        from transformers import pipeline
        _caption_pipeline = pipeline(
            "image-to-text",
            model="Salesforce/blip-image-captioning-base",
        )
    return _caption_pipeline


def generate_image_caption(image_file) -> str:
    """Run BLIP on the uploaded image and return a caption string."""
    img = Image.open(image_file).convert("RGB")
    pipe = _get_caption_pipeline()
    result = pipe(img)
    return result[0]["generated_text"] if result else ""


# ---------------------------------------------------------------------------
# Vintage-specific keyword enrichment
# ---------------------------------------------------------------------------

_VINTAGE_HASHTAGS = [
    "vintage", "secondhand", "sustainable", "thriftfind",
    "preloved", "vintagefashion", "slowfashion", "ecofriendly",
    "retro", "vintagestyle",
]

_CONDITION_PHRASES = {
    "new": "brand new with original tags — never worn",
    "like_new": "in like-new condition — barely worn with no signs of use",
    "good": "in great condition — minimal signs of wear, well cared for",
    "fair": "in fair condition — some visible wear that adds character",
    "poor": "well-loved with clear signs of a life well lived",
}


def _slug(text: str) -> str:
    return text.lower().replace(" ", "").replace("-", "")


def generate_product_description(
    *,
    keywords: str = "",
    title: str = "",
    category: str = "",
    condition: str = "",
    image_caption: str = "",
) -> tuple[str, list[str]]:
    """
    Build an attractive, naturally-written product description and hashtag list.

    Returns (description, hashtags).
    """
    kw_list = [k.strip() for k in keywords.split(",") if k.strip()]
    condition_phrase = _CONDITION_PHRASES.get(condition, "in great condition")
    title_lower = title.lower()

    # --- Paragraph 1: visual hook ---
    if title and image_caption:
        caption_clean = image_caption.strip().rstrip(".")
        opening = f"{title} — {caption_clean}."
    elif title:
        opening = f"{title}."
    elif image_caption:
        opening = image_caption.strip().rstrip(".").capitalize() + "."
    else:
        opening = ""

    # --- Paragraph 2: condition + context ---
    # Only mention keywords that aren't already obvious from the title
    extra_kws = [k for k in kw_list if k.lower() not in title_lower]

    if category and extra_kws:
        body = (
            f"A one-of-a-kind {category.lower()} piece, {condition_phrase}. "
            f"Features worth noting: {', '.join(extra_kws)}."
        )
    elif category:
        body = f"A one-of-a-kind {category.lower()} piece, {condition_phrase}."
    elif extra_kws:
        body = (
            f"A unique vintage find, {condition_phrase}. "
            f"Features worth noting: {', '.join(extra_kws)}."
        )
    else:
        body = f"A unique vintage find, {condition_phrase}."

    # --- Paragraph 3: closing ---
    closing = "Ships carefully packaged — sustainable fashion, one piece at a time."

    paragraphs = [p for p in [opening, body, closing] if p]
    description = "\n\n".join(paragraphs)

    # --- Hashtags ---
    hashtag_pool: list[str] = []

    # Keywords first (deduplicated against title words)
    title_words = set(title_lower.split())
    for k in kw_list:
        if k.lower() not in title_words:
            hashtag_pool.append(k)

    # Individual words from the title (skip very short words)
    for word in title.split():
        if len(word) > 3:
            hashtag_pool.append(word)

    # Category
    if category:
        hashtag_pool.append(category.replace(" ", ""))

    # Meaningful words from image caption
    if image_caption:
        stop = {"a", "an", "the", "of", "in", "on", "with", "and", "is", "are", "its", "some"}
        for w in image_caption.lower().split():
            w = w.strip(".,")
            if len(w) > 3 and w not in stop:
                hashtag_pool.append(w)

    hashtag_pool.extend(_VINTAGE_HASHTAGS)

    seen: set[str] = set()
    hashtags: list[str] = []
    for tag in hashtag_pool:
        clean = _slug(tag)
        if clean and clean not in seen:
            seen.add(clean)
            hashtags.append(f"#{clean}")

    return description, hashtags[:15]
