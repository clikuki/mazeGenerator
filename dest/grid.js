export class Grid {
    colCnt;
    rowCnt;
    cellSize;
    cells = [];
    offsetX;
    offsetY;
    constructor(colCnt, rowCnt, canvas) {
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
                            ctx.moveTo(screenX + this.offsetX, screenY + this.offsetY);
                            ctx.lineTo(screenX + this.offsetX + cellSize, screenY + this.offsetY);
                            break;
                        case 1: // Right
                            if (x >= this.colCnt - 1)
                                break;
                            ctx.moveTo(screenX + this.offsetX + cellSize, screenY + this.offsetY);
                            ctx.lineTo(screenX + this.offsetX + cellSize, screenY + this.offsetY + cellSize);
                            break;
                        case 2: // Bottom
                            if (y >= this.rowCnt - 1)
                                break;
                            ctx.moveTo(screenX + this.offsetX + cellSize, screenY + this.offsetY + cellSize);
                            ctx.lineTo(screenX + this.offsetX, screenY + this.offsetY + cellSize);
                            break;
                        case 3: // Left
                            if (x <= 0)
                                break;
                            ctx.moveTo(screenX + this.offsetX, screenY + this.offsetY + cellSize);
                            ctx.lineTo(screenX + this.offsetX, screenY + this.offsetY);
                            break;
                    }
                }
            }
        }
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.lineCap = "square";
        ctx.stroke();
    }
    drawGrayedCells(ctx) {
        const cellSize = this.cellSize;
        ctx.beginPath();
        for (const { walls, screenX: x, screenY: y, open } of this.cells) {
            if (!open) {
                // Do all this to fix the spaces between cells on larger grids
                const w = Math.ceil(cellSize + (walls[1] ? 0 : 1));
                const h = Math.ceil(cellSize + (walls[2] ? 0 : 1));
                ctx.moveTo(x + this.offsetX, y + this.offsetY);
                ctx.lineTo(x + this.offsetX + w, y + this.offsetY);
                ctx.lineTo(x + this.offsetX + w, y + this.offsetY + h);
                ctx.lineTo(x + this.offsetX, y + this.offsetY + h);
                ctx.moveTo(x + this.offsetX, y + this.offsetY);
            }
        }
        ctx.fillStyle = "#222";
        ctx.fill();
    }
}
//# sourceMappingURL=grid.js.map