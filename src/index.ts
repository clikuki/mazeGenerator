import { Grid } from "./grid.js";
import { MazeGenerators, MazeGenManager } from "./mazeGenerator.js";
import { MazeSolver } from "./mazeSolver.js";
import { GraphNode, convertGridToGraph } from "./utils.js";

/*
	SOME MAYBE PLANS
==-==-==-==-==-==-==-==-==-==-==-==-==-==-==-==
	Add option for symmetry
	Different cell shapes? (triangle, hexagon)
*/

const canvas = document.querySelector("canvas")!;
canvas.width = Math.min(innerHeight, innerWidth);
canvas.height = Math.min(innerHeight, innerWidth);
const ctx = canvas.getContext("2d")!;
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

const restartBtn = document.querySelector(".restart") as HTMLButtonElement;
restartBtn.disabled = !mazeGenManager.current;
restartBtn.addEventListener("click", () => restart({}));

const stepBtn = document.querySelector(".step") as HTMLButtonElement;
stepBtn.addEventListener("click", () => {
	if (!mazeGenManager.isComplete) {
		mazeGenManager.step();
		mazeGenManager.draw(ctx);
	} else if (mazeSolver && !mazeSolver.isComplete) {
		mazeSolver.step();
		mazeSolver.draw(ctx);
	}
});

const pauseBtn = document.querySelector(".pause") as HTMLButtonElement;
pauseBtn.addEventListener("click", () => {
	simulation.paused = !simulation.paused;
});

const fastForwardBtn = document.querySelector(".skip") as HTMLButtonElement;
fastForwardBtn.addEventListener("click", () => {
	while (!mazeGenManager.isComplete) {
		mazeGenManager.step();
	}
	while (mazeSolver && !mazeSolver.isComplete) {
		mazeSolver!.step();
	}
	fastForwardBtn.disabled = true;
});

const exportAsImageBtn = document.querySelector(
	".exports .image"
) as HTMLButtonElement;
exportAsImageBtn.addEventListener("click", () => {
	if (!mazeGenManager.isComplete) return;

	// Resize canvas into full grid
	canvas.width = grid.cellSize * grid.colCnt;
	canvas.height = grid.cellSize * grid.rowCnt;

	// Get image of only the walls
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	grid.drawWalls(ctx);
	const imgUrl = canvas.toDataURL();
	window.open(imgUrl, "_blank");
});

const exportAsGridBtn = document.querySelector(
	".exports .grid"
) as HTMLButtonElement;
exportAsGridBtn.addEventListener("click", () => {
	if (!mazeGenManager.isComplete) return;

	const simplifiedGrid = grid.cells.map((cell) => ({
		x: cell.x,
		y: cell.y,
		top: cell.walls[0],
		right: cell.walls[1],
		bottom: cell.walls[2],
		left: cell.walls[3],
	}));

	const file = new File(
		[JSON.stringify(simplifiedGrid)],
		`maze_grid_${new Date().getTime()}.json`,
		{ type: "application/json" }
	);
	const fileLink = URL.createObjectURL(file);
	window.open(fileLink, "_blank");
	URL.revokeObjectURL(fileLink);
});

const exportAsGraphBtn = document.querySelector(
	".exports .graph"
) as HTMLButtonElement;
exportAsGraphBtn.addEventListener("click", () => {
	if (!mazeGenManager.isComplete) return;

	const graph = convertGridToGraph(grid);
	const simplifiedGraph: { [key: string]: string[] } = {};

	let idCounter = 0;
	const nodeIdMap = new Map<GraphNode, string>();
	function getNodeId(node: GraphNode) {
		let id = nodeIdMap.get(node);
		if (!id) {
			id = String(++idCounter);
			nodeIdMap.set(node, id);
		}
		return id;
	}
	for (const [, node] of graph) {
		const id = getNodeId(node);
		simplifiedGraph[id] = node.neighbors.map((neighbor) => getNodeId(neighbor));
	}

	const file = new File(
		[JSON.stringify(simplifiedGraph)],
		`maze_graph_${new Date().getTime()}.json`,
		{ type: "application/json" }
	);
	const fileLink = URL.createObjectURL(file);
	window.open(fileLink, "_blank");
	URL.revokeObjectURL(fileLink);
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
	if (!mazeGenManager.current) canvas.setAttribute("data-state", "EMPTY");
	else canvas.setAttribute("data-state", nothingIsRunning ? "IDLE" : "RUNNING");

	const mazeHasGenerated = !mazeGenManager.isComplete;
	exportAsImageBtn.disabled = mazeHasGenerated;
	exportAsGridBtn.disabled = mazeHasGenerated;
	exportAsGraphBtn.disabled = mazeHasGenerated;

	// Draw maze background
	ctx.fillStyle = "#000";
	ctx.fillRect(
		Math.floor(grid.centerOffsetX),
		Math.floor(grid.centerOffsetY),
		Math.ceil(grid.cellSize * grid.colCnt),
		Math.ceil(grid.cellSize * grid.rowCnt)
	);

	ctx.save();
	ctx.translate(grid.centerOffsetX, grid.centerOffsetY);

	// Draw solve starter cell
	if (solveStartIndex !== null) {
		const cell = grid.cells[solveStartIndex];
		ctx.fillStyle = "#00f";
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
canvas.addEventListener("click", (e) => {
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

mazeGenManager.current = "Growing Tree";
mazeGenManager.setOption("pickingStyle", { NEWEST: 2, OLDEST: 1 });
restart({ colCnt: 10, rowCnt: 15 });
