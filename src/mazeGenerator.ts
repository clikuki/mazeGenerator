import { Cell, Grid } from './grid.js';
import { randomItemInArray } from './utils.js';

abstract class MazeGeneratorWalkerBase {
	index: number;
	isComplete = false;
	directions: [number, number, number, number];
	grid: Grid;
	constructor(
		grid: Grid,
		startX = Math.floor(grid.colCnt / 2),
		startY = Math.floor(grid.rowCnt / 2),
	) {
		const starterIndex = startY * grid.colCnt + startX;
		const starterCell = grid[starterIndex];
		starterCell.open = true;
		this.index = starterIndex;
		this.isComplete = false;
		this.directions = [-grid.colCnt, 1, grid.colCnt, -1];
		this.grid = grid;
	}
	getRandomUnvisitedCellIndex() {
		const mazePartIndices = this.grid
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
	// Does not check whether the two cells are actually neighbors
	// Don't know if I need to fix that :|
	carveWall(prevCell: Cell, curCell: Cell, offset: number) {
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
	checkIfComplete() {
		return this.grid.every(({ open: visited }) => visited);
	}
	abstract step(): void;
	abstract draw(ctx: CanvasRenderingContext2D): void;
}
class AldousBroderWalker extends MazeGeneratorWalkerBase {
	step() {
		if (this.isComplete) return;

		const head = this.grid[this.index];
		// Get valid directions
		const directions = this.directions.filter((offset) => {
			const newIndex = this.index + offset;
			const cell = this.grid[newIndex];

			// Check if cell is within grid
			if (newIndex < 0 || newIndex >= this.grid.colCnt * this.grid.rowCnt)
				return false;

			// Prevent Walker from going over left and right edges
			if (Math.abs(offset) === 1 && cell.screenY !== head.screenY) return false;
			return true;
		});

		const direction = randomItemInArray(directions);
		// Pick new head
		const newHead = this.grid[(this.index += direction)];

		const prevCell = this.grid[this.index - direction];
		// If new cell is unvisited, then carve walls inbetween
		if (!newHead.open) {
			newHead.open = true;
			this.carveWall(prevCell, newHead, direction);
			if (this.checkIfComplete()) {
				this.isComplete = true;
			}
		}
	}
	draw(ctx: CanvasRenderingContext2D) {
		if (this.isComplete) return;
		ctx.save();
		ctx.translate(this.grid.cellWidth / 2, this.grid.cellHeight / 2);
		ctx.beginPath();
		const headCell = this.grid[this.index];
		ctx.ellipse(
			headCell.screenX,
			headCell.screenY,
			this.grid.cellWidth / 4,
			this.grid.cellHeight / 4,
			0,
			0,
			Math.PI * 2,
		);
		ctx.fillStyle = 'rgb(0, 255, 0)';
		ctx.fill();
		ctx.restore();
	}
}
class WilsonWalker extends MazeGeneratorWalkerBase {
	startIndex: number;
	walkedCells = new Set<number>();
	cellDirection = new Map<Cell, number>();
	constructor(grid: Grid) {
		super(grid);
		const walkerStartIndex = this.getRandomUnvisitedCellIndex();
		this.startIndex = walkerStartIndex;
		this.index = walkerStartIndex;
		if (this.grid.every(({ open: visited }) => !visited)) {
			const centerCellIndex =
				Math.floor(grid.rowCnt / 2) * grid.colCnt + Math.floor(grid.colCnt / 2);
			this.grid[centerCellIndex].open = true;
		}
	}
	step() {
		if (this.isComplete) return;

		const head = this.grid[this.index];
		// Get valid directions
		const directions = this.directions.filter((offset) => {
			const newIndex = this.index + offset;
			const cell = this.grid[newIndex];

			// Check if cell is within grid
			if (newIndex < 0 || newIndex >= this.grid.colCnt * this.grid.rowCnt) return;

			// Prevent Walker from going over left and right edges
			if (Math.abs(offset) === 1 && cell.screenY !== head.screenY) return;

			return true;
		});

		const direction = randomItemInArray(directions);
		// Set direction of current head
		const curHead = this.grid[this.index];
		this.cellDirection.set(curHead, direction);
		this.walkedCells.add(this.index);

		// Pick new head
		const newHead = this.grid[(this.index += direction)];
		if (newHead.open) {
			// Connect path back to body
			let prevCell: Cell | undefined;
			let prevOffset: number | undefined;
			let pathIndex = this.startIndex;
			while (true) {
				// Loop through paths using directions
				const curCell = this.grid[pathIndex];
				const pathOffset = this.cellDirection.get(curCell)!;
				if (prevCell === newHead) break;
				if (prevCell) this.carveWall(prevCell, curCell, prevOffset!);
				curCell.open = true;
				pathIndex += pathOffset;
				prevCell = curCell;
				prevOffset = pathOffset;
			}
			this.cellDirection.clear();
			this.walkedCells.clear();

			if (this.grid.every(({ open: visited }) => visited)) {
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
			const cell = this.grid[index];
			ctx.fillStyle = 'rgb(255, 0, 0)';
			ctx.fillRect(cell.screenX, cell.screenY, cell.w - 2, cell.h - 2);
		}
		// Head
		ctx.save();
		ctx.translate(this.grid.cellWidth / 2, this.grid.cellHeight / 2);
		ctx.fillStyle = 'rgb(0, 255, 0)';
		ctx.beginPath();
		const headCell = this.grid[this.index];
		ctx.ellipse(
			headCell.screenX,
			headCell.screenY,
			this.grid.cellWidth / 4,
			this.grid.cellHeight / 4,
			0,
			0,
			Math.PI * 2,
		);
		ctx.fillStyle = 'rgb(0, 255, 0)';
		ctx.fill();
		ctx.restore();
	}
}
export class MazeGenerator {
	grid: Grid;
	phase = 0;
	isComplete = false;
	walkers: MazeGeneratorWalkerBase[] = [];
	constructor(grid: Grid) {
		this.grid = grid;

		const minSize = 10;
		if (Math.max(grid.colCnt, grid.rowCnt) > minSize) {
			const oneToWalkerRatio = 100;
			const numOfWalkers = Math.max(Math.floor(grid.length / oneToWalkerRatio), 1);
			for (let i = 0; i < numOfWalkers; i++) {
				this.walkers[i] = new AldousBroderWalker(grid);
			}
		} else this.walkers[0] = new AldousBroderWalker(grid);
	}
	step() {
		if (this.isComplete) return;
		for (const walker of this.walkers) {
			walker.step();
			if (walker.isComplete) {
				this.isComplete = true;
				return;
			}
		}
		if (this.phase !== 0) return;
		const numOfVisitedCells = this.grid.filter(
			({ open: visited }) => visited,
		).length;
		if (numOfVisitedCells >= (this.grid.rowCnt * this.grid.colCnt) / 3) {
			this.phase = 1;
			this.walkers.length = 0;
			this.walkers[0] = new WilsonWalker(this.grid);
		}
	}
	draw(ctx: CanvasRenderingContext2D) {
		if (this.isComplete) return;
		this.walkers.forEach((walker) => walker.draw(ctx));
	}
}
