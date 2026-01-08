import { createFileRoute } from "@tanstack/react-router";
import { SudokuBoard } from "@/components/SudokuBoard";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <SudokuBoard />
    </div>
  );
}