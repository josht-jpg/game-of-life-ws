import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { MousePositions } from "../page";

interface Props {
  connectionId: string;
  setCells: Dispatch<SetStateAction<boolean[]>>;
  setDimensions: Dispatch<SetStateAction<number>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setMousePositions: Dispatch<SetStateAction<MousePositions>>;
  setWsReady: Dispatch<SetStateAction<boolean>>;
}

// TODO: this is gnarlier than it needs to be
export const useWebSocket = ({
  connectionId,
  setCells,
  setDimensions,
  setIsPlaying,
  setMousePositions,
  setWsReady,
}: Props) => {
  const wsRef = useRef<WebSocket | null>(null);

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
  }, [
    connectionId,
    setMousePositions,
    setCells,
    setIsPlaying,
    setDimensions,
    setWsReady,
  ]);

  return { sendToggle, sendCells, sendMousePosition };
};

const getWsUrl = () => {
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
};
