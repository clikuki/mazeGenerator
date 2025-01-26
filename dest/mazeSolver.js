import { settings } from "./settings.js";
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
        ctx.save();
        ctx.translate(this.grid.offsetX + this.grid.cellSize / 2, this.grid.offsetY + this.grid.cellSize / 2);
        ctx.beginPath();
        for (let i = 0; i < this.cellMap.length; i++) {
            if (isNaN(this.cellMap[i]))
                continue;
            const from = this.grid.cells[i];
            const to = this.grid.cells[this.cellMap[i]];
            ctx.moveTo(from.screenX, from.screenY);
            ctx.lineTo(to.screenX, to.screenY);
        }
        ctx.strokeStyle = "#f90";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
    }
}
export const solverKeyMap = new Map([
    ["graphSearch", GraphSearch],
]);
//# sourceMappingURL=mazeSolver.js.map