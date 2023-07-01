import { convertGridToGraph } from './utils.js';
function tracePath(nodes, dest) {
    const path = [];
    let node = nodes[dest];
    while (node.parent !== undefined) {
        path.push(node.index);
        node = nodes[node.parent];
    }
    path.push(node.index);
    return path.reverse();
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
    deadEndsAreFilled = false;
    pathDrawMethod = pathDrawMethodList[0];
    path;
    // Dead-end filling
    graph;
    current;
    deadEnds = [];
    filledNodes = new Set();
    grayOutFilledNodes = false;
    // A*
    nodes = [];
    open = [];
    closed = new Set();
    constructor(grid, from, to) {
        this.grid = grid;
        this.from = from;
        this.to = to;
        // Precompute some data
        this.graph = convertGridToGraph(grid, grid.cells[from]);
        this.current = this.graph.get(grid.cells[from]);
        for (let i = 0; i < grid.cells.length; i++) {
            const cell = grid.cells[i];
            const cellWallCount = cell.walls.filter((w) => w).length;
            if (cell.open && ![from, to].includes(cell.index) && cellWallCount >= 3) {
                this.deadEnds.push(this.graph.get(cell));
            }
            this.nodes[i] = {
                index: i,
                f: Infinity,
                g: Infinity,
                h: Infinity,
            };
        }
        this.nodes[from] = {
            index: from,
            f: 0,
            g: 0,
            h: 0,
        };
        this.open.push(from);
    }
    calculateHueristics(from) {
        const x1 = from % this.grid.colCnt;
        const y1 = Math.floor(from / this.grid.colCnt);
        const x2 = this.to % this.grid.colCnt;
        const y2 = Math.floor(this.to / this.grid.colCnt);
        // Manhattan distance
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }
    step() {
        if (this.isComplete)
            return;
        if (this.deadEndsAreFilled) {
            // A* to narrow paths
            // TODO: optimize for larger grids, and just in general
            if (this.open.length === 0) {
                this.isComplete = true;
                throw 'A* cannot reach destination';
            }
            const nodeIndex = this.open.reduce((lowest, index) => {
                if (this.nodes[index].f < this.nodes[lowest].f)
                    return index;
                return lowest;
            });
            const node = this.nodes[nodeIndex];
            this.open = this.open.filter((i) => i !== nodeIndex);
            this.closed.add(nodeIndex);
            if (nodeIndex === this.to) {
                // Destination reached!
                this.isComplete = true;
                this.path = tracePath(this.nodes, this.to);
                return;
            }
            const directions = [-this.grid.colCnt, 1, this.grid.colCnt, -1];
            for (let i = 0; i < directions.length; i++) {
                const dir = directions[i];
                const neighborIndex = node.index + dir;
                const neighbor = this.grid.cells[neighborIndex];
                if (!neighbor)
                    continue;
                // Prevent Walker from going over left and right edges
                if (Math.abs(dir) === 1 &&
                    neighbor.screenY !== this.grid.cells[node.index].screenY)
                    continue;
                if (this.grid.cells[nodeIndex].walls[i])
                    continue;
                if (this.filledNodes.has(this.graph.get(neighbor)))
                    continue;
                if (this.closed.has(neighborIndex))
                    continue;
                const newG = node.g + 0; // TODO: add input to change g
                const newH = this.calculateHueristics(neighborIndex);
                const newF = newG + newH;
                if (this.nodes[neighborIndex].f > newF) {
                    this.open.push(neighborIndex);
                    this.nodes[neighborIndex] = {
                        index: neighborIndex,
                        parent: nodeIndex,
                        f: newF,
                        g: newG,
                        h: newH,
                    };
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
                this.deadEndsAreFilled = true;
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
        if (!this.isComplete && this.deadEndsAreFilled) {
            for (const node of this.nodes) {
                if (this.filledNodes.has(this.graph.get(this.grid.cells[node.index])))
                    continue;
                // F number
                const { screenX, screenY } = this.grid.cells[node.index];
                const x = screenX + cellSize / 2;
                const y = screenY + cellSize / 2;
                ctx.fillStyle = '#fff';
                ctx.font = `${cellSize / 3}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (node.f === Infinity)
                    ctx.fillText('∞', x, y);
                else
                    ctx.fillText(String(+node.f.toPrecision(2)), x, y);
                // Cell clr
                let color;
                if (this.open.includes(node.index))
                    color = '#0e0a';
                else if (this.closed.has(node.index))
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