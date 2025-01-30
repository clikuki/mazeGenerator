import { settings } from "./settings.js";
import { randomItemInArray } from "./utils.js";
function getAdjacentCells(grid, index) {
    const cell = grid.cells[index];
    const adj = [];
    if (!cell.walls[0])
        adj.push(index - grid.colCnt);
    if (!cell.walls[1])
        adj.push(index + 1);
    if (!cell.walls[2])
        adj.push(index + grid.colCnt);
    if (!cell.walls[3])
        adj.push(index - 1);
    return adj;
}
export class GraphSearch {
    isComplete;
    from;
    to;
    grid;
    useBfs;
    path;
    checkList;
    cellMap = [];
    constructor(grid, from, to) {
        this.grid = grid;
        this.from = from;
        this.to = to;
        this.cellMap[from] = NaN;
        this.checkList = [from];
        this.useBfs = settings.get("graphTraversalSolve") === "bfs";
    }
    step() {
        if (this.isComplete)
            return;
        if (!this.checkList.length) {
            this.isComplete = true;
            return;
        }
        const cell = this.useBfs ? this.checkList.shift() : this.checkList.pop();
        if (cell === this.to) {
            this.isComplete = true;
            this.path = [];
            let head = this.to;
            while (!isNaN(head)) {
                this.path.push(head);
                head = this.cellMap[head];
            }
            this.path.push(this.from);
            return;
        }
        const neighbors = getAdjacentCells(this.grid, cell);
        for (const neighbor of neighbors) {
            if (this.cellMap[neighbor] !== undefined)
                continue;
            this.cellMap[neighbor] = cell;
            this.checkList.push(neighbor);
        }
    }
    draw(ctx) {
        if (this.isComplete) {
            this.grid.paintPath(ctx, this.path, "#0f0");
            return;
        }
        this.grid.paintConnections(ctx, this.cellMap, "#f90");
    }
}
export class DeadEndFilling {
    isComplete;
    failed = false;
    from;
    to;
    grid;
    mode = 0;
    path;
    head;
    filledIn = new Set();
    adjacencies;
    constructor(grid, from, to) {
        this.grid = grid;
        this.from = from;
        this.to = to;
        this.head = 0;
        this.path = [from];
        this.adjacencies = grid.cells.map((c) => getAdjacentCells(grid, c.index));
    }
    isDeadEnd(index) {
        if (this.filledIn.has(index))
            return false;
        if (index === this.from)
            return false;
        if (index === this.to)
            return false;
        const neighbors = this.adjacencies[index].filter((d) => !this.filledIn.has(d));
        return neighbors.length <= 1;
    }
    step() {
        if (this.isComplete)
            return;
        if (this.mode === 0) {
            // Search for dead ends
            if (this.isDeadEnd(this.head)) {
                this.mode = 1;
            }
            else if (++this.head >= this.grid.cells.length) {
                this.mode = 2;
                this.head = this.from;
            }
        }
        else if (this.mode === 1) {
            // Follow dead end
            this.filledIn.add(this.head);
            const neighbors = this.adjacencies[this.head];
            this.mode = 0;
            this.head = 0;
            for (const neighbor of neighbors) {
                if (this.isDeadEnd(neighbor)) {
                    this.head = neighbor;
                    this.mode = 1;
                }
            }
        }
        else if (this.mode === 2) {
            // Walk through unfilled cells
            if (this.head === this.to) {
                this.isComplete = true;
                return;
            }
            for (const neighbor of this.adjacencies[this.head]) {
                if (this.filledIn.has(neighbor))
                    continue;
                if (this.path.includes(neighbor))
                    continue;
                this.head = neighbor;
                this.path.push(this.head);
                return;
            }
            this.isComplete = this.failed = true;
            throw Error("Could not find path");
        }
    }
    draw(ctx) {
        if (this.mode === 2) {
            const clr = this.failed ? "#f00" : "#0f0";
            this.grid.paintPath(ctx, this.path, clr);
        }
        if (this.isComplete)
            return;
        for (const cell of this.filledIn) {
            this.grid.paintRect(ctx, cell, 1, 1, "#333");
        }
        if (this.mode === 2)
            this.grid.paintCircle(ctx, this.head, "#0a0");
        else
            this.grid.paintRect(ctx, this.head, 1, 1, "#0a0");
    }
}
export class RandomWalk {
    isComplete;
    failed = false;
    from;
    to;
    grid;
    path;
    head;
    cellMap = [];
    constructor(grid, from, to) {
        this.grid = grid;
        this.from = from;
        this.to = to;
        this.head = from;
    }
    step() {
        if (this.isComplete)
            return;
        const neighbors = getAdjacentCells(this.grid, this.head);
        const neighbor = randomItemInArray(neighbors);
        this.cellMap[this.head] = neighbor;
        this.head = neighbor;
        if (this.head === this.to) {
            this.isComplete = true;
            this.path = [];
            let head = this.from;
            while (head !== this.to) {
                this.path.push(head);
                head = this.cellMap[head];
            }
            this.path.push(this.to);
        }
    }
    draw(ctx) {
        if (this.isComplete) {
            this.grid.paintPath(ctx, this.path, "#0f0");
            return;
        }
        ctx.save();
        ctx.translate(this.grid.offsetX + this.grid.cellSize / 2, this.grid.offsetY + this.grid.cellSize / 2);
        ctx.beginPath();
        const visited = new Set();
        let head = this.from;
        while (head !== this.to) {
            const from = this.grid.cells[head];
            const to = this.grid.cells[this.cellMap[head]];
            if (!to || visited.has(head))
                break;
            visited.add(head);
            ctx.moveTo(from.screenX, from.screenY);
            ctx.lineTo(to.screenX, to.screenY);
            head = this.cellMap[head];
        }
        ctx.strokeStyle = "#f90";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
    }
}
export class AStar {
    isComplete;
    from;
    to;
    grid;
    distanceFunction;
    path;
    cellMap = [];
    distanceMap;
    estimatedCostMap;
    frontier;
    adjacencies;
    constructor(grid, from, to) {
        this.grid = grid;
        this.from = from;
        this.to = to;
        this.distanceFunction = settings.get("heuristicDistance") ?? "taxicab";
        this.frontier = new Set([from]);
        this.distanceMap = grid.cells.map(() => Infinity);
        this.estimatedCostMap = grid.cells.map(() => Infinity);
        this.adjacencies = grid.cells.map((c) => getAdjacentCells(grid, c.index));
        this.distanceMap[from] = 0;
        this.estimatedCostMap[from] = this.distanceFromEnd(from);
    }
    get #nextFrontier() {
        let bestCost = Infinity;
        let bestIndex = NaN;
        for (const index of this.frontier) {
            const estimatedCost = this.estimatedCostMap[index];
            if (estimatedCost < bestCost) {
                bestCost = estimatedCost;
                bestIndex = index;
            }
        }
        return bestIndex;
    }
    distanceFromEnd(i) {
        const ca = this.grid.cells[i];
        const cb = this.grid.cells[this.to];
        switch (this.distanceFunction) {
            case "euclidean":
                return Math.sqrt((cb.x - ca.x) ** 2 + (cb.y - ca.y) ** 2);
            case "chebyshev":
                return Math.max(Math.abs(ca.x - cb.x), Math.abs(ca.y - cb.y));
            case "taxicab":
            default:
                return Math.abs(ca.x - cb.x) + Math.abs(ca.y - cb.y);
        }
    }
    step() {
        if (this.isComplete)
            return;
        const head = this.#nextFrontier;
        if (head === this.to) {
            this.path = [];
            let head = this.to;
            while (head !== this.from) {
                this.path.push(head);
                head = this.cellMap[head];
            }
            this.path.push(this.from);
            this.isComplete = true;
            return;
        }
        this.frontier.delete(head);
        for (const neighbor of this.adjacencies[head]) {
            const distance = this.distanceMap[head] + 1;
            if (distance < this.distanceMap[neighbor]) {
                this.cellMap[neighbor] = head;
                this.distanceMap[neighbor] = distance;
                this.estimatedCostMap[neighbor] = distance + this.distanceFromEnd(neighbor);
                this.frontier.add(neighbor);
            }
        }
    }
    draw(ctx) {
        if (this.isComplete) {
            this.grid.paintPath(ctx, this.path, "#0f0");
            return;
        }
        for (const index of this.frontier) {
            this.grid.paintRect(ctx, index, 1, 1, "#a00");
        }
        this.grid.paintConnections(ctx, this.cellMap, "#f90");
    }
}
export class Tremaux {
    isComplete;
    from;
    to;
    grid;
    fail = false;
    path;
    head;
    marks;
    adjacencies;
    constructor(grid, from, to) {
        this.grid = grid;
        this.from = from;
        this.to = to;
        this.head = from;
        this.marks = Array(grid.cells.length * 2).fill(0);
        this.adjacencies = grid.cells.map((c) => getAdjacentCells(grid, c.index));
    }
    #getMarkIndex(a, b) {
        const cellIndex = Math.min(a, b);
        const markIndex = cellIndex * 2 + +(Math.abs(b - a) === 1);
        return markIndex;
    }
    #addMark(a, b) {
        const markIndex = this.#getMarkIndex(a, b);
        this.marks[markIndex]++;
    }
    #getMark(a, b) {
        const markIndex = this.#getMarkIndex(a, b);
        return this.marks[markIndex];
    }
    step() {
        if (this.isComplete)
            return;
        if (this.head === this.to) {
            this.isComplete = true;
            this.path = [];
            while (this.head !== this.from) {
                if (this.path.includes(this.head)) {
                    // Somethings gone wrong...
                    this.fail = true;
                    console.error("Could not find solution!");
                    break;
                }
                this.path.push(this.head);
                // Find any one mark neighbor
                for (const index of this.adjacencies[this.head]) {
                    if (!this.path.includes(index) && this.#getMark(this.head, index) === 1) {
                        this.head = index;
                        break;
                    }
                }
            }
            if (!this.fail)
                this.path.push(this.from);
            return;
        }
        let neighbors = [];
        let lowestMarks = Infinity;
        for (const index of this.adjacencies[this.head]) {
            const numOfMarks = this.#getMark(this.head, index);
            if (numOfMarks < lowestMarks) {
                neighbors = [index];
                lowestMarks = numOfMarks;
            }
            else if (numOfMarks === lowestMarks) {
                neighbors.push(index);
            }
        }
        const prev = this.head;
        this.head = randomItemInArray(neighbors);
        this.#addMark(prev, this.head);
    }
    draw(ctx) {
        if (this.isComplete) {
            const clr = this.fail ? "#fa0" : "#0f0";
            this.grid.paintPath(ctx, this.path, clr);
        }
        else
            this.grid.paintRect(ctx, this.head, 1, 1, "#0a0");
        for (let markIndex = 0; markIndex < this.marks.length; markIndex++) {
            const numOfMarks = this.marks[markIndex];
            if (numOfMarks === 0)
                continue;
            const cellIndex = Math.floor(markIndex / 2);
            const cell = this.grid.cells[cellIndex];
            ctx.save();
            ctx.translate(this.grid.offsetX + this.grid.cellSize / 2 + cell.screenX, this.grid.offsetY + this.grid.cellSize / 2 + cell.screenY);
            if (markIndex % 2 !== 0)
                ctx.rotate(-Math.PI / 2);
            if (numOfMarks === 1) {
                ctx.fillStyle = "#22f";
                ctx.fillRect(-3, this.grid.cellSize / 2 - 10, 6, 20);
            }
            else {
                ctx.fillStyle = "#d00";
                ctx.translate(0, this.grid.cellSize / 2);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-3, -10, 6, 20);
                ctx.rotate(-Math.PI / 2);
                ctx.fillRect(-3, -10, 6, 20);
            }
            ctx.restore();
        }
    }
}
export const solverKeyMap = new Map([
    ["graphSearch", GraphSearch],
    ["deadend", DeadEndFilling],
    ["randomWalk", RandomWalk],
    ["astar", AStar],
    ["tremaux", Tremaux],
]);
//# sourceMappingURL=mazeSolver.js.map