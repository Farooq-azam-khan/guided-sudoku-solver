import { Link } from "@tanstack/react-router";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  Network,
  SquareFunction,
  StickyNote,
  X,
} from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [groupedExpanded, setGroupedExpanded] = useState<
    Record<string, boolean>
  >({});

  return (
    <>
      <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg"></header>
    </>
  );
}
