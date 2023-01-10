import { Grid } from './grid.js';
import { MazeGenerator } from './mazeGenerator.js';
import { MazeSolver } from './mazeSolver.js';

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;
canvas.width = innerHeight;
canvas.height = innerHeight;
let colCnt = 10;
let rowCnt = 10;
let cellWidth = canvas.width / colCnt;
let cellHeight = canvas.height / rowCnt;
let fastForward = false;
let mazeSolver: MazeSolver | undefined;
let startCellIndex: number | null = null;
let grid = new Grid(colCnt, rowCnt, cellWidth, cellHeight);
let mazeGen = new MazeGenerator(grid);

const restartBtn = document.querySelector('.restart') as HTMLButtonElement;
restartBtn.addEventListener('click', () => {
	grid = new Grid(colCnt, rowCnt, cellWidth, cellHeight);
	mazeGen = new MazeGenerator(grid);
});

const skipBtn = document.querySelector('.fastForward') as HTMLButtonElement;
skipBtn.addEventListener('click', () => {
	if (mazeGen && !mazeGen.isComplete) fastForward = true;
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

{
	decreaseColumns.addEventListener('click', getSizeUpdater(-1, true));
	increaseColumns.addEventListener('click', getSizeUpdater(1, true));
	decreaseRows.addEventListener('click', getSizeUpdater(-1));
	increaseRows.addEventListener('click', getSizeUpdater(1));
	function getSizeUpdater(change: number, cols = false) {
		return () => {
			const newSize = (cols ? colCnt : rowCnt) + change;
			if (newSize < 3) return;
			if (cols) {
				colCnt = newSize;
				columnDisplay.textContent = String(newSize);
			} else {
				rowCnt = newSize;
				rowDisplay.textContent = String(newSize);
			}
			cellWidth = canvas.width / colCnt;
			cellHeight = canvas.height / rowCnt;
			grid = new Grid(colCnt, rowCnt, cellWidth, cellHeight);
			mazeGen = new MazeGenerator(grid);
		};
	}
}

(function loop() {
	requestAnimationFrame(loop);
	grid.draw(canvas, ctx);
	if (mazeGen && !mazeGen.isComplete) {
		mazeGen.draw(ctx);
		do {
			mazeGen.step();
		} while (fastForward && !mazeGen.isComplete);
		fastForward = false;
	} else if (mazeSolver && !mazeSolver.isComplete) {
		mazeSolver.step();
		mazeSolver.draw(ctx);
	}
})();

// Activate Mouse solver on clicks
canvas.addEventListener('click', (e) => {
	if (mazeGen && mazeGen.isComplete && (!mazeSolver || mazeSolver.isComplete)) {
		const cellX = Math.floor(e.x / cellWidth);
		const cellY = Math.floor(e.y / cellHeight);
		if (cellX >= colCnt || cellY >= rowCnt) return;
		const cellIndex = cellY * colCnt + cellX;

		if (startCellIndex !== null && startCellIndex !== cellIndex) {
			if (mazeSolver) mazeSolver.clear();
			mazeSolver = new MazeSolver(grid, startCellIndex, cellIndex);
			startCellIndex = null;
		} else startCellIndex = cellIndex;
	}
});
