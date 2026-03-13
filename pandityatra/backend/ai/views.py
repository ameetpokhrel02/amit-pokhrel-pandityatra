from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from .service import AIOrchestrator


class AIChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get("message", "").strip()
        if not message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = AIOrchestrator().run(request, message)
            return Response(payload)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([AllowAny])
def ai_guide(request):
    return Response({"detail": "Use POST /api/ai/chat/"})
