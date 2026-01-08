import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generateSudoku,
  solveSudoku,
  getEmptyBoard,
  getPossibleMoves,
  BLANK,
  type Board,
  type Difficulty,
} from "@/lib/sudoku";
import { cn } from "@/lib/utils";

const DIFFICULTIES: Difficulty[] = [
  "easy",
  "medium",
  "hard",
  "expert",
  "master",
];

export function SudokuBoard() {
  const [board, setBoard] = React.useState<Board>(getEmptyBoard());
  const [initialBoard, setInitialBoard] =
    React.useState<Board>(getEmptyBoard());
  const [notes, setNotes] = React.useState<number[][][]>(
    Array.from({ length: 9 }, () => Array(9).fill([])),
  );
  const [status, setStatus] = React.useState<
    "playing" | "solved" | "unsolvable"
  >("playing");
  const [selectedDifficulty, setSelectedDifficulty] =
    React.useState<Difficulty>("medium");

  const handleNewGame = (difficulty: Difficulty = selectedDifficulty) => {
    const newBoard = generateSudoku(difficulty);
    setBoard(newBoard.map((row) => [...row]));
    setInitialBoard(newBoard.map((row) => [...row]));
    setNotes(Array.from({ length: 9 }, () => Array(9).fill([])));
    setStatus("playing");
  };

  const handleSolve = () => {
    // Solve from the *current* state of the board, not just the initial one,
    // to allow users to input their own puzzles.
    const solution = solveSudoku(board);
    if (solution) {
      setBoard(solution);
      setStatus("solved");
      setNotes(Array.from({ length: 9 }, () => Array(9).fill([])));
    } else {
      setStatus("unsolvable");
      alert("No solution found for this board configuration!");
    }
  };

  const handleClear = () => {
    setBoard(initialBoard.map((row) => [...row]));
    setNotes(Array.from({ length: 9 }, () => Array(9).fill([])));
    setStatus("playing");
  };

  const handleResetEmpty = () => {
    const empty = getEmptyBoard();
    setBoard(empty);
    setInitialBoard(empty);
    setNotes(Array.from({ length: 9 }, () => Array(9).fill([])));
    setStatus("playing");
  };

  const handleFillNotes = () => {
    const newNotes: number[][][] = board.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (cell === BLANK) {
          return getPossibleMoves(board, rIdx, cIdx);
        }
        return [];
      }),
    );
    setNotes(newNotes);
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

    // Clear notes for this cell
    const newNotes = [...notes];
    newNotes[row] = [...newNotes[row]];
    newNotes[row][col] = [];
    setNotes(newNotes);
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

      <div className="flex flex-wrap gap-2 justify-center">
        {DIFFICULTIES.map((diff) => (
          <Button
            key={diff}
            variant={selectedDifficulty === diff ? "default" : "neutral"}
            size="sm"
            onClick={() => setSelectedDifficulty(diff)}
            className="capitalize"
          >
            {diff}
          </Button>
        ))}
      </div>

      <div className="bg-white border-4 border-black p-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="grid grid-cols-9 bg-black gap-[2px] border-2 border-black">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isInitial =
                initialBoard[rowIndex][colIndex] !== BLANK &&
                initialBoard[rowIndex][colIndex] !== null;
              const cellNotes = notes[rowIndex][colIndex];

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
                  {cell === null && cellNotes.length > 0 && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none p-0.5 z-0">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <div
                          key={n}
                          className="flex items-center justify-center text-[8px] sm:text-[10px] leading-none text-gray-500 font-bold font-mono"
                        >
                          {cellNotes.includes(n) ? n : ""}
                        </div>
                      ))}
                    </div>
                  )}
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
                      "relative z-10 w-full h-full text-center text-xl font-bold bg-transparent border-none focus:outline-hidden focus:bg-yellow-200 transition-colors p-0",
                      isInitial ? "text-black" : "text-blue-600",
                      !isInitial && "cursor-pointer hover:bg-black/5",
                      cell === null &&
                        cellNotes.length > 0 &&
                        "text-transparent", // Hide cursor/text if needed, but actually we want input visible
                    )}
                  />
                </div>
              );
            }),
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center w-full">
        <Button
          onClick={() => handleNewGame()}
          variant="default"
          size="lg"
          className="min-w-[150px]"
        >
          New {selectedDifficulty} Game
        </Button>
        <Button onClick={handleFillNotes} variant="neutral" size="lg">
          Fill Notes
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
