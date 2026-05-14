import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.WS_PORT ?? 3001);


type MousePosition = { id: string, x: number, y: number, windowWidth: number, windowHeight: number }
type MousePositions = Record<string, { x: number, y: number }>

type ServerMessage = { type: "state"; cells?: boolean[]; dimensions?: number; playing?: boolean, mousePositions?: MousePositions };

type ClientMessage =
  | { type: "toggle" }
  | { type: "setPlaying"; playing: boolean }
  | { type: "setCells"; cells: boolean[], dimensions?: number }
  | { type: "setMousePosition"; mousePosition: MousePosition }
  | { type: "removeMousePosition"; id: string }

let cells = new Array(20 * 20).fill(false)
let dimensions = 20;
let playing = false;
const mousePositions: Record<string, { x: number, y: number }> = {}

const wss = new WebSocketServer({ port: PORT });

console.log(wss.address())

// TODO: don't need to send all
function broadcast({ cells, dimensions, playing, mousePositions }: { cells?: boolean[]; dimensions?: number; playing?: boolean, mousePositions?: MousePositions }) {
  const payload: ServerMessage = { type: "state", cells, dimensions, playing, mousePositions };
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

wss.on("connection", (ws) => {
  let socketMouseId: string | undefined;

  const initial: ServerMessage = { type: "state", playing, cells, dimensions, mousePositions };
  ws.send(JSON.stringify(initial));

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

    if (msg.type === "toggle") {
      playing = !playing;
      broadcast({ cells, dimensions, playing, mousePositions });
      return;
    }
    if (msg.type === "setPlaying" && typeof msg.playing === "boolean") {
      if (playing === msg.playing) {
        return;
      }
      playing = msg.playing;
      broadcast({ playing, });
    }
    if (msg.type === "setCells") {
      cells = msg.cells;
      broadcast({ cells, dimensions, });
    }
    if (msg.type === "setCells") {
      if (Array.isArray(msg.cells)) {
        cells = msg.cells;
      }
      if (msg.dimensions && Number.isInteger(msg.dimensions)) {
        dimensions = msg.dimensions
      }
      broadcast({ cells, dimensions, });
    }
    if (msg.type === "setMousePosition") {
      if (typeof msg.mousePosition.id === "string") {
        socketMouseId = msg.mousePosition.id;
        mousePositions[msg.mousePosition.id] = { x: 100 * msg.mousePosition.x / msg.mousePosition.windowWidth, y: 100 * msg.mousePosition.y / msg.mousePosition.windowHeight }
      }

      broadcast({ mousePositions });
    }
    if (msg.type === "removeMousePosition" && typeof msg.id === "string") {
      delete mousePositions[msg.id];
      if (socketMouseId === msg.id) {
        socketMouseId = undefined;
      }
      broadcast({ mousePositions });
    }

  });

  ws.on("close", () => {
    if (socketMouseId) {
      delete mousePositions[socketMouseId];
      socketMouseId = undefined;
      broadcast({ cells, dimensions, playing, mousePositions });
    }
  });
});

console.log(`Game of Life WebSocket listening on ws://localhost:${PORT}`);
