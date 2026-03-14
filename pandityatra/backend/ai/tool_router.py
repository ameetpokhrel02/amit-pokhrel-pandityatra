import json
from .constants import TOOL_NAMES
from . import tools as mcp_tools
from .permissions import can_access_user_booking_tools, can_use_realtime_switch
from .schemas import ToolExecutionResult
from .constants import RESPONSE_TYPES


class ToolRouter:
    def execute(self, request, tool_name: str, args: dict):
        if tool_name == TOOL_NAMES["SEARCH_SAMAGRI"]:
            return mcp_tools.search_samagri(request, args.get("query", ""), args.get("limit", 5))
        if tool_name == TOOL_NAMES["RECOMMEND_PUJA_SAMAGRI"]:
            return mcp_tools.recommend_puja_samagri(
                request=request,
                puja_id=int(args.get("puja_id")),
                location=args.get("location", "ONLINE"),
                budget_preference=args.get("budget_preference", "standard"),
                user_notes=args.get("user_notes", ""),
                auto_add_alternatives=bool(args.get("auto_add_alternatives", True)),
                limit=int(args.get("limit", 12)),
            )
        if tool_name == TOOL_NAMES["FIND_PANDITS"]:
            return mcp_tools.find_pandits(args.get("language"), args.get("expertise"), args.get("limit", 5))
        if tool_name == TOOL_NAMES["GET_BOOKING_STATUS"]:
            if not can_access_user_booking_tools(request.user):
                return ToolExecutionResult(ok=False, type=RESPONSE_TYPES["TEXT"], message="Please login to check booking status.")
            return mcp_tools.get_booking_status(request.user, int(args.get("booking_id")))
        if tool_name == TOOL_NAMES["LIST_MY_BOOKINGS"]:
            if not can_access_user_booking_tools(request.user):
                return ToolExecutionResult(ok=False, type=RESPONSE_TYPES["TEXT"], message="Please login to view your bookings.")
            return mcp_tools.list_my_bookings(request.user, args.get("status"), args.get("limit", 5))
        if tool_name == TOOL_NAMES["ADD_TO_CART_INTENT"]:
            product_id = args.get("product_id")
            product_name = args.get("product_name")
            quantity = int(args.get("quantity", 1))
            if product_id is None and not product_name:
                return ToolExecutionResult(ok=False, type=RESPONSE_TYPES["TEXT"], message="Provide product_id or product_name to add to cart.")
            return mcp_tools.add_to_cart_intent(product_id=product_id, product_name=product_name, quantity=quantity)
        if tool_name == TOOL_NAMES["HOW_TO_BOOK"]:
            return mcp_tools.how_to_book()
        if tool_name == TOOL_NAMES["HOW_KUNDALI_WORKS"]:
            return mcp_tools.how_kundali_works()
        if tool_name == TOOL_NAMES["SWITCH_TO_REALTIME_CHAT"]:
            if not can_use_realtime_switch(request.user):
                return ToolExecutionResult(ok=False, type=RESPONSE_TYPES["TEXT"], message="Please login as a customer to chat with pandit.")
            return mcp_tools.switch_to_realtime_chat(
                request.user,
                booking_id=args.get("booking_id"),
                pandit_id=args.get("pandit_id"),
                pandit_name=args.get("pandit_name"),
            )
        raise ValueError(f"Unknown tool: {tool_name}")

    @staticmethod
    def safe_parse_arguments(raw_args: str) -> dict:
        try:
            return json.loads(raw_args or "{}")
        except Exception:
            return {}
