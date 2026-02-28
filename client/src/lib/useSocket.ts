"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080"
    : "";

export interface ClickEvent {
  shortCode: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  referrer: string;
  country: string;
}

export interface TrendingUpdate {
  trending: Array<{
    shortCode: string;
    totalClicks: number;
    rank: number;
  }>;
}

type ClickHandler = (event: ClickEvent) => void;
type TrendingHandler = (data: TrendingUpdate) => void;

/**
 * Hook to subscribe to real-time click events via Socket.IO.
 *
 * Returns helpers to register event-specific callbacks and
 * a boolean indicating connection status.
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Stable callback refs
  const clickHandlers = useRef<Set<ClickHandler>>(new Set());
  const trendingHandlers = useRef<Set<TrendingHandler>>(new Set());

  useEffect(() => {
    if (!WS_URL) return;

    const socket = io(WS_URL, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[ws] Connected:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", (reason: string) => {
      console.log("[ws] Disconnected:", reason);
      setConnected(false);
    });

    socket.on("click_event", (event: ClickEvent) => {
      clickHandlers.current.forEach((fn) => fn(event));
    });

    socket.on("trending_update", (data: TrendingUpdate) => {
      trendingHandlers.current.forEach((fn) => fn(data));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const onClickEvent = useCallback((handler: ClickHandler) => {
    clickHandlers.current.add(handler);
    return () => {
      clickHandlers.current.delete(handler);
    };
  }, []);

  const onTrendingUpdate = useCallback((handler: TrendingHandler) => {
    trendingHandlers.current.add(handler);
    return () => {
      trendingHandlers.current.delete(handler);
    };
  }, []);

  return { connected, onClickEvent, onTrendingUpdate };
}
