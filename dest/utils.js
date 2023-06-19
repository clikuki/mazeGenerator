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
    function convert(cell) {
        if (visited.has(cell))
            return nodeMap.get(cell);
        const node = {
            cell: cell,
            neighbors: [],
            walls: cell.walls.filter((w) => w).length,
        };
        visited.add(cell);
        nodeMap.set(cell, node);
        node.neighbors = directions
            .map((dir, i) => {
            const neighbor = grid.cells[cell.index + dir];
            if (neighbor === undefined || cell.walls[i]) {
                return [];
            }
            return convert(neighbor);
        })
            .flat();
        return node;
    }
    convert(start);
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