import click
from dataclasses import dataclass, field

from abc import ABC, abstractmethod
from typing import Tuple
import sys
from itertools import combinations
from rich.prompt import Prompt
from rich.console import Console

console = Console()


@dataclass
class Cell:
    """
    A Sudoku cell: holds its value (1-9 or None) and whether it was a given clue.
    """

    value: int | None
    given: bool = False
    # list of candidate numbers (1-9) for this cell; empty for filled cells
    candidates: list[int] = field(default_factory=list)


# Helper functions for solving and guiding
def is_valid(cells: list[list[Cell]], num: int, pos: tuple[int, int]) -> bool:
    r, c = pos
    # Row and column
    for j in range(9):
        v = cells[r][j].value or 0
        if v == num:
            return False
    for i in range(9):
        v = cells[i][c].value or 0
        if v == num:
            return False
    # Block
    br, bc = (r // 3) * 3, (c // 3) * 3
    for i in range(br, br + 3):
        for j in range(bc, bc + 3):
            v = cells[i][j].value or 0
            if v == num:
                return False
    return True


def find_empty(cells: list[list[Cell]]) -> tuple[int, int] | None:
    for i in range(9):
        for j in range(9):
            if cells[i][j].value is None:
                return (i, j)
    return None


def solve(cells: list[list[Cell]]) -> bool:
    empty = find_empty(cells)
    if not empty:
        return True
    r, c = empty
    for num in range(1, 10):
        if is_valid(cells, num, (r, c)):
            cells[r][c].value = num
            if solve(cells):
                return True
            cells[r][c].value = None
    return False


class Strategy(ABC):
    """Abstract base class for a Sudoku solving strategy."""

    name: str

    @abstractmethod
    def apply(self, cells: list[list[Cell]]) -> Tuple[bool, list[list[Cell]]]:
        """Run one pass of the strategy on the grid. Return True if any cell changed."""
        ...


class SingleCandidateStrategy(Strategy):
    """Strategy that fills any cell having exactly one candidate (naked single)."""

    name = "single-candidate"

    def apply(self, cells: list[list[Cell]]) -> bool:
        """Perform one pass: compute candidates and fill naked singles."""
        changed = False
        # update candidates for all empty cells
        # cells = get_cell_candidates(cells)
        for i in range(9):
            for j in range(9):
                cell = cells[i][j]
                if cell.value is None and len(cell.candidates) == 1:
                    cell.value = cell.candidates[0]
                    cell.given = False
                    changed = True
        return changed, cells


class SubgridSingleStrategy(Strategy):
    """Strategy that fills cells where a subgrid has exactly one possible cell for a number (hidden single)."""

    name = "subgrid-single"

    def apply(self, cells: list[list[Cell]]) -> bool:
        """Perform one pass: fill numbers that can only go in one cell of a 3×3 block."""
        changed = False
        # update candidates
        # cells = get_cell_candidates(cells)
        # check each block
        for br in range(0, 9, 3):
            for bc in range(0, 9, 3):
                for n in range(1, 10):
                    positions: list[tuple[int, int]] = []
                    for i in range(br, br + 3):
                        for j in range(bc, bc + 3):
                            cell = cells[i][j]
                            if cell.value is None and n in cell.candidates:
                                positions.append((i, j))
                    if len(positions) == 1:
                        i, j = positions[0]
                        cells[i][j].value = n
                        cells[i][j].given = False
                        cells[i][j].candidates.clear()
                        changed = True
        return changed, cells


class RowSingleStrategy(Strategy):
    """Strategy that fills cells where a row has exactly one possible cell for a number (hidden single in rows)."""

    name = "row-single"

    def apply(self, cells: list[list[Cell]]) -> Tuple[bool, list[list[Cell]]]:
        changed = False
        # cells = get_cell_candidates(cells)
        for r in range(9):
            for n in range(1, 10):
                positions = [
                    c
                    for c in range(9)
                    if cells[r][c].value is None and n in cells[r][c].candidates
                ]
                if len(positions) == 1:
                    c0 = positions[0]
                    cells[r][c0].value = n
                    cells[r][c0].given = False
                    cells[r][c0].candidates.clear()
                    changed = True
        return changed, cells


class ColumnSingleStrategy(Strategy):
    """Strategy that fills cells where a column has exactly one possible cell for a number (hidden single in columns)."""

    name = "column-single"

    def apply(self, cells: list[list[Cell]]) -> Tuple[bool, list[list[Cell]]]:
        changed = False
        # cells = get_cell_candidates(cells)
        for c in range(9):
            for n in range(1, 10):
                positions = [
                    r
                    for r in range(9)
                    if cells[r][c].value is None and n in cells[r][c].candidates
                ]
                if len(positions) == 1:
                    r0 = positions[0]
                    cells[r0][c].value = n
                    cells[r0][c].given = False
                    cells[r0][c].candidates.clear()
                    changed = True
        return changed, cells


class NakedPairColumnStrategy(Strategy):
    """Strategy that finds and applies naked pairs in each column."""

    name = "naked-pair-column"

    def apply(self, cells: list[list[Cell]]) -> Tuple[bool, list[list[Cell]]]:
        changed = False
        # ensure candidates are current
        # cells = get_cell_candidates(cells)
        # scan each column for naked pairs
        for c in range(9):
            # collect cells with exactly two candidates
            pairs = [
                (i, cells[i][c].candidates)
                for i in range(9)
                if cells[i][c].value is None and len(cells[i][c].candidates) == 2
            ]
            # look for identical candidate sets
            found = False
            for idx1 in range(len(pairs)):
                i1, cand1 = pairs[idx1]
                for idx2 in range(idx1 + 1, len(pairs)):
                    i2, cand2 = pairs[idx2]
                    if set(cand1) == set(cand2):
                        # naked pair found
                        coords = f"({i1},{c}) and ({i2},{c})"
                        console.print(
                            f"[green]Naked pair in column {c}: {cand1} at {coords}[/]"
                        )
                        # eliminate these two numbers from other cells in the column
                        for i in range(9):
                            if i not in (i1, i2) and cells[i][c].value is None:
                                before = list(cells[i][c].candidates)
                                cells[i][c].candidates = [
                                    n for n in before if n not in cand1
                                ]
                                if cells[i][c].candidates != before:
                                    changed = True
                        # after elimination, display updated candidates in this column
                        console.print(
                            f"[blue]Candidates after eliminating {cand1} from column {c}:[/]"
                        )
                        for i in range(9):
                            cell = cells[i][c]
                            if cell.value is None:
                                console.print(f"  ({i},{c}): {cell.candidates}")
                        # display all cells' candidates after elimination
                        # console.print("[cyan]Full grid candidates after naked-pair-column elimination:[/]")
                        for ii in range(9):
                            for jj in range(9):
                                cell2 = cells[ii][jj]
                                if cell2.value is None:
                                    pass
                                    # console.print(f"  ({ii},{jj}): {cell2.candidates}")
                        found = True
                        break
                if found:
                    break
        if not changed:
            console.print("[yellow]No naked pairs found in columns.[/]")
        return changed, cells


class NakedPairRowStrategy(Strategy):
    """Strategy that finds and applies naked pairs in each row."""

    name = "naked-pair-row"

    def apply(self, cells: list[list[Cell]]) -> Tuple[bool, list[list[Cell]]]:
        changed = False
        # cells = get_cell_candidates(cells)
        for r in range(9):
            # collect cells with exactly two candidates
            pairs = [
                (j, cells[r][j].candidates)
                for j in range(9)
                if cells[r][j].value is None and len(cells[r][j].candidates) == 2
            ]
            # look for identical candidate sets
            found = False
            for idx1 in range(len(pairs)):
                j1, cand1 = pairs[idx1]
                for idx2 in range(idx1 + 1, len(pairs)):
                    j2, cand2 = pairs[idx2]
                    if set(cand1) == set(cand2):
                        coords = f"({r},{j1}) and ({r},{j2})"
                        console.print(
                            f"[green]Naked pair in row {r}: {cand1} at {coords}[/]"
                        )
                        # eliminate these two numbers from other cells in the row
                        for j in range(9):
                            if j not in (j1, j2) and cells[r][j].value is None:
                                before = list(cells[r][j].candidates)
                                cells[r][j].candidates = [
                                    n for n in before if n not in cand1
                                ]
                                if cells[r][j].candidates != before:
                                    changed = True
                        found = True
                        break
                if found:
                    break
        if not changed:
            console.print("[yellow]No naked pairs found in rows.[/]")
        return changed, cells


class NakedPairSubgridStrategy(Strategy):
    """Strategy that finds and applies naked pairs in each 3×3 subgrid."""

    name = "naked-pair-subgrid"

    def apply(self, cells: list[list[Cell]]) -> Tuple[bool, list[list[Cell]]]:
        changed = False
        # scan each 3×3 block for naked pairs
        for br in range(0, 9, 3):
            for bc in range(0, 9, 3):
                # collect empty cells with exactly two candidates
                pairs = [
                    ((i, j), cells[i][j].candidates)
                    for i in range(br, br + 3)
                    for j in range(bc, bc + 3)
                    if cells[i][j].value is None and len(cells[i][j].candidates) == 2
                ]
                found = False
                # look for identical candidate sets
                for idx1 in range(len(pairs)):
                    (i1, j1), cand1 = pairs[idx1]
                    for idx2 in range(idx1 + 1, len(pairs)):
                        (i2, j2), cand2 = pairs[idx2]
                        if set(cand1) == set(cand2):
                            coords = f"({i1},{j1}) and ({i2},{j2})"
                            console.print(
                                f"[green]Naked pair in subgrid at ({br},{bc}): {cand1} at {coords}[/]"
                            )
                            # eliminate these numbers from other cells in the block
                            for i in range(br, br + 3):
                                for j in range(bc, bc + 3):
                                    if (i, j) not in ((i1, j1), (i2, j2)) and cells[i][
                                        j
                                    ].value is None:
                                        before = list(cells[i][j].candidates)
                                        cells[i][j].candidates = [
                                            n for n in before if n not in cand1
                                        ]
                                        if cells[i][j].candidates != before:
                                            changed = True
                            found = True
                            break
                    if found:
                        break
        if not changed:
            console.print("[yellow]No naked pairs found in subgrids.[/]")
        return changed, cells


class NakedTripletColumnStrategy(Strategy):
    """Strategy that finds and applies naked triplets in each column."""

    name = "naked-triplet-column"

    def apply(self, cells: list[list[Cell]]) -> Tuple[bool, list[list[Cell]]]:
        changed = False
        # scan each column for naked triplets
        for c in range(9):
            # collect empty cells with 2 or 3 candidates
            candidates = [
                (i, cells[i][c].candidates)
                for i in range(9)
                if cells[i][c].value is None and 2 <= len(cells[i][c].candidates) <= 3
            ]
            # check combinations of 3 cells
            found = False
            for combo in combinations(candidates, 3):
                idxs, cands = zip(*combo)
                union = set().union(*cands)
                if len(union) == 3:
                    coords = " and ".join(f"({i},{c})" for i in idxs)
                    console.print(
                        f"[green]Naked triplet in column {c}: {sorted(union)} at {coords}[/]"
                    )
                    # eliminate these numbers from other cells in the column
                    for i in range(9):
                        if i not in idxs and cells[i][c].value is None:
                            before = list(cells[i][c].candidates)
                            cells[i][c].candidates = [
                                n for n in before if n not in union
                            ]
                            if cells[i][c].candidates != before:
                                changed = True
                    found = True
                    break
            if not found:
                console.print(f"[yellow]No naked triplets found in column {c}.[/]")
        return changed, cells


class NakedTripletRowStrategy(Strategy):
    """Strategy that finds and applies naked triplets in each row."""

    name = "naked-triplet-row"

    def apply(self, cells: list[list[Cell]]) -> Tuple[bool, list[list[Cell]]]:
        changed = False
        # scan each row for naked triplets
        for r in range(9):
            candidates = [
                (j, cells[r][j].candidates)
                for j in range(9)
                if cells[r][j].value is None and 2 <= len(cells[r][j].candidates) <= 3
            ]
            found = False
            for combo in combinations(candidates, 3):
                idxs, cands = zip(*combo)
                union = set().union(*cands)
                if len(union) == 3:
                    coords = " and ".join(f"({r},{j})" for j in idxs)
                    console.print(
                        f"[green]Naked triplet in row {r}: {sorted(union)} at {coords}[/]"
                    )
                    for j in range(9):
                        if j not in idxs and cells[r][j].value is None:
                            before = list(cells[r][j].candidates)
                            cells[r][j].candidates = [
                                n for n in before if n not in union
                            ]
                            if cells[r][j].candidates != before:
                                changed = True
                    found = True
                    break
            if not found:
                console.print(f"[yellow]No naked triplets found in row {r}.[/]")
        return changed, cells


class NakedTripletSubgridStrategy(Strategy):
    """Strategy that finds and applies naked triplets in each 3×3 subgrid."""

    name = "naked-triplet-subgrid"

    def apply(self, cells: list[list[Cell]]) -> Tuple[bool, list[list[Cell]]]:
        changed = False
        # scan each 3×3 block for naked triplets
        for br in range(0, 9, 3):
            for bc in range(0, 9, 3):
                candidates = [
                    ((i, j), cells[i][j].candidates)
                    for i in range(br, br + 3)
                    for j in range(bc, bc + 3)
                    if cells[i][j].value is None
                    and 2 <= len(cells[i][j].candidates) <= 3
                ]
                found = False
                for combo in combinations(candidates, 3):
                    positions, cands = zip(*combo)
                    union = set().union(*cands)
                    if len(union) == 3:
                        coords = " and ".join(f"({i},{j})" for (i, j) in positions)
                        console.print(
                            f"[green]Naked triplet in subgrid at ({br},{bc}): {sorted(union)} at {coords}[/]"
                        )
                        for i in range(br, br + 3):
                            for j in range(bc, bc + 3):
                                if (i, j) not in positions and cells[i][
                                    j
                                ].value is None:
                                    before = list(cells[i][j].candidates)
                                    cells[i][j].candidates = [
                                        n for n in before if n not in union
                                    ]
                                    if cells[i][j].candidates != before:
                                        changed = True
                        found = True
                        break
                if not found:
                    console.print(
                        f"[yellow]No naked triplets found in subgrid at ({br},{bc}).[/]"
                    )
        return changed, cells


def guided_solver(cells):
    """
    Guided mode: repeatedly apply the SingleCandidateStrategy until no further progress,
    then display the grid.
    """
    should_continue = True
    # track changed cells: previous and last fill operations
    prev_changes: set[tuple[int, int]] = set()
    last_changes: set[tuple[int, int]] = set()
    strateties = [
        SingleCandidateStrategy(),
        SubgridSingleStrategy(),
        RowSingleStrategy(),
        ColumnSingleStrategy(),
        NakedPairColumnStrategy(),
        NakedPairRowStrategy(),
        NakedPairSubgridStrategy(),
        NakedTripletColumnStrategy(),
        NakedTripletRowStrategy(),
        NakedTripletSubgridStrategy(),
    ]
    strategies_idx = 0
    cells = get_cell_candidates(cells)
    while should_continue:
        console.clear()
        should_continue = False
        strategy = strateties[strategies_idx]
        console.print(f"Applying strategy: [green]{strategy.name}[/]")
        # detect fills: before state
        before_filled = {
            (i, j) for i in range(9) for j in range(9) if cells[i][j].value is not None
        }
        changed, cells = strategy.apply(cells)
        # detect newly filled cells and update candidates
        after_filled = {
            (i, j) for i in range(9) for j in range(9) if cells[i][j].value is not None
        }
        last_changes = after_filled - before_filled
        if last_changes:
            remove_filled_candidates(cells, last_changes)
        # display using guided highlighting
        display_grid_guided(cells, last_changes=last_changes, prev_changes=prev_changes)
        # update previous changes for next iteration
        prev_changes = last_changes.copy()
        if not changed:
            strategies_idx += 1
            # If we've cycled through all strategies, reset and check for completion
            if strategies_idx >= len(strateties):
                console.print("[red]Cycled through all strategies, start from top.[/]")
                strategies_idx = 0
                # If no empty cells remain, puzzle is solved; exit guided mode
                if find_empty(cells) is None:
                    console.print("[green]Puzzle solved![/]")
                    break

        should_continue = (
            Prompt.ask(
                f"[yellow]Changes made by {strategy.name}. Continue with next strategy? (y/n)[/]",
                default="y",
                choices=["y", "n"],
                show_choices=False,
            ).lower()
            == "y"
        )

    # display_grid(cells)
    sys.exit(0)


def display_grid_with_candidates(cells):
    cell_w = 5
    for i in range(9):
        row_cells: list[str] = []
        for j in range(9):
            cell = cells[i][j]
            # filled cells: red for given, blue for added
            if cell.value is not None:
                val_str = str(cell.value).center(cell_w)
                if cell.given:
                    rep = f"[red]{val_str}[/]"
                else:
                    rep = f"[blue]{val_str}[/]"
            else:
                # candidates: show up to 3 in yellow
                cands = cell.candidates
                if cands:
                    disp = cands
                    cand_str = "[" + "".join(str(n) for n in disp) + "]"
                    if len(cand_str) < cell_w:
                        cand_str = cand_str.center(cell_w)
                    rep = f"[yellow]{cand_str}[/]"
                else:
                    rep = " " * cell_w
            row_cells.append(rep)
        # print row with block dividers
        seg1 = " ".join(row_cells[0:3])
        seg2 = " ".join(row_cells[3:6])
        seg3 = " ".join(row_cells[6:9])
        row_str = f"{seg1} | {seg2} | {seg3}"
        console.print(row_str)
        if i in (2, 5):
            console.print(
                "-" * len(seg1) + " | " + "-" * len(seg2) + " | " + "-" * len(seg3)
            )


def display_grid(cells):
    for i in range(9):
        parts: list[str] = []
        for j in range(9):
            if j > 0 and j % 3 == 0:
                parts.append("|")
            cell = cells[i][j]
            if cell.value is not None:
                if cell.given:
                    parts.append(f"[red]{cell.value}[/]")
                else:
                    parts.append(str(cell.value))
            else:
                parts.append(".")
        row_str = " ".join(parts)
        console.print(row_str)
        # full-width horizontal separator after each 3-row block
    if i < 8 and (i + 1) % 3 == 0:
        sep = "-" * (2 * len(parts) - 1)
        console.print(sep)


def display_grid_guided(cells, last_changes=None, prev_changes=None):
    """
    Display grid for guided mode:
      - given clues in red
      - most recent fills (last_changes) in green
      - previous fills (prev_changes) in blue
      - empties as dots
    """
    last_changes = last_changes or set()
    prev_changes = prev_changes or set()
    for i in range(9):
        parts: list[str] = []
        for j in range(9):
            if j > 0 and j % 3 == 0:
                parts.append("|")
            cell = cells[i][j]
            coord = (i, j)
            if cell.value is not None:
                if cell.given:
                    parts.append(f"[red]{cell.value}[/]")
                elif coord in last_changes:
                    parts.append(f"[green]{cell.value}[/]")
                elif coord in prev_changes:
                    parts.append(f"[blue]{cell.value}[/]")
                else:
                    parts.append(str(cell.value))
            else:
                parts.append(".")
        row_str = " ".join(parts)
        console.print(row_str)
        if i < 8 and (i + 1) % 3 == 0:
            sep = "-" * (2 * len(parts) - 1)
            console.print(sep)


def get_cell_candidates(cells):
    for i in range(9):
        for j in range(9):
            cell = cells[i][j]
            if cell.value is None:
                cell.candidates = [
                    n for n in range(1, 10) if is_valid(cells, n, (i, j))
                ]
    return cells


def remove_filled_candidates(cells: list[list[Cell]], filled: set[tuple[int, int]]):
    """
    For each newly filled cell, clear its candidates and remove its value
    from candidate lists of all peer cells (row, column, block).
    """
    for r, c in filled:
        val = cells[r][c].value
        # clear own candidates
        cells[r][c].candidates.clear()
        # row and column peers
        for k in range(9):
            peer = cells[r][k]
            if peer.value is None and val in peer.candidates:
                peer.candidates.remove(val)
            peer = cells[k][c]
            if peer.value is None and val in peer.candidates:
                peer.candidates.remove(val)
        # block peers
        br, bc = (r // 3) * 3, (c // 3) * 3
        for i in range(br, br + 3):
            for j in range(bc, bc + 3):
                peer = cells[i][j]
                if peer.value is None and val in peer.candidates:
                    peer.candidates.remove(val)


@click.command(
    help="Solve a Sudoku puzzle or provide guidance on single-candidate or subgrid analysis."
)
@click.option(
    "--guide",
    is_flag=True,
    default=False,
    help="Enable guide mode (show analysis).",
)
@click.argument("puzzle", type=str, metavar="PUZZLE")
def sudoku(guide: bool, puzzle: str):
    """
    Solve a 9x9 Sudoku puzzle and print the solution.
    """
    # allow '|' separators in input (ignore them)
    puzzle = puzzle.replace("|", "")
    if len(puzzle) != 81:
        console.print(
            f"[red]Error:[/] Puzzle must be 81 characters long (ignoring '|'), got {len(puzzle)}."
        )
        sys.exit(1)

    # Initialize cell grid
    cells: list[list[Cell]] = [[Cell(None, False) for _ in range(9)] for _ in range(9)]
    # Parse puzzle input
    if len(puzzle) != 81:
        console.print(
            f"[red]Error:[/] Puzzle must be 81 characters long, got {len(puzzle)}."
        )
        sys.exit(1)
    for idx, ch in enumerate(puzzle):
        r, c = divmod(idx, 9)
        if ch in "123456789":
            cells[r][c] = Cell(int(ch), True)
        elif ch in ".0":
            # leave as empty cell
            continue
        else:
            console.print(f"[red]Error:[/] Invalid character at position {idx}: '{ch}'")
            sys.exit(1)

    # Solve or guide execution
    if guide:
        guided_solver(cells)
    # Solve and print solution

    if not guide and solve(cells):
        console.print("[green]Solved puzzle:[/]")
        display_grid(cells)
    else:
        console.print("[red]No solution found for the given puzzle.[/]")


@click.group()
def cli():
    pass


cli.add_command(sudoku)

if __name__ == "__main__":
    cli()
