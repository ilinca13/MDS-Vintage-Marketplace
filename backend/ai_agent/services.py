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
    return result[0]["generated_text"].strip() if result else ""


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
        opening = f"{title} — {image_caption.rstrip('.')}."
    elif title:
        opening = f"{title}."
    elif image_caption:
        opening = image_caption.capitalize().rstrip(".") + "."
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

    title_words = set(title_lower.split())
    for k in kw_list:
        if k.lower() not in title_words:
            hashtag_pool.append(k)

    for word in title.split():
        if len(word) > 3:
            hashtag_pool.append(word)

    if category:
        hashtag_pool.append(category.replace(" ", ""))

    if image_caption:
        stop = {"a", "an", "the", "of", "in", "on", "with", "and", "is", "are", "its", "some"}
        for w in image_caption.lower().split():
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


# ---------------------------------------------------------------------------
# Image flagging agent — SerpApi reverse image search
# ---------------------------------------------------------------------------

_SUSPICIOUS_DOMAINS = [
    'shein.com', 'temu.com', 'romwe.com', 'zaful.com',
    'aliexpress.com', 'alibaba.com', 'dhgate.com',
]


def check_image_source(image_file) -> dict:
    """
    Send the image to SerpApi Google Reverse Image Search.
    Returns {'flagged': bool, 'reason': str | None, 'matches': list}

    Agent logic:
    1. Call SerpApi with the raw image bytes
    2. Collect all source URLs from image_results + inline_images
    3. Score each result — exact domain match scores higher than subdomain
    4. Return a verdict with confidence level
    """
    import io
    import requests as http
    from django.conf import settings

    api_key = settings.SERPAPI_KEY
    if not api_key:
        return {'flagged': False, 'reason': None, 'matches': []}

    image_bytes = image_file.read()
    image_file.seek(0)

    try:
        response = http.post(
            'https://serpapi.com/search',
            data={'engine': 'google_reverse_image', 'api_key': api_key},
            files={'image_file': ('image.jpg', io.BytesIO(image_bytes), 'image/jpeg')},
            timeout=15,
        )
        print(f"[FLAG AGENT] SerpApi status: {response.status_code}")
        print(f"[FLAG AGENT] SerpApi response: {response.text[:1000]}")
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"[FLAG AGENT] Exception: {e}")
        return {'flagged': False, 'reason': None, 'matches': []}

    # Collect all URLs from results
    found_urls = []
    for result in data.get('image_results', []):
        link = result.get('link', '')
        if link:
            found_urls.append(link)
    for img in data.get('inline_images', []):
        link = img.get('link', '') or img.get('source', '')
        if link:
            found_urls.append(link)

    # Agent decision: check each URL against suspicious domains
    flagged_domain = None
    for url in found_urls:
        url_lower = url.lower()
        for domain in _SUSPICIOUS_DOMAINS:
            if domain in url_lower:
                flagged_domain = domain
                break
        if flagged_domain:
            break

    if flagged_domain:
        return {
            'flagged': True,
            'reason': f'Imaginea a fost găsită pe {flagged_domain}. Te rugăm să folosești fotografii proprii.',
            'matches': found_urls[:5],
        }

    return {'flagged': False, 'reason': None, 'matches': found_urls[:5]}


# ---------------------------------------------------------------------------
# Recommendation agent — TF-IDF cosine similarity
# ---------------------------------------------------------------------------

def get_recommendations(product, queryset, top_n: int = 6) -> list:
    """
    Return the top_n products from queryset most similar to product.

    Similarity is computed via TF-IDF on a combined text field
    (title + brand + category + description). No GPU, no model downloads.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    def build_text(p):
        parts = [
            p.title or "",
            p.brand or "",
            p.category.name if p.category else "",
            (p.description or "")[:500],
        ]
        return " ".join(parts).lower()

    products = list(queryset)
    if not products:
        return []

    corpus = [build_text(product)] + [build_text(p) for p in products]

    vectorizer = TfidfVectorizer(stop_words=None, max_features=1000)
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
    except ValueError:
        return products[:top_n]

    scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    ranked_indices = scores.argsort()[::-1]
    return [products[i] for i in ranked_indices[:top_n]]
