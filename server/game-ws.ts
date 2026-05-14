import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.WS_PORT ?? 3001);


type MousePosition = { x: number, y: number, windowWidth: number, windowHeight: number }
type MousePositions = Record<string, { x: number, y: number }>

type ServerMessage = { type: "state"; cells?: boolean[]; dimensions?: number; playing?: boolean, mousePositions?: MousePositions, sender?: string };

type ClientMessage =
  | { type: "toggle"; sender: string }
  | { type: "setPlaying"; playing: boolean, sender: string }
  | { type: "setCells"; cells: boolean[], dimensions?: number, sender: string, broadcast: boolean }
  | { type: "setMousePosition"; mousePosition: MousePosition, sender: string }
  | { type: "removeMousePosition"; sender: string }

let cells = new Array(20 * 20).fill(false)
let dimensions = 20;
let playing = false;
const mousePositions: Record<string, { x: number, y: number }> = {}

const wss = new WebSocketServer({ port: PORT });

function broadcast({ cells, dimensions, playing, mousePositions, sender }: { cells?: boolean[]; dimensions?: number; playing?: boolean, mousePositions?: MousePositions, sender?: string }) {
  const payload: ServerMessage = { type: "state", cells, dimensions, playing, mousePositions, sender };
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
      broadcast({ playing, sender: msg.sender, cells });
      return;
    }
    if (msg.type === "setPlaying" && typeof msg.playing === "boolean") {
      if (playing === msg.playing) {
        return;
      }
      playing = msg.playing;
      broadcast({ playing, sender: msg.sender, cells });
    }

    if (msg.type === "setCells") {
      if (Array.isArray(msg.cells)) {
        cells = msg.cells;
      }
      if (msg.dimensions && Number.isInteger(msg.dimensions)) {
        dimensions = msg.dimensions
      }
      if (msg.broadcast) {
        broadcast({ cells, dimensions, sender: msg.sender });
      }
    }

    if (msg.type === "setMousePosition") {
      if (typeof msg.sender === "string") {
        socketMouseId = msg.sender;
        mousePositions[msg.sender] = { x: 100 * msg.mousePosition.x / msg.mousePosition.windowWidth, y: 100 * msg.mousePosition.y / msg.mousePosition.windowHeight }
      }

      broadcast({ mousePositions, sender: msg.sender });
    }

    if (msg.type === "removeMousePosition" && typeof msg.sender === "string") {
      delete mousePositions[msg.sender];
      if (socketMouseId === msg.sender) {
        socketMouseId = undefined;
      }
      broadcast({ mousePositions, sender: msg.sender });
    }

  });

  ws.on("close", () => {
    if (socketMouseId) {
      delete mousePositions[socketMouseId];
      socketMouseId = undefined;
      broadcast({ cells, dimensions, playing, mousePositions, });
    }
  });
});

console.log(`Game of Life WebSocket listening on ws://localhost:${PORT}`);
