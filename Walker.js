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
			const { returnOffset } = this.walked.pop();
			const prevCell = this.grid[this.index += returnOffset];
			if (!prevCell)
			{
				this.isComplete = true;
				return;
			}
			this.x = prevCell.x;
			this.y = prevCell.y;
			this.head--;
		}
		else
		{
			const offset = random(dirOffSets);
			const prevCell = this.grid[this.index];
			const curCell = this.grid[this.index += offset];
			curCell.visited = true;
			this.x = curCell.x;
			this.y = curCell.y;

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

			// Push to queue
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
		if (this.isComplete || this.head === -1) return;

		// Path
		let prev;
		push();
		translate(cellSize / 2, cellSize / 2);
		stroke(0, 255, 0);
		for (let i = 0; i < this.walked.length; i++)
		{
			const index = this.walked[i].index;
			const { x, y } = this.grid[index];
			if (prev)
			{
				const [prevX, prevY] = prev;
				line(prevX, prevY, x, y);
			}

			prev = [x, y];
		}

		// Head
		noStroke();
		fill(0, 255, 0);
		circle(this.x, this.y, cellSize / 4);
		pop();
	}
}
