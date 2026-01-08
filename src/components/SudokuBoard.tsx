import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generateSudoku,
  solveSudoku,
  getEmptyBoard,
  BLANK,
  type Board,
} from "@/lib/sudoku";
import { cn } from "@/lib/utils";

export function SudokuBoard() {
  const [board, setBoard] = React.useState<Board>(getEmptyBoard());
  const [initialBoard, setInitialBoard] =
    React.useState<Board>(getEmptyBoard());
  const [status, setStatus] = React.useState<
    "playing" | "solved" | "unsolvable"
  >("playing");

  const handleNewGame = () => {
    const newBoard = generateSudoku("medium");
    setBoard(newBoard.map((row) => [...row]));
    setInitialBoard(newBoard.map((row) => [...row]));
    setStatus("playing");
  };

  const handleSolve = () => {
    // Solve from the *current* state of the board, not just the initial one,
    // to allow users to input their own puzzles.
    const solution = solveSudoku(board);
    if (solution) {
      setBoard(solution);
      setStatus("solved");
    } else {
      setStatus("unsolvable");
      alert("No solution found for this board configuration!");
    }
  };

  const handleClear = () => {
    setBoard(initialBoard.map((row) => [...row]));
    setStatus("playing");
  };

  const handleResetEmpty = () => {
    const empty = getEmptyBoard();
    setBoard(empty);
    setInitialBoard(empty);
    setStatus("playing");
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    // If it's a fixed initial cell, don't allow changing (unless it was empty initially)
    if (initialBoard[row][col] !== BLANK && initialBoard[row][col] !== null)
      return;

    const num = value === "" ? null : parseInt(value, 10);

    if (value !== "" && (isNaN(num as number) || num! < 1 || num! > 9)) return;

    const newBoard = board.map((r, rIdx) =>
      rIdx === row
        ? r.map((c, cIdx) => (cIdx === col ? (num as number | null) : c))
        : r,
    );
    setBoard(newBoard);
  };

  // Initialize on mount
  React.useEffect(() => {
    handleNewGame();
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-4 w-full max-w-2xl mx-auto">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-heading uppercase tracking-tighter">
          Sudoku
        </h1>
      </div>

      <div className="bg-white border-4 border-black p-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="grid grid-cols-9 bg-black gap-[2px] border-2 border-black">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isInitial =
                initialBoard[rowIndex][colIndex] !== BLANK &&
                initialBoard[rowIndex][colIndex] !== null;

              // Calculate borders for 3x3 grid visualization
              // We use thick borders on the right of cols 2 and 5, and bottom of rows 2 and 5.
              // However, since we are using gap for grid lines, we might not need extra borders if the gap handles it.
              // Let's rely on standard borders but maybe emphasize the 3x3 blocks.

              // Actually, a common trick is to use different border widths.
              const isRightBorder = (colIndex + 1) % 3 === 0 && colIndex !== 8;
              const isBottomBorder = (rowIndex + 1) % 3 === 0 && rowIndex !== 8;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    "relative w-full aspect-square bg-white",
                    isRightBorder && "border-r-4 border-black",
                    isBottomBorder && "border-b-4 border-black",
                  )}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={cell ?? ""}
                    onChange={(e) =>
                      handleCellChange(rowIndex, colIndex, e.target.value)
                    }
                    disabled={isInitial}
                    className={cn(
                      "w-full h-full text-center text-xl font-bold bg-transparent border-none focus:outline-hidden focus:bg-yellow-200 transition-colors p-0",
                      isInitial ? "text-black" : "text-blue-600",
                      !isInitial && "cursor-pointer hover:bg-gray-100",
                    )}
                  />
                </div>
              );
            }),
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center w-full">
        <Button onClick={handleNewGame} variant="default" size="lg">
          New Game
        </Button>
        <Button onClick={handleSolve} variant="reverse" size="lg">
          Solve!
        </Button>
        <Button onClick={handleClear} variant="neutral" size="lg">
          Reset Board
        </Button>
        <Button onClick={handleResetEmpty} variant="neutral" size="lg">
          Clear All
        </Button>
      </div>
    </div>
  );
}
