from ..constants import RESPONSE_TYPES
from ..schemas import AIResponse, ToolExecutionResult


def merge_tool_result(ai_resp: AIResponse, result: ToolExecutionResult):
    if result.type == RESPONSE_TYPES["PRODUCT_LIST"]:
        ai_resp.cards["products"] = result.data.get("products", [])
        ai_resp.response_type = RESPONSE_TYPES["PRODUCT_LIST"]
    elif result.type == RESPONSE_TYPES["PANDIT_LIST"]:
        ai_resp.cards["pandits"] = result.data.get("pandits", [])
        ai_resp.response_type = RESPONSE_TYPES["PANDIT_LIST"]
    elif result.type in (RESPONSE_TYPES["BOOKING_STATUS"], RESPONSE_TYPES["BOOKING_LIST"]):
        ai_resp.cards["bookings"] = result.data.get("bookings", [])
        ai_resp.response_type = result.type
    elif result.type == RESPONSE_TYPES["MIXED"]:
        actions = result.data.get("actions", [])
        ai_resp.actions.extend(actions)
        if result.data.get("products"):
            ai_resp.cards["products"] = result.data.get("products", [])
        if result.data.get("pandits"):
            ai_resp.cards["pandits"] = result.data.get("pandits", [])
        if result.data.get("bookings"):
            ai_resp.cards["bookings"] = result.data.get("bookings", [])
        if ai_resp.response_type == RESPONSE_TYPES["TEXT"]:
            ai_resp.response_type = RESPONSE_TYPES["MIXED"]


def to_payload(ai_resp: AIResponse) -> dict:
    return {
        "reply": ai_resp.reply,
        "response": ai_resp.reply,
        "response_type": ai_resp.response_type,
        "cards": ai_resp.cards,
        "products": ai_resp.cards.get("products", []),
        "pandits": ai_resp.cards.get("pandits", []),
        "bookings": ai_resp.cards.get("bookings", []),
        "actions": ai_resp.actions,
        "tool_log": ai_resp.tool_log,
    }
