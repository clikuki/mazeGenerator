class Walker
{
	constructor(i, j, grid)
	{
		this.x = i * cellSize;
		this.y = j * cellSize;
		this.index = j * rowCnt + i;
		this.isComplete = false;
		this.grid = grid;
		this.allDirOffsets = [-grid.colCnt, 1, grid.colCnt, -1];
	}

	walk()
	{
		if (this.isComplete) return;

		const dirOffSets = this.allDirOffsets
			.filter(offset =>
			{
				const newIndex = this.index + offset;
				const cell = this.grid[newIndex];

				// Check if cell is within grid
				if (newIndex < 0 || newIndex >= colCnt * rowCnt) return false;

				// Prevent Walker from going over left and right edges
				if (abs(offset) === 1 && cell.y !== this.y) return false;

				return true;
			})

		const offset = random(dirOffSets);
		const prevCell = this.grid[this.index];
		const curCell = this.grid[this.index += offset];
		this.x = curCell.x;
		this.y = curCell.y;

		if (!curCell.visited)
		{
			curCell.visited = true;

			// Remove walls
			if (abs(offset) === 1)
			{ // Left and Right
				prevCell.walls[offset < 1 ? 3 : 1] = false;
				curCell.walls[offset < 1 ? 1 : 3] = false;
			}
			else
			{ // Up and Down
				prevCell.walls[offset < 1 ? 0 : 2] = false;
				curCell.walls[offset < 1 ? 2 : 0] = false;
			}

			if (this.grid.every(({ visited }) => visited))
			{
				this.isComplete = true;
			}
		}
	}

	draw()
	{
		if (this.isComplete) return;

		push();
		translate(cellSize / 2, cellSize / 2);
		noStroke();
		fill(0, 255, 0);
		circle(this.x, this.y, cellSize / 4);
		pop();
	}
}
