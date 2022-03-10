class MazeSolver
{
	constructor(grid, startIndex, endIndex)
	{
		this.grid = grid;
		this.startIndex = startIndex;
		this.endIndex = endIndex;
		this.isComplete = false;
		this.allDirOffsets = [-grid.colCnt, 1, grid.colCnt, -1];
		this.filledCells = [];
		this.deadEndCells = this.getDeadEnds();
	}
	step()
	{
		if (this.isComplete) return;
		for (const cell of this.deadEndCells)
		{
			cell.filled = true;
			this.filledCells.push(cell);
		}
		const nextCells = this.getDeadEnds();
		if (!nextCells.length) this.isComplete = true;
		else this.deadEndCells = nextCells;
	}
	getDeadEnds()
	{
		return this.grid.filter(cell =>
		{
			// Check if cell is already filled
			if (cell.filled) return false;

			// Check if cell is end or start point
			const cellIndex = cell.j * this.grid.rowCnt + cell.i;
			if (cellIndex === this.startIndex
				|| cellIndex === this.endIndex) return false;

			if (this.cellIsJunction(cell)) return false;
			return true;
		})
	}
	cellIsJunction(cell)
	{
		// Check if it has 3 walls, as cells with three walls are deadends
		const numOfWalls = cell.walls.filter(x => x).length;
		if (numOfWalls === 3) return false;

		// Check if the number of filled neighbors and walls together equal 3
		const cellIndex = cell.j * this.grid.rowCnt + cell.i;
		let numOfFilledNeighbors = 0;
		for (let i = 0; i < 4; i++)
		{
			if (cell.walls[i]) continue;
			const offset = this.allDirOffsets[i];
			const neighborCell = this.grid[cellIndex + offset];
			if (neighborCell.filled &&
				++numOfFilledNeighbors + numOfWalls >= 3) return false;
		}
		return true;
	}
	clear()
	{
		for (const cell of this.filledCells)
		{
			cell.filled = false;
		}
		this.filledCells = [];
	}
}