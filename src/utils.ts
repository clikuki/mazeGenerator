import { Cell, Grid } from "./grid";

export function randIntBetween(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomItemInArray<T>(arr: T[]) {
	if (arr.length === 1) return arr[0];
	const index = Math.floor(Math.random() * arr.length);
	return arr[index];
}

export function* range(to: number, from = 0, step = 1) {
	let i = from;
	while (from < to ? i < to : i > to) {
		yield i;
		i += step;
	}
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

export type NullOr<T> = null | T;

export type Edge = [index: number, dir: number];
export interface ListNode {
	index: number;
	next: ListNode | null;
}
export function findLastNode(node: ListNode) {
	while (node.next) {
		node = node.next;
	}
	return node;
}

export const HTML = {
	getOne<T extends HTMLElement>(selectors: string, base = document.body) {
		return base.querySelector(selectors) as T | null;
	},
	getAll<T extends HTMLElement>(selectors: string, base = document.body) {
		return Array.from(base.querySelectorAll(selectors)) as T[];
	},
};
