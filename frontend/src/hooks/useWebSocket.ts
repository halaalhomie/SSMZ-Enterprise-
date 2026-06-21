'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { tokenStorage } from '@/lib/api';
import { WSMessage } from '@/types';

type Handler = (data: Record<string, unknown>) => void;

interface UseWebSocketOptions {
  onStockUpdate?: Handler;
  onLowStockAlert?: Handler;
  onAuditComplete?: Handler;
  onNotification?: Handler;
  onProductCreated?: Handler;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const { user } = useAuthStore();

  const connect = useCallback(() => {
    if (!user?.store_id) return;

    const token = tokenStorage.get();
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1'}/ws/${user.store_id}?token=${token}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      // Heartbeat
      const heartbeat = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send('ping');
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);
    };

    ws.current.onmessage = (event) => {
      if (event.data === 'pong') return;
      try {
        const msg: WSMessage = JSON.parse(event.data);
        switch (msg.event) {
          case 'stock_update':
            options.onStockUpdate?.(msg.data);
            break;
          case 'low_stock_alert':
            options.onLowStockAlert?.(msg.data);
            break;
          case 'audit_complete':
            options.onAuditComplete?.(msg.data);
            break;
          case 'notification':
            options.onNotification?.(msg.data);
            break;
          case 'product_created':
            options.onProductCreated?.(msg.data);
            break;
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected, reconnecting in 5s...');
      reconnectTimeout.current = setTimeout(connect, 5000);
    };

    ws.current.onerror = () => {
      ws.current?.close();
    };
  }, [user?.store_id]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
  }, [connect]);

  return { ws: ws.current };
}
