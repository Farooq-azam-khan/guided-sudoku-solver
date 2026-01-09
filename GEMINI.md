# Guided Sudoku Solver Project Context

## Project Overview

**Guided Sudoku Solver** is a modern web-based Sudoku application built to provide an interactive solving experience with difficulty levels, hints, and note-taking capabilities. It leverages the latest React ecosystem tools for performance and developer experience.

### Key Technologies

*   **Framework:** React 19
*   **Routing & App Framework:** [TanStack Start](https://tanstack.com/start) / [TanStack Router](https://tanstack.com/router) (File-based routing)
*   **Build Tool:** Vite 7
*   **Styling:** Tailwind CSS 4, using `shadcn/ui` based components.
*   **Language:** TypeScript
*   **Linting & Formatting:** [Biome](https://biomejs.dev/)
*   **Testing:** Vitest
*   **Deployment:** Netlify (configured via `@netlify/vite-plugin-tanstack-start`)

## Architecture & Directory Structure

The project follows the standard TanStack Start/Router structure:

*   **`src/routes/`**: Contains the application routes.
    *   `__root.tsx`: The root layout component wrapping the entire app.
    *   `index.tsx`: The main entry page rendering the Sudoku game.
*   **`src/components/`**: React components.
    *   `SudokuBoard.tsx`: The primary game component containing the board state, UI, and interaction logic.
    *   `ui/`: Reusable UI components (buttons, inputs, toasts), likely derived from shadcn/ui.
*   **`src/lib/`**: Utility functions and core game logic.
    *   `sudoku.ts`: Pure functions for Sudoku logic (generation, validation, solving, hints).
    *   `utils.ts`: Helper functions (e.g., `cn` for class merging).
*   **`src/styles.css`**: Global styles and Tailwind imports.
*   **`vite.config.ts`**: Vite configuration including plugins for TanStack, Tailwind, and Netlify.
*   **`package.json`**: Dependency management and scripts.

## Core Game Logic (`src/lib/sudoku.ts`)

The `sudoku.ts` file encapsulates the game rules and algorithms:

*   **Board Representation:** A 9x9 grid (`(number | null)[][]`), where `null` (or `BLANK`) represents an empty cell.
*   **Generation:** Generates puzzles by filling diagonal boxes, solving the board, and then removing digits based on difficulty.
*   **Solving:** Implements a backtracking algorithm to solve the board.
*   **Hints:** Provides "Naked Single" and "Hidden Single" hints with explanations.
*   **Validation:** Checks if a move is valid according to Sudoku rules (row, col, 3x3 box).

## Building and Running

This project uses `pnpm` as the package manager.

### Key Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the development server (default port 3000). |
| `pnpm build` | Builds the application for production. |
| `pnpm preview` | Previews the production build locally. |
| `pnpm test` | Runs unit tests using Vitest. |
| `pnpm check` | Runs Biome to check for linting and formatting issues. |
| `pnpm format` | Formats code using Biome. |

## Development Conventions

*   **Routing:** Add new routes by creating files in `src/routes/`. TanStack Router automatically generates the route tree (`src/routeTree.gen.ts`).
*   **Styling:** Use Tailwind utility classes. For conditional class names, use the `cn` utility (Class Variance Authority + clsx).
*   **State:** The `SudokuBoard` currently manages game state locally (board, notes, selection, hints).
*   **Components:** Prefer creating small, reusable components in `src/components`. UI primitives go in `src/components/ui`.
*   **Type Safety:** Strict TypeScript usage is encouraged. `Board`, `Difficulty`, and `Hint` types are exported from `sudoku.ts`.

## Deployment

The application is configured for deployment on Netlify using the `@netlify/vite-plugin-tanstack-start` adapter. The `netlify.toml` file handles the configuration.
