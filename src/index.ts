import { Grid } from './grid.js';
import { MazeGenerator } from './mazeGenerator.js';
import { MazeSolver } from './mazeSolver.js';

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;
canvas.width = innerHeight;
canvas.height = innerHeight;
const initGridSize = {
	w: 10,
	h: 10,
};
let grid = new Grid(
	initGridSize.w,
	initGridSize.h,
	canvas.width / initGridSize.w,
	canvas.height / initGridSize.h,
);
let mazeSolver: MazeSolver | undefined;
let startCellIndex: number | null = null;
let mazeGen = new MazeGenerator(grid);
let pause = false;
const simulationSpeed = {
	capped: false,
	sps: 60,
};

// Controls and displays
function restart({ colCnt = grid.colCnt, rowCnt = grid.colCnt }) {
	grid = new Grid(colCnt, rowCnt, canvas.width / colCnt, canvas.height / rowCnt);
	mazeGen = new MazeGenerator(grid);
	mazeSolver = undefined;
	pause = false;
	pauseBtn.disabled = false;
	stepBtn.disabled = false;
}

document
	.querySelector('.restart')!
	.addEventListener('click', () => restart({}));

const stepBtn = document.querySelector('.step') as HTMLButtonElement;
stepBtn.addEventListener('click', () => {
	if (!mazeGen.isComplete) {
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
	if (!mazeGen.isComplete) {
		while (!mazeGen.isComplete) {
			mazeGen.step();
		}
	} else if (mazeSolver && !mazeSolver.isComplete) {
		while (!mazeSolver.isComplete) {
			mazeGen.step();
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
const simulationSpeedNumInput = document.querySelector(
	'.stepsPerSecond input',
) as HTMLInputElement;
simulationSpeedNumInput.valueAsNumber = simulationSpeed.sps;
simulationSpeedNumInput.disabled = !simulationSpeed.capped;
simulationSpeedCapBtn.addEventListener('click', () => {
	simulationSpeed.capped = !simulationSpeed.capped;
	simulationSpeedCapBtn.textContent = simulationSpeed.capped
		? 'Capped'
		: 'Uncapped';
	simulationSpeedNumInput.disabled = !simulationSpeed.capped;
});
simulationSpeedNumInput.addEventListener('change', () => {
	const newVal = simulationSpeed.sps;
	if (isNaN(newVal) || newVal < 3) {
		simulationSpeedNumInput.valueAsNumber = simulationSpeed.sps;
		return;
	}
	simulationSpeed.sps = newVal;
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

	grid.draw(canvas, ctx);
	fastForwardBtn.disabled =
		mazeGen.isComplete && (!mazeSolver || mazeSolver.isComplete);
	if (mazeGen.isComplete && (!mazeSolver || mazeSolver.isComplete)) {
		pause = false;
		pauseBtn.disabled = true;
		stepBtn.disabled = true;
	}
	pauseBtn.textContent = pause ? 'Resume' : 'Pause';
	if (!mazeGen.isComplete) {
		if (!pause && stepRunners) mazeGen.step();
		mazeGen.draw(ctx);
	} else if (mazeSolver) {
		if (!mazeSolver.isComplete && !pause && stepRunners) mazeSolver.step();
		mazeSolver.draw(ctx);
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
			startCellIndex = null;
			pauseBtn.disabled = false;
			stepBtn.disabled = false;
		} else startCellIndex = cellIndex;
	}
});
