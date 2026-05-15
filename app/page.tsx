"use client";

import { useMemo, useRef, useState } from "react";
import { Board } from "./components/Board";
import { PlayIcon } from "./components/PlayIcon";
import { DimensionController } from "./components/DimensionController";
import { PauseIcon } from "./components/PauseIcon";
import { useRunGame } from "./hooks/useRunGame";
import { Mouses } from "./components/Mouses";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { useWebSocket } from "./hooks/useWebSockets";

const DEFAULT_DIMS = 20;

export type MousePositions = Map<string, { x: number; y: number }>;

export default function Home() {
  const connectionId = useMemo(() => crypto.randomUUID(), []);

  // TODO: this code would clearly benefit from using context
  const [dimensions, setDimensions] = useState(DEFAULT_DIMS);
  const [cells, setCells] = useState<boolean[]>(() =>
    new Array(DEFAULT_DIMS * DEFAULT_DIMS).fill(false),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePositions, setMousePositions] = useState<MousePositions>(
    new Map(),
  );
  const [wsReady, setWsReady] = useState(false);

  const { sendToggle, sendCells, sendMousePosition } = useWebSocket({
    connectionId,
    setCells,
    setDimensions,
    setIsPlaying,
    setMousePositions,
    setWsReady,
  });

  useRunGame({ cells, dimensions, isPlaying, setCells, sendCells });

  return (
    <div className="bg-zinc-50 dark:text-black overflow-hidden relative">
      <Mouses
        connectionId={connectionId}
        sendMousePosition={sendMousePosition}
        mousePositions={mousePositions}
      />

      <main className="h-dvh w-fit relative flex flex-col justify-center items-center mx-auto ">
        {/* TODO: kinda gross */}
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
