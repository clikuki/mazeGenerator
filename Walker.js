class Walker
{
	constructor(grid)
	{
		this.grid = grid;

		// Choose random cell as maze starting point
		const starterCell = this.getRandCell();
		starterCell.visited = true;

		// Choose random cell as walker starting point
		while (true)
		{
			const randomCell = this.getRandCell();
			if (randomCell !== starterCell)
			{
				this.startIndex = randomCell.j * grid.rowCnt + randomCell.i;
				this.index = this.startIndex;
				this.x = randomCell.x;
				this.y = randomCell.y;
				break;
			}
		}

		this.walked = new Set();
		this.isComplete = false;
		this.allDirOffsets = [-grid.colCnt, 1, grid.colCnt, -1];
	}

	getRandCellIndex()
	{
		return floor(random(0, this.grid.colCnt * this.grid.rowCnt));
	}

	getRandCell()
	{
		return this.grid[this.getRandCellIndex()];
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
		this.grid[this.index].direction = offset;
		this.walked.add(this.index);
		const headCell = this.grid[this.index += offset];
		this.x = headCell.x;
		this.y = headCell.y;

		if (headCell.visited)
		{
			let prevCell;
			let pathIndex = this.startIndex;
			while (true)
			{
				const curCell = this.grid[pathIndex];
				const pathOffset = curCell.direction;
				if (!pathOffset) break;
				curCell.visited = true;

				// Remove walls
				if (prevCell)
				{
					console.log(prevCell, curCell);
					if (abs(pathOffset) === 1)
					{ // Left and Right
						prevCell.walls[pathOffset < 1 ? 3 : 1] = false;
						curCell.walls[pathOffset < 1 ? 1 : 3] = false;
					}
					else
					{ // Up and Down
						prevCell.walls[pathOffset < 1 ? 0 : 2] = false;
						curCell.walls[pathOffset < 1 ? 2 : 0] = false;
					}
				}

				pathIndex += pathOffset;
				prevCell = curCell;
			}
			console.log('done');

			for (const index of this.walked)
			{
				this.grid[index].direction = null;
			}
			this.walked.clear();

			if (this.grid.every(({ visited }) => visited))
			{
				this.isComplete = true;
			}
			else
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
						const cell = this.grid[randCellIndex];
						this.startIndex = randCellIndex;
						this.index = randCellIndex;
						this.x = cell.x;
						this.y = cell.y;
						break;
					}
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
