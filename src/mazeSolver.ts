import { Cell, Grid } from './grid.js';
import { Node, convertGridToGraph } from './utils.js';

// Only works for perfect mazes, which are the only mazes I make
function nodeToPath(start: Node, filled: Set<Node>) {
	const visited = new Set<Node>();
	const path = [];
	let current: Node | null = start;
	mainLoop: while (current !== null) {
		visited.add(current);
		path.push(current.cell);
		for (const neighbor of current.neighbors) {
			if (filled.has(neighbor) || visited.has(neighbor)) continue;
			current = neighbor;
			continue mainLoop;
		}
		current = null;
	}
	return path;
}

type Color = [number, number, number];
const startColor = [0, 0, 255] as Color;
const endColor = [255, 0, 0] as Color;
function lerp(a: number, b: number, p: number) {
	return (b - a) * p + a;
}
function lerpClr([a1, a2, a3]: Color, [b1, b2, b3]: Color, p: number): Color {
	return [lerp(a1, b1, p), lerp(a2, b2, p), lerp(a3, b3, p)];
}
function arrayToClrStr([r, g, b]: Color) {
	return `rgb(${r}, ${g}, ${b})`;
}

export const pathDrawMethodList = ['GRADIENT', 'LINE'] as const;
export type pathDrawMethods = typeof pathDrawMethodList[number];
export class MazeSolver {
	grid: Grid;
	from: number;
	to: number;
	isComplete = false;
	directions: [number, number, number, number];
	corridorsToFill: (Node | null)[] = [];
	filledNodes = new Set<Node>();
	graph: Map<Cell, Node>;
	current: Node;
	grayOutFilledNodes = false;
	pathDrawMethod: pathDrawMethods = pathDrawMethodList[0];
	path?: Cell[];
	constructor(grid: Grid, from: number, to: number) {
		this.grid = grid;
		this.from = from;
		this.to = to;
		this.directions = [-grid.colCnt, 1, grid.colCnt, -1];

		// Precompute some data
		this.graph = convertGridToGraph(grid, grid[from]);
		this.current = this.graph.get(grid[from])!;
		for (let i = 0; i < grid.length; i++) {
			const cell = grid[i];
			const cellWallCount = cell.walls.filter((w) => w).length;
			if (
				cell.open &&
				cell.gridIndex !== this.from &&
				cell.gridIndex !== this.to &&
				cellWallCount >= 3
			) {
				this.corridorsToFill.push(this.graph.get(cell)!);
			}
		}
	}
	step() {
		if (this.isComplete) return;

		// Dead-end filling
		let hasReplacedCell = false;
		for (let i = 0; i < this.corridorsToFill.length; i++) {
			const node = this.corridorsToFill[i];
			if (!node) continue;
			this.filledNodes.add(node);

			this.corridorsToFill[i] = null;
			for (const neighbor of node.neighbors) {
				if (
					neighbor.walls++ < 2 ||
					this.filledNodes.has(neighbor) ||
					neighbor.cell === this.grid[this.from] ||
					neighbor.cell === this.grid[this.to]
				) {
					continue;
				}
				this.corridorsToFill[i] = neighbor;
				hasReplacedCell = true;
				break;
			}
		}

		if (!hasReplacedCell) {
			this.isComplete = true;
			this.path = nodeToPath(
				this.graph.get(this.grid[this.from])!,
				this.filledNodes,
			);
			return;
		}
	}
	draw(ctx: CanvasRenderingContext2D) {
		const fromCell = this.grid[this.from];
		const toCell = this.grid[this.to];
		if (!this.isComplete || this.pathDrawMethod === 'LINE') {
			ctx.fillStyle = arrayToClrStr(startColor);
			ctx.fillRect(
				fromCell.screenX,
				fromCell.screenY,
				this.grid.cellWidth,
				this.grid.cellHeight,
			);
			ctx.fillStyle = arrayToClrStr(endColor);
			ctx.fillRect(
				toCell.screenX,
				toCell.screenY,
				this.grid.cellWidth,
				this.grid.cellHeight,
			);
		}
		if (this.isComplete && this.path) {
			switch (this.pathDrawMethod) {
				case 'GRADIENT':
					for (let i = 0; i < this.path.length; i++) {
						const cell = this.path[i];
						const progress = i / (this.path.length - 1);
						const color = lerpClr(startColor, endColor, progress);
						ctx.fillStyle = arrayToClrStr(color);
						ctx.fillRect(
							cell.screenX,
							cell.screenY,
							this.grid.cellWidth,
							this.grid.cellHeight,
						);
					}
					break;
				case 'LINE':
					{
						const linePath = new Path2D();
						let isStartCell = true;
						for (const cell of this.path) {
							if (isStartCell) linePath.moveTo(cell.screenX, cell.screenY);
							else linePath.lineTo(cell.screenX, cell.screenY);
							isStartCell = false;
						}

						const circlePath = new Path2D();
						const circleRX = this.grid.cellWidth * 0.05;
						const circleRY = this.grid.cellHeight * 0.05;
						for (const cell of [fromCell, toCell]) {
							circlePath.ellipse(
								cell.screenX,
								cell.screenY,
								circleRX,
								circleRY,
								0,
								0,
								Math.PI * 2,
							);
						}

						ctx.save();
						ctx.translate(this.grid.cellWidth / 2, this.grid.cellHeight / 2);
						ctx.strokeStyle = '#0f0';
						ctx.stroke(linePath);
						ctx.fillStyle = ctx.strokeStyle;
						ctx.fill(circlePath);
						ctx.restore();
					}
					break;
				default:
					throw 'Invalid path draw method';
			}
		} else {
			const grayPath = new Path2D();
			for (const { cell } of this.filledNodes) {
				grayPath.moveTo(cell.screenX, cell.screenY);
				grayPath.lineTo(cell.screenX + cell.w, cell.screenY);
				grayPath.lineTo(cell.screenX + cell.w, cell.screenY + cell.w);
				grayPath.lineTo(cell.screenX, cell.screenY + cell.w);
				grayPath.lineTo(cell.screenX, cell.screenY);
			}
			ctx.fillStyle = '#fff2';
			ctx.fill(grayPath);
		}
	}
}
