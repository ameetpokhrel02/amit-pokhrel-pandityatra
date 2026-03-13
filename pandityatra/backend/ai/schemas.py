from dataclasses import dataclass, field
from typing import Any


@dataclass
class ToolExecutionResult:
    ok: bool
    type: str
    data: dict[str, Any] = field(default_factory=dict)
    message: str = ""


@dataclass
class AIResponse:
    reply: str
    response_type: str
    cards: dict[str, list[dict[str, Any]]] = field(default_factory=lambda: {
        "products": [],
        "pandits": [],
        "bookings": [],
    })
    actions: list[dict[str, Any]] = field(default_factory=list)
    tool_log: list[dict[str, Any]] = field(default_factory=list)
