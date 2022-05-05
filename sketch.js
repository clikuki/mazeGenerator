const cellSize = 15;
let colCnt, rowCnt, grid, mazeGen; // Maze creation
let mazeSolver, startCellIndex = null; // Maze solving
let noFire; // For testing
let skip = false;
function setup()
{
	createCanvas(600, 600);
	colCnt = floor(width / cellSize);
	rowCnt = floor(height / cellSize);
	grid = new Grid(colCnt, rowCnt, cellSize);
	mazeGen = new MazeGenerator(grid);

	createSpan('Once the maze has finished generating, click on any two cells to find a path between them. ');
	const restartBtn = createButton('Restart');
	restartBtn.mouseClicked(() =>
	{
		grid = new Grid(colCnt, rowCnt, cellSize);
		mazeGen = new MazeGenerator(grid);
	})

	const skipBtn = createButton('Skip to finished maze');
	skipBtn.mouseClicked(() => skip = true)
}

function draw()
{
	background(0);
	grid.draw();
	if (!mazeGen.isComplete)
	{
		mazeGen.draw();
		do
		{
			mazeGen.step();
		} while (skip && !mazeGen.isComplete);
		skip = false;
	}
	else if (mazeSolver && !mazeSolver.isComplete)
	{
		mazeSolver.step();
		mazeSolver.draw();
	}
}

function mouseClicked()
{
	if (mazeGen.isComplete && (!mazeSolver || mazeSolver.isComplete))
	{
		const cellX = floor(mouseX / cellSize);
		const cellY = floor(mouseY / cellSize);
		const cellIndex = cellY * colCnt + cellX;

		if (startCellIndex !== null && startCellIndex !== cellIndex)
		{
			if (mazeSolver) mazeSolver.clear();
			mazeSolver = new MazeSolver(grid, startCellIndex, cellIndex);
			startCellIndex = null;
		}
		else startCellIndex = cellIndex;
	}
}
