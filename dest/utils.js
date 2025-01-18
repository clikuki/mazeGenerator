export function randIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
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
export function swap(arr, i, j) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return arr;
}
export class PriorityQueue {
    heap;
    isGreater;
    constructor(comparator, init = []) {
        this.heap = init;
        this.isGreater = (a, b) => comparator(init[a], init[b]) > 0;
    }
    get size() {
        return this.heap.length;
    }
    peek() {
        return this.heap[0];
    }
    add(value) {
        this.heap.push(value);
        this.#siftUp();
    }
    poll(heap = this.heap, value = heap[0], length = heap.length) {
        if (length)
            swap(heap, 0, length - 1);
        heap.pop();
        this.#siftDown();
        return value;
    }
    #siftUp(node = this.size - 1, parent = ((node + 1) >>> 1) - 1) {
        for (; node && this.isGreater(node, parent); node = parent, parent = ((node + 1) >>> 1) - 1) {
            swap(this.heap, node, parent);
        }
    }
    #siftDown(size = this.size, node = 0, isGreater = this.isGreater) {
        while (true) {
            const leftNode = (node << 1) + 1;
            const rightNode = leftNode + 1;
            if ((leftNode >= size || isGreater(node, leftNode)) &&
                (rightNode >= size || isGreater(node, rightNode))) {
                break;
            }
            const maxChild = rightNode < size && isGreater(rightNode, leftNode) ? rightNode : leftNode;
            swap(this.heap, node, maxChild);
            node = maxChild;
        }
    }
}
export const HTML = {
    getOne(selectors, base = document.body) {
        return base.querySelector(selectors);
    },
    getAll(selectors, base = document.body) {
        return Array.from(base.querySelectorAll(selectors));
    },
};
//# sourceMappingURL=utils.js.map