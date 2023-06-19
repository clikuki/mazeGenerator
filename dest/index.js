import { Grid } from './grid.js';
import { Algorithms as mazeGenerators } from './mazeGenerator.js';
import { MazeSolver, pathDrawMethodList, } from './mazeSolver.js';
import { convertGridToGraph } from './utils.js';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = innerHeight;
canvas.height = innerHeight;
let grid = new Grid(10, 10, canvas);
// let grid = new Grid(3, 3, canvas);
let mazeSolver;
let solveStartIndex = null;
const mazeGen = {
    class: undefined,
    instance: undefined,
    options: {
        'Binary Tree': {
            horizontal: 'EAST',
            vertical: 'SOUTH',
        },
        "Eller's": {
            mergeChance: 0.66,
        },
        'Growing Tree': {
            pickingStyle: {
                NEWEST: 1,
            },
        },
    },
};
if (mazeGen.class) {
    mazeGen.instance = new mazeGen.class(grid, mazeGen.options);
}
let pathDrawMethod = pathDrawMethodList[0];
let pause = false;
const simulationSpeed = {
    capped: false,
    sps: 60,
    // capped: true,
    // sps: 1,
};
// Controls and displays
function restart({ colCnt = grid.colCnt, rowCnt = grid.rowCnt }) {
    grid = new Grid(colCnt, rowCnt, canvas);
    if (!mazeGen.class)
        return;
    mazeGen.instance = new mazeGen.class(grid, mazeGen.options);
    mazeSolver = undefined;
    pause = false;
    pauseBtn.disabled = false;
    stepBtn.disabled = false;
    restartBtn.disabled = false;
    solveStartIndex = null;
}
const restartBtn = document.querySelector('.restart');
restartBtn.disabled = !mazeGen.class;
restartBtn.addEventListener('click', () => restart({}));
const stepBtn = document.querySelector('.step');
stepBtn.addEventListener('click', () => {
    if (mazeGen.instance && !mazeGen.instance.isComplete) {
        mazeGen.instance.step();
        // @ts-ignore
        if (mazeGen.instance.draw)
            mazeGen.instance.draw(ctx);
    }
    else if (mazeSolver && !mazeSolver.isComplete) {
        mazeSolver.step();
        mazeSolver.draw(ctx);
    }
});
const pauseBtn = document.querySelector('.pause');
pauseBtn.addEventListener('click', () => {
    pause = !pause;
});
const fastForwardBtn = document.querySelector('.fastForward');
fastForwardBtn.addEventListener('click', () => {
    if (mazeGen.instance && !mazeGen.instance.isComplete) {
        while (!mazeGen.instance.isComplete) {
            mazeGen.instance.step();
        }
    }
    else if (mazeSolver && !mazeSolver.isComplete) {
        while (!mazeSolver.isComplete) {
            mazeSolver.step();
        }
    }
    fastForwardBtn.disabled = true;
});
const columnInput = document.querySelector('.inputs .column');
columnInput.valueAsNumber = grid.colCnt;
const rowInput = document.querySelector('.inputs .row');
rowInput.valueAsNumber = grid.rowCnt;
const minDimensions = 3;
const maxDimensions = 150;
columnInput.addEventListener('change', () => {
    const newVal = columnInput.valueAsNumber;
    if (isNaN(newVal) || newVal < minDimensions || newVal > maxDimensions) {
        columnInput.valueAsNumber = grid.colCnt;
        return;
    }
    restart({ colCnt: newVal });
});
rowInput.addEventListener('change', () => {
    const newVal = rowInput.valueAsNumber;
    if (isNaN(newVal) || newVal < minDimensions || newVal > maxDimensions) {
        rowInput.valueAsNumber = grid.colCnt;
        return;
    }
    restart({ rowCnt: newVal });
});
const simulationSpeedCapBtn = document.querySelector('.stepsPerSecond button');
const simulationSpeedInput = document.querySelector('.stepsPerSecond input');
simulationSpeedInput.valueAsNumber = simulationSpeed.sps;
simulationSpeedInput.disabled = !simulationSpeed.capped;
simulationSpeedCapBtn.addEventListener('click', () => {
    simulationSpeed.capped = !simulationSpeed.capped;
    simulationSpeedCapBtn.textContent = simulationSpeed.capped
        ? 'Capped'
        : 'Uncapped';
    simulationSpeedInput.disabled = !simulationSpeed.capped;
});
simulationSpeedInput.addEventListener('change', () => {
    const newVal = simulationSpeedInput.valueAsNumber;
    if (isNaN(newVal) || newVal < 1) {
        simulationSpeedInput.valueAsNumber = simulationSpeed.sps;
        return;
    }
    simulationSpeed.sps = newVal;
});
function download(url, fileExtension) {
    // Download img by clicking link with js
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.href = url;
    // Set datetime filename
    const date = new Date();
    const numToTwoCharStr = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = numToTwoCharStr(date.getMonth());
    const day = numToTwoCharStr(date.getDate());
    const hour = numToTwoCharStr(date.getHours());
    const minutes = numToTwoCharStr(date.getMinutes());
    const seconds = numToTwoCharStr(date.getSeconds());
    const milliseconds = numToTwoCharStr(date.getMilliseconds());
    const fileName = `maze-${year}-${month}-${day}-T${hour}-${minutes}-${seconds}-${milliseconds}`;
    link.download = `${fileName}.${fileExtension}`;
    link.click();
    link.remove();
}
const exportAsImageBtn = document.querySelector('.exportAsImage');
exportAsImageBtn.addEventListener('click', () => {
    if (!mazeGen.instance || !mazeGen.instance.isComplete)
        return;
    const dimensions = [canvas.width, canvas.height];
    canvas.width = grid.cellSize * grid.colCnt;
    canvas.height = grid.cellSize * grid.rowCnt;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    grid.drawWalls(ctx);
    const imgUrl = canvas.toDataURL();
    canvas.width = dimensions[0];
    canvas.height = dimensions[1];
    download(imgUrl, 'png');
});
const exportAsGridBtn = document.querySelector('.exportAsGrid');
exportAsGridBtn.addEventListener('click', () => {
    if (!mazeGen.instance || !mazeGen.instance.isComplete)
        return;
    const simplifiedGrid = grid.cells.map((cell) => ({
        x: cell.x,
        y: cell.y,
        top: cell.walls[0],
        right: cell.walls[1],
        bottom: cell.walls[2],
        left: cell.walls[3],
    }));
    const blob = new Blob([JSON.stringify(simplifiedGrid)], { type: 'text/json' });
    download(URL.createObjectURL(blob), 'json');
});
const exportAsGraphBtn = document.querySelector('.exportAsGraph');
exportAsGraphBtn.addEventListener('click', () => {
    if (!mazeGen.instance || !mazeGen.instance.isComplete)
        return;
    const graph = convertGridToGraph(grid);
    const simplifiedGraph = {};
    let idCounter = 0;
    const nodeIdMap = new Map();
    function getNodeId(node) {
        let id = nodeIdMap.get(node);
        if (!id) {
            id = (++idCounter).toString(16);
            nodeIdMap.set(node, id);
        }
        return id;
    }
    for (const [, node] of graph) {
        const id = getNodeId(node);
        simplifiedGraph[id] = node.neighbors.map((neighbor) => getNodeId(neighbor));
    }
    const blob = new Blob([JSON.stringify(simplifiedGraph)], {
        type: 'text/json',
    });
    download(URL.createObjectURL(blob), 'json');
});
const pathDrawMethodSelection = document.querySelector('.pathDrawMethod select');
for (const pathDrawMethod of pathDrawMethodList) {
    const optionElem = document.createElement('option');
    optionElem.value = pathDrawMethod;
    optionElem.textContent = pathDrawMethod;
    pathDrawMethodSelection.appendChild(optionElem);
}
pathDrawMethodSelection.value = pathDrawMethod;
pathDrawMethodSelection.addEventListener('change', () => {
    pathDrawMethod = pathDrawMethodSelection.value;
    if (mazeSolver)
        mazeSolver.pathDrawMethod = pathDrawMethod;
});
const algoTypeSelection = document.querySelector('.algoType select');
const emptyOption = document.createElement('option');
emptyOption.textContent = '-- Choose Algorithm --';
if (!mazeGen.class)
    algoTypeSelection.appendChild(emptyOption);
for (const mazeGenClass of mazeGenerators) {
    const optionElem = document.createElement('option');
    optionElem.textContent = mazeGenClass.key;
    optionElem.value = mazeGenClass.key;
    algoTypeSelection.appendChild(optionElem);
}
if (mazeGen.class)
    algoTypeSelection.value = mazeGen.class.key;
algoTypeSelection.addEventListener('change', () => {
    const newVal = algoTypeSelection.value;
    for (const mazeAlgo of mazeGenerators) {
        if (mazeAlgo.key !== newVal)
            continue;
        if (!mazeGen.class)
            emptyOption.remove();
        mazeGen.class = mazeAlgo;
        restart({});
        return;
    }
    throw 'Invalid algorithm chosen';
});
const binaryTreeSelection = document.querySelector('.binaryTree select');
const binaryTreeOptions = mazeGen.options['Binary Tree'];
binaryTreeSelection.value =
    binaryTreeOptions.vertical + '-' + binaryTreeOptions.horizontal;
binaryTreeSelection.addEventListener('change', () => {
    const [vertical, horizontal] = binaryTreeSelection.value.split('-');
    if (binaryTreeOptions.horizontal === horizontal &&
        binaryTreeOptions.vertical === vertical)
        return;
    binaryTreeOptions.horizontal = horizontal;
    binaryTreeOptions.vertical = vertical;
    restart({});
});
const ellersCarveChanceInput = document.querySelector('.ellersCarveChance input');
const ellersOptions = mazeGen.options["Eller's"];
ellersCarveChanceInput.valueAsNumber =
    Math.floor(ellersOptions.mergeChance * 100) / 100;
ellersCarveChanceInput.addEventListener('change', () => {
    const newChance = Math.floor(ellersCarveChanceInput.valueAsNumber * 100) / 100;
    if (isNaN(newChance) || newChance < 0 || newChance > 1) {
        ellersCarveChanceInput.valueAsNumber =
            Math.floor(ellersOptions.mergeChance * 100) / 100;
        return;
    }
    ellersOptions.mergeChance = newChance;
    ellersCarveChanceInput.valueAsNumber = newChance;
    restart({});
});
const growingTreePickingStyleSelection = document.querySelector('.growingTree select');
const growingTreeOptions = mazeGen.options['Growing Tree'];
{
    const pickStyleEntries = Object.entries(growingTreeOptions.pickingStyle);
    const initValue = pickStyleEntries.length === 1
        ? pickStyleEntries[0][0]
        : pickStyleEntries
            // :>
            .reduce(([nl, cl], [n, c]) => [
            [...nl, n],
            [...cl, c],
        ], // :<
        [[], []])
            .flat()
            .join('-');
    // console.log(initValue);
    growingTreePickingStyleSelection.value = initValue;
}
growingTreePickingStyleSelection.addEventListener('change', () => {
    const value = growingTreePickingStyleSelection.value;
    if (value.includes('-')) {
        const [style1, style2, chance1, chance2] = value.split('-');
        growingTreeOptions.pickingStyle = {
            [style1]: +chance1,
            [style2]: +chance2,
        };
    }
    else {
        const pickingStyle = value;
        growingTreeOptions.pickingStyle = { [pickingStyle]: 1 };
    }
    restart({});
});
let prevTime = Date.now();
(function loop() {
    requestAnimationFrame(loop);
    grid.drawWalls(ctx);
    let stepRunners = true;
    if (simulationSpeed.capped) {
        const time = Date.now();
        const delta = time - prevTime;
        if (delta < 1000 / simulationSpeed.sps) {
            stepRunners = false;
        }
        else {
            prevTime = time;
        }
    }
    const nothingIsRunning = (!mazeGen.instance || mazeGen.instance.isComplete) &&
        (!mazeSolver || mazeSolver.isComplete);
    fastForwardBtn.disabled = nothingIsRunning;
    if (nothingIsRunning) {
        pause = false;
        pauseBtn.disabled = true;
        stepBtn.disabled = true;
    }
    pauseBtn.textContent = pause ? 'Resume' : 'Pause';
    if (!mazeGen.instance)
        canvas.setAttribute('data-state', 'EMPTY');
    else
        canvas.setAttribute('data-state', nothingIsRunning ? 'IDLE' : 'RUNNING');
    const mazeHasGenerated = !mazeGen.instance || !mazeGen.instance.isComplete;
    exportAsImageBtn.disabled = mazeHasGenerated;
    exportAsGridBtn.disabled = mazeHasGenerated;
    exportAsGraphBtn.disabled = mazeHasGenerated;
    // Draw outside of grid
    if (grid.colCnt !== grid.rowCnt) {
        ctx.fillStyle = '#dd0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        {
            const barIterSpacing = 1 / 5;
            const spaceBetweenBars = (barIterSpacing * 1) / 3;
            for (let i = -spaceBetweenBars; i < 2; i += barIterSpacing) {
                ctx.beginPath();
                ctx.moveTo(canvas.width * i, 0);
                ctx.lineTo(canvas.width * (i + 1 / 8), 0);
                ctx.lineTo(0, canvas.width * (i + 1 / 8));
                ctx.lineTo(0, canvas.width * i);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    // Draw grid background
    ctx.fillStyle = '#000';
    ctx.fillRect(Math.floor(grid.centerOffsetX), Math.floor(grid.centerOffsetY), Math.ceil(grid.cellSize * grid.colCnt), Math.ceil(grid.cellSize * grid.rowCnt));
    // Center draws
    ctx.save();
    ctx.translate(grid.centerOffsetX, grid.centerOffsetY);
    grid.drawGrayedCells(canvas, ctx);
    if (mazeGen.instance && !mazeGen.instance.isComplete) {
        if (!pause && stepRunners)
            mazeGen.instance.step();
        // @ts-ignore
        if (mazeGen.instance.draw)
            mazeGen.instance.draw(ctx);
    }
    else if (mazeSolver) {
        if (!mazeSolver.isComplete && !pause && stepRunners)
            mazeSolver.step();
        mazeSolver.draw(ctx);
    }
    grid.drawWalls(ctx);
    if (solveStartIndex !== null) {
        const cell = grid.cells[solveStartIndex];
        ctx.fillStyle = '#00f';
        ctx.fillRect(cell.screenX, cell.screenY, grid.cellSize, grid.cellSize);
    }
    ctx.restore();
})();
// Activate Mouse solver on clicks
canvas.addEventListener('click', (e) => {
    if (mazeGen.instance &&
        mazeGen.instance.isComplete &&
        (!mazeSolver || mazeSolver.isComplete) &&
        e.x >= grid.centerOffsetX &&
        e.y >= grid.centerOffsetY) {
        const cellX = Math.floor((e.x - grid.centerOffsetX) / grid.cellSize);
        const cellY = Math.floor((e.y - grid.centerOffsetY) / grid.cellSize);
        if (cellX >= grid.colCnt || cellY >= grid.rowCnt)
            return;
        const cellIndex = cellY * grid.colCnt + cellX;
        if (solveStartIndex !== null && solveStartIndex !== cellIndex) {
            mazeSolver = new MazeSolver(grid, solveStartIndex, cellIndex);
            mazeSolver.pathDrawMethod = pathDrawMethod;
            solveStartIndex = null;
            pauseBtn.disabled = false;
            stepBtn.disabled = false;
        }
        else {
            solveStartIndex = cellIndex;
            mazeSolver = undefined;
        }
    }
});
//# sourceMappingURL=index.js.map