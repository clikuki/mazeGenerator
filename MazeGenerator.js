class MazeGenerator
{
	constructor(grid)
	{
		// Choose center as maze starting point
		const starterIndex = (grid.rowCnt ** 2 / 2) + (grid.colCnt / 2);
		const starterCell = grid[starterIndex];
		starterCell.visited = true;
		this.index = starterIndex;
		this.x = starterCell.x;
		this.y = starterCell.y;
		this.walked = new Set();
		this.isComplete = false;
		this.phase = 0;
		this.allDirOffsets = [-grid.colCnt, 1, grid.colCnt, -1];
		this.grid = grid;
	}

	getRandUnvisitedCellIndex()
	{
		const mazePartIndices = this.grid
			.map((cell, i) => ({ ...cell, i, }))
			.filter(({ visited }) => visited)
			.map(({ i }) => i);

		while (true)
		{
			const randCellIndex = floor(random(0, this.grid.colCnt * this.grid.rowCnt));
			if (!mazePartIndices.includes(randCellIndex))
			{
				return randCellIndex;
			}
		}
	}

	carveWall(prevCell, curCell, offset)
	{
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
				if (newIndex < 0 || newIndex >= this.grid.colCnt * this.grid.rowCnt) return false;

				// Prevent Walker from going over left and right edges
				if (abs(offset) === 1 && cell.y !== this.y) return false;
				return true;
			})

		const offset = random(dirOffSets);
		const headCell = this.grid[this.index += offset];
		this.x = headCell.x;
		this.y = headCell.y;

		// Phase 1: Aldous-Broder algorithm
		if (this.phase === 0)
		{
			const prevCell = this.grid[this.index - offset];
			// If new cell is unvisited, then carve walls inbetween
			if (!headCell.visited)
			{
				headCell.visited = true;
				this.carveWall(prevCell, headCell, offset);

				// Switch to second phase when 1/3 of grid has been covered
				const numOfVisitedCells = this.grid.filter(({ visited }) => visited).length;
				if (numOfVisitedCells >= this.grid.rowCnt * this.grid.colCnt / 3)
				{
					const randCellIndex = this.getRandUnvisitedCellIndex();
					const cell = this.grid[randCellIndex];
					this.startIndex = randCellIndex;
					this.index = randCellIndex;
					this.x = cell.x;
					this.y = cell.y;
					this.phase = 1;
				}
			}
		}
		else // Phase 2: Wilson's algorithm
		{
			this.grid[this.index - offset].direction = offset;
			this.walked.add(this.index - offset);
			if (headCell.visited)
			{ // Connect path back to body
				let prevCell, prevOffset;
				let pathIndex = this.startIndex;
				while (true)
				{ // Loop through paths using direction offsets
					const curCell = this.grid[pathIndex];
					const pathOffset = curCell?.direction;
					if (prevCell === headCell) break;
					if (prevCell) this.carveWall(prevCell, curCell, prevOffset);
					if (curCell) curCell.visited = true;
					pathIndex += pathOffset;
					prevCell = curCell;
					prevOffset = pathOffset;
				}

				for (const cellIndex of this.walked)
				{
					delete this.grid[cellIndex].direction;
				}
				this.walked.clear();
				if (this.grid.every(({ visited }) => visited))
				{
					this.isComplete = true;
				}
				else
				{ // Find new starting point for path
					const randCellIndex = this.getRandUnvisitedCellIndex();
					const cell = this.grid[randCellIndex];
					this.startIndex = randCellIndex;
					this.index = randCellIndex;
					this.x = cell.x;
					this.y = cell.y;
				}
			}
		}
	}

	draw()
	{
		if (this.isComplete) return;

		// Path
		for (const index of this.walked)
		{
			const cell = this.grid[index];
			fill(255, 0, 0);
			square(cell.x, cell.y, cell.s - 2);
		}

		// Head
		push();
		translate(cellSize / 2, cellSize / 2);
		noStroke();
		fill(0, 255, 0);
		circle(this.x, this.y, cellSize / 4);
		pop();
	}
}
