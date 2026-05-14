import { classNames } from "@/utils";
import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

interface Props {
  dimensions: number;
  setDimensions: Dispatch<SetStateAction<number>>;
  cells: boolean[];
  setCells: Dispatch<SetStateAction<boolean[]>>;
  sendCells: (
    cells: boolean[],
    broadcast: boolean,
    dimensions?: number,
  ) => void;
}

export const DimensionController: FC<Props> = ({
  dimensions,
  setDimensions,
  cells,
  setCells,
  sendCells,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const MIN = 0;
  const MAX = 64;

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) {
        return;
      }

      if (startPosition === null) {
        setStartPosition(
          containerRef.current?.getBoundingClientRect()?.left ?? null,
        );
        return;
      }

      if (e.clientX < startPosition) {
        return;
      }

      const relativePosition =
        (e.clientX - startPosition) / containerRef.current.clientWidth;

      const dimensions = Math.max(
        Math.min(Math.round(MAX * relativePosition), MAX),
        MIN,
      );

      setDimensions(dimensions);

      if (cells.length < dimensions * dimensions) {
        const paddingCells = new Array(
          dimensions * dimensions - cells.length,
        ).fill(false);
        const newBoard = [...cells, ...paddingCells];
        setCells(newBoard);
        sendCells(paddingCells, true, dimensions);
        return;
      }

      if (cells.length > dimensions * dimensions) {
        const newCells = cells.slice(0, dimensions * dimensions);
        setCells(newCells);
        sendCells(newCells, true, dimensions);
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [
    setIsDragging,
    isDragging,
    setDimensions,
    startPosition,
    cells,
    setCells,
    sendCells,
  ]);

  //   const CONTAINER_ID = "dimension-controller";

  return (
    <div className="pt-7 w-full text-right">
      <div
        ref={containerRef}
        className="h-1 border rounded-lg flex-1 w-full flex"
      >
        <span
          className="bg-black h-full"
          style={{ width: `${(100 * dimensions) / MAX}%` }}
        />
        <button
          onMouseDown={() => setIsDragging(true)}
          className={classNames(
            "size-3 rounded-full bg-black hover:scale-125 transition-transform cursor-grab",
            isDragging && "cursor-grabbing",
          )}
          style={{
            translate: `0px -5px`,
          }}
        />
      </div>
      <p className="text-sm pt-2.5">Cells: {dimensions * dimensions}</p>
    </div>
  );
};
