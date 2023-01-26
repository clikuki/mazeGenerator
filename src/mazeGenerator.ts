import { Cell, Grid } from './grid.js';
import { randomItemInArray, shuffle } from './utils.js';

export abstract class MazeGenerator {
	grid: Grid;
	isComplete = false;
	constructor(grid: Grid) {
		this.grid = grid;
	}
	abstract step(): void;
	abstract draw(ctx: CanvasRenderingContext2D): void;
}

// Does not check whether the two cells are actually neighbors
// Don't know if I need to fix that :|
function carveWall(prevCell: Cell, curCell: Cell, offset: number) {
	if (Math.abs(offset) === 1) {
		// Left and Right
		prevCell.walls[offset < 1 ? 3 : 1] = false;
		curCell.walls[offset < 1 ? 1 : 3] = false;
	} else {
		// Up and Down
		prevCell.walls[offset < 1 ? 0 : 2] = false;
		curCell.walls[offset < 1 ? 2 : 0] = false;
	}
}

abstract class WalkerBase extends MazeGenerator {
	index: number;
	isComplete = false;
	directions: [number, number, number, number];
	grid: Grid;
	constructor(
		grid: Grid,
		startX = Math.floor(grid.colCnt / 2),
		startY = Math.floor(grid.rowCnt / 2),
	) {
		super(grid);
		const starterIndex = startY * grid.colCnt + startX;
		const starterCell = grid.cells[starterIndex];
		starterCell.open = true;
		this.index = starterIndex;
		this.isComplete = false;
		this.directions = [-grid.colCnt, 1, grid.colCnt, -1];
		this.grid = grid;
	}
	getRandomUnvisitedCellIndex() {
		const mazePartIndices = this.grid.cells
			.map((cell, i) => ({ ...cell, i }))
			.filter(({ open: visited }) => visited)
			.map(({ i }) => i);

		while (true) {
			const randCellIndex = Math.floor(
				Math.random() * this.grid.colCnt * this.grid.rowCnt,
			);
			if (!mazePartIndices.includes(randCellIndex)) {
				return randCellIndex;
			}
		}
	}
	checkIfComplete() {
		return this.grid.cells.every(({ open: visited }) => visited);
	}
}

export class AldousBroder extends WalkerBase {
	static key = 'Aldous-Broder';
	step() {
		if (this.isComplete) return;

		const head = this.grid.cells[this.index];
		// Get valid directions
		const directions = this.directions.filter((direction) => {
			const newIndex = this.index + direction;
			const cell = this.grid.cells[newIndex];

			// Check if cell is within grid
			if (newIndex < 0 || newIndex >= this.grid.colCnt * this.grid.rowCnt)
				return false;

			// Prevent Walker from going over left and right edges
			if (Math.abs(direction) === 1 && cell.screenY !== head.screenY) return false;
			return true;
		});

		const direction = randomItemInArray(directions);
		// Pick new head
		const newHead = this.grid.cells[(this.index += direction)];

		const prevCell = this.grid.cells[this.index - direction];
		// If new cell is unvisited, then carve walls inbetween
		if (!newHead.open) {
			newHead.open = true;
			carveWall(prevCell, newHead, direction);
			if (this.checkIfComplete()) {
				this.isComplete = true;
			}
		}
	}
	draw(ctx: CanvasRenderingContext2D) {
		if (this.isComplete) return;
		ctx.save();
		ctx.translate(this.grid.cellSize / 2, this.grid.cellSize / 2);
		ctx.beginPath();
		const headCell = this.grid.cells[this.index];
		ctx.ellipse(
			headCell.screenX,
			headCell.screenY,
			this.grid.cellSize / 4,
			this.grid.cellSize / 4,
			0,
			0,
			Math.PI * 2,
		);
		ctx.fillStyle = 'rgb(0, 255, 0)';
		ctx.fill();
		ctx.restore();
	}
}

export class Wilsons extends WalkerBase {
	static key = "Wilson's";
	startIndex: number;
	walkedCells = new Set<number>();
	cellDirection = new Map<Cell, number>();
	constructor(grid: Grid) {
		super(grid);
		const walkerStartIndex = this.getRandomUnvisitedCellIndex();
		this.startIndex = walkerStartIndex;
		this.index = walkerStartIndex;
		if (this.grid.cells.every(({ open: visited }) => !visited)) {
			const centerCellIndex =
				Math.floor(grid.rowCnt / 2) * grid.colCnt + Math.floor(grid.colCnt / 2);
			this.grid.cells[centerCellIndex].open = true;
		}
	}
	step() {
		if (this.isComplete) return;

		const head = this.grid.cells[this.index];
		// Get valid directions
		const directions = this.directions.filter((direction) => {
			const newIndex = this.index + direction;
			const cell = this.grid.cells[newIndex];

			// Check if cell is within grid
			if (newIndex < 0 || newIndex >= this.grid.colCnt * this.grid.rowCnt) return;

			// Prevent Walker from going over left and right edges
			if (Math.abs(direction) === 1 && cell.screenY !== head.screenY) return;

			return true;
		});

		const direction = randomItemInArray(directions);
		// Set direction of current head
		const curHead = this.grid.cells[this.index];
		this.cellDirection.set(curHead, direction);
		this.walkedCells.add(this.index);

		// Pick new head
		const newHead = this.grid.cells[(this.index += direction)];
		if (newHead.open) {
			// Connect path back to body
			let prevCell: Cell | undefined;
			let prevOffset: number | undefined;
			let pathIndex = this.startIndex;
			while (true) {
				// Loop through paths using directions
				const curCell = this.grid.cells[pathIndex];
				const pathOffset = this.cellDirection.get(curCell)!;
				if (prevCell === newHead) break;
				if (prevCell) carveWall(prevCell, curCell, prevOffset!);
				curCell.open = true;
				pathIndex += pathOffset;
				prevCell = curCell;
				prevOffset = pathOffset;
			}
			this.cellDirection.clear();
			this.walkedCells.clear();

			if (this.grid.cells.every(({ open: visited }) => visited)) {
				this.isComplete = true;
			} else {
				// Find new starting point for path
				const randCellIndex = this.getRandomUnvisitedCellIndex();
				this.startIndex = randCellIndex;
				this.index = randCellIndex;
			}
		}
	}
	draw(ctx: CanvasRenderingContext2D) {
		if (this.isComplete) return;
		// Path
		for (const index of this.walkedCells) {
			const cell = this.grid.cells[index];
			ctx.fillStyle = 'rgb(255, 0, 0)';
			ctx.fillRect(cell.screenX, cell.screenY, cell.size - 2, cell.size - 2);
		}
		// Head
		ctx.save();
		ctx.translate(this.grid.cellSize / 2, this.grid.cellSize / 2);
		ctx.fillStyle = 'rgb(0, 255, 0)';
		ctx.beginPath();
		const headCell = this.grid.cells[this.index];
		ctx.ellipse(
			headCell.screenX,
			headCell.screenY,
			this.grid.cellSize / 4,
			this.grid.cellSize / 4,
			0,
			0,
			Math.PI * 2,
		);
		ctx.fillStyle = 'rgb(0, 255, 0)';
		ctx.fill();
		ctx.restore();
	}
}

export class RecursiveBacktracking {
	static key = 'Recursive Backtracking';
	grid: Grid;
	directions: [number, number, number, number];
	isComplete = false;
	stack: {
		cell: Cell;
		directionsToTry?: number[];
	}[];
	constructor(grid: Grid) {
		this.grid = grid;
		this.directions = [-grid.colCnt, 1, grid.colCnt, -1];
		this.stack = [
			{
				cell: grid.cells[0],
			},
		];
		this.stack[0].cell.open = true;
	}
	step(): void {
		if (this.isComplete) return;

		const head = this.stack[this.stack.length - 1];
		if (!head) {
			this.isComplete = true;
			return;
		}

		const directions =
			head.directionsToTry ||
			shuffle(
				this.directions.filter((direction) => {
					const newIndex = head.cell.gridIndex + direction;
					const newCell = this.grid.cells[newIndex];

					if (!newCell) return;

					// Check if cell is within grid
					if (newIndex < 0 || newIndex >= this.grid.colCnt * this.grid.rowCnt)
						return;

					// Prevent Walker from going over left and right edges
					if (Math.abs(direction) === 1 && newCell.screenY !== head.cell.screenY)
						return;

					return true;
				}),
			);

		if (!directions.length) {
			this.stack.pop();
			return;
		}

		head.directionsToTry ||= directions;
		while (directions.length) {
			const direction = directions.shift()!;
			const cell = this.grid.cells[head.cell.gridIndex + direction];
			if (!cell.open) {
				head.directionsToTry = directions;
				cell.open = true;
				carveWall(head.cell, cell, direction);

				const newHead = { cell };
				this.stack.push(newHead);
				return;
			}
		}
	}
	draw(ctx: CanvasRenderingContext2D): void {
		if (this.isComplete || !this.stack.length) return;

		ctx.fillStyle = '#f004';
		for (const { cell } of this.stack) {
			ctx.fillRect(
				cell.screenX,
				cell.screenY,
				this.grid.cellSize,
				this.grid.cellSize,
			);
		}

		ctx.save();
		ctx.translate(this.grid.cellSize / 2, this.grid.cellSize / 2);
		ctx.beginPath();
		const headCell = this.stack[this.stack.length - 1].cell;
		ctx.ellipse(
			headCell.screenX,
			headCell.screenY,
			this.grid.cellSize / 4,
			this.grid.cellSize / 4,
			0,
			0,
			Math.PI * 2,
		);
		ctx.fillStyle = 'rgb(0, 255, 0)';
		ctx.fill();
		ctx.restore();
	}
}

export class AldousBroderWilsonHybrid {
	static key = "Aldous-Broder + Wilson's";
	phase = 0;
	isComplete = false;
	grid: Grid;
	walker: AldousBroder | Wilsons;
	constructor(grid: Grid) {
		this.grid = grid;
		this.walker = new AldousBroder(grid);
	}
	step() {
		if (this.isComplete) return;
		this.walker.step();
		if (this.walker.isComplete) {
			this.isComplete = true;
			return;
		}

		if (this.phase === 0) {
			const visitedCellCount = this.grid.cells.filter(
				({ open: visited }) => visited,
			).length;
			if (visitedCellCount >= (this.grid.rowCnt * this.grid.colCnt) / 3) {
				this.phase = 1;
				this.walker = new Wilsons(this.grid);
			}
		}
	}
	draw(ctx: CanvasRenderingContext2D) {
		if (this.isComplete) return;
		this.walker.draw(ctx);
	}
}

export const algorithms = [
	RecursiveBacktracking,
	AldousBroder,
	Wilsons,
	AldousBroderWilsonHybrid,
];
