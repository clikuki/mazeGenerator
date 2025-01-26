export interface Cell {
	index: number;
	x: number;
	y: number;
	screenX: number;
	screenY: number;
	open: boolean;
	walls: [boolean, boolean, boolean, boolean];
}

export class Grid {
	colCnt: number;
	rowCnt: number;
	cellSize: number;
	cells: Cell[] = [];
	offsetX: number;
	offsetY: number;
	canvas: HTMLCanvasElement;
	constructor(colCnt: number, rowCnt: number, canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.colCnt = colCnt;
		this.rowCnt = rowCnt;

		// Cell size should fit to smallest integer screen side
		this.cellSize = Math.min(
			Math.floor(canvas.width / colCnt),
			Math.floor(canvas.height / rowCnt)
		);

		// Center maze on screen
		this.offsetX = (canvas.width - colCnt * this.cellSize) / 2;
		this.offsetY = (canvas.height - rowCnt * this.cellSize) / 2;

		for (let y = 0; y < this.rowCnt; y++) {
			for (let x = 0; x < this.colCnt; x++) {
				this.cells[y * this.colCnt + x] = {
					index: y * this.colCnt + x,
					x,
					y,
					screenX: x * this.cellSize,
					screenY: y * this.cellSize,
					open: false,
					walls: [true, true, true, true],
				};
			}
		}
	}
	drawWalls(ctx: CanvasRenderingContext2D) {
		const path = new Path2D();
		const cellSize = this.cellSize;
		for (const { walls, x, y, screenX, screenY, open } of this.cells) {
			if (!open) continue;
			for (let i = 0; i < 4; i++) {
				if (!walls[i]) continue;
				let fromX, fromY, toX, toY;

				switch (i) {
					case 0: // Top
						if (y < 0) continue;
						fromX = screenX + this.offsetX;
						fromY = screenY + this.offsetY;
						toX = screenX + this.offsetX + cellSize;
						toY = screenY + this.offsetY;
						break;
					case 1: // Right
						if (x >= this.colCnt) continue;
						fromX = screenX + this.offsetX + cellSize;
						fromY = screenY + this.offsetY;
						toX = screenX + this.offsetX + cellSize;
						toY = screenY + this.offsetY + cellSize;
						break;
					case 2: // Bottom
						if (y >= this.rowCnt) continue;
						fromX = screenX + this.offsetX + cellSize;
						fromY = screenY + this.offsetY + cellSize;
						toX = screenX + this.offsetX;
						toY = screenY + this.offsetY + cellSize;
						break;
					case 3: // Left
						if (x < 0) continue;
						fromX = screenX + this.offsetX;
						fromY = screenY + this.offsetY + cellSize;
						toX = screenX + this.offsetX;
						toY = screenY + this.offsetY;
						break;
					default:
						throw Error("Invalid wall index");
				}

				path.moveTo(Math.floor(fromX), Math.floor(fromY));
				path.lineTo(Math.floor(toX), Math.floor(toY));
			}
		}

		ctx.strokeStyle = "white";
		ctx.lineCap = "butt";
		ctx.lineWidth = 2;
		ctx.stroke(path);
	}
	paintRect(
		ctx: CanvasRenderingContext2D,
		i: number,
		w: number,
		h: number,
		clr: string
	) {
		const cell = this.cells[i];
		ctx.fillStyle = clr;
		ctx.fillRect(
			Math.floor(this.offsetX + cell.screenX),
			Math.floor(this.offsetY + cell.screenY),
			w * this.cellSize,
			h * this.cellSize
		);
	}
	paintCircle(ctx: CanvasRenderingContext2D, i: number, clr: string) {
		const cell = this.cells[i];
		ctx.fillStyle = clr;
		ctx.beginPath();
		ctx.ellipse(
			this.offsetX + cell.screenX + this.cellSize / 2,
			this.offsetY + cell.screenY + this.cellSize / 2,
			this.cellSize / 3,
			this.cellSize / 3,
			0,
			0,
			Math.PI * 2
		);
		ctx.fill();
	}
	paintPath(ctx: CanvasRenderingContext2D, path: number[], clr: string) {
		ctx.beginPath();

		const startCell = this.cells[path[0]];
		const startX = this.offsetX + startCell.screenX + this.cellSize / 2;
		const startY = this.offsetY + startCell.screenY + this.cellSize / 2;
		ctx.moveTo(startX, startY);

		for (const i of path) {
			const cell = this.cells[i];
			const x = this.offsetX + cell.screenX + this.cellSize / 2;
			const y = this.offsetY + cell.screenY + this.cellSize / 2;

			ctx.lineTo(x, y);
		}

		ctx.strokeStyle = clr;
		ctx.lineWidth = 4;
		ctx.lineCap = "round";
		ctx.stroke();
	}
	paintText(
		ctx: CanvasRenderingContext2D,
		i: number,
		text: string,
		clr: string
	) {
		const cell = this.cells[i];
		ctx.fillStyle = clr;
		ctx.font = `${this.cellSize / 3}px monospace`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(
			text,
			Math.floor(this.offsetX + cell.screenX + this.cellSize / 2),
			Math.floor(this.offsetY + cell.screenY + this.cellSize / 2)
		);
	}
}
