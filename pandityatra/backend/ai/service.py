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

    # ── Rule-based pattern matching ────────────────────────────────────
    GREETING_PATTERNS = [
        r"^hi$", r"^hello$", r"^hey$", r"^hey\s*there$", r"^hii+$",
        r"^namaste$", r"^namaste\s*ji$", r"^namaskar$",
        r"^k\s*cha$", r"^k\s*cha\s*guru$", r"^kasto\s*xa$", r"^tv\s*cha$",
        r"^hi\s*guru$", r"^good\s*(morning|evening|afternoon|night)$",
        r"^sup$", r"^yo$", r"^howdy$", r"^greetings$",
    ]

    THANK_PATTERNS = [
        r"^thanks?$", r"^thank\s*you$", r"^thank\s*u$", r"^dhanyabad$",
        r"^dhanyabaad$", r"^ok\s*thanks?$", r"^thx$", r"^ty$",
        r"^nice$", r"^great$", r"^awesome$", r"^perfect$", r"^cool$",
    ]

    RULE_BASED_RESPONSES = {
        # How to book / booking flow
        r"how.*(book|puja\s*book|booking)": (
            "Here's how to book a puja on PanditYatra 📅:\n\n"
            "1️⃣ Go to **Booking** page (/booking)\n"
            "2️⃣ Select the puja type (e.g., Bratabandha, Satyanarayan, Bibaha)\n"
            "3️⃣ Choose your preferred date, time, and location\n"
            "4️⃣ Pick a verified pandit from the list\n"
            "5️⃣ Pay via **Khalti**, **eSewa**, or **Stripe** (for international)\n"
            "6️⃣ On the puja day, click **Join Video Puja** from your dashboard! 🙏\n\n"
            "Would you like me to show you available pandits?"
        ),

        # How kundali works
        r"(how|what).*(kundali|kundli|birth\s*chart|janam\s*patri)": (
            "**Offline Kundali Generator** works completely without internet! 🕉️\n\n"
            "1️⃣ Go to **Kundali** page (/kundali)\n"
            "2️⃣ Enter your birth date, time, and place\n"
            "3️⃣ Click **Generate Chart**\n"
            "4️⃣ View your planetary positions, Rashi, and Nakshatra\n"
            "5️⃣ Download as a beautiful **PDF** to keep forever!\n\n"
            "It uses real astronomical calculations (astronomy-engine) so your chart is accurate. ✨"
        ),

        # Video puja / how video call works
        r"(how|what).*(video\s*puja|video\s*call|live\s*puja|online\s*puja)": (
            "**Live Video Puja** lets you attend puja ceremonies from anywhere in the world! 📹\n\n"
            "• After booking and payment, a **Join Video Puja** button appears on your dashboard\n"
            "• Click it at the scheduled time to join the live session with your pandit\n"
            "• You can see and hear the pandit performing the puja in real-time\n"
            "• Chat with the pandit during the session too!\n\n"
            "It's perfect for NRIs (Non-Resident Nepalis) abroad who want to participate in ceremonies. 🙏"
        ),

        # Payment methods
        r"(how|what).*(pay|payment|khalti|esewa|stripe|card)": (
            "PanditYatra supports **3 payment methods** 💰:\n\n"
            "🟣 **Khalti** — Pay in NPR (Nepali Rupees)\n"
            "🟢 **eSewa** — Pay in NPR (Nepal's leading digital wallet)\n"
            "🔵 **Stripe** — Pay with USD/International credit/debit cards\n\n"
            "Choose your preferred method during checkout. All payments are secure & encrypted! 🔒"
        ),

        # What is PanditYatra
        r"(what\s*is|about|tell\s*me\s*about)\s*(pandit\s*yatra|this\s*app|this\s*platform|pandityatra)": (
            "**PanditYatra** is a comprehensive digital platform connecting Nepali families worldwide with authentic spiritual services 🙏\n\n"
            "✨ **Key Features:**\n"
            "• 📿 Book verified pandits for pujas (Bratabandha, Marriage, Satyanarayan, etc.)\n"
            "• 📹 Live Video Puja — attend from anywhere in the world\n"
            "• 🛒 Shop puja samagri (agarbatti, diya, ghee, books, idols)\n"
            "• 🕉️ Offline Kundali generator with PDF download\n"
            "• 📅 Nepali Panchang (daily calendar & tithi)\n"
            "• 💬 Real-time chat with your pandit\n"
            "• 💰 Pay via Khalti, eSewa, or Stripe\n\n"
            "It's designed for the global Nepali community — especially NRIs who want to practice their traditions with ease and trust! 🌍"
        ),

        # Samagri / shop
        r"(what|how).*(samagri|shop|buy|purchase|items|products)": (
            "Our **Puja Samagri Shop** has everything you need! 🛒\n\n"
            "• 📿 Agarbatti & Dhup (incense)\n"
            "• 🕯️ Diya & Candles\n"
            "• 📗 Books (Bhagavad Gita, Ramayan)\n"
            "• 🗿 Idols & Murtis\n"
            "• 🌿 Ghee, Rice, Flowers, Coconut\n"
            "• 📿 Rudraksha & Sacred Thread\n\n"
            "Go to **/shop/samagri** to browse, or tell me what puja you're doing and I'll recommend the exact items! 🙏"
        ),

        # Find pandit
        r"(how|where).*(find|search|pandit|priest)": (
            "To find the perfect pandit 🙏:\n\n"
            "1️⃣ Go to **Find Pandit** (/find-pandit)\n"
            "2️⃣ Filter by language (Nepali, Hindi, Sanskrit)\n"
            "3️⃣ Filter by expertise (Vedic rituals, Kundali, etc.)\n"
            "4️⃣ Sort by rating ⭐\n"
            "5️⃣ View profile & reviews, then **Book** or **Message** them!\n\n"
            "Would you like me to search for pandits now?"
        ),

        # Panchang
        r"(what|how|today).*(panchang|tithi|calendar|nepali\s*date)": (
            "The **Nepali Panchang** provides today's important information 📅:\n\n"
            "• Nepali date (Bikram Sambat)\n"
            "• Tithi (lunar day)\n"
            "• Nakshatra (star/constellation)\n"
            "• Auspicious timings for pujas\n\n"
            "Visit **/panchang** to check today's details! 🕉️"
        ),

        # Help / support / contact
        r"(help|support|contact|problem|issue|complaint)": (
            "I'm here to help! 🙏 Here are your options:\n\n"
            "💬 **Ask me** — I can help with bookings, navigation, samagri, kundali, and more!\n"
            "📧 **Email** — pandityatra9@gmail.com\n"
            "📝 **Contact Form** — Visit **/contact** to submit your query\n\n"
            "What would you like help with?"
        ),

        # Price / cost
        r"(how\s*much|price|cost|fee|charge)": (
            "Pricing varies by service 💰:\n\n"
            "• **Puja booking** — Depends on the pandit's rate and puja type\n"
            "• **Samagri items** — Browse prices in our shop (/shop/samagri)\n"
            "• **Kundali** — Completely **FREE** (offline generator)!\n"
            "• **Panchang** — **FREE** to view daily!\n\n"
            "Would you like me to show specific prices for any item or service?"
        ),

        # Login / registration / account
        r"(how|register|sign\s*up|login|account|create\s*account)": (
            "Getting started is easy! 🎉\n\n"
            "1️⃣ Click **Register** on the top navigation\n"
            "2️⃣ Enter your email and details\n"
            "3️⃣ Verify with **OTP** sent to your email\n"
            "4️⃣ You're in! Start booking pujas and ordering samagri 🙏\n\n"
            "You can also **login with Google** for quick access!"
        ),

        # Language
        r"(language|nepali|hindi|english|bhasha)": (
            "PanditYatra supports **3 languages** 🌐:\n\n"
            "🇬🇧 **English**\n"
            "🇳🇵 **Nepali** (नेपाली)\n"
            "🇮🇳 **Hindi** (हिन्दी)\n\n"
            "You can switch languages from the navigation menu! The pandits also speak multiple languages - you can filter by language preference."
        ),

        # PWA / app / install
        r"(download|app|install|pwa|mobile|phone)": (
            "PanditYatra is a **Progressive Web App (PWA)** 📱!\n\n"
            "You don't need to download from any app store. Just:\n"
            "1️⃣ Open PanditYatra in your mobile browser\n"
            "2️⃣ Click the **Install** popup or tap the browser menu\n"
            "3️⃣ Select **Add to Home Screen**\n"
            "4️⃣ It works like a native app — even offline for Kundali! ✨\n\n"
            "Works on Android, iOS, and Desktop!"
        ),
    }

    def _match_greeting(self, text: str) -> bool:
        t = (text or "").strip().lower()
        return any(re.match(p, t) for p in self.GREETING_PATTERNS)

    def _match_thanks(self, text: str) -> bool:
        t = (text or "").strip().lower()
        return any(re.match(p, t) for p in self.THANK_PATTERNS)

    def _match_rule_based(self, text: str) -> str | None:
        t = (text or "").strip().lower()
        for pattern, response in self.RULE_BASED_RESPONSES.items():
            if re.search(pattern, t):
                return response
        return None

    def _get_greeting_reply(self, text: str, user) -> str:
        user_name = ""
        if user and getattr(user, "is_authenticated", False):
            user_name = getattr(user, "full_name", "") or getattr(user, "username", "")

        t = (text or "").strip().lower()

        # Nepali greetings get Nepali-flavored response
        if any(w in t for w in ["namaste", "namaskar", "k cha", "kasto", "tv cha"]):
            name_part = f" {user_name} ji" if user_name else " ji"
            return (
                f"Namaste{name_part}! 🙏 Thik xa, tapai kasto hunuhunchha?\n\n"
                "Ma PanditYatra ko AI Guide ho. Ma tapailai yesma help garna sakchu:\n"
                "• 📿 Puja booking garna\n"
                "• 🔍 Pandit khojne\n"
                "• 🛒 Puja samagri kinne\n"
                "• 🕉️ Kundali banaaune\n"
                "• 📅 Panchang herne\n\n"
                "Kasto help chahiyeko xa?"
            )

        # English greetings
        name_part = f" {user_name}" if user_name else ""
        return (
            f"Hey{name_part}! Welcome to PanditYatra 🙏\n\n"
            "I'm your AI Guide and I can help you with:\n"
            "• 📿 **Book a puja** with verified pandits\n"
            "• 🔍 **Find pandits** by expertise & language\n"
            "• 🛒 **Buy puja samagri** (agarbatti, diya, books, idols)\n"
            "• 🕉️ **Generate Kundali** (works offline!)\n"
            "• 📅 **Check Panchang** for today's tithi\n"
            "• 📹 **Video Puja** — attend live from anywhere\n\n"
            "What would you like to explore? 😊"
        )

    def _get_thanks_reply(self, user) -> str:
        user_name = ""
        if user and getattr(user, "is_authenticated", False):
            user_name = getattr(user, "full_name", "") or ""
        name_part = f" {user_name}" if user_name else ""
        return (
            f"You're welcome{name_part}! 🙏😊\n\n"
            "I'm always here if you need help with booking pujas, finding pandits, "
            "ordering samagri, or anything else on PanditYatra.\n\n"
            "Namaste! 🕉️"
        )

    def run(self, request, user_message: str) -> dict:
        start = time.time()
        trace_id = uuid.uuid4().hex
        tool_log = []
        ai_resp = AIResponse(reply="", response_type=RESPONSE_TYPES["TEXT"])

        user = request.user if hasattr(request, 'user') else None

        # ── 1. Greeting check ──
        if self._match_greeting(user_message):
            ai_resp.reply = self._get_greeting_reply(user_message, user)
            latency_ms = int((time.time() - start) * 1000)
            AIQueryLog.objects.create(
                user=user if getattr(user, "is_authenticated", False) else None,
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

        # ── 2. Thank-you check ──
        if self._match_thanks(user_message):
            ai_resp.reply = self._get_thanks_reply(user)
            latency_ms = int((time.time() - start) * 1000)
            AIQueryLog.objects.create(
                user=user if getattr(user, "is_authenticated", False) else None,
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

        # ── 3. Rule-based knowledge check ──
        rule_reply = self._match_rule_based(user_message)
        if rule_reply:
            ai_resp.reply = rule_reply
            latency_ms = int((time.time() - start) * 1000)
            AIQueryLog.objects.create(
                user=user if getattr(user, "is_authenticated", False) else None,
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
