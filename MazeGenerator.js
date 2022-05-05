class MazeGeneratorWalkerBase
{
	constructor(grid, startX = floor(grid.colCnt / 2), startY = floor(grid.rowCnt / 2))
	{
		const starterIndex = (startY * grid.colCnt) + startX;
		const starterCell = grid[starterIndex];
		starterCell.visited = true;
		this.index = starterIndex;
		this.x = starterCell.x;
		this.y = starterCell.y;
		this.isComplete = false;
		this.allDirOffsets = [-grid.colCnt, 1, grid.colCnt, -1];
		this.grid = grid;
	}

	getRandomUnvisitedCellIndex()
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

	checkIfComplete()
	{
		return this.grid.every(({ visited }) => visited);
	}
}

class AldousBroderWalker extends MazeGeneratorWalkerBase
{
	step()
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

		const prevCell = this.grid[this.index - offset];
		// If new cell is unvisited, then carve walls inbetween
		if (!headCell.visited)
		{
			headCell.visited = true;
			this.carveWall(prevCell, headCell, offset);
			if (this.checkIfComplete())
			{
				this.isComplete = true;
			}
		}
	}

	draw()
	{
		if (this.isComplete) return;
		push();
		translate(this.grid.cellSize / 2, this.grid.cellSize / 2);
		noStroke();
		fill(0, 255, 0);
		circle(this.x, this.y, this.grid.cellSize / 4);
		pop();
	}
}

class WilsonWalker extends MazeGeneratorWalkerBase
{
	constructor(grid)
	{
		super(grid);
		const walkerStartIndex = this.getRandomUnvisitedCellIndex();
		const walkerStartCell = this.grid[walkerStartIndex];
		this.startIndex = walkerStartIndex;
		this.index = walkerStartIndex;
		this.x = walkerStartCell.x;
		this.y = walkerStartCell.y;
		this.walked = new Set();
		if (this.grid.every(({ visited }) => !visited))
		{
			const centerCellIndex = (floor(grid.rowCnt / 2) * grid.colCnt) + floor(grid.colCnt / 2);
			this.grid[centerCellIndex].visited = true;
		}
	}
	step()
	{
		if (this.isComplete) return;

		const dirOffSets = this.allDirOffsets
			.filter(offset =>
			{
				const newIndex = this.index + offset;
				const cell = this.grid[newIndex];

				// Check if cell is within grid
				if (newIndex < 0 || newIndex >= this.grid.colCnt * this.grid.rowCnt) return;

				// Prevent Walker from going over left and right edges
				if (abs(offset) === 1 && cell.y !== this.y) return;

				return true;
			})

		const offset = random(dirOffSets);
		const curCell = this.grid[this.index];
		curCell.direction = offset;
		this.walked.add(this.index);

		const newHeadCell = this.grid[this.index += offset];
		this.x = newHeadCell.x;
		this.y = newHeadCell.y;
		if (newHeadCell.visited)
		{ // Connect path back to body
			let prevCell, prevOffset;
			let pathIndex = this.startIndex;
			while (true)
			{ // Loop through paths using direction offsets
				const curCell = this.grid[pathIndex];
				const pathOffset = curCell?.direction;
				if (prevCell === newHeadCell) break;
				if (prevCell) this.carveWall(prevCell, curCell, prevOffset);
				curCell.visited = true;
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
				const randCellIndex = this.getRandomUnvisitedCellIndex();
				const cell = this.grid[randCellIndex];
				this.startIndex = randCellIndex;
				this.index = randCellIndex;
				this.x = cell.x;
				this.y = cell.y;
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
		translate(this.grid.cellSize / 2, this.grid.cellSize / 2);
		noStroke();
		fill(0, 255, 0);
		circle(this.x, this.y, this.grid.cellSize / 4);
		pop();
	}
}

class MazeGenerator
{
	constructor(grid)
	{
		this.grid = grid;
		this.phase = 0;
		this.isComplete = false;
		this.walkers = [];

		const areaSize = 10;
		if (max(colCnt, rowCnt) >= areaSize)
		{
			const areasColCnt = floor(grid.colCnt / areaSize);
			const areasRowCnt = floor(grid.rowCnt / areaSize);
			const numOfWalkers = areasColCnt * areasRowCnt;
			for (let i = 0; i < numOfWalkers; i++)
			{
				this.walkers[i] = new AldousBroderWalker(grid);
			}
		}
		else this.walkers[0] = new AldousBroderWalker(grid);
	}

	step()
	{
		if (this.isComplete) return;
		for (const walker of this.walkers)
		{
			walker.step()
			if (walker.isComplete)
			{
				this.isComplete = true;
				return;
			}
		}

		if (this.phase !== 0) return;
		const numOfVisitedCells = this.grid.filter(({ visited }) => visited).length;
		if (numOfVisitedCells >= this.grid.rowCnt * this.grid.colCnt / 3)
		{
			this.phase = 1;
			this.walkers.length = 0;
			this.walkers[0] = new WilsonWalker(this.grid);
		}
	}

	draw()
	{
		if (this.isComplete) return;
		this.walkers.forEach(walker => walker.draw());
	}
}
