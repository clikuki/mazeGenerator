import { Grid } from "./grid.js";
import { settings } from "./settings.js";

function getAdjacentCells(grid: Grid, index: number) {
	const cell = grid.cells[index];
	const adj = [];
	if (!cell.walls[0]) adj.push(index - grid.colCnt);
	if (!cell.walls[1]) adj.push(index + 1);
	if (!cell.walls[2]) adj.push(index + grid.colCnt);
	if (!cell.walls[3]) adj.push(index - 1);
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

export class GraphSearch implements SolverStructure {
	isComplete: boolean;
	from: number;
	to: number;
	grid: Grid;
	useBfs: boolean;

	path: number[];
	checkList: number[];
	cellMap: number[] = [];
	constructor(grid: Grid, from: number, to: number) {
		this.grid = grid;
		this.from = from;
		this.to = to;

		this.cellMap[from] = NaN;
		this.checkList = [from];

		this.useBfs = settings.get("graphTraversalSolve") === "bfs";
		console.log(this.useBfs);
	}

	step(): void {
		if (this.isComplete) return;
		if (!this.checkList.length) {
			this.isComplete = true;
			return;
		}

		const cell = this.useBfs ? this.checkList.shift()! : this.checkList.pop()!;
		if (cell === this.to) {
			this.isComplete = true;

			this.path = [];
			let head = this.to;
			while (!isNaN(head)) {
				this.path.push(head);
				head = this.cellMap[head];
			}
			this.path.push(this.from);

			return;
		}

		const neighbors = getAdjacentCells(this.grid, cell);
		for (const neighbor of neighbors) {
			if (this.cellMap[neighbor] !== undefined) continue;

			this.cellMap[neighbor] = cell;
			this.checkList.push(neighbor);
		}
	}

	draw(ctx: CanvasRenderingContext2D): void {
		if (this.isComplete) {
			this.grid.paintPath(ctx, this.path, "#0f0");
			return;
		}

		ctx.save();
		ctx.translate(
			this.grid.offsetX + this.grid.cellSize / 2,
			this.grid.offsetY + this.grid.cellSize / 2
		);
		ctx.beginPath();
		for (let i = 0; i < this.cellMap.length; i++) {
			if (isNaN(this.cellMap[i])) continue;

			const from = this.grid.cells[i];
			const to = this.grid.cells[this.cellMap[i]];

			ctx.moveTo(from.screenX, from.screenY);
			ctx.lineTo(to.screenX, to.screenY);
		}

		ctx.strokeStyle = "#f90";
		ctx.lineWidth = 4;
		ctx.lineCap = "round";
		ctx.stroke();
		ctx.restore();
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
		if (path.at(-2) === adj) continue;
		path.push(adj);
		const res = search(grid, to, path);
		if (res) return true;
		path.pop();
	}

	return false;
}

export const solverKeyMap = new Map<string, SolverConstructor>([
	["graphSearch", GraphSearch],
]);
