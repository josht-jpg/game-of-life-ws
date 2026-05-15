import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.WS_PORT ?? 3001);
const DEFAULT_DIMENSIONS = 20;

type MousePosition = {
  x: number;
  y: number;
  windowWidth: number;
  windowHeight: number;
  // sender: string
};

type MousePositions = Record<string, { x: number; y: number }>;

type ServerMessage = {
  type: "state";
  cells?: boolean[];
  dimensions?: number;
  playing?: boolean;
  mousePositions?: MousePositions;
  sender?: string;
  // id: string
};

type ClientMessage =
  | { type: "toggle"; sender: string }
  | { type: "setPlaying"; playing: boolean; sender: string }
  | { type: "setCells"; cells: boolean[]; dimensions?: number; sender: string; broadcast: boolean }
  | { type: "setMousePosition"; mousePosition: MousePosition; sender: string }
  | { type: "removeMousePosition"; sender: string };

function normalizedMousePosition(p: MousePosition): { x: number; y: number } {
  return {
    x: (100 * p.x) / p.windowWidth,
    y: (100 * p.y) / p.windowHeight,
  };
}

let cells = new Array(DEFAULT_DIMENSIONS * DEFAULT_DIMENSIONS).fill(false);
let dimensions = DEFAULT_DIMENSIONS;
let playing = false;
const mousePositions: MousePositions = {};

const wss = new WebSocketServer({ port: PORT });

function broadcast(args: {
  cells?: boolean[];
  dimensions?: number;
  playing?: boolean;
  mousePositions?: MousePositions;
  sender?: string;
}) {
  const payload: ServerMessage = { type: "state", ...args };
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

wss.on("connection", (ws) => {
  let socketMouseId: string | undefined;

  ws.send(JSON.stringify({ type: "state", playing, cells, dimensions, mousePositions } satisfies ServerMessage));

  ws.on("message", (raw) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
      return;
    }

    const msg = parsed as ClientMessage;

    switch (msg.type) {
      case "toggle":
        playing = !playing;
        broadcast({ playing, sender: msg.sender, cells });
        return;

      case "setPlaying": {
        if (typeof msg.playing !== "boolean" || playing === msg.playing) {
          return;
        }
        playing = msg.playing;
        broadcast({ playing, sender: msg.sender, cells });
        return;
      }

      case "setCells": {
        if (Array.isArray(msg.cells)) {
          cells = msg.cells;
        }

        if (msg.dimensions && Number.isInteger(msg.dimensions)) {
          dimensions = msg.dimensions;
        }
        if (msg.broadcast) {
          broadcast({ cells, dimensions, sender: msg.sender });
        }
        return;
      }

      case "setMousePosition": {
        if (typeof msg.sender !== "string") {
          return;
        }
        socketMouseId = msg.sender;
        mousePositions[msg.sender] = normalizedMousePosition(msg.mousePosition);
        broadcast({ mousePositions, sender: msg.sender });
        return;
      }

      case "removeMousePosition": {
        if (typeof msg.sender !== "string") {
          return;
        }
        // TODO: double check I'm not being dumb here
        delete mousePositions[msg.sender];
        if (socketMouseId === msg.sender) {
          socketMouseId = undefined;
        }
        broadcast({ mousePositions, sender: msg.sender });
        return;
      }

      default:
        return;
    }
  });

  ws.on("close", () => {
    if (!socketMouseId) {
      return;
    }
    delete mousePositions[socketMouseId];
    socketMouseId = undefined;
    broadcast({ cells, dimensions, playing, mousePositions });
  });
});

console.log(`Game of Life WebSocket listening on ws://localhost:${PORT}`);
