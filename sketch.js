const cellSize = 30;
let colCnt, rowCnt, grid, walker;
let noFire; // For testing
function setup()
{
	createCanvas(600, 600);
	colCnt = floor(width / cellSize);
	rowCnt = floor(height / cellSize);
	grid = new Grid(colCnt, rowCnt, cellSize, 0, 0, colCnt - 1, rowCnt - 1);
	walker = new Walker(0, 0, grid);
}

function draw()
{
	background(0);
	grid.draw();
	walker.draw();
	walker.walk();
	// if (keyIsDown(32))
	// {
	// 	if (!noFire) walker.walk();
	// 	noFire = true;
	// }
	// else noFire = false;
}
