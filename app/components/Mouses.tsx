import { FC, useEffect } from "react";
import { type MousePositions } from "../page";
import { RemoteCursorIcon } from "./RemoteCursorIcon";

const MOUSE_POSITION_THROTTLE_MS = 25;

interface Props {
  mousePositions: MousePositions;
  connectionId: string;
  sendMousePosition: (x: number, y: number) => void;
}

export const Mouses: FC<Props> = ({
  sendMousePosition,
  connectionId,
  mousePositions,
}) => {
  useEffect(() => {
    let lastSentAt = 0;
    let trailingTimer: ReturnType<typeof setTimeout> | null = null;
    let lastX = 0;
    let lastY = 0;

    const flush = () => {
      trailingTimer = null;
      lastSentAt = Date.now();
      sendMousePosition(lastX, lastY);
    };

    const onMouseMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      const now = Date.now();
      const elapsedSinceSend = now - lastSentAt;
      const waitMs = MOUSE_POSITION_THROTTLE_MS - elapsedSinceSend;

      if (waitMs <= 0) {
        if (trailingTimer !== null) {
          clearTimeout(trailingTimer);
          trailingTimer = null;
        }
        flush();
      } else if (trailingTimer === null) {
        trailingTimer = setTimeout(flush, waitMs);
      }
    };

    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      if (trailingTimer !== null) {
        clearTimeout(trailingTimer);
      }
    };
  }, [sendMousePosition]);

  return (
    <>
      {[...mousePositions.entries()].map(
        ([id, { x, y }]) =>
          id !== connectionId && (
            <div
              className="pointer-events-none absolute z-50 -translate-x-1.5 -translate-y-1.5 drop-shadow-md transition-transform top-0 left-0"
              key={id}
              style={{ transform: `translate(${x}dvw, ${y}dvh)` }}
            >
              <RemoteCursorIcon />
            </div>
          ),
      )}
    </>
  );
};
