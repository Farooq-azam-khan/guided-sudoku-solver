import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generateSudoku,
  solveSudoku,
  getEmptyBoard,
  getPossibleMoves,
  getHint,
  BLANK,
  type Board,
  type Difficulty,
  type Hint,
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
  const [solutionBoard, setSolutionBoard] = React.useState<Board | null>(null);
  const [notes, setNotes] = React.useState<number[][][]>(
    Array.from({ length: 9 }, () => Array(9).fill([])),
  );
  const [validation, setValidation] = React.useState<
    ("correct" | "incorrect" | null)[][]
  >(Array.from({ length: 9 }, () => Array(9).fill(null)));
  const [hint, setHint] = React.useState<Hint | null>(null);

  const [status, setStatus] = React.useState<
    "playing" | "solved" | "unsolvable"
  >("playing");
  const [selectedDifficulty, setSelectedDifficulty] =
    React.useState<Difficulty>("medium");

  const handleNewGame = (difficulty: Difficulty = selectedDifficulty) => {
    const { puzzle, solution } = generateSudoku(difficulty);
    setBoard(puzzle.map((row) => [...row]));
    setInitialBoard(puzzle.map((row) => [...row]));
    setSolutionBoard(solution);
    setNotes(Array.from({ length: 9 }, () => Array(9).fill([])));
    setValidation(Array.from({ length: 9 }, () => Array(9).fill(null)));
    setHint(null);
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
      setValidation(Array.from({ length: 9 }, () => Array(9).fill(null)));
      setHint(null);
    } else {
      setStatus("unsolvable");
      alert("No solution found for this board configuration!");
    }
  };

  const handleCheck = () => {
    if (!solutionBoard) {
      // If no solution is stored (e.g. custom game), try to solve it now to check
      const currentSolution = solveSudoku(initialBoard);
      if (!currentSolution) {
        alert("This puzzle seems unsolvable!");
        return;
      }
      // Use this solution for checking
      const newValidation = board.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (initialBoard[rIdx][cIdx] !== BLANK) return null; // Don't validate initial cells
          if (cell === BLANK) return null; // Don't validate empty cells
          return cell === currentSolution[rIdx][cIdx] ? "correct" : "incorrect";
        }),
      );
      setValidation(newValidation);
      return;
    }

    const newValidation = board.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (initialBoard[rIdx][cIdx] !== BLANK) return null; // Don't validate initial cells
        if (cell === BLANK) return null; // Don't validate empty cells
        return cell === solutionBoard[rIdx][cIdx] ? "correct" : "incorrect";
      }),
    );
    setValidation(newValidation);
  };

  const handleGetHint = () => {
    const nextHint = getHint(board);
    if (nextHint) {
      setHint(nextHint);
    } else {
      alert("No obvious hint found! You might need advanced techniques or the board is full.");
    }
  };

  const handleClear = () => {
    setBoard(initialBoard.map((row) => [...row]));
    setNotes(Array.from({ length: 9 }, () => Array(9).fill([])));
    setValidation(Array.from({ length: 9 }, () => Array(9).fill(null)));
    setHint(null);
    setStatus("playing");
  };

  const handleResetEmpty = () => {
    const empty = getEmptyBoard();
    setBoard(empty);
    setInitialBoard(empty);
    setSolutionBoard(null);
    setNotes(Array.from({ length: 9 }, () => Array(9).fill([])));
    setValidation(Array.from({ length: 9 }, () => Array(9).fill(null)));
    setHint(null);
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

    // Clear validation for this cell
    const newValidation = [...validation];
    newValidation[row] = [...newValidation[row]];
    newValidation[row][col] = null;
    setValidation(newValidation);

    // Clear hint if we touched the hint cell or any cell (to keep state fresh)
    setHint(null);
  };

  // Initialize on mount
  React.useEffect(() => {
    handleNewGame();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 p-4 w-full max-w-7xl mx-auto">
      {/* Sidebar / Controls (Left on Desktop, Top on Mobile) */}
      <div className="flex flex-col items-center lg:items-start gap-8 w-full lg:w-80 shrink-0 order-2 lg:order-1">
        <div className="flex flex-col items-center lg:items-start gap-2">
          <h1 className="text-4xl font-heading uppercase tracking-tighter text-center lg:text-left">
            Sudoku
          </h1>
          <p className="text-sm text-gray-500 text-center lg:text-left">
            Select a difficulty and start playing!
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Difficulty</h2>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {DIFFICULTIES.map((diff) => (
                <Button
                  key={diff}
                  variant={selectedDifficulty === diff ? "default" : "neutral"}
                  size="sm"
                  onClick={() => setSelectedDifficulty(diff)}
                  className="capitalize flex-1 min-w-[80px]"
                >
                  {diff}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Actions</h2>
            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={() => handleNewGame()}
                variant="default"
                size="lg"
                className="w-full"
              >
                New {selectedDifficulty} Game
              </Button>
              <Button onClick={handleCheck} variant="neutral" size="lg" className="w-full">
                Check Puzzle
              </Button>
              <Button onClick={handleGetHint} variant="neutral" size="lg" className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300">
                Get Hint
              </Button>
              <Button onClick={handleFillNotes} variant="neutral" size="lg" className="w-full">
                Fill Notes
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleClear} variant="neutral" size="lg" className="w-full">
                  Reset
                </Button>
                <Button onClick={handleResetEmpty} variant="neutral" size="lg" className="w-full">
                  Clear All
                </Button>
              </div>
              <Button onClick={handleSolve} variant="reverse" size="lg" className="w-full mt-2">
                Solve Board
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 w-full max-w-2xl order-1 lg:order-2 flex flex-col gap-4">
        {hint && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700 animate-in fade-in slide-in-from-top-2">
            <p className="font-bold">Hint Available:</p>
            <p>{hint.explanation}</p>
          </div>
        )}

        <div className="bg-white border-4 border-black p-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="grid grid-cols-9 bg-black gap-[2px] border-2 border-black">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isInitial =
                  initialBoard[rowIndex][colIndex] !== BLANK &&
                  initialBoard[rowIndex][colIndex] !== null;
                const cellNotes = notes[rowIndex][colIndex];
                const cellValidation = validation[rowIndex][colIndex];
                const isHintCell = hint?.row === rowIndex && hint?.col === colIndex;

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
                        cellValidation === "correct" && "bg-green-100 text-green-700",
                        cellValidation === "incorrect" && "bg-red-100 text-red-700",
                        isHintCell && !cell && "bg-blue-100 ring-inset ring-4 ring-blue-400 animate-pulse"
                      )}
                    />
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
