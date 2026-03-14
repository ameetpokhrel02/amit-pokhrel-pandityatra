import time
import uuid
import re

from bookings.models import Booking
from services.models import Puja
from .models import AIQueryLog
from .constants import RESPONSE_TYPES
from .schemas import AIResponse
from .groq_client import GroqClient
from .prompt_builder import build_booking_context, build_system_prompt
from .tool_registry import get_tool_specs
from .tool_router import ToolRouter
from .formatters.response_formatter import merge_tool_result, to_payload


class AIOrchestrator:
    def __init__(self):
        self.groq = GroqClient()
        self.router = ToolRouter()

    def _get_user_booking_context(self, user) -> str:
        if not user or not user.is_authenticated:
            return ""
        active = Booking.objects.filter(user=user).select_related("pandit__user").order_by("-created_at")[:5]
        rows = [
            {
                "id": b.id,
                "service_name": b.service_name,
                "pandit_name": b.pandit.user.full_name or b.pandit.user.username,
                "booking_date": str(b.booking_date),
                "status": b.status,
            }
            for b in active
        ]
        return build_booking_context(rows)

    def _is_casual_greeting(self, text: str) -> bool:
        t = (text or "").strip().lower()
        if not t:
            return False
        patterns = [
            r"^hi$", r"^hello$", r"^hey$", r"^namaste$", r"^namaste\s*ji$",
            r"^k\s*cha$", r"^k\s*cha\s*guru$", r"^kasto\s*xa$", r"^tv\s*cha$", r"^hi\s*guru$",
        ]
        return any(re.match(p, t) for p in patterns)

    def run(self, request, user_message: str) -> dict:
        start = time.time()
        trace_id = uuid.uuid4().hex
        tool_log = []
        ai_resp = AIResponse(reply="", response_type=RESPONSE_TYPES["TEXT"])

        if self._is_casual_greeting(user_message):
            ai_resp.reply = "Namaste ji! Thik xa 🙏 Timi kasto xa? Ma PanditYatra ko AI guide ho — booking, pandit, puja, samagri ma help garna sakchu."
            latency_ms = int((time.time() - start) * 1000)
            AIQueryLog.objects.create(
                user=request.user if getattr(request.user, "is_authenticated", False) else None,
                trace_id=trace_id,
                mode="guide",
                user_message=user_message,
                ai_reply=ai_resp.reply,
                response_type=ai_resp.response_type,
                tool_log=tool_log,
                latency_ms=latency_ms,
            )
            payload = to_payload(ai_resp)
            payload["trace_id"] = trace_id
            return payload

        booking_context = self._get_user_booking_context(request.user)
        system_prompt = build_system_prompt(request.user, booking_context)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]

        response = self.groq.chat(messages=messages, tools=get_tool_specs(), tool_choice="auto", max_tokens=400)
        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls or []
        ai_resp.reply = response_message.content or ""

        lowered = user_message.lower()
        puja_hint = Puja.objects.filter(name__icontains=user_message).first() or Puja.objects.filter(name__icontains=lowered).first()
        product_intent = any(k in lowered for k in ["buy", "need", "find", "search", "book", "murti", "idol", "samagri", "agarbatti", "diya", "gita", "ramayan"])

        if tool_calls:
            messages.append(response_message)
            for call in tool_calls:
                tool_name = call.function.name
                args = self.router.safe_parse_arguments(call.function.arguments)
                result = self.router.execute(request, tool_name, args)

                tool_entry = {"tool": tool_name, "ok": result.ok, "message": result.message}
                ai_resp.tool_log.append(tool_entry)
                tool_log.append(tool_entry)
                merge_tool_result(ai_resp, result)

                messages.append({
                    "tool_call_id": call.id,
                    "role": "tool",
                    "name": tool_name,
                    "content": result.message,
                })

            final = self.groq.chat(messages=messages, max_tokens=350)
            ai_resp.reply = final.choices[0].message.content or ai_resp.reply or "Namaste 🙏 How can I help next?"
        elif puja_hint and any(k in lowered for k in ["samagri", "items", "kit", "materials", "required", "recommend"]):
            result = self.router.execute(
                request,
                "recommend_puja_samagri",
                {
                    "puja_id": puja_hint.id,
                    "location": "ONLINE",
                    "budget_preference": "standard",
                    "user_notes": user_message,
                    "auto_add_alternatives": True,
                    "limit": 12,
                }
            )
            tool_entry = {"tool": "recommend_puja_samagri", "ok": result.ok, "message": result.message, "fallback": True}
            ai_resp.tool_log.append(tool_entry)
            tool_log.append(tool_entry)
            merge_tool_result(ai_resp, result)
            if result.data.get("products"):
                ai_resp.reply = (
                    f"I prepared puja-specific samagri for {puja_hint.name} and added best alternatives for missing items. "
                    "Would you like me to add these to your cart?"
                )
        elif product_intent:
            # Guard fallback: ensure user still gets product cards if tool call was skipped
            result = self.router.execute(request, "search_samagri", {"query": user_message, "limit": 5})
            tool_entry = {"tool": "search_samagri", "ok": result.ok, "message": result.message, "fallback": True}
            ai_resp.tool_log.append(tool_entry)
            tool_log.append(tool_entry)
            merge_tool_result(ai_resp, result)
            if result.data.get("products"):
                ai_resp.reply = "I found some matching items 🙏 You can add them to cart directly from below."

        if not ai_resp.reply:
            ai_resp.reply = "Namaste 🙏 How can I help you today?"

        latency_ms = int((time.time() - start) * 1000)

        AIQueryLog.objects.create(
            user=request.user if getattr(request.user, "is_authenticated", False) else None,
            trace_id=trace_id,
            mode="guide",
            user_message=user_message,
            ai_reply=ai_resp.reply,
            response_type=ai_resp.response_type,
            tool_log=tool_log,
            latency_ms=latency_ms,
        )

        payload = to_payload(ai_resp)
        payload["trace_id"] = trace_id
        return payload
