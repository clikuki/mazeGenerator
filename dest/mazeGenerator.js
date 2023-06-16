import { randomItemInArray, shuffle } from './utils.js';
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
function randIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
class AldousBroder {
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
class Wilsons {
    static key = "Wilson's";
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
            const { screenX, screenY, size } = this.grid.cells[pathIndex];
            const dir = this.cellDirection[pathIndex];
            if (dir === undefined || truePath.has(pathIndex))
                break;
            truePath.add(pathIndex);
            pathIndex += dir;
            // draw direction of cell
            ctx.save();
            ctx.translate(screenX + size / 2, screenY + size / 2);
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
            ctx.moveTo(0, size / 4);
            ctx.lineTo(0, -size / 4);
            ctx.moveTo(-size / 4, 0);
            ctx.lineTo(0, -size / 4);
            ctx.moveTo(size / 4, 0);
            ctx.lineTo(0, -size / 4);
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
class RecursiveBacktracking {
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
        if (directions.length === 0) {
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
class RecursiveDivision {
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
class AldousBroderWilsonHybrid {
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
class BinaryTree {
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
class Kruskals {
    static key = "Kruskal's";
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
            this.cellNodes[cell.gridIndex] = {
                index: cell.gridIndex,
                parent: null,
                children: [],
            };
            this.cellClrs[cell.gridIndex] = randomRGB(150);
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
        for (const tree of this.cellNodes) {
            const visited = new Set([tree]);
            let root = tree;
            while (root.parent) {
                visited.add(root);
                root = root.parent;
            }
            const [r, g, b] = this.cellClrs[root.index];
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
class Prims {
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
class Ellers {
    static key = "Eller's";
    isComplete = false;
    grid;
    index = 0;
    idList = [];
    sets = [];
    idsInUse = new Set();
    curEdge;
    bridgeDown = [];
    joinSetEdges;
    phase = 0;
    #idCounter = 1;
    constructor(grid, options) {
        const { "Eller's": { joinSetEdges }, } = options;
        this.joinSetEdges = joinSetEdges;
        this.grid = grid;
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
                    if (this.idsInUse instanceof Array)
                        throw "Can't be an array";
                    if (this.idList[index] === undefined) {
                        const newId = this.#idCounter++;
                        this.idList[index] = newId;
                        this.idsInUse.add(newId);
                        this.sets[newId] = [index];
                    }
                    const id = this.idList[index];
                    const cell = this.grid.cells[index];
                    cell.open = true;
                    if (atRightEdge) {
                        const rowIsLast = index / this.grid.colCnt >= this.grid.rowCnt - 1;
                        if (rowIsLast) {
                            if (this.idsInUse.size === 1) {
                                this.isComplete = true;
                                return;
                            }
                            this.phase = 3;
                            this.idsInUse = [...this.idsInUse];
                        }
                        else {
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
                    }
                    else if (Math.random() < 2 / 3) {
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
                        if (!this.joinSetEdges && nextRowIsLast)
                            this.phase = 2;
                        else
                            this.phase = 0;
                    }
                }
                break;
            case 2:
                // ENDING 1
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
            case 3:
                // ENDING 2
                // Keep joining sets until one set remains
                // Might prevent having maze be completely connected at the bottom
                // Wouldn't work for mazes that are infinite tho
                {
                    if (this.idsInUse instanceof Set)
                        throw "Can't be a set";
                    const id = randomItemInArray(this.idsInUse);
                    const set = this.sets[id];
                    const edges = set.flatMap((i) => {
                        const directions = [-this.grid.colCnt, 1, this.grid.colCnt, -1];
                        return directions
                            .filter((dir) => {
                            const newIndex = i + dir;
                            const newY = (newIndex / this.grid.colCnt) | 0;
                            const oldY = (i / this.grid.colCnt) | 0;
                            return (this.idList[newIndex] !== id &&
                                newIndex >= 0 &&
                                newIndex < this.grid.cells.length &&
                                (Math.abs(dir) !== 1 || newY === oldY));
                        })
                            .map((dir) => [i, dir]);
                    });
                    this.curEdge = randomItemInArray(edges);
                    const [index, dir] = this.curEdge;
                    const cell1 = this.grid.cells[index];
                    const cell2 = this.grid.cells[index + dir];
                    carveWall(cell1, cell2, dir);
                    const mergeId = this.idList[index + dir];
                    const mergeSet = this.sets[mergeId];
                    this.sets[id] = this.sets[id].concat(mergeSet);
                    for (const i of mergeSet) {
                        this.idList[i] = id;
                    }
                    // Remove merged set
                    delete this.sets[mergeId];
                    this.idsInUse = this.idsInUse.filter((n) => n !== mergeId);
                    if (this.idsInUse.length === 1)
                        this.isComplete = true;
                }
                break;
        }
    }
    iter = 0;
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
        // Current edge
        if (this.curEdge) {
            const [index, dir] = this.curEdge;
            const cell = this.grid.cells[index];
            ctx.beginPath();
            switch (dir) {
                case -this.grid.colCnt: // Top
                    ctx.moveTo(cell.screenX, cell.screenY);
                    ctx.lineTo(cell.screenX + cell.size, cell.screenY);
                    break;
                case 1: // Right
                    ctx.moveTo(cell.screenX + cell.size, cell.screenY);
                    ctx.lineTo(cell.screenX + cell.size, cell.screenY + cell.size);
                    break;
                case this.grid.colCnt: // Bottom
                    ctx.moveTo(cell.screenX + cell.size, cell.screenY + cell.size);
                    ctx.lineTo(cell.screenX, cell.screenY + cell.size);
                    break;
                case -1: // Left
                    ctx.moveTo(cell.screenX, cell.screenY + cell.size);
                    ctx.lineTo(cell.screenX, cell.screenY);
                    break;
                default:
                    throw 'Impossible direction';
                    break;
            }
            ctx.strokeStyle = '#0a0';
            ctx.lineWidth = 5;
            ctx.stroke();
        }
        // Cell ids
        for (let i = 0; i < this.idList.length; i++) {
            const id = this.idList[i];
            if (id !== undefined) {
                const { screenX, screenY, size } = this.grid.cells[i];
                const x = screenX + size / 2;
                const y = screenY + size / 2;
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
class Sidewinder {
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
            this.isComplete = true;
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
}
class HuntAndKill {
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
                    if (this.index >= Number(this.mazeCheckUntil)) {
                        this.isComplete = true;
                        return;
                    }
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
                    // Final check if maze is truly complete
                    if (++this.index >= this.grid.cells.length) {
                        if (this.mazeCheckUntil !== undefined) {
                            this.isComplete = true;
                            return;
                        }
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
    Ellers,
    Sidewinder,
    HuntAndKill,
];
// Some boilerplate
// class ALGO_NAME {
// 	static readonly key = "ALGO_NAME";
// 	isComplete = false;
// 	grid: Grid;
// 	constructor(grid: Grid) {
// 		this.grid = grid;
// 	}
// 	step() {
// 		if(this.isComplete) return;
// 	}
// 	draw(ctx: CanvasRenderingContext2D) {
// 		if(this.isComplete) return;
// 	}
// }
//# sourceMappingURL=mazeGenerator.js.map