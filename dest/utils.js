export function randomItemInArray(arr) {
    if (arr.length === 1)
        return arr[0];
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}
export function convertGridToGraph(grid, start = grid.cells[0]) {
    const directions = [-grid.colCnt, 1, grid.colCnt, -1];
    const visited = new Set();
    const nodeMap = new Map();
    const stack = [[null, start]];
    function convert([parent, cell]) {
        const node = {
            cell: cell,
            neighbors: [],
            walls: cell.walls.filter((w) => w).length,
        };
        if (parent) {
            nodeMap.get(parent).neighbors.push(node);
        }
        visited.add(cell);
        nodeMap.set(cell, node);
        for (let i = 0; i < directions.length; i++) {
            const dir = directions[i];
            const neighbor = grid.cells[cell.index + dir];
            if (neighbor !== undefined && !cell.walls[i]) {
                if (visited.has(neighbor))
                    node.neighbors.push(nodeMap.get(neighbor));
                else
                    stack.push([cell, neighbor]);
            }
        }
    }
    while (stack.length) {
        convert(stack.pop());
    }
    return nodeMap;
}
export function shuffle(arr) {
    let shuffledCount = 0;
    const shuffled = [...arr];
    while (shuffledCount < arr.length) {
        const index = Math.random() * (arr.length - shuffledCount++);
        shuffled.push(shuffled.splice(index, 1)[0]);
    }
    return shuffled;
}
//# sourceMappingURL=utils.js.map