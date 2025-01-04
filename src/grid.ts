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
	constructor(colCnt: number, rowCnt: number, canvas: HTMLCanvasElement) {
		this.colCnt = colCnt;
		this.rowCnt = rowCnt;

		// Cell size should fit to smallest screen side
		this.cellSize = Math.min(canvas.width / colCnt, canvas.height / rowCnt);

		// Center maze on screen
		this.offsetX = (canvas.width - colCnt * this.cellSize) / 2;
		this.offsetY = (canvas.height - rowCnt * this.cellSize) / 2;

		// Instantiate all cells
		this.reset();
	}
	reset() {
		for (let y = 0; y < this.rowCnt; y++) {
			for (let x = 0; x < this.colCnt; x++) {
				this.cells[y * this.colCnt + x] = {
					index: y * this.colCnt + x,
					x,
					y,
					screenX: Math.floor(x * this.cellSize),
					screenY: Math.floor(y * this.cellSize),
					open: false,
					walls: [true, true, true, true],
				};
			}
		}
	}
	drawWalls(ctx: CanvasRenderingContext2D) {
		ctx.beginPath();
		const cellSize = this.cellSize;
		for (const { walls, x, y, screenX, screenY, open } of this.cells) {
			if (!open) continue;
			for (let i = 0; i < 4; i++) {
				if (walls[i]) {
					switch (i) {
						case 0: // Top
							if (y < 0) break;
							ctx.moveTo(screenX + this.offsetX, screenY + this.offsetY);
							ctx.lineTo(screenX + this.offsetX + cellSize, screenY + this.offsetY);
							break;
						case 1: // Right
							if (x >= this.colCnt) break;
							ctx.moveTo(screenX + this.offsetX + cellSize, screenY + this.offsetY);
							ctx.lineTo(
								screenX + this.offsetX + cellSize,
								screenY + this.offsetY + cellSize
							);
							break;
						case 2: // Bottom
							if (y >= this.rowCnt) break;
							ctx.moveTo(
								screenX + this.offsetX + cellSize,
								screenY + this.offsetY + cellSize
							);
							ctx.lineTo(screenX + this.offsetX, screenY + this.offsetY + cellSize);
							break;
						case 3: // Left
							if (x < 0) break;
							ctx.moveTo(screenX + this.offsetX, screenY + this.offsetY + cellSize);
							ctx.lineTo(screenX + this.offsetX, screenY + this.offsetY);
							break;
					}
				}
			}
		}
		ctx.strokeStyle = "white";
		ctx.lineWidth = 2;
		ctx.lineCap = "butt";
		ctx.stroke();
	}
}
