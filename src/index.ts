import { Grid } from './grid.js';
import { MazeGenerators, MazeGenManager } from './mazeGenerator.js';
import { MazeSolver } from './mazeSolver.js';
import { GraphNode, convertGridToGraph } from './utils.js';

/*
	SOME MAYBE PLANS
==-==-==-==-==-==-==-==-==-==-==-==-==-==-==-==
	Add option for symmetry
	Different cell shapes? (triangle, hexagon)
*/

const canvas = document.querySelector('canvas')!;
canvas.width = Math.min(innerHeight, innerWidth);
canvas.height = Math.min(innerHeight, innerWidth);
const ctx = canvas.getContext('2d')!;
let grid = new Grid(10, 10, canvas);
let mazeSolver: MazeSolver | undefined;
let solveStartIndex: number | null = null;
const mazeGenManager = new MazeGenManager();
const simulation = {
	paused: false,
	capped: false,
	sps: 60,
};

// Controls and displays
function restart({ colCnt = grid.colCnt, rowCnt = grid.rowCnt }) {
	if (!mazeGenManager.current) return;
	if (mazeSolver) {
		mazeSolver = new MazeSolver(grid, mazeSolver!.start, mazeSolver!.dest);
	} else {
		grid = new Grid(colCnt, rowCnt, canvas);
		mazeGenManager.restart(grid);
	}
	mazeSolver = undefined;
	simulation.paused = false;
	pauseBtn.disabled = false;
	stepBtn.disabled = false;
	restartBtn.disabled = false;
	solveStartIndex = null;
}

const restartBtn = document.querySelector('.restart') as HTMLButtonElement;
restartBtn.disabled = !mazeGenManager.current;
restartBtn.addEventListener('click', () => restart({}));

const stepBtn = document.querySelector('.step') as HTMLButtonElement;
stepBtn.addEventListener('click', () => {
	if (!mazeGenManager.isComplete) {
		mazeGenManager.step();
		mazeGenManager.draw(ctx);
	} else if (mazeSolver && !mazeSolver.isComplete) {
		mazeSolver.step();
		mazeSolver.draw(ctx);
	}
});

const pauseBtn = document.querySelector('.pause') as HTMLButtonElement;
pauseBtn.addEventListener('click', () => {
	simulation.paused = !simulation.paused;
});

const fastForwardBtn = document.querySelector(
	'.fastForward',
) as HTMLButtonElement;
fastForwardBtn.addEventListener('click', () => {
	while (!mazeGenManager.isComplete) {
		mazeGenManager.step();
	}
	while (mazeSolver && !mazeSolver.isComplete) {
		mazeSolver!.step();
	}
	fastForwardBtn.disabled = true;
});

const columnInput = document.querySelector(
	'.inputs .column',
) as HTMLInputElement;
columnInput.valueAsNumber = grid.colCnt;
const rowInput = document.querySelector('.inputs .row') as HTMLInputElement;
rowInput.valueAsNumber = grid.rowCnt;

const minDimensions = 2;
const maxDimensions = 200;
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

const simulationCapBtn = document.querySelector(
	'.stepsPerSecond button',
) as HTMLButtonElement;
const simulationInput = document.querySelector(
	'.stepsPerSecond input',
) as HTMLInputElement;
simulationInput.valueAsNumber = simulation.sps;
simulationInput.disabled = !simulation.capped;
simulationCapBtn.addEventListener('click', () => {
	simulation.capped = !simulation.capped;
	simulationCapBtn.textContent = simulation.capped ? 'Capped' : 'Uncapped';
	simulationInput.disabled = !simulation.capped;
});
simulationInput.addEventListener('change', () => {
	const newVal = simulationInput.valueAsNumber;
	if (isNaN(newVal) || newVal < 1) {
		simulationInput.valueAsNumber = simulation.sps;
		return;
	}
	simulation.sps = newVal;
});

function download(url: string, fileExtension: string) {
	// Download img by clicking link with js
	const link = document.createElement('a');
	document.body.appendChild(link);
	link.href = url;

	// Set datetime filename
	const date = new Date();
	const numToTwoCharStr = (num: number) => String(num).padStart(2, '0');
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

const exportAsImageBtn = document.querySelector(
	'.exportAsImage',
) as HTMLButtonElement;
exportAsImageBtn.addEventListener('click', () => {
	if (!mazeGenManager.isComplete) return;

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

const exportAsGridBtn = document.querySelector(
	'.exportAsGrid',
) as HTMLButtonElement;
exportAsGridBtn.addEventListener('click', () => {
	if (!mazeGenManager.isComplete) return;

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

const exportAsGraphBtn = document.querySelector(
	'.exportAsGraph',
) as HTMLButtonElement;
exportAsGraphBtn.addEventListener('click', () => {
	if (!mazeGenManager.isComplete) return;

	const graph = convertGridToGraph(grid);
	const simplifiedGraph: { [key: string]: string[] } = {};

	let idCounter = 0;
	const nodeIdMap = new Map<GraphNode, string>();
	function getNodeId(node: GraphNode) {
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

const algoTypeSelection = document.querySelector(
	'.algoType select',
) as HTMLSelectElement;
let emptyOption: HTMLOptionElement | undefined =
	document.createElement('option');
emptyOption.textContent = '-- Choose Algorithm --';
emptyOption.value = 'null';
for (const mazeGenClass of MazeGenerators) {
	const optionElem = document.createElement('option');
	optionElem.textContent = mazeGenClass.key;
	optionElem.value = mazeGenClass.key;
	algoTypeSelection.appendChild(optionElem);
}
if (mazeGenManager.current) algoTypeSelection.value = mazeGenManager.current;
else {
	algoTypeSelection.prepend(emptyOption);
	algoTypeSelection.value = emptyOption.value;
}

algoTypeSelection.addEventListener('change', () => {
	const newVal = algoTypeSelection.value;
	for (const mazeAlgo of MazeGenerators) {
		if (mazeAlgo.key !== newVal) continue;
		if (emptyOption && !mazeGenManager.current) {
			emptyOption.remove();
			emptyOption = undefined;
		}
		mazeGenManager.current = mazeAlgo.key;
		restart({});
		return;
	}
	throw 'Invalid algorithm chosen';
});

const rdTraversalSelection = document.querySelector(
	'.recursiveDivisionTraversal select',
) as HTMLSelectElement;
rdTraversalSelection.value = mazeGenManager.getOption('useBfs') ? 'BFS' : 'DFS';
rdTraversalSelection.addEventListener('click', () => {
	const method = rdTraversalSelection.value === 'BFS';
	mazeGenManager.setOption('useBfs', method);
	if (
		mazeGenManager.current === 'Recursive Division' ||
		mazeGenManager.current === 'Recursive Cluster Division'
	) {
		restart({});
	}
});

const rcdSizeInput = document.querySelector(
	'.blobbyDivisionGInput input',
) as HTMLInputElement;
rcdSizeInput.valueAsNumber = mazeGenManager.getOption('roomMaxSize');
rcdSizeInput.addEventListener('change', () => {
	const newSize = rcdSizeInput.valueAsNumber;
	if (isNaN(newSize) || newSize < 1) {
		rcdSizeInput.valueAsNumber = mazeGenManager.getOption('roomMaxSize');
	} else {
		mazeGenManager.setOption('roomMaxSize', newSize);
		if (mazeGenManager.current === 'Recursive Cluster Division') {
			restart({});
		}
	}
});

const binaryTreeSelection = document.querySelector(
	'.binaryTree select',
) as HTMLSelectElement;
binaryTreeSelection.value =
	mazeGenManager.getOption('vert') + '-' + mazeGenManager.getOption('horz');
binaryTreeSelection.addEventListener('change', () => {
	const [vertical, horizontal] = binaryTreeSelection.value.split('-') as any;
	mazeGenManager.setOption('horz', horizontal);
	mazeGenManager.setOption('vert', vertical);
	if (mazeGenManager.current === 'Binary Tree') {
		restart({});
	}
});

const ellersCarveChanceInput = document.querySelector(
	'.ellersCarveChance input',
) as HTMLInputElement;
ellersCarveChanceInput.valueAsNumber =
	Math.floor(mazeGenManager.getOption('mergeChance') * 100) / 100;
ellersCarveChanceInput.addEventListener('change', () => {
	const newChance = +ellersCarveChanceInput.valueAsNumber.toPrecision(2);
	if (isNaN(newChance) || newChance < 0 || newChance > 1) {
		+mazeGenManager.getOption('mergeChance').toPrecision(2);
	} else {
		mazeGenManager.setOption('mergeChance', newChance);
		ellersCarveChanceInput.valueAsNumber = newChance;
		if (mazeGenManager.current === 'Ellers') {
			restart({});
		}
	}
});

const growingTreePickingStyleSelection = document.querySelector(
	'.growingTree select',
) as HTMLSelectElement;
{
	// Init
	const pickStyleEntries = Object.entries(
		mazeGenManager.getOption('pickingStyle'),
	);
	const initValue =
		pickStyleEntries.length === 1
			? pickStyleEntries[0][0]
			: pickStyleEntries
					// :>
					.reduce(
						([nl, cl], [n, c]) =>
							[
								[...nl, n],
								[...cl, c],
							] as [string[], number[]], // :<
						[[], []] as [string[], number[]],
					)
					.flat()
					.join('-');
	growingTreePickingStyleSelection.value = initValue;
}
growingTreePickingStyleSelection.addEventListener('change', () => {
	const value = growingTreePickingStyleSelection.value as any;
	if (value.includes('-')) {
		const [style1, style2, chance1, chance2] = value.split('-');
		mazeGenManager.setOption('pickingStyle', {
			[style1]: +chance1,
			[style2]: +chance2,
		});
	} else {
		const pickingStyle = value;
		mazeGenManager.setOption('pickingStyle', { [pickingStyle]: 1 });
	}
	if (mazeGenManager.current === 'Growing Tree') restart({});
});

let prevTime = Date.now();
(function loop() {
	requestAnimationFrame(loop);

	const nothingIsRunning =
		mazeGenManager.isComplete && (!mazeSolver || mazeSolver.isComplete);

	let stepRunners = true;
	if (simulation.capped) {
		const time = Date.now();
		const delta = time - prevTime;
		if (delta < 1000 / simulation.sps) {
			stepRunners = false;
		} else {
			prevTime = time;
		}
	}

	fastForwardBtn.disabled = nothingIsRunning;
	if (nothingIsRunning) {
		simulation.paused = false;
		pauseBtn.disabled = true;
		stepBtn.disabled = true;
	}
	pauseBtn.textContent = simulation.paused ? 'Resume' : 'Pause';
	if (!mazeGenManager.current) canvas.setAttribute('data-state', 'EMPTY');
	else canvas.setAttribute('data-state', nothingIsRunning ? 'IDLE' : 'RUNNING');

	const mazeHasGenerated = !mazeGenManager.isComplete;
	exportAsImageBtn.disabled = mazeHasGenerated;
	exportAsGridBtn.disabled = mazeHasGenerated;
	exportAsGraphBtn.disabled = mazeHasGenerated;

	// Draw yellow and black stripes behind maze
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

	// Draw maze background
	ctx.fillStyle = '#000';
	ctx.fillRect(
		Math.floor(grid.centerOffsetX),
		Math.floor(grid.centerOffsetY),
		Math.ceil(grid.cellSize * grid.colCnt),
		Math.ceil(grid.cellSize * grid.rowCnt),
	);

	ctx.save();
	ctx.translate(grid.centerOffsetX, grid.centerOffsetY);

	// Draw solve starter cell
	if (solveStartIndex !== null) {
		const cell = grid.cells[solveStartIndex];
		ctx.fillStyle = '#00f';
		ctx.fillRect(cell.screenX, cell.screenY, grid.cellSize, grid.cellSize);
	}

	grid.drawGrayedCells(ctx);

	if (!mazeGenManager.isComplete) {
		if (!simulation.paused && stepRunners) mazeGenManager.step();
		mazeGenManager.draw(ctx);
	} else if (mazeSolver) {
		if (!mazeSolver.isComplete && !simulation.paused && stepRunners) {
			mazeSolver.step();
		}
		mazeSolver.draw(ctx);
	}

	grid.drawWalls(ctx);
	ctx.restore();
})();

// Activate Mouse solver on clicks
canvas.addEventListener('click', (e) => {
	if (
		mazeGenManager &&
		mazeGenManager.isComplete &&
		(!mazeSolver || mazeSolver.isComplete) &&
		e.x >= grid.centerOffsetX &&
		e.y >= grid.centerOffsetY
	) {
		const cellX = Math.floor((e.x - grid.centerOffsetX) / grid.cellSize);
		const cellY = Math.floor((e.y - grid.centerOffsetY) / grid.cellSize);
		if (cellX >= grid.colCnt || cellY >= grid.rowCnt) return;
		const cellIndex = cellY * grid.colCnt + cellX;

		if (solveStartIndex !== null && solveStartIndex !== cellIndex) {
			mazeSolver = new MazeSolver(grid, solveStartIndex, cellIndex);
			solveStartIndex = null;
			pauseBtn.disabled = false;
			stepBtn.disabled = false;
		} else {
			solveStartIndex = cellIndex;
			mazeSolver = undefined;
		}
	}
});
