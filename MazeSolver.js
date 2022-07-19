class MazeSolver {
	constructor(grid, startIndex, endIndex) {
		this.grid = grid;
		this.startIndex = startIndex;
		this.endIndex = endIndex;
		this.isComplete = false;
		this.allDirOffsets = [-grid.colCnt, 1, grid.colCnt, -1];
		this.filledCells = [];
		this.phase = 0;
		this.deadEndCells = this.getDeadEnds();
	}
	step() {
		if (this.isComplete) return;
		if (this.phase === 0) {
			for (const cell of this.deadEndCells) {
				cell.filled = true;
				this.filledCells.push(cell);
			}
			const nextCells = this.getDeadEnds();
			if (!nextCells.length) {
				const startCell = this.grid[this.startIndex];
				this.index = this.startIndex;
				this.head = 0;
				this.x = startCell.x;
				this.y = startCell.y;
				this.path = [
					{
						index: this.startIndex,
						tried: [],
					},
				];
				this.mazeIsPerfect = true;
				this.phase = 1;
			} else this.deadEndCells = nextCells;
		} else {
			const dirOffSets = this.allDirOffsets.filter((offset, i) => {
				const newIndex = this.index + offset;
				const cell = this.grid[newIndex];

				if (this.index === this.endIndex) return false;
				if (
					newIndex < 0 ||
					newIndex >= this.grid.colCnt * this.grid.rowCnt
				)
					return false;
				if (abs(offset) === 1 && cell.y !== this.y) return false;
				if (cell.filled || cell.pathVisited) return false;
				if (this.grid[this.index].walls[i]) return false;
				if (this.head !== -1) {
					for (const triedOffset of this.path[this.head].tried) {
						if (triedOffset === offset) return false;
					}
				}

				return true;
			});

			if (dirOffSets.length) {
				if (dirOffSets.length > 1) this.mazeIsPerfect = false;
				const offset = random(dirOffSets);
				const curCell = this.grid[(this.index += offset)];
				curCell.pathVisited = true;
				this.x = curCell.x;
				this.y = curCell.y;
				this.path[this.head++].tried.push(offset);
				this.path.push({
					returnOffset: -offset,
					index: this.index,
					tried: [],
				});
			} else {
				if (!this.mazeIsPerfect) {
					for (const { index } of this.path) {
						const cell = this.grid[index];
						cell.pathVisited = false;
					}
					this.isComplete = true;
					return;
				}

				if (this.index === this.endIndex) {
					if (
						!this.truePath ||
						this.path.length < this.truePath.length
					) {
						this.truePath = this.path.map(({ index }) => index);
					}
				}

				this.grid[this.index].pathVisited = false;
				const { returnOffset } = this.path.pop();
				const prevCell = this.grid[(this.index += returnOffset)];
				if (!prevCell) {
					for (let i = 0; i < this.grid.length; i++) {
						const cell = this.grid[i];
						if (cell.pathVisited) cell.pathVisited = false;
						if (!cell.filled && !this.truePath.includes(i)) {
							cell.filled = true;
						}
					}
					this.isComplete = true;
					return;
				}
				this.x = prevCell.x;
				this.y = prevCell.y;
				this.head--;
			}
		}
	}
	getDeadEnds() {
		return this.grid.filter((cell) => {
			// Check if cell is already filled
			if (cell.filled) return false;

			// Check if cell is end or start point
			const cellIndex = cell.j * this.grid.colCnt + cell.i;
			if (cellIndex === this.startIndex || cellIndex === this.endIndex)
				return false;

			if (this.cellIsJunction(cell)) return false;
			return true;
		});
	}
	cellIsJunction(cell) {
		// Check if it has 3 walls, as cells with three walls are deadends
		const numOfWalls = cell.walls.filter((x) => x).length;
		if (numOfWalls === 3) return false;

		// Check if the number of filled neighbors and walls together equal 3
		const cellIndex = cell.j * this.grid.colCnt + cell.i;
		let numOfFilledNeighbors = 0;
		for (let i = 0; i < 4; i++) {
			if (cell.walls[i]) continue;
			const offset = this.allDirOffsets[i];
			const neighborCell = this.grid[cellIndex + offset];
			if (neighborCell.filled && ++numOfFilledNeighbors + numOfWalls >= 3)
				return false;
		}
		return true;
	}
	clear() {
		if (this.isComplete) {
			for (const cell of this.filledCells) {
				cell.filled = false;
			}
		}
	}
	fill() {
		if (this.isComplete) {
			for (const cell of this.filledCells) {
				cell.filled = true;
			}
		}
	}
	draw() {
		push();
		translate(this.grid.cellWidth / 2, this.grid.cellHeight / 2);
		noStroke();
		fill(0, 255, 0);
		ellipse(
			this.x,
			this.y,
			this.grid.cellWidth / 4,
			this.grid.cellHeight / 4,
		);
		pop();
	}
}
