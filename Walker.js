class Walker
{
	constructor(i, j, grid)
	{
		this.x = i * cellSize;
		this.y = j * cellSize;
		this.index = j * rowCnt + i;
		this.isComplete = false;
		this.head = -1;
		this.walked = [];
		this.grid = grid;
		this.allDirOffsets = [-grid.colCnt, 1, grid.colCnt, -1];
	}

	walk()
	{
		if (this.isComplete) return;
		if (this.head === -1)
		{
			this.head++;
			this.walked.push({
				index: this.index,
				tried: [],
			});
			this.grid[this.index].visited = true;
			return;
		}

		const dirOffSets = this.allDirOffsets
			.filter(offset =>
			{
				const newIndex = this.index + offset;
				const cell = this.grid[newIndex];

				// Check if cell is within grid
				if (newIndex < 0 || newIndex >= colCnt * rowCnt) return false;

				// Prevent Walker from going over left and right edges
				if (abs(offset) === 1 && cell.y !== this.y) return false;

				// Check if cell is empty
				if (cell.visited) return false;

				// Check if direction has been tried before
				for (const triedOffset of this.walked[this.head].tried)
				{
					if (triedOffset === offset) return false;
				}

				return true;
			})

		if (!dirOffSets.length)
		{
			this.grid[this.index].visited = false;
			const { returnOffset } = this.walked.pop();
			const cell = this.grid[this.index += returnOffset];
			this.x = cell.x;
			this.y = cell.y;
			this.head--;
		}
		else
		{
			const offset = random(dirOffSets);
			const cell = this.grid[this.index += offset];
			cell.visited = true;
			this.x = cell.x;
			this.y = cell.y;
			this.walked[this.head++].tried.push(offset);
			this.walked.push({
				returnOffset: -offset,
				index: this.index,
				tried: [],
			});
		}
	}

	draw()
	{
		if (this.head === -1) return;

		// Path
		noStroke();
		fill('#ff00007f');
		for (let i = 0; i < this.head; i++)
		{
			const index = this.walked[i].index;
			const cell = this.grid[index];
			square(cell.x, cell.y, cellSize);
		}

		// Head
		fill('#00ff007f');
		square(this.x, this.y, cellSize);
	}
}
