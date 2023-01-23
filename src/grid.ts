export class Cell {
	gridIndex: number;
	gridX: number;
	gridY: number;
	screenX: number;
	screenY: number;
	w: number;
	h: number;
	open = false;
	walls = [true, true, true, true];
	constructor(grid: Grid, i: number, j: number, w: number, h: number) {
		this.gridIndex = j * grid.colCnt + i;
		this.gridX = i;
		this.gridY = j;
		this.screenX = Math.floor(i * w);
		this.screenY = Math.floor(j * h);
		this.w = w;
		this.h = h;
	}
	grayOut(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = `hsla(0, 0%, 15%)`;
		ctx.fillRect(
			this.screenX + (!this.screenX && this.walls[3] ? 0 : 1),
			this.screenY + (!this.screenY && this.walls[0] ? 0 : 1),
			this.w + (this.screenX >= canvas.width && this.walls[1] ? 0 : 1),
			this.h + (this.screenY >= canvas.height && this.walls[2] ? 0 : 1),
		);
	}
	drawWalls(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
		// Walls
		ctx.strokeStyle = 'white';
		const path = new Path2D();
		for (let i = 0; i < 4; i++) {
			if (this.walls[i]) {
				switch (i) {
					case 0: // Top
						if (!this.screenY) break;
						path.moveTo(this.screenX, this.screenY);
						path.lineTo(this.screenX + this.w, this.screenY);
						break;
					case 1: // Right
						if (this.screenX + this.w >= canvas.width) break;
						path.moveTo(this.screenX + this.w, this.screenY);
						path.lineTo(this.screenX + this.w, this.screenY + this.h);
						break;
					case 2: // Bottom
						if (this.screenY + this.h >= canvas.height) break;
						path.moveTo(this.screenX + this.w, this.screenY + this.h);
						path.lineTo(this.screenX, this.screenY + this.h);
						break;
					case 3: // Left
						if (!this.screenX) break;
						path.moveTo(this.screenX, this.screenY + this.h);
						path.lineTo(this.screenX, this.screenY);
						break;
				}
			}
		}
		ctx.stroke(path);
	}
}

export class Grid extends Array<Cell> {
	colCnt: number;
	rowCnt: number;
	cellWidth: number;
	cellHeight: number;
	constructor(
		colCnt: number,
		rowCnt: number,
		cellWidth: number,
		cellHeight: number,
	) {
		super();
		this.colCnt = colCnt;
		this.rowCnt = rowCnt;
		this.cellWidth = cellWidth;
		this.cellHeight = cellHeight;
		for (let j = 0; j < rowCnt; j++) {
			for (let i = 0; i < colCnt; i++) {
				const cell = new Cell(this, i, j, cellWidth, cellHeight);
				this[j * colCnt + i] = cell;
			}
		}
	}
	drawWalls(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
		for (const cell of this) {
			if (cell.open) cell.drawWalls(canvas, ctx);
		}
	}
	drawGrayedCells(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
		for (const cell of this) {
			if (!cell.open) cell.grayOut(canvas, ctx);
		}
	}
}
