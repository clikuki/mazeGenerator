import { convertGridToGraph, PriorityQueue } from './utils.js';
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
    aStarPhase = false;
    pathDrawMethod = pathDrawMethodList[0];
    path;
    // Dead-end filling
    graph;
    current;
    deadEnds = [];
    filledNodes = new Set();
    grayOutFilledNodes = false;
    // A*
    open = new PriorityQueue((a, b) => this.calculateHueristics(b) - this.calculateHueristics(a));
    closed = new Set(); // Used only for drawing purposes, could be removed!
    gScore = [];
    fScore = [];
    hMem = [];
    comeFrom = [];
    hMult = 1; // TODO: Setting to 0 should make it act like djikstra (dist * 0 = 0), but instead its acting weird. Might have to do with the queue?
    distanceMethod;
    constructor(grid, from, to, options) {
        this.grid = grid;
        this.from = from;
        this.to = to;
        this.aStarPhase = options.useDeadEndFilling;
        this.distanceMethod = options.distanceMethod;
        this.hMult = options.hMult;
        // Precompute some data
        this.graph = convertGridToGraph(grid, grid.cells[from]);
        this.current = this.graph.get(grid.cells[from]);
        for (let i = 0; i < grid.cells.length; i++) {
            const cell = grid.cells[i];
            const cellWallCount = cell.walls.filter((w) => w).length;
            if (cell.open && ![from, to].includes(cell.index) && cellWallCount >= 3) {
                this.deadEnds.push(this.graph.get(cell));
            }
            this.gScore[i] = Infinity;
            this.fScore[i] = Infinity;
        }
        this.open.add(from);
        this.gScore[from] = 0;
        this.fScore[from] = this.calculateHueristics(from);
    }
    calculateHueristics(from) {
        if (this.hMem[from] === undefined) {
            const x1 = from % this.grid.colCnt;
            const y1 = Math.floor(from / this.grid.colCnt);
            const x2 = this.to % this.grid.colCnt;
            const y2 = Math.floor(this.to / this.grid.colCnt);
            switch (this.distanceMethod) {
                case 'EUCLIDEAN':
                    this.hMem[from] = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                    break;
                case 'MANHATTAN':
                    this.hMem[from] = Math.abs(x2 - x1) + Math.abs(y2 - y1);
                    break;
            }
            this.hMem[from] *= this.hMult;
        }
        return this.hMem[from];
    }
    tracePath() {
        const path = [];
        let index = this.to;
        while (this.comeFrom[index] !== undefined) {
            path.push(index);
            index = this.comeFrom[index];
        }
        path.push(index);
        return path.reverse();
    }
    step() {
        if (this.isComplete)
            return;
        if (this.aStarPhase) {
            // A* to narrow paths
            // TODO: optimize for larger grids, and just in general
            if (this.open.size === 0) {
                this.isComplete = true;
                throw 'A* cannot reach destination';
            }
            const index = this.open.poll();
            if (index === this.to) {
                // Destination reached!
                this.isComplete = true;
                this.path = this.tracePath();
                return;
            }
            this.closed.add(index);
            const g = this.gScore[index];
            const directions = [-this.grid.colCnt, 1, this.grid.colCnt, -1];
            for (let i = 0; i < directions.length; i++) {
                const dir = directions[i];
                const neighborIndex = index + dir;
                const neighbor = this.grid.cells[neighborIndex];
                if (!neighbor)
                    continue;
                // Prevent Walker from going over left and right edges
                if (Math.abs(dir) === 1 &&
                    neighbor.screenY !== this.grid.cells[index].screenY)
                    continue;
                if (this.grid.cells[index].walls[i])
                    continue;
                if (this.filledNodes.has(this.graph.get(neighbor)))
                    continue;
                const newG = g + 1; // changing g score doesn't seem to change anything?
                if (newG < this.gScore[neighborIndex]) {
                    this.open.add(neighborIndex);
                    this.comeFrom[neighborIndex] = index;
                    this.gScore[neighborIndex] = newG;
                    this.fScore[neighborIndex] =
                        newG + this.calculateHueristics(neighborIndex);
                }
            }
        }
        else {
            // Dead-end filling
            const newDeadEnds = [];
            for (let i = 0; i < this.deadEnds.length; i++) {
                const node = this.deadEnds[i];
                this.filledNodes.add(node);
                for (const neighbor of node.neighbors) {
                    if (neighbor.walls++ < 2 ||
                        this.filledNodes.has(neighbor) ||
                        [this.from, this.to].includes(neighbor.cell.index)) {
                        continue;
                    }
                    newDeadEnds.push(neighbor);
                    break;
                }
            }
            this.deadEnds = newDeadEnds;
            if (this.deadEnds.length === 0)
                this.aStarPhase = true;
        }
    }
    draw(ctx) {
        const cellSize = this.grid.cellSize;
        const fromCell = this.grid.cells[this.from];
        const toCell = this.grid.cells[this.to];
        if (!this.isComplete || this.pathDrawMethod === 'LINE') {
            ctx.fillStyle = arrayToClrStr(startColor);
            ctx.fillRect(fromCell.screenX, fromCell.screenY, cellSize, cellSize);
            ctx.fillStyle = arrayToClrStr(endColor);
            ctx.fillRect(toCell.screenX, toCell.screenY, cellSize, cellSize);
        }
        if (!this.isComplete && this.aStarPhase) {
            for (let i = 0; i < this.grid.cells.length; i++) {
                if (this.filledNodes.has(this.graph.get(this.grid.cells[i])))
                    continue;
                // F number
                const { screenX, screenY } = this.grid.cells[i];
                const x = screenX + cellSize / 2;
                const y = screenY + cellSize / 2;
                ctx.fillStyle = '#fff';
                ctx.font = `${cellSize / 3}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (this.fScore[i] === Infinity)
                    ctx.fillText('∞', x, y);
                else
                    ctx.fillText(String(+this.fScore[i].toPrecision(2)), x, y);
                // Cell clr
                let color;
                if (this.open.heap.includes(i))
                    color = '#0e0a';
                else if (this.closed.has(i))
                    color = '#e00a';
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(screenX, screenY, cellSize, cellSize);
                }
            }
        }
        if (this.isComplete && this.path) {
            switch (this.pathDrawMethod) {
                case 'GRADIENT':
                    for (let i = 0; i < this.path.length; i++) {
                        const { screenX, screenY } = this.grid.cells[this.path[i]];
                        const progress = i / (this.path.length - 1);
                        const color = lerpClr(startColor, endColor, progress);
                        ctx.fillStyle = arrayToClrStr(color);
                        ctx.fillRect(Math.floor(screenX), Math.floor(screenY), Math.ceil(cellSize), Math.ceil(cellSize));
                    }
                    break;
                case 'LINE':
                    {
                        const linePath = new Path2D();
                        let isStartCell = true;
                        for (const index of this.path) {
                            const { screenX, screenY } = this.grid.cells[index];
                            if (isStartCell)
                                linePath.moveTo(screenX, screenY);
                            else
                                linePath.lineTo(screenX, screenY);
                            isStartCell = false;
                        }
                        const circlePath = new Path2D();
                        const circleRX = cellSize * 0.05;
                        const circleRY = cellSize * 0.05;
                        for (const { screenX, screenY } of [fromCell, toCell]) {
                            circlePath.ellipse(screenX, screenY, circleRX, circleRY, 0, 0, Math.PI * 2);
                        }
                        ctx.save();
                        ctx.translate(this.grid.cellSize / 2, cellSize / 2);
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
            for (const { cell: { screenX, screenY }, } of this.filledNodes) {
                grayPath.moveTo(screenX, screenY);
                grayPath.lineTo(screenX + cellSize, screenY);
                grayPath.lineTo(screenX + cellSize, screenY + cellSize);
                grayPath.lineTo(screenX, screenY + cellSize);
                grayPath.lineTo(screenX, screenY);
            }
            ctx.fillStyle = '#fff2';
            ctx.fill(grayPath);
        }
    }
}
//# sourceMappingURL=mazeSolver.js.map