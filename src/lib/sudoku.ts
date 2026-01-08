export type Board = (number | null)[][];

export const BLANK = null;

export function getEmptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(BLANK));
}

export function isValid(board: Board, row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }

  return true;
}

export function getPossibleMoves(board: Board, row: number, col: number): number[] {
  const moves: number[] = [];
  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      moves.push(num);
    }
  }
  return moves;
}

export function solveSudoku(board: Board): Board | false {
  const solvedBoard = board.map((row) => [...row]);

  function solve(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (solvedBoard[row][col] === BLANK) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(solvedBoard, row, col, num)) {
              solvedBoard[row][col] = num;
              if (solve()) return true;
              solvedBoard[row][col] = BLANK;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  if (solve()) return solvedBoard;
  return false;
}

export type Difficulty = "easy" | "medium" | "hard" | "expert" | "master";

export type Hint = {
  row: number;
  col: number;
  value: number;
  explanation: string;
};

export function getHint(board: Board): Hint | null {
  // 1. Look for Naked Singles (cells with only one possible candidate)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === BLANK) {
        const moves = getPossibleMoves(board, r, c);
        if (moves.length === 1) {
          return {
            row: r,
            col: c,
            value: moves[0],
            explanation: `Cell (${r + 1}, ${c + 1}) can only be ${moves[0]} (Naked Single).`,
          };
        }
      }
    }
  }

  // 2. Look for Hidden Singles (a number can only go in one spot in a unit)
  for (let num = 1; num <= 9; num++) {
    // Check Rows
    for (let r = 0; r < 9; r++) {
      const positions = [];
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === BLANK && isValid(board, r, c, num)) {
          positions.push(c);
        }
      }
      if (positions.length === 1) {
        return {
          row: r,
          col: positions[0],
          value: num,
          explanation: `In row ${r + 1}, the number ${num} can only go in cell (${r + 1}, ${positions[0] + 1}) (Hidden Single).`,
        };
      }
    }

    // Check Columns
    for (let c = 0; c < 9; c++) {
      const positions = [];
      for (let r = 0; r < 9; r++) {
        if (board[r][c] === BLANK && isValid(board, r, c, num)) {
          positions.push(r);
        }
      }
      if (positions.length === 1) {
        return {
          row: positions[0],
          col: c,
          value: num,
          explanation: `In column ${c + 1}, the number ${num} can only go in cell (${positions[0] + 1}, ${c + 1}) (Hidden Single).`,
        };
      }
    }

    // Check Boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const positions = [];
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const r = boxRow * 3 + i;
            const c = boxCol * 3 + j;
            if (board[r][c] === BLANK && isValid(board, r, c, num)) {
              positions.push({ r, c });
            }
          }
        }
        if (positions.length === 1) {
          return {
            row: positions[0].r,
            col: positions[0].c,
            value: num,
            explanation: `In the 3x3 box at (${boxRow * 3 + 1}, ${boxCol * 3 + 1}), the number ${num} can only go in cell (${positions[0].r + 1}, ${positions[0].c + 1}) (Hidden Single).`,
          };
        }
      }
    }
  }

  return null;
}

export function generateSudoku(difficulty: Difficulty = "medium"): { puzzle: Board; solution: Board } {
  // Start with empty board
  const board = getEmptyBoard();

  // Fill diagonal 3x3 boxes (independent of each other) to ensure randomness
  for (let i = 0; i < 9; i = i + 3) {
    fillBox(board, i, i);
  }

  // Solve the board to get a valid full solution
  solveSudokuInPlace(board);
  const solution = board.map(row => [...row]);

  // Remove elements to create puzzle
  removeDigits(board, difficulty);

  return { puzzle: board, solution };
}

function fillBox(board: Board, row: number, col: number) {
  let num: number;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      do {
        num = Math.floor(Math.random() * 9) + 1;
      } while (!isSafeInBox(board, row, col, num));
      board[row + i][col + j] = num;
    }
  }
}

function isSafeInBox(board: Board, rowStart: number, colStart: number, num: number) {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[rowStart + i][colStart + j] === num) return false;
    }
  }
  return true;
}

function solveSudokuInPlace(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === BLANK) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudokuInPlace(board)) return true;
            board[row][col] = BLANK;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function removeDigits(board: Board, difficulty: Difficulty) {
  const attemptsMap: Record<Difficulty, number> = {
    easy: 35,
    medium: 45,
    hard: 52,
    expert: 58,
    master: 64,
  };

  let attempts = attemptsMap[difficulty];
  while (attempts > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    while (board[row][col] === BLANK) {
      row = Math.floor(Math.random() * 9);
      col = Math.floor(Math.random() * 9);
    }
    board[row][col] = BLANK;
    attempts--;
  }
}
