import { convertGridToGraph } from './utils.js';
// Only works for perfect mazes, which are the only mazes I make
function nodeToPath(start, filled) {
    const visited = new Set();
    const path = [];
    let current = start;
    mainLoop: while (current !== null) {
        visited.add(current);
        path.push(current.cell);
        for (const neighbor of current.neighbors) {
            if (filled.has(neighbor) || visited.has(neighbor))
                continue;
            current = neighbor;
            continue mainLoop;
        }
        current = null;
    }
    return path;
}
const startColor = [0, 0, 255];
const endColor = [255, 0, 0];
function lerp(a, b, p) {
    return (b - a) * p + a;
}
function lerpClr([a1, a2, a3], [b1, b2, b3], p) {
    return [lerp(a1, b1, p), lerp(a2, b2, p), lerp(a3, b3, p)];
}
function arrayToClrStr([r, g, b]) {
    return `rgb(${r}, ${g}, ${b})`;
}
export const pathDrawMethodList = ['GRADIENT', 'LINE'];
export class MazeSolver {
    grid;
    from;
    to;
    isComplete = false;
    directions;
    corridorsToFill = [];
    filledNodes = new Set();
    graph;
    current;
    grayOutFilledNodes = false;
    pathDrawMethod = pathDrawMethodList[0];
    path;
    constructor(grid, from, to) {
        this.grid = grid;
        this.from = from;
        this.to = to;
        this.directions = [-grid.colCnt, 1, grid.colCnt, -1];
        // Precompute some data
        this.graph = convertGridToGraph(grid, grid.cells[from]);
        this.current = this.graph.get(grid.cells[from]);
        for (let i = 0; i < grid.cells.length; i++) {
            const cell = grid.cells[i];
            const cellWallCount = cell.walls.filter((w) => w).length;
            if (cell.open &&
                cell.gridIndex !== this.from &&
                cell.gridIndex !== this.to &&
                cellWallCount >= 3) {
                this.corridorsToFill.push(this.graph.get(cell));
            }
        }
    }
    step() {
        if (this.isComplete)
            return;
        // Dead-end filling
        let hasReplacedCell = false;
        for (let i = 0; i < this.corridorsToFill.length; i++) {
            const node = this.corridorsToFill[i];
            if (!node)
                continue;
            this.filledNodes.add(node);
            this.corridorsToFill[i] = null;
            for (const neighbor of node.neighbors) {
                if (neighbor.walls++ < 2 ||
                    this.filledNodes.has(neighbor) ||
                    neighbor.cell === this.grid.cells[this.from] ||
                    neighbor.cell === this.grid.cells[this.to]) {
                    continue;
                }
                this.corridorsToFill[i] = neighbor;
                hasReplacedCell = true;
                break;
            }
        }
        if (!hasReplacedCell) {
            this.isComplete = true;
            this.path = nodeToPath(this.graph.get(this.grid.cells[this.from]), this.filledNodes);
            return;
        }
    }
    draw(ctx) {
        const fromCell = this.grid.cells[this.from];
        const toCell = this.grid.cells[this.to];
        if (!this.isComplete || this.pathDrawMethod === 'LINE') {
            ctx.fillStyle = arrayToClrStr(startColor);
            ctx.fillRect(fromCell.screenX, fromCell.screenY, this.grid.cellSize, this.grid.cellSize);
            ctx.fillStyle = arrayToClrStr(endColor);
            ctx.fillRect(toCell.screenX, toCell.screenY, this.grid.cellSize, this.grid.cellSize);
        }
        if (this.isComplete && this.path) {
            switch (this.pathDrawMethod) {
                case 'GRADIENT':
                    for (let i = 0; i < this.path.length; i++) {
                        const cell = this.path[i];
                        const progress = i / (this.path.length - 1);
                        const color = lerpClr(startColor, endColor, progress);
                        ctx.fillStyle = arrayToClrStr(color);
                        ctx.fillRect(cell.screenX, cell.screenY, this.grid.cellSize, this.grid.cellSize);
                    }
                    break;
                case 'LINE':
                    {
                        const linePath = new Path2D();
                        let isStartCell = true;
                        for (const cell of this.path) {
                            if (isStartCell)
                                linePath.moveTo(cell.screenX, cell.screenY);
                            else
                                linePath.lineTo(cell.screenX, cell.screenY);
                            isStartCell = false;
                        }
                        const circlePath = new Path2D();
                        const circleRX = this.grid.cellSize * 0.05;
                        const circleRY = this.grid.cellSize * 0.05;
                        for (const cell of [fromCell, toCell]) {
                            circlePath.ellipse(cell.screenX, cell.screenY, circleRX, circleRY, 0, 0, Math.PI * 2);
                        }
                        ctx.save();
                        ctx.translate(this.grid.cellSize / 2, this.grid.cellSize / 2);
                        ctx.strokeStyle = '#0f0';
                        ctx.stroke(linePath);
                        ctx.fillStyle = ctx.strokeStyle;
                        ctx.fill(circlePath);
                        ctx.restore();
                    }
                    break;
                default:
                    throw 'Invalid path draw method';
            }
        }
        else {
            const grayPath = new Path2D();
            for (const { cell } of this.filledNodes) {
                grayPath.moveTo(cell.screenX, cell.screenY);
                grayPath.lineTo(cell.screenX + cell.size, cell.screenY);
                grayPath.lineTo(cell.screenX + cell.size, cell.screenY + cell.size);
                grayPath.lineTo(cell.screenX, cell.screenY + cell.size);
                grayPath.lineTo(cell.screenX, cell.screenY);
            }
            ctx.fillStyle = '#fff2';
            ctx.fill(grayPath);
        }
    }
}
//# sourceMappingURL=mazeSolver.js.map