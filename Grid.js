class Cell
{
	constructor(x, y, s, curGrid)
	{
		this.x = x * s;
		this.y = y * s;
		this.s = s + 1;
		this.curGrid = curGrid;
		this.walls = [true, true, true, true];
	}
	draw()
	{
		stroke(255);
		beginShape(LINES);
		for (let i = 0; i < 4; i++)
		{
			if (this.walls[i])
			{
				switch (i)
				{
					case 0:
						if (!this.y) break;
						vertex(this.x, this.y);
						vertex(this.x + this.s, this.y);
						break;
					case 1:
						if (this.x >= width) break;
						vertex(this.x + this.s, this.y);
						vertex(this.x + this.s, this.y + this.s);
						break;
					case 2:
						if (this.y >= height) break;
						vertex(this.x + this.s, this.y + this.s);
						vertex(this.x, this.y + this.s);
						break;
					case 3:
						if (!this.x) break;
						vertex(this.x, this.y + this.s);
						vertex(this.x, this.y);
						break;
				}
			}
		}
		endShape();
	}
}

class Grid
{
	constructor(colCnt, rowCnt, cellSize)
	{
		this.cells = Array.from({ length: colCnt },
			(_, j) => Array.from({ length: rowCnt },
				(_, i) => new Cell(i, j, cellSize, this)))
			.flat();
	}
	draw()
	{
		for (const cell of this.cells)
		{
			cell.draw();
		}
	}
}
