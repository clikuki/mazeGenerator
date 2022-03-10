class Cell
{
	constructor(i, j, s)
	{
		this.i = i;
		this.j = j;
		this.x = i * s;
		this.y = j * s;
		this.s = s + 1;
		this.visited = false;
		this.filled = false;
		this.walls = [true, true, true, true];
	}
	draw()
	{
		if (!this.visited || this.filled)
		{
			fill(70);
			noStroke();
			square(this.x, this.y, this.s);
		}

		stroke(255);
		beginShape(LINES);
		for (let i = 0; i < 4; i++)
		{
			if (this.walls[i])
			{
				switch (i)
				{
					case 0: // Top
						if (!this.y) break;
						vertex(this.x, this.y);
						vertex(this.x + this.s, this.y);
						break;
					case 1: // Right
						if (this.x >= width) break;
						vertex(this.x + this.s, this.y);
						vertex(this.x + this.s, this.y + this.s);
						break;
					case 2: // Bottom
						if (this.y >= height) break;
						vertex(this.x + this.s, this.y + this.s);
						vertex(this.x, this.y + this.s);
						break;
					case 3: // Left
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
				const cell = new Cell(i, j, cellSize);
				this[j * rowCnt + i] = cell;
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
