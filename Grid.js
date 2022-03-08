class Cell
{
	constructor(x, y, s)
	{
		this.x = x * s;
		this.y = y * s;
		this.s = s + 1;
		this.visited = false;
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

class Grid extends Array
{
	constructor(colCnt, rowCnt, cellSize)
	{
		super();
		this.colCnt = colCnt;
		this.rowCnt = rowCnt;
		for (let j = 0; j < rowCnt; j++)
		{
			for (let i = 0; i < colCnt; i++)
			{
				this[j * rowCnt + i] = new Cell(i, j, cellSize);
			}
		}
	}
	draw()
	{
		for (const cell of this)
		{
			cell.draw();
		}
	}
}
