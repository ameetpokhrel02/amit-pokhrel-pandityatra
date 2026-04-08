from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from .service import AIOrchestrator
from .tool_router import ToolRouter
from .constants import TOOL_NAMES
from drf_spectacular.utils import extend_schema


class AIChatView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(summary="AI Chat Interface")
    def post(self, request):
        message = request.data.get("message", "").strip()
        if not message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = AIOrchestrator().run(request, message)
            return Response(payload)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIPujaSamagriView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(summary="AI Puja Samagri Recommendation")
    def post(self, request):
        puja_id = request.data.get("puja_id")
        if not puja_id:
            return Response({"error": "puja_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            args = {
                "puja_id": int(puja_id),
                "location": request.data.get("location", "ONLINE"),
                "budget_preference": request.data.get("budget_preference", "standard"),
                "user_notes": request.data.get("user_notes", ""),
                "auto_add_alternatives": request.data.get("auto_add_alternatives", True),
                "limit": int(request.data.get("limit", 12)),
            }

            result = ToolRouter().execute(request, TOOL_NAMES["RECOMMEND_PUJA_SAMAGRI"], args)
            context = result.data.get("context", {})
            products = result.data.get("products", [])

            recommended_items = [
                {
                    "id": p.get("id"),
                    "name": p.get("name"),
                    "quantity": f"{p.get('quantity', 1)} {p.get('unit', 'pcs')}",
                    "price_npr": p.get("price", 0),
                    "image_url": p.get("image"),
                }
                for p in products
            ]

            followup = "Would you like me to add these to your cart?"
            payload = {
                "reply": f"{result.message}\n{followup}",
                "response": f"{result.message}\n{followup}",
                "response_type": result.type,
                "puja": context.get("puja_name"),
                "recommended_items": recommended_items,
                "products": products,
                "actions": result.data.get("actions", []),
                "missing_items": result.data.get("missing_items", []),
                "suggested_alternatives": result.data.get("suggested_alternatives", []),
                "context": context,
            }
            return Response(payload, status=status.HTTP_200_OK if result.ok else status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([AllowAny])
def ai_guide(request):
    return Response({"detail": "Use POST /api/ai/chat/"})
