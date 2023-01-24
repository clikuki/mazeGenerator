import { Grid } from './grid.js';
import {
	MazeGenerator,
	algorithms as mazeAlgorithms,
} from './mazeGenerator.js';
import {
	MazeSolver,
	pathDrawMethods,
	pathDrawMethodList,
} from './mazeSolver.js';

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;
canvas.width = innerHeight;
canvas.height = innerHeight;
const init = {
	w: 10,
	h: 10,
};
let grid = new Grid(
	init.w,
	init.h,
	canvas.width / init.w,
	canvas.height / init.h,
);
let mazeSolver: MazeSolver | undefined;
let startCellIndex: number | null = null;
// let mazeGenClass: typeof mazeAlgorithms[number] | undefined;
let mazeGenClass: typeof mazeAlgorithms[number] | undefined = mazeAlgorithms[2];
let mazeGen: MazeGenerator | undefined;
if (mazeGenClass) {
	mazeGen = new mazeGenClass(grid);
}
let pathDrawMethod: pathDrawMethods = pathDrawMethodList[0];
let pause = false;
const simulationSpeed = {
	capped: false,
	sps: 60,
};

// Controls and displays
function restart({ colCnt = grid.colCnt, rowCnt = grid.rowCnt }) {
	grid = new Grid(colCnt, rowCnt, canvas.width / colCnt, canvas.height / rowCnt);
	if (!mazeGenClass) return;
	mazeGen = new mazeGenClass(grid);
	mazeSolver = undefined;
	pause = false;
	pauseBtn.disabled = false;
	stepBtn.disabled = false;
	restartBtn.disabled = false;
}

const restartBtn = document.querySelector('.restart') as HTMLButtonElement;
restartBtn.disabled = !mazeGenClass;
restartBtn.addEventListener('click', () => restart({}));

const stepBtn = document.querySelector('.step') as HTMLButtonElement;
stepBtn.addEventListener('click', () => {
	if (mazeGen && !mazeGen.isComplete) {
		mazeGen.step();
		mazeGen.draw(ctx);
	} else if (mazeSolver && !mazeSolver.isComplete) {
		mazeSolver.step();
		mazeSolver.draw(ctx);
	}
});

const pauseBtn = document.querySelector('.pause') as HTMLButtonElement;
pauseBtn.addEventListener('click', () => {
	pause = !pause;
});

const fastForwardBtn = document.querySelector(
	'.fastForward',
) as HTMLButtonElement;
fastForwardBtn.addEventListener('click', () => {
	if (mazeGen && !mazeGen.isComplete) {
		while (!mazeGen.isComplete) {
			mazeGen.step();
		}
	} else if (mazeSolver && !mazeSolver.isComplete) {
		while (!mazeSolver.isComplete) {
			mazeSolver.step();
		}
	}
	fastForwardBtn.disabled = true;
});

const columnInput = document.querySelector(
	'.inputs .column',
) as HTMLInputElement;
columnInput.valueAsNumber = grid.colCnt;
const rowInput = document.querySelector('.inputs .row') as HTMLInputElement;
rowInput.valueAsNumber = grid.rowCnt;

columnInput.addEventListener('change', () => {
	const newVal = columnInput.valueAsNumber;
	if (isNaN(newVal) || newVal < 3 || newVal > 100) {
		columnInput.valueAsNumber = grid.colCnt;
		return;
	}
	restart({ colCnt: newVal });
});

rowInput.addEventListener('change', () => {
	const newVal = rowInput.valueAsNumber;
	if (isNaN(newVal) || newVal < 3 || newVal > 100) {
		rowInput.valueAsNumber = grid.colCnt;
		return;
	}
	restart({ rowCnt: newVal });
});

const simulationSpeedCapBtn = document.querySelector(
	'.stepsPerSecond button',
) as HTMLButtonElement;
const simulationSpeedInput = document.querySelector(
	'.stepsPerSecond input',
) as HTMLInputElement;
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
	const newVal = simulationSpeed.sps;
	if (isNaN(newVal) || newVal < 3) {
		simulationSpeedInput.valueAsNumber = simulationSpeed.sps;
		return;
	}
	simulationSpeed.sps = newVal;
});

const pathDrawMethodSelection = document.querySelector(
	'.pathDrawMethod select',
) as HTMLSelectElement;
for (const pathDrawMethod of pathDrawMethodList) {
	const optionElem = document.createElement('option');
	optionElem.value = pathDrawMethod;
	optionElem.textContent = pathDrawMethod;
	pathDrawMethodSelection.appendChild(optionElem);
}
pathDrawMethodSelection.value = pathDrawMethod;
pathDrawMethodSelection.addEventListener('change', () => {
	pathDrawMethod = pathDrawMethodSelection.value as pathDrawMethods;
	if (mazeSolver) mazeSolver.pathDrawMethod = pathDrawMethod;
});

const algoTypeSelection = document.querySelector(
	'.algoType select',
) as HTMLSelectElement;
const emptyOption = document.createElement('option');
emptyOption.textContent = '-- Choose Algorithm --';
if (!mazeGenClass) algoTypeSelection.appendChild(emptyOption);
for (const mazeGen of mazeAlgorithms) {
	const optionElem = document.createElement('option');
	optionElem.textContent = mazeGen.key;
	optionElem.value = mazeGen.key;
	algoTypeSelection.appendChild(optionElem);
}
if (mazeGenClass) algoTypeSelection.value = mazeGenClass.key;

algoTypeSelection.addEventListener('change', () => {
	const newVal = algoTypeSelection.value;
	for (const mazeGen of mazeAlgorithms) {
		if (mazeGen.key !== newVal) continue;
		if (!mazeGenClass) emptyOption.remove();
		mazeGenClass = mazeGen;
		restart({});
		return;
	}
	throw 'Invalid algorithm chosen';
});

let prevTime = Date.now();
(function loop() {
	requestAnimationFrame(loop);

	let stepRunners = true;
	if (simulationSpeed.capped) {
		const time = Date.now();
		const delta = time - prevTime;
		if (delta < 1000 / simulationSpeed.sps) {
			stepRunners = false;
		} else {
			prevTime = time;
		}
	}

	const nothingIsRunning =
		(!mazeGen || mazeGen.isComplete) && (!mazeSolver || mazeSolver.isComplete);
	fastForwardBtn.disabled = nothingIsRunning;
	if (nothingIsRunning) {
		pause = false;
		pauseBtn.disabled = true;
		stepBtn.disabled = true;
	}
	pauseBtn.textContent = pause ? 'Resume' : 'Pause';

	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	grid.drawGrayedCells(canvas, ctx);

	if (mazeGen && !mazeGen.isComplete) {
		if (!pause && stepRunners) mazeGen.step();
		mazeGen.draw(ctx);
	} else if (mazeSolver) {
		if (!mazeSolver.isComplete && !pause && stepRunners) mazeSolver.step();
		mazeSolver.draw(ctx);
	}

	grid.drawWalls(canvas, ctx);

	if (startCellIndex !== null) {
		const cell = grid[startCellIndex];
		ctx.fillStyle = '#00f';
		ctx.fillRect(cell.screenX, cell.screenY, grid.cellWidth, grid.cellHeight);
	}
})();

// Activate Mouse solver on clicks
canvas.addEventListener('click', (e) => {
	if (mazeGen && mazeGen.isComplete && (!mazeSolver || mazeSolver.isComplete)) {
		const cellX = Math.floor(e.x / grid.cellWidth);
		const cellY = Math.floor(e.y / grid.cellHeight);
		if (cellX >= grid.colCnt || cellY >= grid.rowCnt) return;
		const cellIndex = cellY * grid.colCnt + cellX;

		if (startCellIndex !== null && startCellIndex !== cellIndex) {
			mazeSolver = new MazeSolver(grid, startCellIndex, cellIndex);
			mazeSolver.pathDrawMethod = pathDrawMethod;
			startCellIndex = null;
			pauseBtn.disabled = false;
			stepBtn.disabled = false;
		} else {
			startCellIndex = cellIndex;
			mazeSolver = undefined;
		}
	}
});
