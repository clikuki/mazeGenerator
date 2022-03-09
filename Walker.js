class Walker
{
	constructor(grid)
	{
		this.grid = grid;

		// Choose random cell as maze starting point
		const starterIndex = this.getRandCellIndex();
		const starterCell = this.grid[starterIndex];
		starterCell.visited = true;
		this.index = starterIndex;
		this.x = starterCell.x;
		this.y = starterCell.y;
		this.walked = new Set();
		this.isComplete = false;
		this.phase = 0;
		this.allDirOffsets = [-grid.colCnt, 1, grid.colCnt, -1];
	}

	getRandCellIndex()
	{
		return floor(random(0, this.grid.colCnt * this.grid.rowCnt));
	}

	getRandUnvisitedCellIndex()
	{
		const mazePartIndices = this.grid
			.map((cell, i) => ({ ...cell, i, }))
			.filter(({ visited }) => visited)
			.map(({ i }) => i);

		while (true)
		{
			const randCellIndex = this.getRandCellIndex();
			if (!mazePartIndices.includes(randCellIndex))
			{
				return randCellIndex;
			}
		}
	}

	/**
	 * WILSON'S ALGORITHM STEPS
	 * =========================================================   
	 * 	1. Choose random cell and set it as a part of the body   
	 * 	2. Choose another random cell   
	 * 	3. Choose a random direction   
	 * 	4. Set direction on current cell   
	 * 	5. Walk in direction   
	 * 	6. Repeat steps 3-6 until you hit a part of the maze   
	 * 	7. Return to start / second random cell   
	 * 	8. push cell as a part of the path   
	 * 	9. Walk in direction written on cell   
	 * 	10. Repeat steps 8-10 until you reach a part of the maze   
	 * 	11. Remove walls in between paths to create corridors   
	 * 	12. Repeat steps 2-12 until maze is completely generated   
	 */
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

		if (this.phase === 0)
		{
			const prevCell = this.grid[this.index - offset];

			if (!headCell.visited)
			{
				headCell.visited = true;
				if (abs(offset) === 1)
				{ // Left and Right
					prevCell.walls[offset < 1 ? 3 : 1] = false;
					headCell.walls[offset < 1 ? 1 : 3] = false;
				}
				else
				{ // Up and Down
					prevCell.walls[offset < 1 ? 0 : 2] = false;
					headCell.walls[offset < 1 ? 2 : 0] = false;
				}

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
		else
		{
			this.grid[this.index - offset].direction = offset;
			this.walked.add(this.index - offset);
			if (headCell.visited)
			{
				let prevCell, prevOffset;
				let pathIndex = this.startIndex;
				while (true)
				{
					const curCell = this.grid[pathIndex];
					const pathOffset = curCell?.direction;
					if (!prevOffset && prevCell) break;
					if (curCell) curCell.visited = true;

					// Remove walls
					if (prevCell)
					{
						if (abs(prevOffset) === 1)
						{ // Left and Right
							prevCell.walls[prevOffset < 1 ? 3 : 1] = false;
							curCell.walls[prevOffset < 1 ? 1 : 3] = false;
						}
						else
						{ // Up and Down
							prevCell.walls[prevOffset < 1 ? 0 : 2] = false;
							curCell.walls[prevOffset < 1 ? 2 : 0] = false;
						}
					}

					pathIndex += pathOffset;
					prevCell = curCell;
					prevOffset = pathOffset;
				}

				this.walked.clear();
				if (this.grid.every(({ visited }) => visited))
				{
					this.isComplete = true;
				}
				else
				{
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

		for (const index of this.walked)
		{
			const cell = this.grid[index];
			fill(255, 0, 0);
			square(cell.x, cell.y, cell.s - 2);
		}

		push();
		translate(cellSize / 2, cellSize / 2);
		noStroke();
		fill(0, 255, 0);
		circle(this.x, this.y, cellSize / 4);
		pop();
	}
}
