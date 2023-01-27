import { Grid } from './grid.js';
import { algorithms as mazeAlgorithms, } from './mazeGenerator.js';
import { MazeSolver, pathDrawMethodList, } from './mazeSolver.js';
import { convertGridToGraph } from './utils.js';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = innerHeight;
canvas.height = innerHeight;
let grid = new Grid(10, 10, canvas);
let mazeSolver;
let solveStartIndex = null;
let mazeGenClass;
let mazeGen;
if (mazeGenClass) {
    mazeGen = new mazeGenClass(grid);
}
let pathDrawMethod = pathDrawMethodList[0];
let pause = false;
const simulationSpeed = {
    capped: false,
    sps: 60,
};
// Controls and displays
function restart({ colCnt = grid.colCnt, rowCnt = grid.rowCnt }) {
    grid = new Grid(colCnt, rowCnt, canvas);
    if (!mazeGenClass)
        return;
    mazeGen = new mazeGenClass(grid);
    mazeSolver = undefined;
    pause = false;
    pauseBtn.disabled = false;
    stepBtn.disabled = false;
    restartBtn.disabled = false;
    solveStartIndex = null;
}
const restartBtn = document.querySelector('.restart');
restartBtn.disabled = !mazeGenClass;
restartBtn.addEventListener('click', () => restart({}));
const stepBtn = document.querySelector('.step');
stepBtn.addEventListener('click', () => {
    if (mazeGen && !mazeGen.isComplete) {
        mazeGen.step();
        if (mazeGen.draw)
            mazeGen.draw(ctx);
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
    if (mazeGen && !mazeGen.isComplete) {
        while (!mazeGen.isComplete) {
            mazeGen.step();
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
    if (!mazeGen || !mazeGen.isComplete)
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
    if (!mazeGen || !mazeGen.isComplete)
        return;
    const simplifiedGrid = grid.cells.map((cell) => ({
        x: cell.gridX,
        y: cell.gridY,
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
    if (!mazeGen || !mazeGen.isComplete)
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
if (!mazeGenClass)
    algoTypeSelection.appendChild(emptyOption);
for (const mazeGen of mazeAlgorithms) {
    const optionElem = document.createElement('option');
    optionElem.textContent = mazeGen.key;
    optionElem.value = mazeGen.key;
    algoTypeSelection.appendChild(optionElem);
}
if (mazeGenClass)
    algoTypeSelection.value = mazeGenClass.key;
algoTypeSelection.addEventListener('change', () => {
    const newVal = algoTypeSelection.value;
    for (const mazeGen of mazeAlgorithms) {
        if (mazeGen.key !== newVal)
            continue;
        if (!mazeGenClass)
            emptyOption.remove();
        mazeGenClass = mazeGen;
        restart({});
        return;
    }
    throw 'Invalid algorithm chosen';
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
    const nothingIsRunning = (!mazeGen || mazeGen.isComplete) && (!mazeSolver || mazeSolver.isComplete);
    fastForwardBtn.disabled = nothingIsRunning;
    if (nothingIsRunning) {
        pause = false;
        pauseBtn.disabled = true;
        stepBtn.disabled = true;
    }
    pauseBtn.textContent = pause ? 'Resume' : 'Pause';
    const mazeHasGenerated = !mazeGen || !mazeGen.isComplete;
    exportAsImageBtn.disabled = mazeHasGenerated;
    exportAsGridBtn.disabled = mazeHasGenerated;
    exportAsGraphBtn.disabled = mazeHasGenerated;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Center draws
    ctx.save();
    ctx.translate(grid.centerOffsetX, grid.centerOffsetY);
    grid.drawGrayedCells(canvas, ctx);
    if (mazeGen && !mazeGen.isComplete) {
        if (!pause && stepRunners)
            mazeGen.step();
        if (mazeGen.draw)
            mazeGen.draw(ctx);
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
    if (mazeGen &&
        mazeGen.isComplete &&
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