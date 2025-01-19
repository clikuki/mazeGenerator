import { Grid } from "./grid.js";

// TODO: split and create multiple solver algorithms
export interface SolverStructure {
	from: number;
	to: number;
	isComplete: boolean;
	path: number[] | null;
	step(): void;
	draw(ctx: CanvasRenderingContext2D): void;
}
export type SolverConstructor = new (
	grid: Grid,
	from: number,
	to: number
) => SolverStructure;

export class BreadthFirstSearch implements SolverStructure {
	isComplete: boolean;
	path: number[] | null;
	from: number;
	to: number;
	grid: Grid;

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

export const solverKeyMap = new Map<string, SolverConstructor>([
	["bfs", BreadthFirstSearch],
]);
