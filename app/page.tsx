"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Board } from "./components/Board";
import { PlayIcon } from "./components/PlayIcon";
import { DimensionController } from "./components/DimensionController";
import { PauseIcon } from "./components/PauseIcon";
import { useRunGame } from "./hooks/useRunGame";
import { Mouses } from "./components/Mouses";
import { LoadingSpinner } from "./components/LoadingSpinner";

const DEFAULT_DIMS = 20;

function getWsUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const fromEnv = process.env.NEXT_PUBLIC_WS_URL;
  if (fromEnv) {
    return fromEnv;
  }
  const host = window.location.hostname;
  const port = process.env.NEXT_PUBLIC_WS_PORT ?? "3001";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${host}:${port}`;
}

export type MousePositions = Map<string, { x: number; y: number }>;

export default function Home() {
  const connectionId = useMemo(() => crypto.randomUUID(), []);

  const [dimensions, setDimensions] = useState(DEFAULT_DIMS);
  const [cells, setCells] = useState<boolean[]>(() =>
    new Array(DEFAULT_DIMS * DEFAULT_DIMS).fill(false),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePositions, setMousePositions] = useState<MousePositions>(
    new Map(),
  );
  const [wsReady, setWsReady] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const removeMouse = () => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN && connectionId) {
        ws.send(
          JSON.stringify({
            type: "removeMousePosition",
            id: connectionId,
          }),
        );
      }
    };

    const onPageHide = () => {
      removeMouse();
    };
    const onBeforeUnload = () => {
      removeMouse();
    };

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    const connect = () => {
      if (cancelled) {
        return;
      }
      const url = getWsUrl();
      if (!url) {
        return;
      }
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!cancelled) {
          setWsReady(true);
        }
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(String(event.data)) as {
          type?: string;
          playing?: boolean;
          cells: boolean[];
          dimensions?: number;
          mousePositions?: MousePositions;
          sender?: string;
        };

        if (data.type === "state") {
          if (typeof data.playing === "boolean") {
            setIsPlaying(data.playing);
          }

          if (Array.isArray(data.cells) && data.sender !== connectionId) {
            console.log(connectionId);

            setCells(data.cells);
          }

          if (
            Number.isInteger(data.dimensions) &&
            data.sender !== connectionId
          ) {
            setDimensions(data.dimensions as number);
          }

          if (data.mousePositions && data.sender !== connectionId) {
            setMousePositions(new Map(Object.entries(data.mousePositions)));
          }
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!cancelled) {
          setWsReady(false);
          reconnectTimer = setTimeout(connect, 1500);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      removeMouse();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connectionId]);

  const sendToggle = useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "toggle", sender: connectionId }));
    }
  }, [connectionId]);

  const sendCells = (
    cells: boolean[],
    broadcast: boolean,
    dimensions?: number,
  ) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "setCells",
          cells,
          dimensions,
          broadcast,
          sender: connectionId,
        }),
      );
    }
  };

  const sendMousePosition = (x: number, y: number) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN && connectionId) {
      ws.send(
        JSON.stringify({
          type: "setMousePosition",
          mousePosition: {
            x,
            y,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
          },
          sender: connectionId,
        }),
      );
    }
  };

  useRunGame({ cells, dimensions, isPlaying, setCells, sendCells });

  return (
    <div className="bg-zinc-50 dark:text-black overflow-hidden relative">
      <Mouses
        connectionId={connectionId}
        sendMousePosition={sendMousePosition}
        mousePositions={mousePositions}
      />

      <main className="h-dvh w-fit relative flex flex-col justify-center items-center mx-auto ">
        {wsReady ? (
          <>
            <Board
              dimensions={dimensions}
              cells={cells}
              setCells={setCells}
              sendCells={sendCells}
            />
            <div className="flex w-full gap-x-3 items-center">
              <button
                type="button"
                onClick={sendToggle}
                disabled={!wsReady}
                title={wsReady ? undefined : "Connecting to game server…"}
                className="h-fit flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <DimensionController
                sendCells={sendCells}
                dimensions={dimensions}
                setDimensions={setDimensions}
                cells={cells}
                setCells={setCells}
              />
            </div>
          </>
        ) : (
          <div
            className="absolute inset-0 z-100 flex flex-col items-center justify-center gap-4 bg-black/75 text-zinc-200 backdrop-blur-sm dark:bg-zinc-50/90 dark:text-zinc-800"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <LoadingSpinner />
            <p className="text-sm font-medium text-zinc-400 dark:text-zinc-600">
              Connecting…
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
