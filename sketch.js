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

	createP(
		'A maze generator that uses two algorthms, the Aldous-Broder algorithm for the start and Wilsons algorithm to finish it off.',
	);
	createP(
		"I'm not too sure about the uniformness of the maze when using this method, but it looks nice enough and is pretty fast.",
	);
	createP(
		'Once the maze has finished generating, click on any two cells to find a path between them.',
	);

	const restartBtn = document.createElement('button');
	restartBtn.textContent = 'Restart';
	restartBtn.addEventListener('click', () => {
		grid = new Grid(colCnt, rowCnt, cellWidth, cellHeight);
		mazeGen = new MazeGenerator(grid);
	});

	const skipBtn = document.createElement('button');
	skipBtn.textContent = 'Skip to finished maze';
	skipBtn.addEventListener('click', () => (skip = true));
	const div = document.createElement('div');
	div.append(restartBtn, skipBtn);
	document.body.append(div);
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
		const cellIndex = cellY * colCnt + cellX;

		if (startCellIndex !== null && startCellIndex !== cellIndex) {
			if (mazeSolver) mazeSolver.clear();
			mazeSolver = new MazeSolver(grid, startCellIndex, cellIndex);
			startCellIndex = null;
		} else startCellIndex = cellIndex;
	}
}
