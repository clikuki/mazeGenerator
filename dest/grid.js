export class Cell {
    gridIndex;
    gridX;
    gridY;
    screenX;
    screenY;
    size;
    open = false;
    walls = [true, true, true, true];
    constructor(grid, i, j, s) {
        this.gridIndex = j * grid.colCnt + i;
        this.gridX = i;
        this.gridY = j;
        this.screenX = Math.floor(i * s);
        this.screenY = Math.floor(j * s);
        this.size = s;
    }
    grayOut(canvas, ctx) {
        ctx.fillStyle = `hsla(0, 0%, 15%)`;
        ctx.fillRect(Math.floor(this.screenX + (!this.screenX && this.walls[3] ? 0 : 1)), Math.ceil(this.screenY + (!this.screenY && this.walls[0] ? 0 : 1)), Math.floor(this.size + (this.screenX >= canvas.width && this.walls[1] ? 0 : 1)), Math.ceil(this.size + (this.screenY >= canvas.height && this.walls[2] ? 0 : 1)));
    }
    drawWalls(ctx) {
        // Walls
        ctx.strokeStyle = 'white';
        const path = new Path2D();
        for (let i = 0; i < 4; i++) {
            if (this.walls[i]) {
                switch (i) {
                    case 0: // Top
                        path.moveTo(this.screenX, this.screenY);
                        path.lineTo(this.screenX + this.size, this.screenY);
                        break;
                    case 1: // Right
                        path.moveTo(this.screenX + this.size, this.screenY);
                        path.lineTo(this.screenX + this.size, this.screenY + this.size);
                        break;
                    case 2: // Bottom
                        path.moveTo(this.screenX + this.size, this.screenY + this.size);
                        path.lineTo(this.screenX, this.screenY + this.size);
                        break;
                    case 3: // Left
                        path.moveTo(this.screenX, this.screenY + this.size);
                        path.lineTo(this.screenX, this.screenY);
                        break;
                }
            }
        }
        ctx.stroke(path);
    }
}
export class Grid {
    colCnt;
    rowCnt;
    cellSize;
    cells = [];
    centerOffsetX;
    centerOffsetY;
    constructor(colCnt, rowCnt, canvas) {
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
    drawWalls(ctx) {
        for (const cell of this.cells) {
            if (cell.open)
                cell.drawWalls(ctx);
        }
    }
    drawGrayedCells(canvas, ctx) {
        for (const cell of this.cells) {
            if (!cell.open)
                cell.grayOut(canvas, ctx);
        }
    }
}
//# sourceMappingURL=grid.js.map