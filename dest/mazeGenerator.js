import { settings } from "./settings.js";
import { randIntBetween, randomItemInArray, shuffle, } from "./utils.js";
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
        .map(({ index: gridIndex }) => gridIndex);
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
// Does not check if direction's cell is visited, that is left to the specific algorithm
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
        this.grid.paintCircle(ctx, this.index, "#00ff00");
    }
}
export class Wilsons {
    index;
    isComplete = false;
    grid;
    startIndex;
    walkedCells = new Set();
    cellDirection = [];
    constructor(grid) {
        const walkerStartIndex = getRandomUnvisitedCellIndex(grid);
        this.startIndex = walkerStartIndex;
        this.index = walkerStartIndex;
        this.grid = grid;
        // Initialized random cell as the seed
        if (!grid.cells.some(({ open }) => open)) {
            const starterIndex = Math.floor(Math.random() * grid.cells.length);
            grid.cells[starterIndex].open = true;
        }
        this.walkedCells.add(this.index);
    }
    step() {
        if (this.isComplete)
            return;
        // Get valid directions
        const directions = findValidDirections(this.grid, this.index);
        // Pick new head
        const direction = randomItemInArray(directions);
        this.cellDirection[this.index] = direction;
        this.walkedCells.add((this.index += direction));
        if (this.grid.cells[this.index].open) {
            // Connect path back to body
            let prevCell;
            let prevOffset;
            let pathIndex = this.startIndex;
            while (true) {
                // Loop through paths using directions
                const curCell = this.grid.cells[pathIndex];
                const pathOffset = this.cellDirection[pathIndex];
                if (prevCell)
                    carveWall(prevCell, curCell, prevOffset);
                if (curCell.open)
                    break;
                curCell.open = true;
                pathIndex += pathOffset;
                prevCell = curCell;
                prevOffset = pathOffset;
            }
            this.cellDirection.length = 0;
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
        // All traversed cells
        for (const index of this.walkedCells) {
            this.grid.paintRect(ctx, index, 1, 1, "#ff0000");
        }
        // Mark actual path with line
        const truePath = [];
        let pathIndex = this.startIndex;
        while (true) {
            truePath.push(pathIndex);
            // Break if on head
            if (pathIndex === this.index)
                break;
            if (this.cellDirection[pathIndex]) {
                pathIndex += this.cellDirection[pathIndex];
            }
        }
        this.grid.paintPath(ctx, truePath, "#00ff00");
        // Head
        this.grid.paintCircle(ctx, this.index, "#00ff00");
    }
}
export class RecursiveBacktracking {
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
            shuffle(findValidDirections(this.grid, head.cell.index));
        if (directions.length === 0) {
            this.stack.pop();
            return;
        }
        head.directionsToTry ||= directions;
        while (directions.length) {
            const direction = directions.shift();
            const cell = this.grid.cells[head.cell.index + direction];
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
        // Current stack/path
        for (const { cell } of this.stack) {
            this.grid.paintRect(ctx, cell.index, 1, 1, "#aa0000");
        }
        // Head
        const headIndex = this.stack.at(-1).cell.index;
        this.grid.paintCircle(ctx, headIndex, "#00ff00");
    }
}
export class RecursiveDivision {
    isComplete = false;
    chambers;
    grid;
    useBfs;
    constructor(grid) {
        for (const cell of grid.cells) {
            cell.open = true;
            cell.walls = [false, false, false, false];
            if (cell.x === 0)
                cell.walls[3] = true;
            if (cell.y === 0)
                cell.walls[0] = true;
            if (cell.x === grid.colCnt - 1)
                cell.walls[1] = true;
            if (cell.y === grid.rowCnt - 1)
                cell.walls[2] = true;
        }
        this.grid = grid;
        this.chambers = [[0, 0, grid.colCnt, grid.rowCnt]];
        this.useBfs = settings.get("graphTraversal") === "bfs";
    }
    chooseOrientation(width, height) {
        if (width < height)
            return "HORIZONTAL";
        else if (height < width)
            return "VERTICAL";
        else
            return Math.random() < 0.5 ? "HORIZONTAL" : "VERTICAL";
    }
    step() {
        if (this.isComplete)
            return;
        let chamber;
        if (this.useBfs)
            chamber = this.chambers.shift();
        else
            chamber = this.chambers.pop();
        if (!chamber) {
            this.isComplete = true;
            return;
        }
        const [areaX, areaY, areaWidth, areaHeight] = chamber;
        if (this.chooseOrientation(areaWidth, areaHeight) === "VERTICAL") {
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
        const index = this.useBfs ? 0 : this.chambers.length - 1;
        if (!this.chambers[index])
            return;
        const [x, y, w, h] = this.chambers[index];
        this.grid.paintRect(ctx, x + y * this.grid.rowCnt, w, h, "#aa0000");
    }
}
export class AldousBroderWilsonHybrid {
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
            const visitedCellCount = this.grid.cells.filter(({ open }) => open).length;
            if (visitedCellCount >= (this.grid.rowCnt * this.grid.colCnt) / 8) {
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
    grid;
    isComplete = false;
    directions;
    x;
    y;
    constructor(grid) {
        const horz = settings.get("horizontalCarve") ?? "eastCarve";
        const vert = settings.get("verticalCarve") ?? "southCarve";
        this.grid = grid;
        this.directions = [
            horz === "eastCarve" ? 1 : -1,
            (vert === "southCarve" ? 1 : -1) * grid.colCnt,
        ];
        this.x = horz === "eastCarve" ? 0 : grid.colCnt - 1;
        this.y = vert === "southCarve" ? 0 : grid.rowCnt - 1;
    }
    get index() {
        return this.y * this.grid.colCnt + this.x;
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
        this.grid.paintRect(ctx, this.index, 1, 1, "#00aa00");
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
export class Kruskals {
    grid;
    isComplete = false;
    cellNodes = [];
    cellClrs = []; // For presentation
    edges = [];
    curEdge;
    constructor(grid) {
        this.grid = grid;
        for (const cell of grid.cells) {
            cell.open = true;
            this.cellNodes[cell.index] = {
                index: cell.index,
                parent: null,
                children: [],
            };
            this.cellClrs[cell.index] = [
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256),
            ];
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
    step() {
        if (this.isComplete)
            return;
        this.curEdge = this.edges.pop();
        const [index, dir] = this.curEdge;
        const node1 = this.cellNodes[index];
        const node2 = this.cellNodes[index + dir];
        const root1 = findTreeRoot(node1);
        const root2 = findTreeRoot(node2);
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
        if (this.edges.length === 0) {
            this.isComplete = true;
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        // Tree colors
        const allVisited = new Set();
        for (const tree of this.cellNodes) {
            const visited = new Set([tree]);
            let root = tree;
            while (root.parent) {
                visited.add(root);
                root = root.parent;
            }
            const [r, g, b] = this.cellClrs[root.index];
            const clrStr = `rgb(${r},${g},${b})`;
            for (const { index } of visited) {
                this.grid.paintRect(ctx, index, 1, 1, clrStr);
            }
            visited.forEach((t) => allVisited.add(t));
        }
        // Current edge
        if (this.curEdge) {
            const [index, dir] = this.curEdge;
            const cell = this.grid.cells[index];
            let wallIndex = 0;
            ctx.save();
            ctx.translate(this.grid.offsetX + cell.screenX + this.grid.cellSize / 2, this.grid.offsetY + cell.screenY + this.grid.cellSize / 2);
            ctx.beginPath();
            switch (dir) {
                case 1: // Right
                    ctx.rotate(Math.PI / 2);
                    wallIndex = 1;
                    break;
                case this.grid.colCnt: // Bottom
                    ctx.rotate(Math.PI);
                    wallIndex = 2;
                    break;
                case -1: // Left
                    ctx.rotate((Math.PI / 4) * 3);
                    wallIndex = 3;
                    break;
            }
            ctx.fillStyle = cell.walls[wallIndex] ? "#a00" : "#0a0";
            ctx.fillRect(-this.grid.cellSize / 2, -this.grid.cellSize / 2 - 6, this.grid.cellSize, 12);
            ctx.restore();
        }
    }
}
export class Prims {
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
            this.grid.paintRect(ctx, index, 1, 1, "#aa0000");
        }
    }
}
// TODO: fix last row bug
export class Ellers {
    isComplete = false;
    grid;
    index = 0;
    mergeChance;
    constructor(grid) {
        this.grid = grid;
        this.mergeChance = settings.get("carveChance") ?? 0.5;
    }
    step() {
        if (this.isComplete)
            return;
    }
    draw(ctx) {
        if (this.isComplete)
            return;
    }
}
export class Sidewinder {
    isComplete = false;
    grid;
    index = 0;
    runStart = 0;
    constructor(grid) {
        this.grid = grid;
        this.grid.cells[0].open = true;
    }
    step() {
        if (this.isComplete)
            return;
        const index = this.index++;
        const width = this.grid.colCnt;
        const x = index % width;
        const atEndColumn = x + 1 >= width;
        const nextCell = this.grid.cells[index + 1];
        if (nextCell)
            nextCell.open = true;
        else
            this.isComplete = true; // Grid end reached
        if (index >= width && (atEndColumn || Math.random() < 1 / 3)) {
            // End run and carve north
            const bridgeIndex = randIntBetween(this.runStart, index);
            const bridgeCell = this.grid.cells[bridgeIndex];
            const toCell = this.grid.cells[bridgeIndex - width];
            carveWall(bridgeCell, toCell, -width);
            this.runStart = index + 1;
        }
        else if (!atEndColumn) {
            // Carve east
            const curCell = this.grid.cells[index];
            carveWall(curCell, nextCell, 1);
        }
        else {
            // First row end reached
            this.runStart = index + 1;
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        this.grid.paintRect(ctx, this.index, 1, 1, "#00ff00");
    }
}
export class HuntAndKill {
    isComplete = false;
    grid;
    index;
    phase = 0;
    huntStart = 0;
    mazeCheckUntil;
    constructor(grid) {
        this.grid = grid;
        this.index = getRandomUnvisitedCellIndex(grid);
        grid.cells[this.index].open = true;
    }
    step() {
        if (this.isComplete)
            return;
        const curCell = this.grid.cells[this.index];
        switch (this.phase) {
            case 0:
                {
                    // Random walk
                    const directions = findValidDirections(this.grid, this.index);
                    for (const dir of shuffle(directions)) {
                        const nextCell = this.grid.cells[this.index + dir];
                        if (!nextCell.open) {
                            nextCell.open = true;
                            carveWall(curCell, nextCell, dir);
                            this.index += dir;
                            return;
                        }
                    }
                    // Begin hunting for new index
                    this.phase = 1;
                    this.index = this.huntStart * this.grid.colCnt;
                }
                break;
            case 1:
                {
                    // Maze complete when check cell reached
                    if (this.index >= Number(this.mazeCheckUntil)) {
                        this.isComplete = true;
                        return;
                    }
                    // Search surrounding open cells to restart random walk
                    if (!curCell.open) {
                        const directions = findValidDirections(this.grid, this.index);
                        for (const dir of shuffle(directions)) {
                            const mazeCell = this.grid.cells[this.index + dir];
                            if (mazeCell.open) {
                                curCell.open = true;
                                carveWall(curCell, mazeCell, dir);
                                this.huntStart = Math.floor(this.index / this.grid.colCnt);
                                this.phase = 0;
                                this.mazeCheckUntil = undefined;
                                return;
                            }
                        }
                    }
                    // Loop back to start when end of grid reached
                    if (++this.index >= this.grid.cells.length) {
                        const { colCnt, rowCnt } = this.grid;
                        this.mazeCheckUntil = Math.min(this.huntStart + 1, rowCnt - 1) * colCnt;
                        this.huntStart = 0;
                        this.index = 0;
                    }
                }
                break;
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        if (this.grid.cells[this.index]) {
            this.grid.paintRect(ctx, this.index, 1, 1, this.phase === 0 ? "#00aa00" : "#aa0000");
        }
    }
}
export class GrowingTree {
    isComplete = false;
    grid;
    bag;
    pickingStyle = [];
    constructor(grid) {
        this.grid = grid;
        this.bag = [getRandomUnvisitedCellIndex(grid)];
        grid.cells[this.bag[0]].open = true;
        // Set picking style
        const pickNewest = Math.max(settings.get("pickNewest") ?? 1, 0);
        const pickRandom = Math.max(settings.get("pickRandom") ?? 0, 0);
        const pickOldest = Math.max(settings.get("pickOldest") ?? 0, 0);
        const pickMiddle = Math.max(settings.get("pickMiddle") ?? 0, 0);
        const initializer = [
            ["NEWEST", pickNewest],
            ["RANDOM", pickRandom],
            ["OLDEST", pickOldest],
            ["MIDDLE", pickMiddle],
        ];
        for (const [style, count] of initializer) {
            this.pickingStyle.push(...Array(count).fill(style));
        }
    }
    step() {
        if (this.isComplete)
            return;
        const index = this.chooseCell();
        const directions = shuffle(findValidDirections(this.grid, index));
        for (const dir of directions) {
            const nextCell = this.grid.cells[index + dir];
            if (!nextCell.open) {
                const cell = this.grid.cells[index];
                carveWall(cell, nextCell, dir);
                nextCell.open = true;
                this.bag.push(index + dir);
                return;
            }
        }
        this.bag = this.bag.filter((i) => i !== index);
        if (this.bag.length === 0) {
            this.isComplete = true;
        }
    }
    chooseCell() {
        switch (randomItemInArray(this.pickingStyle)) {
            case "NEWEST":
                return this.bag[this.bag.length - 1];
            case "RANDOM":
                return randomItemInArray(this.bag);
            case "OLDEST":
                return this.bag[0];
            case "MIDDLE":
                return this.bag[Math.floor(this.bag.length / 2)];
            default:
                throw "Invalid picking style";
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        for (let i = 0; i < this.bag.length; i++) {
            const index = this.bag[i];
            this.grid.paintRect(ctx, index, 1, 1, "#ff0000");
            this.grid.paintText(ctx, index, String(i), "#ff0000");
        }
    }
}
export class ClusterDivision {
    isComplete = false;
    grid;
    regions = [[]];
    currRegion;
    subregionA = new Set();
    subregionB = new Set();
    bag = [];
    edges = [];
    wallMap;
    useBfs;
    roomMaxSize;
    constructor(grid) {
        this.grid = grid;
        this.wallMap = {
            [-this.grid.colCnt]: 0,
            [1]: 1,
            [this.grid.colCnt]: 2,
            [-1]: 3,
        };
        this.useBfs = settings.get("graphTraversal") === "bfs";
        this.roomMaxSize = settings.get("maximumRoomSize") ?? 3;
        // Open up all cells and remove walls between cells
        grid.cells.forEach((c, i) => {
            this.regions[0][i] = i;
            c.open = true;
            c.walls = [false, false, false, false];
            if (c.x === 0)
                c.walls[3] = true;
            if (c.y === 0)
                c.walls[0] = true;
            if (c.x === grid.colCnt - 1)
                c.walls[1] = true;
            if (c.y === grid.rowCnt - 1)
                c.walls[2] = true;
        });
    }
    getOccupancy(index) {
        if (this.subregionA.has(index))
            return "A";
        if (this.subregionB.has(index))
            return "B";
        return "NONE";
    }
    step() {
        if (this.isComplete)
            return;
        if (this.bag.length === 0) {
            // Start new region to subdivide
            // Skip on first iteration
            if (this.currRegion) {
                // Carve a hole in one wall, and discard remaining walls
                const [index, dir] = randomItemInArray(this.edges);
                carveWall(this.grid.cells[index], this.grid.cells[index + dir], dir);
                this.edges.length = 0;
                // Add subregions to stack
                this.regions.length--;
                for (const subregion of [this.subregionA, this.subregionB]) {
                    // Stop subdividing when region is smaller than given threshold
                    if (subregion.size > this.roomMaxSize) {
                        this.regions.push(Array.from(subregion));
                    }
                    subregion.clear();
                }
                // If stack is empty, end algorthim
                if (this.regions.length === 0) {
                    this.isComplete = true;
                    return;
                }
            }
            // Choose subregion starting points
            const region = this.regions[this.useBfs ? 0 : this.regions.length - 1];
            let a = randomItemInArray(region);
            let b;
            do {
                b = randomItemInArray(region);
            } while (b === a);
            this.currRegion = new Set(region);
            this.subregionA.add(a);
            this.subregionB.add(b);
            this.bag.push(a, b);
        }
        else {
            // Take out random item from bag
            const bagIndex = randIntBetween(0, this.bag.length - 1);
            const index = this.bag[bagIndex];
            const last = this.bag.length - 1;
            [this.bag[bagIndex], this.bag[last]] = [this.bag[last], this.bag[bagIndex]];
            this.bag.length -= 1;
            // Check surrounding cells
            const occupancy = this.getOccupancy(index);
            for (const dir of findValidDirections(this.grid, index)) {
                const neighbor = index + dir;
                const neighborOccupancy = this.getOccupancy(neighbor);
                if (!this.currRegion.has(neighbor))
                    continue;
                if (neighborOccupancy === "NONE") {
                    // Add unassociated cell to bag and subregion
                    this.bag.push(neighbor);
                    if (occupancy === "A")
                        this.subregionA.add(neighbor);
                    else
                        this.subregionB.add(neighbor);
                }
                else if (neighborOccupancy !== occupancy) {
                    // Add wall against opposite set
                    const cells = this.grid.cells;
                    cells[index].walls[this.wallMap[dir]] = true;
                    cells[neighbor].walls[this.wallMap[-dir]] = true;
                    // Remember walls to remove later
                    this.edges.push([index, dir]);
                }
            }
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        // subregion coloring
        for (const [subregion, clr] of [
            [this.subregionA, "#0000ff"],
            [this.subregionB, "#ff0000"],
        ]) {
            for (const index of subregion) {
                const opacity = this.bag.includes(index) ? "a" : "4";
                this.grid.paintRect(ctx, index, 1, 1, clr + opacity);
            }
        }
    }
}
// DEBUG ONLY
// class EmptyGrid {
//
// 	isComplete = true;
// 	constructor(grid: Grid) {
// 		grid.cells.forEach((c) => {
// 			c.open = true;
// 			c.walls = [false, false, false, false];
// 			if (c.x === 0) c.walls[3] = true;
// 			if (c.y === 0) c.walls[0] = true;
// 			if (c.x === grid.colCnt - 1) c.walls[1] = true;
// 			if (c.y === grid.rowCnt - 1) c.walls[2] = true;
// 		});
// 	}
// 	step() {}
// 	draw() {}
// }
export const generatorKeyMap = new Map([
    ["recursiveBacktracking", RecursiveBacktracking],
    ["recursiveDivision", RecursiveDivision],
    ["clusterDivision", ClusterDivision],
    ["wilsons", Wilsons],
    ["aldousbroder", AldousBroder],
    ["aldousbroder&wilsons", AldousBroderWilsonHybrid],
    ["binarytree", BinaryTree],
    ["kruskals", Kruskals],
    ["prims", Prims],
    ["ellers", Ellers],
    ["sidewinder", Sidewinder],
    ["hunt&kill", HuntAndKill],
    ["growingTree", GrowingTree],
]);
//# sourceMappingURL=mazeGenerator.js.map