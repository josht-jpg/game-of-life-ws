import { Dispatch, SetStateAction, useEffect, useRef } from "react";

interface Props {
  cells: boolean[];
  dimensions: number;
  isPlaying: boolean;
  sendCells: (cells: boolean[]) => void;
  setCells: Dispatch<SetStateAction<boolean[]>>;
}

export const useRunGame = ({
  cells,
  dimensions,
  isPlaying,
  sendCells,
  setCells,
}: Props) => {
  const cellsRef = useRef(cells);
  const dimensionsRef = useRef(dimensions);
  const sendCellsRef = useRef(sendCells);

  useEffect(() => {
    cellsRef.current = cells;
    dimensionsRef.current = dimensions;
    sendCellsRef.current = sendCells;
  }, [cells, dimensions, sendCells]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      const newCells = runGame(cellsRef.current, dimensionsRef.current);
      sendCellsRef.current(newCells);
      setCells(newCells);
    }, 125);

    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, setCells]);
};

const runGame = (cells: boolean[], dimensions: number) => {
  const newCells = new Array(dimensions * dimensions).fill(false);

  for (let i = 0; i < dimensions * dimensions; i++) {
    let neighbors = 0;

    if (cells[i - dimensions - 1]) {
      neighbors++;
    }
    if (cells[i - dimensions]) {
      neighbors++;
    }
    if (cells[i - dimensions + 1]) {
      neighbors++;
    }
    if (cells[i - 1]) {
      neighbors++;
    }
    if (cells[i + 1]) {
      neighbors++;
    }
    if (cells[i + dimensions - 1]) {
      neighbors++;
    }
    if (cells[i + dimensions]) {
      neighbors++;
    }
    if (cells[i + dimensions + 1]) {
      neighbors++;
    }

    if (cells[i] && neighbors < 2) {
      newCells[i] = false;
      continue;
    }
    if (cells[i] && (neighbors === 2 || neighbors === 3)) {
      newCells[i] = true;
      continue;
    }
    if (cells[i] && neighbors > 3) {
      newCells[i] = false;
      continue;
    }
    if (!cells[i] && neighbors === 3) {
      newCells[i] = true;
    }
  }

  return newCells;
};
