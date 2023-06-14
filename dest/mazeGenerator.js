import { randomItemInArray, shuffle } from './utils.js';
// Does not check whether the two cells are actually neighbors
// Don't know if I need to fix that :|
function carveWall(prevCell, curCell, offset) {
    if (Math.abs(offset) === 1) {
        // Left and Right
        prevCell.walls[offset < 1 ? 3 : 1] = false;
        curCell.walls[offset < 1 ? 1 : 3] = false;
    }
    else {
        // Up and Down
        prevCell.walls[offset < 1 ? 0 : 2] = false;
        curCell.walls[offset < 1 ? 2 : 0] = false;
    }
}
function getRandomUnvisitedCellIndex(grid) {
    const mazePartIndices = grid.cells
        .filter(({ open: visited }) => visited)
        .map(({ gridIndex }) => gridIndex);
    while (true) {
        const randCellIndex = Math.floor(Math.random() * grid.colCnt * grid.rowCnt);
        if (!mazePartIndices.includes(randCellIndex)) {
            return randCellIndex;
        }
    }
}
function checkIfComplete(grid) {
    return grid.cells.every(({ open: visited }) => visited);
}
function findValidDirections(grid, index) {
    const cell = grid.cells[index];
    return [-grid.colCnt, 1, grid.colCnt, -1].filter((dir) => {
        const newIndex = index + dir;
        const neighbor = grid.cells[newIndex];
        // Check if cell is within grid
        if (newIndex < 0 || newIndex >= grid.colCnt * grid.rowCnt)
            return;
        // Prevent Walker from going over left and right edges
        if (Math.abs(dir) === 1 && neighbor.screenY !== cell.screenY)
            return;
        return true;
    });
}
export class AldousBroder {
    static key = 'Aldous-Broder';
    index;
    isComplete = false;
    grid;
    constructor(grid) {
        const starterIndex = Math.floor(Math.random() * grid.cells.length);
        const starterCell = grid.cells[starterIndex];
        starterCell.open = true;
        this.grid = grid;
        this.index = starterIndex;
    }
    step() {
        if (this.isComplete)
            return;
        const directions = findValidDirections(this.grid, this.index);
        const direction = randomItemInArray(directions);
        // Pick new head
        const newHead = this.grid.cells[(this.index += direction)];
        const prevCell = this.grid.cells[this.index - direction];
        // If new cell is unvisited, then carve walls inbetween
        if (!newHead.open) {
            newHead.open = true;
            carveWall(prevCell, newHead, direction);
            this.isComplete = checkIfComplete(this.grid);
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        ctx.save();
        ctx.translate(this.grid.cellSize / 2, this.grid.cellSize / 2);
        ctx.beginPath();
        const headCell = this.grid.cells[this.index];
        ctx.ellipse(headCell.screenX, headCell.screenY, this.grid.cellSize / 4, this.grid.cellSize / 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgb(0, 255, 0)';
        ctx.fill();
        ctx.restore();
    }
}
export class Wilsons {
    static key = "Wilson's";
    index;
    isComplete = false;
    grid;
    startIndex;
    walkedCells = new Set();
    cellDirection = new Map();
    constructor(grid) {
        const walkerStartIndex = getRandomUnvisitedCellIndex(grid);
        this.startIndex = walkerStartIndex;
        this.index = walkerStartIndex;
        this.grid = grid;
        if (!grid.cells.some(({ open }) => open)) {
            const starterIndex = Math.floor(Math.random() * grid.cells.length);
            grid.cells[starterIndex].open = true;
        }
    }
    step() {
        if (this.isComplete)
            return;
        // Get valid directions
        const directions = findValidDirections(this.grid, this.index);
        const direction = randomItemInArray(directions);
        // const direction = directions[0];
        // Set direction of current head
        const curHead = this.grid.cells[this.index];
        this.cellDirection.set(curHead, direction);
        this.walkedCells.add(this.index);
        // Pick new head
        const newHead = this.grid.cells[(this.index += direction)];
        if (newHead.open) {
            // Connect path back to body
            let prevCell;
            let prevOffset;
            let pathIndex = this.startIndex;
            while (true) {
                // Loop through paths using directions
                const curCell = this.grid.cells[pathIndex];
                const pathOffset = this.cellDirection.get(curCell);
                if (prevCell === newHead)
                    break;
                if (prevCell)
                    carveWall(prevCell, curCell, prevOffset);
                curCell.open = true;
                pathIndex += pathOffset;
                prevCell = curCell;
                prevOffset = pathOffset;
            }
            this.cellDirection.clear();
            this.walkedCells.clear();
            if (checkIfComplete(this.grid)) {
                this.isComplete = true;
            }
            else {
                // Find new starting point for path
                const randCellIndex = getRandomUnvisitedCellIndex(this.grid);
                this.startIndex = randCellIndex;
                this.index = randCellIndex;
            }
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        // Full path
        for (const index of this.walkedCells) {
            const cell = this.grid.cells[index];
            ctx.fillStyle = 'rgb(255, 0, 0)';
            ctx.fillRect(cell.screenX, cell.screenY, cell.size - 2, cell.size - 2);
        }
        // True path
        let pathIndex = this.startIndex;
        const truePath = new Set([this.index]);
        while (true) {
            const cell = this.grid.cells[pathIndex];
            const dir = this.cellDirection.get(cell);
            if (dir === undefined || truePath.has(pathIndex))
                break;
            truePath.add(pathIndex);
            pathIndex += dir;
            // draw direction of cell
            ctx.save();
            ctx.translate(cell.screenX + cell.size / 2, cell.screenY + cell.size / 2);
            let rot;
            if (dir === -this.grid.colCnt)
                rot = 0;
            else if (dir === 1)
                rot = Math.PI / 2;
            else if (dir === this.grid.colCnt)
                rot = Math.PI;
            else if (dir === -1)
                rot = -Math.PI / 2;
            else
                throw 'Impossible direction encountered!';
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.moveTo(0, cell.size / 4);
            ctx.lineTo(0, -cell.size / 4);
            ctx.moveTo(-cell.size / 4, 0);
            ctx.lineTo(0, -cell.size / 4);
            ctx.moveTo(cell.size / 4, 0);
            ctx.lineTo(0, -cell.size / 4);
            ctx.strokeStyle = 'rgb(0, 255, 0)';
            const prevLineWidth = ctx.lineWidth;
            ctx.lineWidth = 5;
            if (26 > this.grid.cellSize)
                ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.lineWidth = prevLineWidth;
            ctx.restore();
        }
        // Head
        ctx.save();
        ctx.translate(this.grid.cellSize / 2, this.grid.cellSize / 2);
        ctx.beginPath();
        const headCell = this.grid.cells[this.index];
        ctx.ellipse(headCell.screenX, headCell.screenY, this.grid.cellSize / 4, this.grid.cellSize / 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgb(0, 255, 0)';
        ctx.fill();
        ctx.restore();
    }
}
export class RecursiveBacktracking {
    static key = 'Recursive Backtracking';
    grid;
    isComplete = false;
    stack;
    constructor(grid) {
        this.grid = grid;
        this.stack = [
            {
                cell: grid.cells[getRandomUnvisitedCellIndex(grid)],
            },
        ];
        this.stack[0].cell.open = true;
    }
    step() {
        if (this.isComplete)
            return;
        const head = this.stack[this.stack.length - 1];
        if (!head) {
            this.isComplete = true;
            return;
        }
        const directions = head.directionsToTry ||
            shuffle(findValidDirections(this.grid, head.cell.gridIndex));
        if (!directions.length) {
            this.stack.pop();
            return;
        }
        head.directionsToTry ||= directions;
        while (directions.length) {
            const direction = directions.shift();
            const cell = this.grid.cells[head.cell.gridIndex + direction];
            if (!cell.open) {
                head.directionsToTry = directions;
                cell.open = true;
                carveWall(head.cell, cell, direction);
                const newHead = { cell };
                this.stack.push(newHead);
                return;
            }
        }
    }
    draw(ctx) {
        if (this.isComplete || !this.stack.length)
            return;
        ctx.fillStyle = '#f004';
        for (const { cell } of this.stack) {
            ctx.fillRect(cell.screenX, cell.screenY, this.grid.cellSize, this.grid.cellSize);
        }
        ctx.save();
        ctx.translate(this.grid.cellSize / 2, this.grid.cellSize / 2);
        ctx.beginPath();
        const headCell = this.stack[this.stack.length - 1].cell;
        ctx.ellipse(headCell.screenX, headCell.screenY, this.grid.cellSize / 4, this.grid.cellSize / 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgb(0, 255, 0)';
        ctx.fill();
        ctx.restore();
    }
}
export class RecursiveDivision {
    static key = 'Recursive Division';
    isComplete = false;
    chambers;
    grid;
    constructor(grid) {
        for (const cell of grid.cells) {
            cell.open = true;
            cell.walls = [false, false, false, false];
            if (cell.gridX === 0)
                cell.walls[3] = true;
            if (cell.gridY === 0)
                cell.walls[0] = true;
            if (cell.gridX === grid.colCnt - 1)
                cell.walls[1] = true;
            if (cell.gridY === grid.rowCnt - 1)
                cell.walls[2] = true;
        }
        this.grid = grid;
        this.chambers = [[0, 0, grid.colCnt, grid.rowCnt]];
    }
    chooseOrientation(width, height) {
        if (width < height)
            return 'HORIZONTAL';
        else if (height < width)
            return 'VERTICAL';
        else
            return Math.random() < 0.5 ? 'HORIZONTAL' : 'VERTICAL';
    }
    step() {
        if (this.isComplete)
            return;
        const chamber = this.chambers.pop();
        if (!chamber) {
            this.isComplete = true;
            return;
        }
        const [areaX, areaY, areaWidth, areaHeight] = chamber;
        if (this.chooseOrientation(areaWidth, areaHeight) === 'VERTICAL') {
            const wallX = Math.floor(Math.random() * (areaWidth - 1)) + areaX;
            const holeY = Math.floor(Math.random() * areaHeight) + areaY;
            for (let y = areaY; y < areaHeight + areaY; y++) {
                if (y === holeY)
                    continue;
                const leftCell = this.grid.cells[wallX + this.grid.colCnt * y];
                const rightCell = this.grid.cells[wallX + this.grid.colCnt * y + 1];
                leftCell.walls[1] = true;
                rightCell.walls[3] = true;
            }
            const leftChamberWidth = areaWidth - (areaX + areaWidth - wallX) + 1;
            if (leftChamberWidth > 1) {
                this.chambers.push([areaX, areaY, leftChamberWidth, areaHeight]);
            }
            if (areaWidth - leftChamberWidth > 1) {
                this.chambers.push([
                    areaX + leftChamberWidth,
                    areaY,
                    areaWidth - leftChamberWidth,
                    areaHeight,
                ]);
            }
        }
        else {
            const holeX = Math.floor(Math.random() * areaWidth) + areaX;
            const wallY = Math.floor(Math.random() * (areaHeight - 1)) + areaY;
            for (let x = areaX; x < areaWidth + areaX; x++) {
                if (x === holeX)
                    continue;
                const topCell = this.grid.cells[x + this.grid.colCnt * wallY];
                const bottomCell = this.grid.cells[x + this.grid.colCnt * (wallY + 1)];
                topCell.walls[2] = true;
                bottomCell.walls[0] = true;
            }
            const topChamberHeight = areaHeight - (areaY + areaHeight - wallY) + 1;
            if (topChamberHeight > 1) {
                this.chambers.push([areaX, areaY, areaWidth, topChamberHeight]);
            }
            if (areaHeight - topChamberHeight > 1) {
                this.chambers.push([
                    areaX,
                    areaY + topChamberHeight,
                    areaWidth,
                    areaHeight - topChamberHeight,
                ]);
            }
        }
        if (!this.chambers.length)
            this.isComplete = true;
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        const chamber = this.chambers[this.chambers.length - 1];
        if (!chamber)
            return;
        ctx.fillStyle = '#f003';
        ctx.fillRect(chamber[0] * this.grid.cellSize, chamber[1] * this.grid.cellSize, chamber[2] * this.grid.cellSize, chamber[3] * this.grid.cellSize);
    }
}
export class AldousBroderWilsonHybrid {
    static key = "Aldous-Broder + Wilson's";
    phase = 0;
    isComplete = false;
    grid;
    walker;
    constructor(grid) {
        this.grid = grid;
        this.walker = new AldousBroder(grid);
    }
    step() {
        if (this.isComplete)
            return;
        this.walker.step();
        if (this.walker.isComplete) {
            this.isComplete = true;
            return;
        }
        if (this.phase === 0) {
            const visitedCellCount = this.grid.cells.filter(({ open: visited }) => visited).length;
            if (visitedCellCount >= (this.grid.rowCnt * this.grid.colCnt) / 3) {
                this.phase = 1;
                this.walker = new Wilsons(this.grid);
            }
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        this.walker.draw(ctx);
    }
}
export class BinaryTree {
    static key = 'Binary Tree';
    grid;
    isComplete = false;
    directions;
    x;
    y;
    get index() {
        return this.y * this.grid.colCnt + this.x;
    }
    constructor(grid, options) {
        const { horizontal, vertical } = options[BinaryTree.key];
        this.grid = grid;
        this.directions = [
            horizontal === 'EAST' ? 1 : -1,
            (vertical === 'SOUTH' ? 1 : -1) * grid.colCnt,
        ];
        this.x = horizontal === 'EAST' ? 0 : grid.colCnt - 1;
        this.y = vertical === 'SOUTH' ? 0 : grid.rowCnt - 1;
    }
    step() {
        if (this.isComplete)
            return;
        const directions = this.directions.filter((dir) => {
            const newIndex = this.index + dir;
            const oldY = Math.floor(this.index / this.grid.colCnt);
            const newY = Math.floor(newIndex / this.grid.colCnt);
            if (Math.abs(dir) === 1 && oldY !== newY)
                return false;
            if (newIndex < 0 || newIndex >= this.grid.cells.length)
                return false;
            return true;
        });
        if (directions.length === 0) {
            this.isComplete = true;
            return;
        }
        const dir = randomItemInArray(directions);
        const cell1 = this.grid.cells[this.index];
        const cell2 = this.grid.cells[this.index + dir];
        cell2.open = cell1.open = true;
        carveWall(cell1, cell2, dir);
        this.x += this.directions[0];
        if (this.x < 0) {
            this.x = this.grid.colCnt - 1;
            this.y += Math.sign(this.directions[1]);
        }
        if (this.x >= this.grid.colCnt) {
            this.x = 0;
            this.y += Math.sign(this.directions[1]);
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        ctx.fillStyle = '#0a0';
        const cell = this.grid.cells[this.index];
        ctx.fillRect(cell.screenX, cell.screenY, cell.size, cell.size);
    }
}
function findTreeRoot(node) {
    while (node.parent) {
        node = node.parent;
    }
    return node;
}
function findBranchSize(node) {
    let nodes = [node];
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        nodes.push(...node.children);
    }
    return nodes.length;
}
function randomRGB(max) {
    const r = (max) => Math.floor(Math.random() * max);
    return [r(max), r(max), r(max)];
}
export class Kruskals {
    static key = "Kruskal's";
    grid;
    isComplete = false;
    cellTrees = new Map();
    edges = [];
    curEdge;
    constructor(grid) {
        this.grid = grid;
        for (const cell of grid.cells) {
            cell.open = true;
            this.cellTrees.set(cell, {
                index: cell.gridIndex,
                parent: null,
                clr: randomRGB(150),
                children: [],
            });
        }
        for (let x = 0; x < grid.colCnt; x++) {
            for (let y = 0; y < grid.rowCnt; y++) {
                const index = y * grid.colCnt + x;
                if (x + 1 < grid.colCnt)
                    this.edges.push([index, 1]);
                if (y + 1 < grid.rowCnt)
                    this.edges.push([index, grid.colCnt]);
            }
        }
        this.edges = shuffle(this.edges);
    }
    iterCnt = 0;
    step() {
        if (this.isComplete)
            return;
        this.curEdge = randomItemInArray(this.edges);
        const [index, dir] = this.curEdge;
        let node1 = this.cellTrees.get(this.grid.cells[index]);
        let node2 = this.cellTrees.get(this.grid.cells[index + dir]);
        let root1 = findTreeRoot(node1);
        let root2 = findTreeRoot(node2);
        if (root1 !== root2) {
            carveWall(this.grid.cells[node1.index], this.grid.cells[node2.index], dir);
            // Not needed technically, I could just pick one tree to always take precedence
            // But during animation, the color change causes big flashes when a big tree's color changes
            const size1 = findBranchSize(root1);
            const size2 = findBranchSize(root2);
            if (size1 > size2) {
                root2.parent = node1;
                node1.children.push(root2);
            }
            else {
                root1.parent = node2;
                node2.children.push(root1);
            }
            if (size1 + size2 === this.grid.cells.length) {
                this.isComplete = true;
                return;
            }
        }
        this.edges = this.edges.filter((e) => e !== this.curEdge);
        if (this.edges.length === 0) {
            this.isComplete = true;
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        // Tree colors
        const allVisited = new Set();
        for (const [, tree] of this.cellTrees) {
            const visited = new Set([tree]);
            let root = tree;
            while (root.parent) {
                visited.add(root);
                root = root.parent;
            }
            const { clr: [r, g, b], } = root;
            for (const { index } of visited) {
                const { screenX, screenY, size } = this.grid.cells[index];
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(screenX, screenY, size, size);
            }
            visited.forEach((t) => allVisited.add(t));
        }
        // Current edge
        if (this.curEdge) {
            const [index, dir] = this.curEdge;
            const cell = this.grid.cells[index];
            let wallIndex;
            ctx.beginPath();
            for (const i of [-1, 1]) {
                switch (dir) {
                    case -this.grid.colCnt: // Top
                        ctx.moveTo(cell.screenX, cell.screenY + i);
                        ctx.lineTo(cell.screenX + cell.size, cell.screenY + i);
                        wallIndex = 0;
                        break;
                    case 1: // Right
                        ctx.moveTo(cell.screenX + cell.size + i, cell.screenY);
                        ctx.lineTo(cell.screenX + cell.size + i, cell.screenY + cell.size);
                        wallIndex = 1;
                        break;
                    case this.grid.colCnt: // Bottom
                        ctx.moveTo(cell.screenX + cell.size, cell.screenY + cell.size - i);
                        ctx.lineTo(cell.screenX, cell.screenY + cell.size - i);
                        wallIndex = 2;
                        break;
                    case -1: // Left
                        ctx.moveTo(cell.screenX - i, cell.screenY + cell.size);
                        ctx.lineTo(cell.screenX - i, cell.screenY);
                        wallIndex = 3;
                        break;
                    default:
                        throw 'Impossible direction';
                }
            }
            ctx.strokeStyle = cell.walls[wallIndex] ? '#a00' : '#0a0';
            ctx.lineWidth = 5;
            ctx.stroke();
        }
    }
}
export class Prims {
    static key = "Prim's";
    isComplete = false;
    grid;
    frontier = [];
    constructor(grid) {
        this.grid = grid;
        const startIndex = getRandomUnvisitedCellIndex(grid);
        grid.cells[startIndex].open = true;
        this.frontier = findValidDirections(grid, startIndex).map((dir) => startIndex + dir);
    }
    step() {
        if (this.isComplete)
            return;
        const pickedIndex = randomItemInArray(this.frontier);
        this.frontier = this.frontier.filter((c) => c !== pickedIndex);
        const newFrontier = findValidDirections(this.grid, pickedIndex)
            .map((dir) => pickedIndex + dir)
            .filter((i) => !this.grid.cells[i].open);
        for (const index of newFrontier) {
            if (this.frontier.includes(index))
                continue;
            this.frontier.push(index);
        }
        // Converting to set then spreading back to an array feels wrong...
        // this.frontier = [
        // 	...new Set(
        // 		this.frontier.concat(
        // 			this.#findValidDirections(pickedIndex)
        // 				.map((dir) => pickedIndex + dir)
        // 				.filter((i) => !this.grid.cells[i].open),
        // 		),
        // 	),
        // ];
        const dir = randomItemInArray(findValidDirections(this.grid, pickedIndex).filter((dir) => this.grid.cells[pickedIndex + dir].open));
        const cell1 = this.grid.cells[pickedIndex];
        const cell2 = this.grid.cells[pickedIndex + dir];
        cell1.open = cell2.open = true;
        carveWall(cell1, cell2, dir);
        this.isComplete = checkIfComplete(this.grid);
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        for (const index of this.frontier) {
            const { screenX, screenY, size } = this.grid.cells[index];
            ctx.fillStyle = `#a00a`;
            ctx.fillRect(screenX, screenY, size, size);
        }
    }
}
// TODO: Eller's Algorithm
// TODO: Sidewinder Algorithm
// TODO: "Hunt and Kill" Algorithm
// TODO: Customizable "Growing Tree" Algorithm
export const Algorithms = [
    RecursiveBacktracking,
    RecursiveDivision,
    Wilsons,
    AldousBroder,
    AldousBroderWilsonHybrid,
    BinaryTree,
    Kruskals,
    Prims,
];
//# sourceMappingURL=mazeGenerator.js.map