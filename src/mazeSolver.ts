import { Cell, Grid } from './grid.js';
import { GraphNode, convertGridToGraph } from './utils.js';

function tracePath(comeFrom: number[], dest: number) {
	const path: number[] = [];
	let index = dest;
	while (comeFrom[index] !== undefined) {
		path.push(index);
		index = comeFrom[index];
	}
	path.push(index);
	return path.reverse();
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

// https://stackoverflow.com/a/74649125/15169879
type Comparator<T> = (valueA: T, valueB: T) => number;
const swap = (arr: unknown[], i: number, j: number) => {
	[arr[i], arr[j]] = [arr[j], arr[i]];
};
class PriorityQueue<T> {
	heap;
	isGreater;
	constructor(comparator: Comparator<T>, init: T[] = []) {
		this.heap = init;
		this.isGreater = (a: number, b: number) =>
			comparator(init[a] as T, init[b] as T) > 0;
	}
	get size(): number {
		return this.heap.length;
	}
	peek(): T | undefined {
		return this.heap[0];
	}
	add(value: T): void {
		this.heap.push(value);
		this.#siftUp();
	}
	poll(heap = this.heap, value = heap[0], length = heap.length): T | undefined {
		if (length) swap(heap, 0, length - 1);

		heap.pop();
		this.#siftDown();

		return value;
	}
	#siftUp(node = this.size - 1, parent = ((node + 1) >>> 1) - 1): void {
		for (
			;
			node && this.isGreater(node, parent);
			node = parent, parent = ((node + 1) >>> 1) - 1
		) {
			swap(this.heap, node, parent);
		}
	}
	#siftDown(size = this.size, node = 0, isGreater = this.isGreater): void {
		while (true) {
			const leftNode = (node << 1) + 1;
			const rightNode = leftNode + 1;

			if (
				(leftNode >= size || isGreater(node, leftNode)) &&
				(rightNode >= size || isGreater(node, rightNode))
			) {
				break;
			}

			const maxChild =
				rightNode < size && isGreater(rightNode, leftNode) ? rightNode : leftNode;

			swap(this.heap, node, maxChild);

			node = maxChild;
		}
	}
}

export const pathDrawMethodList = ['GRADIENT', 'LINE'] as const;
export type pathDrawMethods = (typeof pathDrawMethodList)[number];
export class MazeSolver {
	grid: Grid;
	from: number;
	to: number;
	isComplete = false;
	deadEndsAreFilled = false;
	pathDrawMethod: pathDrawMethods = pathDrawMethodList[0];
	path?: number[];

	// Dead-end filling
	graph: Map<Cell, GraphNode>;
	current: GraphNode;
	deadEnds: GraphNode[] = [];
	filledNodes = new Set<GraphNode>();
	grayOutFilledNodes = false;

	// A*
	open = new PriorityQueue<number>(
		(a, b) => this.calculateHueristics(b) - this.calculateHueristics(a),
	);
	closed = new Set<number>(); // Used only for drawing purposes, could be removed!
	gScore: number[] = [];
	fScore: number[] = [];
	hMem: number[] = [];
	hMult = 1; // TODO: Setting to 0 should make it act like djikstra (dist * 0 = 0), but instead its acting weird. Might have to do with the queue?
	comeFrom: number[] = [];
	constructor(grid: Grid, from: number, to: number) {
		this.grid = grid;
		this.from = from;
		this.to = to;

		// Precompute some data
		this.graph = convertGridToGraph(grid, grid.cells[from]);
		this.current = this.graph.get(grid.cells[from])!;
		for (let i = 0; i < grid.cells.length; i++) {
			const cell = grid.cells[i];
			const cellWallCount = cell.walls.filter((w) => w).length;
			if (cell.open && ![from, to].includes(cell.index) && cellWallCount >= 3) {
				this.deadEnds.push(this.graph.get(cell)!);
			}

			this.gScore[i] = Infinity;
			this.fScore[i] = Infinity;
		}

		this.open.add(from);
		this.gScore[from] = 0;
		this.fScore[from] = this.calculateHueristics(from);
	}
	calculateHueristics(from: number) {
		if (this.hMem[from] === undefined) {
			const x1 = from % this.grid.colCnt;
			const y1 = Math.floor(from / this.grid.colCnt);
			const x2 = this.to % this.grid.colCnt;
			const y2 = Math.floor(this.to / this.grid.colCnt);
			// // Manhattan distance
			// this.hMem[from] = (Math.abs(x2 - x1) + Math.abs(y2 - y1)) * this.hMult;
			// Euclidean distance
			this.hMem[from] = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * this.hMult;
		}
		return this.hMem[from];
	}
	step() {
		if (this.isComplete) return;

		if (this.deadEndsAreFilled) {
			// A* to narrow paths
			// TODO: optimize for larger grids, and just in general
			if (this.open.size === 0) {
				this.isComplete = true;
				throw 'A* cannot reach destination';
			}

			const index = this.open.poll()!;
			if (index === this.to) {
				// Destination reached!
				this.isComplete = true;
				this.path = tracePath(this.comeFrom, this.to);
				return;
			}

			this.closed.add(index);
			const g = this.gScore[index];

			const directions = [-this.grid.colCnt, 1, this.grid.colCnt, -1];
			for (let i = 0; i < directions.length; i++) {
				const dir = directions[i];
				const neighborIndex = index + dir;

				const neighbor = this.grid.cells[neighborIndex];
				if (!neighbor) continue;

				// Prevent Walker from going over left and right edges
				if (
					Math.abs(dir) === 1 &&
					neighbor.screenY !== this.grid.cells[index].screenY
				)
					continue;
				if (this.grid.cells[index].walls[i]) continue;
				if (this.filledNodes.has(this.graph.get(neighbor)!)) continue;

				const newG = g + 1; // changing g score doesn't seem to change anything?
				if (newG < this.gScore[neighborIndex]) {
					this.open.add(neighborIndex);
					this.comeFrom[neighborIndex] = index;
					this.gScore[neighborIndex] = newG;
					this.fScore[neighborIndex] =
						newG + this.calculateHueristics(neighborIndex);
				}
			}
		} else {
			// Dead-end filling
			const newDeadEnds: GraphNode[] = [];
			for (let i = 0; i < this.deadEnds.length; i++) {
				const node = this.deadEnds[i];
				this.filledNodes.add(node);

				for (const neighbor of node.neighbors) {
					if (
						neighbor.walls++ < 2 ||
						this.filledNodes.has(neighbor) ||
						[this.from, this.to].includes(neighbor.cell.index)
					) {
						continue;
					}
					newDeadEnds.push(neighbor);
					break;
				}
			}
			this.deadEnds = newDeadEnds;

			if (this.deadEnds.length === 0) this.deadEndsAreFilled = true;
		}
	}
	draw(ctx: CanvasRenderingContext2D) {
		const cellSize = this.grid.cellSize;
		const fromCell = this.grid.cells[this.from];
		const toCell = this.grid.cells[this.to];
		if (!this.isComplete || this.pathDrawMethod === 'LINE') {
			ctx.fillStyle = arrayToClrStr(startColor);
			ctx.fillRect(fromCell.screenX, fromCell.screenY, cellSize, cellSize);
			ctx.fillStyle = arrayToClrStr(endColor);
			ctx.fillRect(toCell.screenX, toCell.screenY, cellSize, cellSize);
		}
		if (!this.isComplete && this.deadEndsAreFilled) {
			for (let i = 0; i < this.grid.cells.length; i++) {
				if (this.filledNodes.has(this.graph.get(this.grid.cells[i])!)) continue;

				// F number
				const { screenX, screenY } = this.grid.cells[i];
				const x = screenX + cellSize / 2;
				const y = screenY + cellSize / 2;
				ctx.fillStyle = '#fff';
				ctx.font = `${cellSize / 3}px monospace`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				if (this.fScore[i] === Infinity) ctx.fillText('∞', x, y);
				else ctx.fillText(String(+this.fScore[i].toPrecision(2)), x, y);

				// Cell clr
				let color;
				if (this.open.heap.includes(i)) color = '#0e0a';
				else if (this.closed.has(i)) color = '#e00a';
				if (color) {
					ctx.fillStyle = color;
					ctx.fillRect(screenX, screenY, cellSize, cellSize);
				}
			}
		}
		if (this.isComplete && this.path) {
			switch (this.pathDrawMethod) {
				case 'GRADIENT':
					for (let i = 0; i < this.path.length; i++) {
						const { screenX, screenY } = this.grid.cells[this.path[i]];
						const progress = i / (this.path.length - 1);
						const color = lerpClr(startColor, endColor, progress);
						ctx.fillStyle = arrayToClrStr(color);
						ctx.fillRect(
							Math.floor(screenX),
							Math.floor(screenY),
							Math.ceil(cellSize),
							Math.ceil(cellSize),
						);
					}
					break;
				case 'LINE':
					{
						const linePath = new Path2D();
						let isStartCell = true;
						for (const index of this.path) {
							const { screenX, screenY } = this.grid.cells[index];
							if (isStartCell) linePath.moveTo(screenX, screenY);
							else linePath.lineTo(screenX, screenY);
							isStartCell = false;
						}

						const circlePath = new Path2D();
						const circleRX = cellSize * 0.05;
						const circleRY = cellSize * 0.05;
						for (const { screenX, screenY } of [fromCell, toCell]) {
							circlePath.ellipse(
								screenX,
								screenY,
								circleRX,
								circleRY,
								0,
								0,
								Math.PI * 2,
							);
						}

						ctx.save();
						ctx.translate(this.grid.cellSize / 2, cellSize / 2);
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
			for (const {
				cell: { screenX, screenY },
			} of this.filledNodes) {
				grayPath.moveTo(screenX, screenY);
				grayPath.lineTo(screenX + cellSize, screenY);
				grayPath.lineTo(screenX + cellSize, screenY + cellSize);
				grayPath.lineTo(screenX, screenY + cellSize);
				grayPath.lineTo(screenX, screenY);
			}
			ctx.fillStyle = '#fff2';
			ctx.fill(grayPath);
		}
	}
}
