import { classNames } from "@/utils";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";

interface Props {
  cells: boolean[];
  setCells: Dispatch<SetStateAction<boolean[]>>;
  sendCells: (cells: boolean[]) => void;
  dimensions: number;
}

export const Board: FC<Props> = ({
  dimensions,
  cells,
  setCells,
  sendCells,
}) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  useEffect(() => {
    const onMouseDown = () => {
      setIsMouseDown(true);
    };
    const onMouseUp = () => {
      setIsMouseDown(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        setIsShiftPressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        setIsShiftPressed(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const updateCells = (flippedCells: Set<number>, living?: boolean) => {
    const newBoard = cells.map((c, i) => {
      if (flippedCells.has(i)) {
        if (living === undefined) {
          return !c;
        }
        return living;
      } else {
        return c;
      }
    });

    setCells(newBoard);
    sendCells(newBoard);
  };

  return (
    <div
      className="border size-[600px] grid"
      style={{
        gridTemplateColumns: `repeat(${Math.sqrt(cells.length)}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${Math.sqrt(dimensions)}, minmax(0, 1fr))`,
      }}
    >
      {cells.map((cell, index) => (
        <button
          key={index}
          onMouseEnter={() => {
            if (isMouseDown) {
              updateCells(new Set([index]), !isShiftPressed);
            }
          }}
          onClick={() => updateCells(new Set([index]))}
          className={classNames(
            "border border-black/50 aspect-square cursor-pointer outline-0 ring-0",
            cell ? "bg-black" : "bg-white",
          )}
        />
      ))}
    </div>
  );
};
