import { Cell, Grid } from "./grid.js";

function getAdjacentCells(grid: Grid, index: number) {
	const cell = grid.cells[index];
	const adj: Cell[] = [];
	if (!cell.walls[0]) adj.push(grid.cells[index - grid.colCnt]);
	if (!cell.walls[1]) adj.push(grid.cells[index + 1]);
	if (!cell.walls[2]) adj.push(grid.cells[index + grid.colCnt]);
	if (!cell.walls[3]) adj.push(grid.cells[index - 1]);
	return adj;
}

// TODO: split and create multiple solver algorithms
export interface SolverStructure {
	from: number;
	to: number;
	isComplete: boolean;
	path: number[];
	step(): void;
	draw(ctx: CanvasRenderingContext2D): void;
}
export type SolverConstructor = new (
	grid: Grid,
	from: number,
	to: number
) => SolverStructure;

export class DepthFirstSearch implements SolverStructure {
	isComplete: boolean;
	from: number;
	to: number;
	grid: Grid;

	path: number[];
	neighbors: Cell[][];
	constructor(grid: Grid, from: number, to: number) {
		this.grid = grid;
		this.from = from;
		this.to = to;

		this.path = [from];
		this.neighbors = [getAdjacentCells(grid, from)];
	}

	step(): void {
		if (this.isComplete) return;

		const head = this.path.at(-1);
		if (head === undefined || head === this.to) {
			this.isComplete = true;
			return;
		}

		const curNeighbors = this.neighbors.at(-1)!;
		const neighbor = curNeighbors.pop();
		if (!neighbor) {
			// All adjacents tried / none exist, backtrack
			this.path.pop();
			this.neighbors.pop();
			return;
		}

		// Prepare next head
		this.path.push(neighbor.index);
		this.neighbors.push(
			getAdjacentCells(this.grid, neighbor.index).filter(
				(a) => !this.path.includes(a.index)
			)
		);
	}

	draw(ctx: CanvasRenderingContext2D): void {
		this.grid.paintPath(ctx, this.path, "#0f0");
	}
}

export class BreadthFirstSearch implements SolverStructure {
	isComplete: boolean;
	path: number[];
	from: number;
	to: number;
	grid: Grid;
	stack: {}[];
	constructor(grid: Grid, from: number, to: number) {
		this.grid = grid;
		this.from = from;
		this.to = to;
	}

	step(): void {}

	draw(ctx: CanvasRenderingContext2D): void {
		if (this.isComplete) return;
	}
}

// NOTE: Test purposes, delete later
// @ts-expect-error
window.search = search;
function search(grid: Grid, to: number, path: number[]): boolean {
	const current = path.at(-1);
	if (current === undefined) throw Error("No path found");
	if (current === to) return true;

	const adjCells = getAdjacentCells(grid, current);
	for (const adj of adjCells) {
		if (path.at(-2) === adj.index) continue;
		path.push(adj.index);
		const res = search(grid, to, path);
		if (res) return true;
		path.pop();
	}

	return false;
}

export const solverKeyMap = new Map<string, SolverConstructor>([
	["dfs", DepthFirstSearch],
	["bfs", BreadthFirstSearch],
]);
