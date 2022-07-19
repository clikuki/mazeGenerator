let colCnt = 10;
let rowCnt = 10;
let cellWidth, cellHeight, grid, mazeGen; // Maze creation
let mazeSolver,
	startCellIndex = null; // Maze solving
let noFire; // For testing
let skip = false;
function setup() {
	createCanvas(600, 600);
	cellWidth = width / colCnt;
	cellHeight = height / rowCnt;
	grid = new Grid(colCnt, rowCnt, cellWidth, cellHeight);
	mazeGen = new MazeGenerator(grid);

	const restartBtn = document.querySelector('.restart');
	restartBtn.addEventListener('click', () => {
		grid = new Grid(colCnt, rowCnt, cellWidth, cellHeight);
		mazeGen = new MazeGenerator(grid);
	});

	const skipBtn = document.querySelector('.fastForward');
	skipBtn.addEventListener('click', () => {
		if (!mazeGen.isComplete) skip = true;
	});

	const columnDisplay = document.querySelector(
		'.sizeControls.column .display',
	);
	const decreaseColumns = document.querySelector(
		'.sizeControls.column .decrease',
	);
	const increaseColumns = document.querySelector(
		'.sizeControls.column .increase',
	);
	const rowDisplay = document.querySelector('.sizeControls.row .display');
	const decreaseRows = document.querySelector('.sizeControls.row .decrease');
	const increaseRows = document.querySelector('.sizeControls.row .increase');
	decreaseColumns.addEventListener('click', getSizeUpdater(-1, true));
	increaseColumns.addEventListener('click', getSizeUpdater(1, true));
	decreaseRows.addEventListener('click', getSizeUpdater(-1));
	increaseRows.addEventListener('click', getSizeUpdater(1));
	function getSizeUpdater(change, cols = false) {
		return () => {
			const newSize = (cols ? colCnt : rowCnt) + change;
			if (newSize < 3) return;
			if (cols) {
				colCnt = newSize;
				columnDisplay.textContent = newSize;
			} else {
				rowCnt = newSize;
				rowDisplay.textContent = newSize;
			}
			cellWidth = width / colCnt;
			cellHeight = height / rowCnt;
			grid = new Grid(colCnt, rowCnt, cellWidth, cellHeight);
			mazeGen = new MazeGenerator(grid);
		};
	}
}

function draw() {
	background(0);
	grid.draw();
	if (!mazeGen.isComplete) {
		mazeGen.draw();
		do {
			mazeGen.step();
		} while (skip && !mazeGen.isComplete);
		skip = false;
	} else if (mazeSolver && !mazeSolver.isComplete) {
		mazeSolver.step();
		mazeSolver.draw();
	}
}

function mouseClicked() {
	if (mazeGen.isComplete && (!mazeSolver || mazeSolver.isComplete)) {
		const cellX = floor(mouseX / cellWidth);
		const cellY = floor(mouseY / cellHeight);
		if (cellX >= colCnt || cellY >= rowCnt) return;
		const cellIndex = cellY * colCnt + cellX;

		if (startCellIndex !== null && startCellIndex !== cellIndex) {
			if (mazeSolver) mazeSolver.clear();
			mazeSolver = new MazeSolver(grid, startCellIndex, cellIndex);
			startCellIndex = null;
		} else startCellIndex = cellIndex;
	}
}
