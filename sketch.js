const cellSize = 20;
let colCnt, rowCnt, grid, mazeGen; // Maze creation
let mazeSolver, startCellIndex = null; // Maze solving
let noFire; // For testing
function setup()
{
	createCanvas(1200, 600);
	colCnt = floor(width / cellSize);
	rowCnt = floor(height / cellSize);
	grid = new Grid(colCnt, rowCnt, cellSize);
	mazeGen = new MazeGenerator(grid);
}

function draw()
{
	background(0);
	grid.draw();
	if (!mazeGen.isComplete)
	{
		mazeGen.draw();
		mazeGen.step();
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
