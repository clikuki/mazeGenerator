import { Grid } from './grid.js';
import { MazeGenerator } from './mazeGenerator.js';
import { MazeSolver } from './mazeSolver.js';

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;
canvas.width = innerHeight;
canvas.height = innerHeight;
const initGridSize = {
	w: 10,
	h: 10,
};
let grid = new Grid(
	initGridSize.w,
	initGridSize.h,
	canvas.width / initGridSize.w,
	canvas.height / initGridSize.h,
);
let mazeSolver: MazeSolver | undefined;
let startCellIndex: number | null = null;
let mazeGen = new MazeGenerator(grid);

// Controls and displays
{
	document.querySelector('.restart')!.addEventListener('click', () => {
		grid = new Grid(grid.colCnt, grid.rowCnt, grid.cellWidth, grid.cellHeight);
		mazeGen = new MazeGenerator(grid);
		fastForwardBtn.disabled = false;
	});

	const fastForwardBtn = document.querySelector(
		'.fastForward',
	) as HTMLButtonElement;
	fastForwardBtn.addEventListener('click', () => {
		if (mazeGen && !mazeGen.isComplete) {
			while (!mazeGen.isComplete) {
				mazeGen.step();
			}
			fastForwardBtn.disabled = true;
		}
	});

	const columnDisplay = document.querySelector(
		'.sizeControls.column .display',
	) as HTMLParagraphElement;
	const decreaseColumns = document.querySelector(
		'.sizeControls.column .decrease',
	) as HTMLButtonElement;
	const increaseColumns = document.querySelector(
		'.sizeControls.column .increase',
	) as HTMLButtonElement;
	const rowDisplay = document.querySelector(
		'.sizeControls.row .display',
	) as HTMLParagraphElement;
	const decreaseRows = document.querySelector(
		'.sizeControls.row .decrease',
	) as HTMLButtonElement;
	const increaseRows = document.querySelector(
		'.sizeControls.row .increase',
	) as HTMLButtonElement;
	decreaseColumns.addEventListener('click', getSizeUpdater(-1, true));
	increaseColumns.addEventListener('click', getSizeUpdater(1, true));
	decreaseRows.addEventListener('click', getSizeUpdater(-1));
	increaseRows.addEventListener('click', getSizeUpdater(1));
	function getSizeUpdater(change: number, cols = false) {
		return () => {
			const newSize = (cols ? grid.colCnt : grid.rowCnt) + change;
			const newGridSize = {
				width: cols ? newSize : grid.colCnt,
				height: cols ? grid.rowCnt : newSize,
			};
			columnDisplay.textContent = String(newGridSize.width);
			rowDisplay.textContent = String(newGridSize.height);
			const newCellSize = {
				width: canvas.width / newGridSize.width,
				height: canvas.height / newGridSize.height,
			};
			if (newSize < 3) return;
			grid = new Grid(
				newGridSize.width,
				newGridSize.height,
				newCellSize.width,
				newCellSize.height,
			);
			mazeGen = new MazeGenerator(grid);
			fastForwardBtn.disabled = false;
		};
	}
}

(function loop() {
	requestAnimationFrame(loop);
	grid.draw(canvas, ctx);
	if (!mazeGen.isComplete) {
		if (!mazeGen.isComplete) {
			mazeGen.step();
		}
		mazeGen.draw(ctx);
	} else if (mazeSolver && !mazeSolver.isComplete) {
		mazeSolver.step();
		mazeSolver.draw(ctx);
	}
})();

// Activate Mouse solver on clicks
canvas.addEventListener('click', (e) => {
	if (mazeGen && mazeGen.isComplete && (!mazeSolver || mazeSolver.isComplete)) {
		const cellX = Math.floor(e.x / grid.cellWidth);
		const cellY = Math.floor(e.y / grid.cellHeight);
		if (cellX >= grid.colCnt || cellY >= grid.rowCnt) return;
		const cellIndex = cellY * grid.colCnt + cellX;

		if (startCellIndex !== null && startCellIndex !== cellIndex) {
			if (mazeSolver) mazeSolver.clear();
			mazeSolver = new MazeSolver(grid, startCellIndex, cellIndex);
			// @ts-ignore
			window.m = mazeSolver;
			startCellIndex = null;
		} else startCellIndex = cellIndex;
	}
});

// @ts-ignore
window.g = grid;
