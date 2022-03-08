const cellSize = 50;
let colCnt, rowCnt, grid;
function setup()
{
	createCanvas(600, 600);
	colCnt = floor(width / cellSize);
	rowCnt = floor(height / cellSize);
	grid = new Grid(colCnt, rowCnt, cellSize);
}

function draw()
{
	background(0);
	grid.draw();
}
