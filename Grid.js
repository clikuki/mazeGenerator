class Cell {
	constructor(i, j, w, h) {
		this.i = i;
		this.j = j;
		this.x = i * w;
		this.y = j * h;
		this.w = w + 1;
		this.h = h + 1;
		this.visited = false;
		this.filled = false;
		this.walls = [true, true, true, true];
	}
	draw() {
		if (!this.visited || this.filled) {
			fill(70);
			noStroke();
			rect(this.x, this.y, this.w, this.h);
		}

		stroke(255);
		beginShape(LINES);
		for (let i = 0; i < 4; i++) {
			if (this.walls[i]) {
				switch (i) {
					case 0: // Top
						if (!this.y) break;
						vertex(this.x, this.y);
						vertex(this.x + this.w, this.y);
						break;
					case 1: // Right
						if (this.x >= width) break;
						vertex(this.x + this.w, this.y);
						vertex(this.x + this.w, this.y + this.h);
						break;
					case 2: // Bottom
						if (this.y >= height) break;
						vertex(this.x + this.w, this.y + this.h);
						vertex(this.x, this.y + this.h);
						break;
					case 3: // Left
						if (!this.x) break;
						vertex(this.x, this.y + this.h);
						vertex(this.x, this.y);
						break;
				}
			}
		}
		endShape();
	}
}

class Grid extends Array {
	constructor(colCnt, rowCnt, cellWidth, cellHeight) {
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
	draw() {
		for (const cell of this) {
			cell.draw();
		}
	}
}
