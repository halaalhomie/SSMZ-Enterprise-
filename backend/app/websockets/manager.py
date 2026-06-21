import json
import asyncio
from typing import Dict, Set
from uuid import UUID
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections grouped by store_id."""

    def __init__(self):
        # store_id -> set of (websocket, user_id)
        self._connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, store_id: str, user_id: str):
        await websocket.accept()
        async with self._lock:
            if store_id not in self._connections:
                self._connections[store_id] = set()
            self._connections[store_id].add(websocket)
        logger.info(f"WS connected: user={user_id} store={store_id}")

    async def disconnect(self, websocket: WebSocket, store_id: str):
        async with self._lock:
            conns = self._connections.get(store_id, set())
            conns.discard(websocket)
            if not conns:
                self._connections.pop(store_id, None)

    async def broadcast_to_store(self, store_id: str, event: str, data: dict):
        """Send an event to all connected clients in a store."""
        message = json.dumps({"event": event, "data": data})
        conns = self._connections.get(str(store_id), set()).copy()

        dead = set()
        for ws in conns:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)

        if dead:
            async with self._lock:
                self._connections.get(str(store_id), set()).difference_update(dead)

    def get_connection_count(self, store_id: str) -> int:
        return len(self._connections.get(str(store_id), set()))


manager = ConnectionManager()


# ─── Event helpers ────────────────────────────────────────────────────────────

async def broadcast_stock_update(store_id: UUID, product_id: str, new_quantity: int, transaction_type: str):
    await manager.broadcast_to_store(
        str(store_id),
        "stock_update",
        {"product_id": product_id, "quantity": new_quantity, "type": transaction_type},
    )


async def broadcast_low_stock(store_id: UUID, product_name: str, quantity: int, min_stock: int):
    await manager.broadcast_to_store(
        str(store_id),
        "low_stock_alert",
        {"product_name": product_name, "quantity": quantity, "min_stock": min_stock},
    )


async def broadcast_audit_complete(store_id: UUID, audit_id: str, product_name: str, difference: int):
    await manager.broadcast_to_store(
        str(store_id),
        "audit_complete",
        {"audit_id": audit_id, "product_name": product_name, "difference": difference},
    )


async def broadcast_notification(store_id: UUID, notification: dict):
    await manager.broadcast_to_store(str(store_id), "notification", notification)
