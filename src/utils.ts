import { Cell, Grid } from "./grid";

export function randIntBetween(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomItemInArray<T>(arr: T[]) {
	if (arr.length === 1) return arr[0];
	const index = Math.floor(Math.random() * arr.length);
	return arr[index];
}

export interface GraphNode {
	cell: Cell;
	neighbors: GraphNode[];
	walls: number;
}
export function convertGridToGraph(grid: Grid, start = grid.cells[0]) {
	const directions = [-grid.colCnt, 1, grid.colCnt, -1];
	const visited = new Set<Cell>();
	const nodeMap = new Map<Cell, GraphNode>();

	const stack: [Cell | null, Cell][] = [[null, start]];
	function convert([parent, cell]: (typeof stack)[number]) {
		const node: GraphNode = {
			cell: cell,
			neighbors: [],
			walls: cell.walls.filter((w) => w).length,
		};
		if (parent) {
			nodeMap.get(parent)!.neighbors.push(node);
		}

		visited.add(cell);
		nodeMap.set(cell, node);

		for (let i = 0; i < directions.length; i++) {
			const dir = directions[i];
			const neighbor = grid.cells[cell.index + dir];
			if (neighbor !== undefined && !cell.walls[i]) {
				if (visited.has(neighbor)) node.neighbors.push(nodeMap.get(neighbor)!);
				else stack.push([cell, neighbor]);
			}
		}
	}

	while (stack.length) {
		convert(stack.pop()!);
	}
	return nodeMap;
}

export function shuffle<T>(arr: T[]) {
	let shuffledCount = 0;
	const shuffled = [...arr];
	while (shuffledCount < arr.length) {
		const index = Math.random() * (arr.length - shuffledCount++);
		shuffled.push(shuffled.splice(index, 1)[0]);
	}
	return shuffled;
}

// https://stackoverflow.com/a/74649125/15169879
type Comparator<T> = (valueA: T, valueB: T) => number;
export function swap<T>(arr: T[], i: number, j: number) {
	[arr[i], arr[j]] = [arr[j], arr[i]];
	return arr;
}
export class PriorityQueue<T> {
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

export type RGB = [number, number, number];
export type Edge = [index: number, dir: number];
export interface TreeNode {
	index: number;
	parent: TreeNode | null;
	// Children is only needed for finding the branch size
	children: TreeNode[];
}

export const HTML = {
	getOne<T extends HTMLElement>(selectors: string, base = document.body) {
		return base.querySelector(selectors) as T | null;
	},
	getAll<T extends HTMLElement>(selectors: string, base = document.body) {
		return Array.from(base.querySelectorAll(selectors)) as T[];
	},
};
