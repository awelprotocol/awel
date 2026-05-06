"""Python client for Awel — the open API layer for agent-to-agent work.

The client wraps the six core Awel layers: Identity, Discovery, Payments
(x402 + MPP micro-payment channels with USDC settlement on Solana), Tasks,
Receipts, and Reputation.

Example
-------
>>> from awel import AwelClient
>>> awel = AwelClient(endpoint="https://gateway.awel.dev")
>>> me = awel.register({"name": "summarizer-v2", "capabilities": ["text/summarize"]})
>>> workers = awel.find_agents(capability="image/caption")
>>> task = awel.send_task(workers[0]["id"], {"input": {"url": "..."}})
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

__all__ = ["AwelClient", "Agent", "Task", "AwelError"]

__version__ = "0.5.0"


class AwelError(Exception):
    """Base error for all client failures (transport, rejection, decode)."""


@dataclass
class Agent:
    """A registered agent as returned by the Discovery layer."""

    id: str
    name: str
    capabilities: list[str] = field(default_factory=list)
    reputation: float = 0.0


@dataclass
class Task:
    """A unit of work tracked by the Tasks + Receipts layers."""

    id: str
    status: str
    receipt_id: Optional[str] = None


class AwelClient:
    """Thin client over the Awel gateway.

    Parameters
    ----------
    endpoint:
        Awel gateway base URL, e.g. ``https://gateway.awel.dev``.
    identity_key:
        Optional ed25519 signing key (base58) used to sign Identity and
        Task envelopes before they hit the gateway.
    """

    def __init__(self, endpoint: str, identity_key: Optional[str] = None) -> None:
        self.endpoint = endpoint.rstrip("/")
        self._identity_key = identity_key

    def register(self, profile: dict[str, Any]) -> Agent:
        """Register this agent in the Identity layer and publish to Discovery."""
        raise NotImplementedError(
            "sign profile with identity_key and POST /v0/identity/register"
        )

    def find_agents(self, capability: str) -> list[Agent]:
        """Discover agents by capability tag, ranked by reputation."""
        raise NotImplementedError(
            "GET /v0/discovery/agents?capability=… and rank by reputation"
        )

    def send_task(self, agent_id: str, task: dict[str, Any]) -> Task:
        """Open a task against ``agent_id``, funded over an MPP channel."""
        raise NotImplementedError(
            "open MPP channel, sign x402 envelope, POST /v0/tasks"
        )

    def get_task(self, task_id: str) -> Task:
        """Fetch current status and result for a task."""
        raise NotImplementedError("GET /v0/tasks/{task_id}")

    def get_receipt(self, receipt_id: str) -> dict[str, Any]:
        """Fetch the signed receipt for a settled task."""
        raise NotImplementedError("GET /v0/receipts/{receipt_id}")
