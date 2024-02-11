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
function randIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
        const cellSize = this.grid.cellSize;
        ctx.ellipse(headCell.screenX, headCell.screenY, cellSize / 4, cellSize / 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgb(0, 255, 0)';
        ctx.fill();
        ctx.restore();
    }
}
export class Wilsons {
    static key = 'Wilsons';
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
        this.cellDirection[this.index] = direction;
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
        const cellSize = this.grid.cellSize;
        // Full path
        for (const index of this.walkedCells) {
            const cell = this.grid.cells[index];
            ctx.fillStyle = 'rgb(255, 0, 0)';
            ctx.fillRect(cell.screenX, cell.screenY, cellSize - 2, cellSize - 2);
        }
        // True path
        let pathIndex = this.startIndex;
        const truePath = new Set([this.index]);
        while (true) {
            const { screenX, screenY } = this.grid.cells[pathIndex];
            const dir = this.cellDirection[pathIndex];
            if (dir === undefined || truePath.has(pathIndex))
                break;
            truePath.add(pathIndex);
            pathIndex += dir;
            // draw direction of cell
            ctx.save();
            ctx.translate(screenX + cellSize / 2, screenY + cellSize / 2);
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
            ctx.moveTo(0, cellSize / 4);
            ctx.lineTo(0, -cellSize / 4);
            ctx.moveTo(-cellSize / 4, 0);
            ctx.lineTo(0, -cellSize / 4);
            ctx.moveTo(cellSize / 4, 0);
            ctx.lineTo(0, -cellSize / 4);
            ctx.strokeStyle = 'rgb(0, 255, 0)';
            const prevLineWidth = ctx.lineWidth;
            ctx.lineWidth = 5;
            if (26 > cellSize)
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
        ctx.fillStyle = '#f004';
        const cellSize = this.grid.cellSize;
        for (const { cell: { screenX, screenY }, } of this.stack) {
            ctx.fillRect(screenX, screenY, cellSize, cellSize);
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
    useBfs;
    constructor(grid, { useBfs }) {
        this.useBfs = useBfs;
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
        const chamber = this.chambers[this.useBfs ? 0 : this.chambers.length - 1];
        if (!chamber)
            return;
        ctx.fillStyle = '#f00a';
        const cellSize = this.grid.cellSize;
        ctx.fillRect(chamber[0] * cellSize, chamber[1] * cellSize, chamber[2] * cellSize, chamber[3] * cellSize);
    }
}
export class AldousBroderWilsonHybrid {
    static key = 'Aldous-Broder + Wilsons';
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
    static key = 'Binary Tree';
    grid;
    isComplete = false;
    directions;
    x;
    y;
    get index() {
        return this.y * this.grid.colCnt + this.x;
    }
    constructor(grid, { horz, vert }) {
        this.grid = grid;
        this.directions = [
            horz === 'EAST' ? 1 : -1,
            (vert === 'SOUTH' ? 1 : -1) * grid.colCnt,
        ];
        this.x = horz === 'EAST' ? 0 : grid.colCnt - 1;
        this.y = vert === 'SOUTH' ? 0 : grid.rowCnt - 1;
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
        const cellSize = this.grid.cellSize;
        ctx.fillRect(cell.screenX, cell.screenY, cellSize, cellSize);
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
    static key = 'Kruskals';
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
    iterCnt = 0;
    step() {
        if (this.isComplete)
            return;
        this.curEdge = this.edges.pop();
        const [index, dir] = this.curEdge;
        let node1 = this.cellNodes[index];
        let node2 = this.cellNodes[index + dir];
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
        if (this.edges.length === 0) {
            this.isComplete = true;
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        const cellSize = this.grid.cellSize;
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
            for (const { index } of visited) {
                const { screenX, screenY } = this.grid.cells[index];
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(screenX, screenY, cellSize, cellSize);
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
                        ctx.lineTo(cell.screenX + cellSize, cell.screenY + i);
                        wallIndex = 0;
                        break;
                    case 1: // Right
                        ctx.moveTo(cell.screenX + cellSize + i, cell.screenY);
                        ctx.lineTo(cell.screenX + cellSize + i, cell.screenY + cellSize);
                        wallIndex = 1;
                        break;
                    case this.grid.colCnt: // Bottom
                        ctx.moveTo(cell.screenX + cellSize, cell.screenY + cellSize - i);
                        ctx.lineTo(cell.screenX, cell.screenY + cellSize - i);
                        wallIndex = 2;
                        break;
                    case -1: // Left
                        ctx.moveTo(cell.screenX - i, cell.screenY + cellSize);
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
    static key = 'Prims';
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
        const cellSize = this.grid.cellSize;
        for (const index of this.frontier) {
            const { screenX, screenY } = this.grid.cells[index];
            ctx.fillStyle = `#a00a`;
            ctx.fillRect(screenX, screenY, cellSize, cellSize);
        }
    }
}
export class Ellers {
    static key = 'Ellers';
    isComplete = false;
    grid;
    index = 0;
    idList = [];
    sets = [];
    idsInUse = new Set();
    bridgeDown = [];
    mergeChance;
    phase = 0;
    idCounter = 1;
    constructor(grid, { mergeChance }) {
        this.grid = grid;
        this.mergeChance = mergeChance;
    }
    step() {
        if (this.isComplete)
            return;
        const index = this.index++;
        const atRightEdge = (index + 1) % this.grid.colCnt === 0;
        switch (this.phase) {
            case 0:
                // Group cells in their own sets, but randomly merge some together
                {
                    if (this.idList[index] === undefined) {
                        const newId = this.idCounter++;
                        this.idList[index] = newId;
                        this.idsInUse.add(newId);
                        this.sets[newId] = [index];
                    }
                    const id = this.idList[index];
                    const cell = this.grid.cells[index];
                    cell.open = true;
                    if (atRightEdge) {
                        this.phase = 1;
                        // Return index to start of row
                        const y = Math.floor(index / this.grid.colCnt);
                        this.index = y * this.grid.colCnt;
                        // Pick bridges ahead of time to make it look better
                        const idsInRow = new Set();
                        for (let i = this.index; i < (y + 1) * this.grid.colCnt; i++) {
                            const id = this.idList[i];
                            idsInRow.add(id);
                        }
                        for (const id of idsInRow) {
                            const indicesInRow = this.sets[id].filter((i) => i / this.grid.colCnt >= y);
                            const bridgeIndex = randomItemInArray(indicesInRow);
                            this.bridgeDown[bridgeIndex] = true;
                        }
                    }
                    else if (Math.random() < this.mergeChance) {
                        const nextIndex = index + 1;
                        const nextCell = this.grid.cells[nextIndex];
                        const nextId = this.idList[nextIndex];
                        if (nextId === undefined) {
                            this.grid.cells[nextIndex].open = true;
                            this.idList[nextIndex] = id;
                            this.sets[id].push(nextIndex);
                        }
                        else {
                            // Merge next to current
                            const nextSet = this.sets[nextId];
                            this.sets[id] = this.sets[id].concat(nextSet);
                            for (const i of nextSet) {
                                this.idList[i] = id;
                            }
                            // Remove merged set
                            delete this.sets[nextId];
                            this.idsInUse.delete(nextId);
                        }
                        carveWall(cell, nextCell, 1);
                    }
                }
                break;
            case 1:
                // Connect current row to next row
                {
                    if (this.bridgeDown[index]) {
                        const curCell = this.grid.cells[index];
                        const curId = this.idList[index];
                        const nextIndex = index + this.grid.colCnt;
                        const nextCell = this.grid.cells[nextIndex];
                        nextCell.open = true;
                        this.idList[nextIndex] = curId;
                        this.sets[curId].push(nextIndex);
                        carveWall(curCell, nextCell, this.grid.colCnt);
                    }
                    if (atRightEdge) {
                        const nextRowIsLast = (index + 1) / this.grid.colCnt >= this.grid.rowCnt - 1;
                        if (nextRowIsLast)
                            this.phase = 2;
                        else
                            this.phase = 0;
                    }
                }
                break;
            case 2:
                // Connect every cell in last row together
                {
                    const curCell = this.grid.cells[index];
                    curCell.open = true;
                    if (atRightEdge)
                        this.isComplete = true;
                    else {
                        const nextCell = this.grid.cells[index + 1];
                        carveWall(curCell, nextCell, 1);
                    }
                }
                break;
            default:
                break;
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        const cellSize = this.grid.cellSize;
        // Row
        const y = Math.floor(this.index / this.grid.colCnt);
        ctx.fillStyle = '#a00a';
        ctx.fillRect(0, y * cellSize, this.grid.colCnt * cellSize, cellSize);
        // Current cell
        const curCell = this.grid.cells[this.index];
        if (curCell) {
            ctx.fillStyle = this.phase === 1 ? '#00aa' : '#0a0a';
            ctx.fillRect(curCell.screenX, curCell.screenY, cellSize, cellSize);
        }
        // Cell ids
        for (let i = 0; i < this.idList.length; i++) {
            const id = this.idList[i];
            if (id !== undefined) {
                const { screenX, screenY } = this.grid.cells[i];
                const x = screenX + cellSize / 2;
                const y = screenY + cellSize / 2;
                ctx.fillStyle = '#fff';
                ctx.font = `${cellSize / 3}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(id), x, y);
            }
        }
        // // Bridges
        // for (let i = 0; i < this.grid.cells.length; i++) {
        // 	if (this.bridgeDown[i]) {
        // 		const curCell = this.grid.cells[i];
        // 		ctx.fillStyle = '#00a';
        // 		ctx.fillRect(
        // 			curCell.screenX,
        // 			curCell.screenY + (cellSize / 4) * 3,
        // 			cellSize,
        // 			cellSize / 2,
        // 		);
        // 	}
        // }
    }
}
export class Sidewinder {
    static key = 'Sidewinder';
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
        // Current cell
        const cell = this.grid.cells[this.index];
        ctx.fillStyle = '#55ff55';
        ctx.fillRect(cell.screenX, cell.screenY, this.grid.cellSize, this.grid.cellSize);
    }
}
export class HuntAndKill {
    static key = 'Hunt and Kill';
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
        const curCell = this.grid.cells[this.index];
        if (curCell) {
            ctx.fillStyle = this.phase === 0 ? '#0a0a' : '#a00a';
            ctx.fillRect(curCell.screenX, curCell.screenY, this.grid.cellSize, this.grid.cellSize);
        }
    }
}
export class GrowingTree {
    static key = 'Growing Tree';
    isComplete = false;
    grid;
    bag;
    pickingStyle = [];
    constructor(grid, { pickingStyle }) {
        this.grid = grid;
        this.bag = [getRandomUnvisitedCellIndex(grid)];
        grid.cells[this.bag[0]].open = true;
        for (const name in pickingStyle) {
            const chance = pickingStyle[name];
            this.pickingStyle.push(...Array(chance).fill(name));
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
            case 'NEWEST':
                return this.bag[this.bag.length - 1];
            case 'RANDOM':
                return randomItemInArray(this.bag);
            case 'OLDEST':
                return this.bag[0];
            case 'MIDDLE':
                return this.bag[Math.floor(this.bag.length / 2)];
            default:
                throw 'Invalid picking style';
        }
    }
    draw(ctx) {
        if (this.isComplete)
            return;
        const cellSize = this.grid.cellSize;
        for (let i = 0; i < this.bag.length; i++) {
            const index = this.bag[i];
            // Cell clr
            const { screenX, screenY } = this.grid.cells[index];
            ctx.fillStyle = '#f004';
            ctx.fillRect(screenX, screenY, cellSize, cellSize);
            // Age
            const x = screenX + cellSize / 2;
            const y = screenY + cellSize / 2;
            ctx.fillStyle = '#fff';
            ctx.font = `${cellSize / 3}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i), x, y);
        }
    }
}
export class RecursiveClusterDivision {
    static key = 'Recursive Cluster Division';
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
    constructor(grid, { roomMaxSize, useBfs }) {
        this.grid = grid;
        this.wallMap = {
            [-this.grid.colCnt]: 0,
            [1]: 1,
            [this.grid.colCnt]: 2,
            [-1]: 3,
        };
        this.useBfs = useBfs;
        this.roomMaxSize = roomMaxSize;
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
            return 'A';
        if (this.subregionB.has(index))
            return 'B';
        return 'NONE';
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
                if (neighborOccupancy === 'NONE') {
                    // Add unassociated cell to bag and subregion
                    this.bag.push(neighbor);
                    if (occupancy === 'A')
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
        const cellSize = this.grid.cellSize;
        // subregion coloring
        for (const [subregion, clr] of [
            [this.subregionA, '#00f'],
            [this.subregionB, '#f00'],
        ]) {
            for (const index of subregion) {
                const { screenX, screenY } = this.grid.cells[index];
                const opacity = this.bag.includes(index) ? 'a' : '4';
                ctx.fillStyle = clr + opacity;
                ctx.fillRect(screenX, screenY, cellSize, cellSize);
            }
        }
    }
}
// DEBUG ONLY
// class EmptyGrid {
// 	static readonly key = 'Empty Grid';
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
export const MazeGenerators = [
    // EmptyGrid,
    RecursiveBacktracking,
    RecursiveDivision,
    RecursiveClusterDivision,
    Wilsons,
    AldousBroder,
    AldousBroderWilsonHybrid,
    BinaryTree,
    Kruskals,
    Prims,
    Ellers,
    Sidewinder,
    HuntAndKill,
    GrowingTree,
];
export class MazeGenManager {
    instance;
    options = {
        useBfs: false,
        roomMaxSize: 3,
        horz: 'EAST',
        vert: 'SOUTH',
        mergeChance: 2 / 3,
        pickingStyle: { NEWEST: 1 },
    };
    current;
    get isComplete() {
        return this.instance?.isComplete ?? true;
    }
    constructor(init) {
        if (init) {
            this.current = init[0];
            this.restart(init[1]);
        }
    }
    step() {
        if (!this.instance)
            return;
        this.instance.step();
    }
    draw(ctx) {
        if (!this.instance)
            return;
        this.instance.draw(ctx);
    }
    restart(grid = this.instance?.grid) {
        if (!grid)
            return;
        this.instance = new (MazeGenerators.find(({ key }) => key === this.current))(grid, this.options);
    }
    setOption(prop, val) {
        this.options[prop] = val;
    }
    getOption(prop) {
        return structuredClone(this.options[prop]);
    }
}
//# sourceMappingURL=mazeGenerator.js.map