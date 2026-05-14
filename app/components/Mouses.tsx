import { FC, useEffect } from "react";
import { type MousePositions } from "../page";
import { RemoteCursorIcon } from "./RemoteCursorIcon";

const MOUSE_POSITION_DEBOUNCE_MS = 25;

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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const onMouseMove = (e: MouseEvent) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        sendMousePosition(e.clientX, e.clientY);
      }, MOUSE_POSITION_DEBOUNCE_MS);
    };

    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
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
