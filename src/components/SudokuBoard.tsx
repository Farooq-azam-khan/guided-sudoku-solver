import * as React from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [selectedCell, setSelectedCell] = React.useState<{
    row: number;
    col: number;
  } | null>(null);
  const [noteMode, setNoteMode] = React.useState(false);
  const [showNumberPad, setShowNumberPad] = React.useState(false);

  const [status, setStatus] = React.useState<
    "playing" | "solved" | "unsolvable"
  >("playing");
  const [selectedDifficulty, setSelectedDifficulty] =
    React.useState<Difficulty>("medium");
  const [showCompletionModal, setShowCompletionModal] = React.useState(false);

  const handleNewGame = (difficulty: Difficulty = selectedDifficulty) => {
    const { puzzle, solution } = generateSudoku(difficulty);
    setBoard(puzzle.map((row) => [...row]));
    setInitialBoard(puzzle.map((row) => [...row]));
    setSolutionBoard(solution);
    setNotes(Array.from({ length: 9 }, () => Array(9).fill([])));
    setValidation(Array.from({ length: 9 }, () => Array(9).fill(null)));
    setHint(null);
    setStatus("playing");
    setSelectedCell(null);
    setShowCompletionModal(false);
  };

  const handleSolve = () => {
    const solution = solveSudoku(board);
    if (solution) {
      setBoard(solution);
      setStatus("solved");
      setNotes(Array.from({ length: 9 }, () => Array(9).fill([])));
      setValidation(Array.from({ length: 9 }, () => Array(9).fill(null)));
      setHint(null);
    } else {
      setStatus("unsolvable");
      toast.error("Unsolvable", {
        description: "No solution found for this board configuration!",
      });
    }
  };

  const handleCheck = () => {
    if (!solutionBoard) {
      const currentSolution = solveSudoku(initialBoard);
      if (!currentSolution) {
        toast.error("Unsolvable", {
          description: "This puzzle seems unsolvable!",
        });
        return;
      }
      const newValidation = board.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (initialBoard[rIdx][cIdx] !== BLANK) return null;
          if (cell === BLANK) return null;
          return cell === currentSolution[rIdx][cIdx] ? "correct" : "incorrect";
        }),
      );
      setValidation(newValidation);
      return;
    }

    const newValidation = board.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (initialBoard[rIdx][cIdx] !== BLANK) return null;
        if (cell === BLANK) return null;
        return cell === solutionBoard[rIdx][cIdx] ? "correct" : "incorrect";
      }),
    );
    setValidation(newValidation);
  };

  const handleGetHint = () => {
    const nextHint = getHint(board);
    if (nextHint) {
      setHint(nextHint);
      toast("Hint Available", {
        description: nextHint.explanation,
      });
    } else {
      toast.info("No Hint Found", {
        description:
          "No obvious hint found! You might need advanced techniques or the board is full.",
      });
    }
  };

  const handleClear = () => {
    setBoard(initialBoard.map((row) => [...row]));
    setNotes(Array.from({ length: 9 }, () => Array(9).fill([])));
    setValidation(Array.from({ length: 9 }, () => Array(9).fill(null)));
    setHint(null);
    setStatus("playing");
    setSelectedCell(null);
    setShowCompletionModal(false);
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
    setSelectedCell(null);
    setShowCompletionModal(false);
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

  const checkCompletion = (currentBoard: Board) => {
    // Check if board is fully filled
    const isFull = currentBoard.every((row) =>
      row.every((cell) => cell !== BLANK),
    );

    if (!isFull) return;

    // Check if solution is correct
    if (solutionBoard) {
      const isCorrect = currentBoard.every((row, rIdx) =>
        row.every((cell, cIdx) => cell === solutionBoard[rIdx][cIdx]),
      );

      if (isCorrect) {
        setStatus("solved");
        setShowCompletionModal(true);
      }
    } else {
      // No solution board, just check if valid
      const solution = solveSudoku(currentBoard);
      if (solution) {
        setStatus("solved");
        setShowCompletionModal(true);
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  const handleNumberSelect = (num: number | null) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    if (initialBoard[row][col] !== BLANK && initialBoard[row][col] !== null) {
      toast.warning("Cannot Edit", {
        description: "Initial numbers cannot be changed.",
      });
      return;
    }

    if (noteMode && num !== null) {
      // Toggle note
      const cellNotes = notes[row][col];
      const newNotes = [...notes];
      newNotes[row] = [...newNotes[row]];

      if (cellNotes.includes(num)) {
        newNotes[row][col] = cellNotes.filter((n) => n !== num);
      } else {
        newNotes[row][col] = [...cellNotes, num].sort();
      }
      setNotes(newNotes);
    } else {
      // Fill number
      const newBoard = board.map((r, rIdx) =>
        rIdx === row ? r.map((c, cIdx) => (cIdx === col ? num : c)) : r,
      );
      setBoard(newBoard);

      // Start with a deep copy of current notes
      const newNotes = notes.map((r) => r.map((c) => [...c]));

      if (num !== null) {
        // Clear from row
        for (let c = 0; c < 9; c++) {
          newNotes[row][c] = newNotes[row][c].filter((n) => n !== num);
        }

        // Clear from column
        for (let r = 0; r < 9; r++) {
          newNotes[r][col] = newNotes[r][col].filter((n) => n !== num);
        }

        // Clear from 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
          for (let c = boxCol; c < boxCol + 3; c++) {
            newNotes[r][c] = newNotes[r][c].filter((n) => n !== num);
          }
        }
      }

      // Clear notes for this cell
      newNotes[row][col] = [];
      setNotes(newNotes);

      // Clear validation for this cell
      const newValidation = [...validation];
      newValidation[row] = [...newValidation[row]];
      newValidation[row][col] = null;
      setValidation(newValidation);

      setHint(null);

      // Check completion
      checkCompletion(newBoard);
    }
  };

  // Calculate number counts
  const numberCounts = React.useMemo(() => {
    const counts: Record<number, number> = {};
    for (let n = 1; n <= 9; n++) {
      counts[n] = 0;
    }
    board.forEach((row) => {
      row.forEach((cell) => {
        if (cell !== BLANK) {
          counts[cell] = (counts[cell] || 0) + 1;
        }
      });
    });
    return counts;
  }, [board]);

  // Initialize on mount
  React.useEffect(() => {
    handleNewGame();
  }, []);

  // Handle keyboard input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;

      // Numbers 1-9
      if (e.key >= "1" && e.key <= "9") {
        handleNumberSelect(Number.parseInt(e.key));
        return;
      }

      // Backspace or Delete to clear
      if (e.key === "Backspace" || e.key === "Delete") {
        handleNumberSelect(null);
        return;
      }

      // Arrow keys for navigation
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const { row, col } = selectedCell;
        let newRow = row;
        let newCol = col;

        if (e.key === "ArrowUp") newRow = Math.max(0, row - 1);
        if (e.key === "ArrowDown") newRow = Math.min(8, row + 1);
        if (e.key === "ArrowLeft") newCol = Math.max(0, col - 1);
        if (e.key === "ArrowRight") newCol = Math.min(8, col + 1);

        setSelectedCell({ row: newRow, col: newCol });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, handleNumberSelect]);

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 p-4 w-full max-w-7xl mx-auto">
      {/* Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-3xl">
              🎉 Congratulations! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              You solved the {selectedDifficulty} puzzle!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() => {
                setShowCompletionModal(false);
                handleNewGame();
              }}
              variant="default"
              size="lg"
              className="w-full"
            >
              New {selectedDifficulty} Game
            </Button>
            <Button
              onClick={() => setShowCompletionModal(false)}
              variant="neutral"
              size="lg"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sidebar / Controls */}
      <div className="flex flex-col items-center lg:items-start gap-8 w-full lg:w-80 shrink-0 order-2 lg:order-1">
        <h1 className="sr-only text-4xl font-heading uppercase tracking-tighter text-center lg:text-left">
          Sudoku
        </h1>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Difficulty</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="neutral" size="lg" className="w-full capitalize">
                  {selectedDifficulty} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Select Difficulty</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {DIFFICULTIES.map((diff) => (
                  <DropdownMenuItem
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className="capitalize"
                  >
                    {diff}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Mode</h2>
            <Button
              onClick={() => setNoteMode(!noteMode)}
              variant={noteMode ? "default" : "neutral"}
              size="lg"
              className="w-full"
            >
              {noteMode ? "📝 Note Mode ON" : "✏️ Fill Mode"}
            </Button>
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="neutral" size="lg" className="w-full">
                    Game Actions <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Game Assistance</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleCheck}>
                    Check Puzzle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGetHint}>
                    Get Hint
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFillNotes}>
                    Fill Notes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Board Control</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleClear}>
                    Reset Current Game
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleResetEmpty}>
                    Clear Board (Empty)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSolve}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    Solve Board
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 w-full max-w-2xl order-1 lg:order-2 flex flex-col gap-4">
        <div className="bg-white border-4 border-black p-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="grid grid-cols-9 bg-black gap-[2px] border-2 border-black">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isInitial =
                  initialBoard[rowIndex][colIndex] !== BLANK &&
                  initialBoard[rowIndex][colIndex] !== null;
                const cellNotes = notes[rowIndex][colIndex];
                const cellValidation = validation[rowIndex][colIndex];
                const isHintCell =
                  hint?.row === rowIndex && hint?.col === colIndex;
                const isSelected =
                  selectedCell?.row === rowIndex &&
                  selectedCell?.col === colIndex;
                const isHighlighted =
                  selectedCell &&
                  (selectedCell.row === rowIndex ||
                    selectedCell.col === colIndex);

                const isRightBorder =
                  (colIndex + 1) % 3 === 0 && colIndex !== 8;
                const isBottomBorder =
                  (rowIndex + 1) % 3 === 0 && rowIndex !== 8;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={cn(
                      "relative w-full aspect-square cursor-pointer",
                      isInitial ? "bg-gray-100" : "bg-white",
                      isRightBorder && "border-r-4 border-black",
                      isBottomBorder && "border-b-4 border-black",
                      isHighlighted && !isSelected && "bg-blue-50",
                      isSelected &&
                        "bg-yellow-200 ring-4 ring-yellow-400 ring-inset",
                      !isInitial && "hover:bg-yellow-100",
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
                    <div
                      className={cn(
                        "relative z-10 w-full h-full flex items-center justify-center text-xl sm:text-2xl font-bold transition-colors",
                        isInitial ? "text-black" : "text-blue-600",
                        cellValidation === "correct" &&
                          "bg-green-100 text-green-700",
                        cellValidation === "incorrect" &&
                          "bg-red-100 text-red-700",
                        isHintCell &&
                          !cell &&
                          "bg-blue-100 ring-inset ring-4 ring-blue-400 animate-pulse",
                      )}
                    >
                      {cell ?? ""}
                    </div>
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Number Pad */}
        <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const isCompleted = numberCounts[num] >= 9;
              return (
                <Button
                  key={num}
                  onClick={() => handleNumberSelect(num)}
                  disabled={!selectedCell || isCompleted}
                  variant="neutral"
                  size="lg"
                  className={cn(
                    "text-xl font-bold aspect-square p-0",
                    isCompleted && "opacity-50 cursor-not-allowed bg-gray-200",
                  )}
                >
                  {num}
                </Button>
              );
            })}
            <Button
              onClick={() => handleNumberSelect(null)}
              disabled={!selectedCell}
              variant="reverse"
              size="lg"
              className="col-span-1 text-lg font-bold aspect-square p-0"
            >
              ⌫
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
