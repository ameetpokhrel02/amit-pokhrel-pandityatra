from .constants import TOOL_NAMES


def get_tool_specs():
    return [
        {
            "type": "function",
            "function": {
                "name": TOOL_NAMES["SEARCH_SAMAGRI"],
                "description": "Search products/items/samagri from shop inventory.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "limit": {"type": "integer", "default": 5}
                    },
                    "required": ["query"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": TOOL_NAMES["FIND_PANDITS"],
                "description": "Find verified pandits by language/expertise.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "language": {"type": "string"},
                        "expertise": {"type": "string"},
                        "limit": {"type": "integer", "default": 5}
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": TOOL_NAMES["GET_BOOKING_STATUS"],
                "description": "Get one booking status for the current user.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "booking_id": {"type": "integer"}
                    },
                    "required": ["booking_id"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": TOOL_NAMES["LIST_MY_BOOKINGS"],
                "description": "List authenticated user's bookings.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string"},
                        "limit": {"type": "integer", "default": 5}
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": TOOL_NAMES["HOW_TO_BOOK"],
                "description": "Explain booking flow on platform.",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": TOOL_NAMES["HOW_KUNDALI_WORKS"],
                "description": "Explain online/offline kundali flow.",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": TOOL_NAMES["ADD_TO_CART_INTENT"],
                "description": "Prepare add-to-cart action for frontend.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_id": {"type": "integer"},
                        "product_name": {"type": "string"},
                        "quantity": {"type": "integer", "default": 1}
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": TOOL_NAMES["SWITCH_TO_REALTIME_CHAT"],
                "description": "Prepare action to switch UI to realtime pandit chat.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "booking_id": {"type": "integer"},
                        "pandit_id": {"type": "integer"},
                        "pandit_name": {"type": "string"}
                    }
                }
            }
        },
    ]
