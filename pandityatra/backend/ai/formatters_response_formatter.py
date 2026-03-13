"""Compatibility shim: use ai.formatters.response_formatter instead."""

from .formatters.response_formatter import merge_tool_result, to_payload  # noqa: F401
