const cellSize = 50;
let colCnt, rowCnt, grid, mazeGen;
let noFire; // For testing
function setup()
{
	createCanvas(600, 600);
	colCnt = floor(width / cellSize);
	rowCnt = floor(height / cellSize);
	grid = new Grid(colCnt, rowCnt, cellSize);
	mazeGen = new MazeGenerator(grid);
}

function draw()
{
	background(0);
	grid.draw();
	mazeGen.draw();
	mazeGen.walk();
	// if (keyIsDown(32))
	// {
	// 	if (!noFire) walker.walk();
	// 	noFire = true;
	// }
	// else noFire = false;
}
