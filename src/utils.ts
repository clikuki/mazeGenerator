import { Cell, Grid } from './grid';

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
	function convert(cell: Cell) {
		if (visited.has(cell)) return nodeMap.get(cell)!;

		const node: GraphNode = {
			cell: cell,
			neighbors: [],
			walls: cell.walls.filter((w) => w).length,
		};

		visited.add(cell);
		nodeMap.set(cell, node);

		node.neighbors = directions
			.map((dir, i): GraphNode | [] => {
				const neighbor = grid.cells[cell.index + dir];
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

export function shuffle<T>(arr: T[]) {
	let shuffledCount = 0;
	const shuffled = [...arr];
	while (shuffledCount < arr.length) {
		const index = Math.random() * (arr.length - shuffledCount++);
		shuffled.push(shuffled.splice(index, 1)[0]);
	}
	return shuffled;
}
