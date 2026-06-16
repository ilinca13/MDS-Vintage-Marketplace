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

_CONDITION_LABELS = {
    "new": "brand new with original tags",
    "like_new": "in like-new condition — barely worn",
    "good": "in great condition with minimal signs of wear",
    "fair": "in fair condition — some visible wear that adds character",
    "poor": "well-loved with clear signs of use",
}


def generate_product_description(
    *,
    keywords: str = "",
    title: str = "",
    category: str = "",
    condition: str = "",
    image_caption: str = "",
) -> tuple[str, list[str]]:
    """
    Build an attractive product description and hashtag list from available context.

    Returns (description, hashtags).
    """
    kw_list = [k.strip() for k in keywords.split(",") if k.strip()]
    condition_text = _CONDITION_LABELS.get(condition, "in great condition")

    # --- Description body ---
    lines: list[str] = []

    # Opening line: combine title and image caption
    if title and image_caption:
        lines.append(f"{title} — {image_caption.rstrip('.')}.")
    elif title:
        lines.append(f"{title}.")
    elif image_caption:
        lines.append(f"{image_caption.capitalize().rstrip('.')}.")

    # Category + condition sentence
    if category:
        lines.append(
            f"A wonderful vintage piece from the {category} category, {condition_text}."
        )
    else:
        lines.append(
            f"This beautiful vintage item is {condition_text} and ready for a new home."
        )

    # Keyword features
    if kw_list:
        lines.append(f"Key features: {', '.join(kw_list)}.")

    # Sustainability pitch
    lines.append("Sustainably sourced from a curated vintage collection.")
    lines.append("Carefully packaged and shipped with love.")

    description = " ".join(lines)

    # --- Hashtags ---
    hashtag_pool: list[str] = list(kw_list)

    if category:
        hashtag_pool.append(category.replace(" ", ""))

    # Pull meaningful words from the image caption
    if image_caption:
        stop = {"a", "an", "the", "of", "in", "on", "with", "and", "is", "are"}
        caption_words = [
            w.strip(".,") for w in image_caption.lower().split()
            if len(w) > 3 and w.strip(".,") not in stop
        ]
        hashtag_pool.extend(caption_words[:4])

    hashtag_pool.extend(_VINTAGE_HASHTAGS)

    seen: set[str] = set()
    hashtags: list[str] = []
    for tag in hashtag_pool:
        clean = tag.lower().replace(" ", "").replace("-", "")
        if clean and clean not in seen:
            seen.add(clean)
            hashtags.append(f"#{clean}")

    return description, hashtags[:15]
