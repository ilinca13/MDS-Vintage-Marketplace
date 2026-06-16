"""
AI Agent services — image-to-text captioning (BLIP large) + description generation.

Model: Salesforce/blip-image-captioning-large
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
            model="Salesforce/blip-image-captioning-large",
        )
    return _caption_pipeline


def generate_image_captions(image_files: list) -> list[str]:
    """Run BLIP on each uploaded image and return one caption per image."""
    if not image_files:
        return []
    pipe = _get_caption_pipeline()
    captions = []
    for f in image_files:
        img = Image.open(f).convert("RGB")
        result = pipe(img)
        if result and result[0].get("generated_text"):
            captions.append(result[0]["generated_text"].strip())
    return captions


def _merge_captions(captions: list[str]) -> str:
    """
    Combine captions from multiple images into one rich description sentence.
    Deduplicates words so repeated phrases don't pile up.
    """
    if not captions:
        return ""
    if len(captions) == 1:
        return captions[0]

    merged = captions[0].rstrip(".")
    seen_words = set(captions[0].lower().split())

    for caption in captions[1:]:
        words = set(caption.lower().split())
        # Only append if this caption adds at least 2 new meaningful words
        new_words = words - seen_words
        meaningful = [w for w in new_words if len(w) > 3]
        if len(meaningful) >= 2:
            merged += f"; the back shows {caption.rstrip('.')}" if len(captions) > 1 else f"; {caption.rstrip('.')}"
            seen_words |= words

    return merged + "."


# ---------------------------------------------------------------------------
# Vintage-specific defaults
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
    image_captions: list[str] | None = None,
) -> tuple[str, list[str]]:
    """
    Build an attractive, naturally-written product description and hashtag list.
    Uses all image captions to capture details from every photo.

    Returns (description, hashtags).
    """
    if image_captions is None:
        image_captions = []

    kw_list = [k.strip() for k in keywords.split(",") if k.strip()]
    condition_phrase = _CONDITION_PHRASES.get(condition, "in great condition")
    title_lower = title.lower()

    merged_caption = _merge_captions(image_captions)

    # --- Paragraph 1: visual hook ---
    if title and merged_caption:
        opening = f"{title} — {merged_caption.rstrip('.')}."
    elif title:
        opening = f"{title}."
    elif merged_caption:
        opening = merged_caption.capitalize()
    else:
        opening = ""

    # --- Paragraph 2: condition + extra features ---
    extra_kws = [k for k in kw_list if k.lower() not in title_lower]

    if category and extra_kws:
        body = (
            f"A one-of-a-kind {category.lower()} piece, {condition_phrase}. "
            f"Notable details: {', '.join(extra_kws)}."
        )
    elif category:
        body = f"A one-of-a-kind {category.lower()} piece, {condition_phrase}."
    elif extra_kws:
        body = (
            f"A unique vintage find, {condition_phrase}. "
            f"Notable details: {', '.join(extra_kws)}."
        )
    else:
        body = f"A unique vintage find, {condition_phrase}."

    # --- Paragraph 3: closing ---
    closing = "Ships carefully packaged — sustainable fashion, one piece at a time."

    paragraphs = [p for p in [opening, body, closing] if p]
    description = "\n\n".join(paragraphs)

    # --- Hashtags ---
    hashtag_pool: list[str] = []

    # Keywords that aren't already in the title
    title_words = set(title_lower.split())
    for k in kw_list:
        if k.lower() not in title_words:
            hashtag_pool.append(k)

    # Individual words from the title
    for word in title.split():
        if len(word) > 3:
            hashtag_pool.append(word)

    if category:
        hashtag_pool.append(category.replace(" ", ""))

    # Meaningful words from all image captions
    stop = {"a", "an", "the", "of", "in", "on", "with", "and", "is", "are", "its", "some", "back", "also", "shows"}
    for caption in image_captions:
        for w in caption.lower().split():
            w = w.strip(".,;")
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
