import { Cell, Grid } from './grid.js';

interface Node {
	cell: Cell;
	neighbors: Node[];
	walls: number;
}
function convertGridToGraph(grid: Grid, start = grid[0]) {
	const directions = [-grid.colCnt, 1, grid.colCnt, -1];
	const visited = new Set<Cell>();
	const nodeMap = new Map<Cell, Node>();
	function convert(cell: Cell) {
		if (visited.has(cell)) return nodeMap.get(cell)!;

		const node: Node = {
			cell: cell,
			neighbors: [],
			walls: cell.walls.filter((w) => w).length,
		};

		visited.add(cell);
		nodeMap.set(cell, node);

		node.neighbors = directions
			.map((dir, i): Node | [] => {
				const neighbor = grid[cell.gridIndex + dir];
				if (neighbor === undefined || cell.walls[i]) {
					return [];
				}
				return convert(neighbor);
			})
			.flat();

		return node;
	}
	convert(start);
	return nodeMap;
}

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
		ctx.fillStyle = '#f00';
		ctx.fillRect(
			fromCell.screenX + 1,
			fromCell.screenY + 1,
			this.grid.cellWidth - 2,
			this.grid.cellHeight - 2,
		);
		ctx.fillStyle = '#00f';
		ctx.fillRect(
			toCell.screenX + 1,
			toCell.screenY + 1,
			this.grid.cellWidth - 2,
			this.grid.cellHeight - 2,
		);
		if (this.isComplete && this.path) {
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
			circlePath.ellipse(
				fromCell.screenX,
				fromCell.screenY,
				circleRX,
				circleRY,
				0,
				0,
				Math.PI * 2,
			);
			circlePath.ellipse(
				toCell.screenX,
				toCell.screenY,
				circleRX,
				circleRY,
				0,
				0,
				Math.PI * 2,
			);

			ctx.save();
			ctx.translate(this.grid.cellWidth / 2, this.grid.cellHeight / 2);
			ctx.strokeStyle = '#0f0';
			ctx.stroke(linePath);
			ctx.fillStyle = ctx.strokeStyle;
			ctx.fill(circlePath);
			ctx.restore();
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
