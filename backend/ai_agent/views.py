from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import generate_image_captions, generate_product_description


class GenerateDescriptionView(APIView):
    """
    POST /api/ai/generate-description/

    Accepts multipart/form-data:
      - images     (files, optional) — one or more product photos; each is captioned by BLIP
      - keywords   (str,  optional)  — comma-separated keywords, e.g. "linen, summer, boho"
      - title      (str,  optional)  — product title
      - category   (str,  optional)  — product category name
      - condition  (str,  optional)  — one of: new / like_new / good / fair / poor

    Returns:
      - description    (str)   — generated product description
      - hashtags       (list)  — up to 15 relevant hashtags
      - image_captions (list)  — raw captions from BLIP, one per image
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image_files = request.FILES.getlist("images")
        keywords = request.data.get("keywords", "").strip()
        title = request.data.get("title", "").strip()
        category = request.data.get("category", "").strip()
        condition = request.data.get("condition", "").strip()

        if not image_files and not keywords and not title:
            return Response(
                {"error": "Provide at least one of: images, title, or keywords."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        image_captions = []
        if image_files:
            try:
                image_captions = generate_image_captions(image_files)
            except Exception as exc:
                return Response(
                    {"error": f"Image processing failed: {exc}"},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

        description, hashtags = generate_product_description(
            keywords=keywords,
            title=title,
            category=category,
            condition=condition,
            image_captions=image_captions,
        )

        return Response(
            {
                "description": description,
                "hashtags": hashtags,
                "image_captions": image_captions,
            },
            status=status.HTTP_200_OK,
        )
