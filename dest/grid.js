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
        for (let y = 0; y < rowCnt; y++) {
            for (let x = 0; x < colCnt; x++) {
                const cell = {
                    index: y * colCnt + x,
                    x,
                    y,
                    screenX: Math.floor(x * this.cellSize),
                    screenY: Math.floor(y * this.cellSize),
                    open: false,
                    walls: [true, true, true, true],
                };
                this.cells[y * colCnt + x] = cell;
            }
        }
    }
    drawWalls(ctx) {
        ctx.beginPath();
        const cellSize = this.cellSize;
        for (const { walls, x, y, screenX, screenY, open } of this.cells) {
            if (!open)
                continue;
            for (let i = 0; i < 4; i++) {
                if (walls[i]) {
                    switch (i) {
                        case 0: // Top
                            if (y <= 0)
                                break;
                            ctx.moveTo(screenX, screenY);
                            ctx.lineTo(screenX + cellSize, screenY);
                            break;
                        case 1: // Right
                            if (x >= this.colCnt - 1)
                                break;
                            ctx.moveTo(screenX + cellSize, screenY);
                            ctx.lineTo(screenX + cellSize, screenY + cellSize);
                            break;
                        case 2: // Bottom
                            if (y >= this.rowCnt - 1)
                                break;
                            ctx.moveTo(screenX + cellSize, screenY + cellSize);
                            ctx.lineTo(screenX, screenY + cellSize);
                            break;
                        case 3: // Left
                            if (x <= 0)
                                break;
                            ctx.moveTo(screenX, screenY + cellSize);
                            ctx.lineTo(screenX, screenY);
                            break;
                    }
                }
            }
        }
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    drawGrayedCells(canvas, ctx) {
        const cellSize = this.cellSize;
        ctx.beginPath();
        for (const { walls, screenX: x, screenY: y, open } of this.cells) {
            if (!open) {
                // Do all this to fix the spaces between cells on larger grids
                const w = Math.ceil(cellSize + (screenX >= canvas.width && walls[1] ? 0 : 1));
                const h = Math.ceil(cellSize + (screenY >= canvas.height && walls[2] ? 0 : 1));
                ctx.moveTo(x, y);
                ctx.lineTo(x + w, y);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x, y + h);
                ctx.moveTo(x, y);
            }
        }
        ctx.fillStyle = '#333';
        ctx.fill();
    }
}
//# sourceMappingURL=grid.js.map