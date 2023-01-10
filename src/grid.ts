export class Cell {
	i: number;
	j: number;
	x: number;
	y: number;
	w: number;
	h: number;
	visited = false;
	pathVisited = false;
	filled = false;
	direction: number | null;
	walls = [true, true, true, true];
	constructor(i: number, j: number, w: number, h: number) {
		this.i = i;
		this.j = j;
		this.x = i * w;
		this.y = j * h;
		this.w = w + 1;
		this.h = h + 1;
	}
	draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = `black`;
		if (!this.visited || this.filled) {
			ctx.fillStyle = `hsla(0, 0%, 20%)`;
			ctx.fillRect(
				this.x + (!this.x ? 0 : 1),
				this.y + (!this.y ? 0 : 1),
				this.w - (this.x >= canvas.width ? 0 : 1),
				this.h - (this.y >= canvas.height ? 0 : 1),
			);
		}

		ctx.strokeStyle = 'white';
		const path = new Path2D();
		for (let i = 0; i < 4; i++) {
			if (this.walls[i]) {
				switch (i) {
					case 0: // Top
						if (!this.y) break;
						path.moveTo(this.x, this.y);
						path.lineTo(this.x + this.w, this.y);
						break;
					case 1: // Right
						if (this.x >= canvas.width) break;
						path.moveTo(this.x + this.w, this.y);
						path.lineTo(this.x + this.w, this.y + this.h);
						break;
					case 2: // Bottom
						if (this.y >= canvas.height) break;
						path.moveTo(this.x + this.w, this.y + this.h);
						path.lineTo(this.x, this.y + this.h);
						break;
					case 3: // Left
						if (!this.x) break;
						path.moveTo(this.x, this.y + this.h);
						path.lineTo(this.x, this.y);
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
				const cell = new Cell(i, j, cellWidth, cellHeight);
				this[j * colCnt + i] = cell;
			}
		}
	}
	draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		for (const cell of this) {
			cell.draw(canvas, ctx);
		}
	}
}
