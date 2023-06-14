export class Cell {
	gridIndex: number;
	gridX: number;
	gridY: number;
	screenX: number;
	screenY: number;
	size: number;
	open = false;
	walls = [true, true, true, true];
	constructor(grid: Grid, i: number, j: number, s: number) {
		this.gridIndex = j * grid.colCnt + i;
		this.gridX = i;
		this.gridY = j;
		this.screenX = Math.floor(i * s);
		this.screenY = Math.floor(j * s);
		this.size = s;
	}
	grayOut(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = `hsla(0, 0%, 15%)`;
		ctx.fillRect(
			Math.floor(this.screenX + (!this.screenX && this.walls[3] ? 0 : 1)),
			Math.floor(this.screenY + (!this.screenY && this.walls[0] ? 0 : 1)),
			Math.ceil(
				this.size + (this.screenX >= canvas.width && this.walls[1] ? 0 : 1),
			),
			Math.ceil(
				this.size + (this.screenY >= canvas.height && this.walls[2] ? 0 : 1),
			),
		);
	}
	drawWalls(ctx: CanvasRenderingContext2D) {
		// Walls
		ctx.beginPath();
		for (let i = 0; i < 4; i++) {
			if (this.walls[i]) {
				switch (i) {
					case 0: // Top
						ctx.moveTo(this.screenX, this.screenY);
						ctx.lineTo(this.screenX + this.size, this.screenY);
						break;
					case 1: // Right
						ctx.moveTo(this.screenX + this.size, this.screenY);
						ctx.lineTo(this.screenX + this.size, this.screenY + this.size);
						break;
					case 2: // Bottom
						ctx.moveTo(this.screenX + this.size, this.screenY + this.size);
						ctx.lineTo(this.screenX, this.screenY + this.size);
						break;
					case 3: // Left
						ctx.moveTo(this.screenX, this.screenY + this.size);
						ctx.lineTo(this.screenX, this.screenY);
						break;
				}
			}
		}
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 1;
		ctx.stroke();
	}
}

export class Grid {
	colCnt: number;
	rowCnt: number;
	cellSize: number;
	cells: Cell[] = [];
	centerOffsetX: number;
	centerOffsetY: number;
	constructor(colCnt: number, rowCnt: number, canvas: HTMLCanvasElement) {
		this.colCnt = colCnt;
		this.rowCnt = rowCnt;
		this.cellSize = Math.min(canvas.width / colCnt, canvas.height / rowCnt);
		this.centerOffsetX = (this.cellSize / 2) * Math.max(rowCnt - colCnt, 0);
		this.centerOffsetY = (this.cellSize / 2) * Math.max(colCnt - rowCnt, 0);
		for (let j = 0; j < rowCnt; j++) {
			for (let i = 0; i < colCnt; i++) {
				const cell = new Cell(this, i, j, this.cellSize);
				this.cells[j * colCnt + i] = cell;
			}
		}
	}
	drawWalls(ctx: CanvasRenderingContext2D) {
		for (const cell of this.cells) {
			if (cell.open) cell.drawWalls(ctx);
		}
	}
	drawGrayedCells(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
		for (const cell of this.cells) {
			if (!cell.open) cell.grayOut(canvas, ctx);
		}
	}
}
