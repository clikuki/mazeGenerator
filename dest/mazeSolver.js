export class BreadthFirstSearch {
    isComplete;
    path;
    from;
    to;
    grid;
    constructor(grid, from, to) {
        this.grid = grid;
        this.from = from;
        this.to = to;
    }
    step() { }
    draw(ctx) {
        if (this.isComplete)
            return;
    }
}
export const solverKeyMap = new Map([
    ["bfs", BreadthFirstSearch],
]);
//# sourceMappingURL=mazeSolver.js.map