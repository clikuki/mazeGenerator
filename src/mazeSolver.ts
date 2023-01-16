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
			this.filledNodes.forEach((node) => this.graph.delete(node.cell));
			return;
		}
	}
	clear() {
		if (this.isComplete) {
			for (const node of this.filledNodes) {
				node.cell.open = true;
			}
		}
	}
	fill() {
		if (this.isComplete) {
			for (const node of this.filledNodes) {
				node.cell.open = false;
			}
		}
	}
	draw(ctx: CanvasRenderingContext2D) {
		if (this.isComplete) return;
		const path = new Path2D();
		for (const { cell } of this.filledNodes) {
			path.moveTo(cell.screenX, cell.screenY);
			path.lineTo(cell.screenX + cell.w, cell.screenY);
			path.lineTo(cell.screenX + cell.w, cell.screenY + cell.w);
			path.lineTo(cell.screenX, cell.screenY + cell.w);
			path.lineTo(cell.screenX, cell.screenY);
		}
		ctx.fillStyle = '#fff2';
		ctx.fill(path);
	}
}
