class Walker
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
		this.colCnt = colCnt;
		this.rowCnt = rowCnt;
		this.isComplete = false;
		this.head = 0;
		this.walked = [{
			pos: [x, y],
			tried: [],
		}];
		this.spots = Array.from({ length: rowCnt },
			() => Array.from({ length: colCnt }, () => false)
		)
		this.spots[y][x] = true;
	}

	gridIsSplit()
	{
		const numOfEmptySpots = this.spots
			.reduce((acc, row) =>
			{
				const rowLen = row
					.filter(b => !b)
					.length;

				return acc + rowLen;
			}, 0);

		// if empty spots is 0, then path is complete
		if (!numOfEmptySpots) return true;

		// Locate an empty spot
		let emptyX, emptyY;
		findEmpty: for (let j = 0; j < this.spots.length; j++)
		{
			const row = this.spots[j];
			for (let i = 0; i < row.length; i++)
			{
				if (!this.spots[j][i])
				{
					emptyX = i;
					emptyY = j;
					break findEmpty;
				}
			}
		}

		const visited = {}; // Prevents visiting already visited node
		let nodeCnt = 0; // Actual node counting
		const findEmptyBody = (x, y) =>
		{
			nodeCnt++;
			visited[`${x}-${y}`] = true;
			const neighbors = Walker.allDirOffsets
				.map(([offsetX, offsetY]) =>
				{
					const newX = x + offsetX;
					const newY = y + offsetY;
					return [newX, newY];
				})
				.filter(([neighborX, neighborY]) =>
				{
					if ((
						(neighborX < 0 || neighborX >= colCnt) ||
						(neighborY < 0 || neighborY >= rowCnt))) return false;
					if (this.spots[neighborY][neighborX]) return false;
					return true;
				})

			if (!neighbors.length) return;
			for (const [nx, ny] of neighbors)
			{
				if (!visited[`${nx}-${ny}`])
				{
					findEmptyBody(nx, ny);
				}
			}
		}
		findEmptyBody(emptyX, emptyY);
		return nodeCnt === numOfEmptySpots;
	}

	walk()
	{
		if (this.isComplete) return;

		const dirOffSets = Walker.allDirOffsets
			.filter(([offsetX, offsetY]) =>
			{
				const newX = this.x + offsetX;
				const newY = this.y + offsetY;

				// Check if spot is within grid
				if ((
					(newX < 0 || newX >= colCnt) ||
					(newY < 0 || newY >= rowCnt))) return false;

				// Check if spot is empty
				if (this.spots[newY][newX]) return false;

				// Check if direction has been tried by current head
				const tried = this.walked[this.head].tried;
				for (const triedOffsetArr of tried)
				{
					const [triedOffsetX, triedOffsetY] = triedOffsetArr;
					if (triedOffsetX === offsetX && triedOffsetY === offsetY) return false;
				}

				// Check if move splits empty area into two
				this.spots[newY][newX] = true;
				const e = this.gridIsSplit();
				this.spots[newY][newX] = false;
				return e;
			})

		if (!dirOffSets.length)
		{
			const { prevPos } = this.walked.pop();
			if (!prevPos)
			{
				this.isComplete = true;
				return;
			}
			this.spots[this.y][this.x] = false;
			[this.x, this.y] = prevPos;
			this.head--;
		}
		else
		{
			const [offsetX, offsetY] = random(dirOffSets);
			this.walked[this.head].tried.push([offsetX, offsetY]);
			this.walked.push({
				prevPos: [this.x, this.y],
				pos: [this.x += offsetX, this.y += offsetY],
				tried: [],
			});
			this.spots[this.y][this.x] = true;
			if ((++this.head + 1) === colCnt * rowCnt)
			{
				this.isComplete = true;
				return;
			}
		}
	}

	draw()
	{
		// Draw body
		let prev;
		for (const { pos } of this.walked)
		{
			const [x, y] = pos;
			const canvasX = x * colSpace;
			const canvasY = y * rowSpace;
			if (prev)
			{
				stroke(255);
				line(prev[0], prev[1], canvasX, canvasY);
			}

			prev = [canvasX, canvasY];
		}

		// Draw head
		const { pos } = this.walked[this.head];
		circle(pos[0] * colSpace, pos[1] * rowSpace, 20);
	}

	static allDirOffsets = [[0, -1], [1, 0], [0, 1], [-1, 0]];
}
