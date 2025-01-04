import {
	GeneratorConstructor,
	generatorKeyMap,
	GeneratorStructure,
} from "./mazeGenerator.js";
import {
	MazeSolver,
	SolverConstructor,
	SolverStructure,
} from "./mazeSolver.js";
import { convertGridToGraph, GraphNode, HTML } from "./utils.js";
import { Grid } from "./grid.js";

/*

initialize states
	canvas
	simulation values
	generator
	solver

begin loop
	execute algorithms
	draw
		maze
		visualizations

*/

type NullOr<T> = null | T;
class SimulationProperties {
	width = 10;
	height = 10;
	solverStartIndex: NullOr<number> = null;
	isPaused = true;
	performStep = false;
	performSkip = false;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	grid: Grid;
	generator: NullOr<GeneratorStructure> = null;
	solver: NullOr<SolverStructure> = null;
	getGenerator: NullOr<GeneratorConstructor> = null;
	getSolver: NullOr<SolverConstructor> = null;
	constructor(canvas: HTMLCanvasElement) {
		this.grid = new Grid(this.width, this.height, canvas);
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d")!;
	}

	get canExecute() {
		return !!(this.generator || this.solver);
	}
	get isAlgoComplete() {
		if (this.generator && !this.generator.isComplete) return false;
		if (this.solver && !this.solver.isComplete) return false;
		return true;
	}
}

function setUpAlgorithmSelection(simProps: SimulationProperties) {
	const generatorMenu = HTML.getOne(".menu.generator")!;

	function updateGenerator() {
		const generatorKey = generatorMenu.getAttribute("data-value");
		if (!generatorKey) return;

		const Generator = generatorKeyMap.get(generatorKey);
		if (Generator) {
			simProps.grid.reset();

			simProps.getGenerator = Generator;
			simProps.generator = new Generator(simProps.grid);
		}
	}

	generatorMenu.addEventListener("change", updateGenerator);
	updateGenerator();
}

function setUpSimulationControls(simProps: SimulationProperties) {
	const optionsMenu = HTML.getOne(".menu.options")!;

	const pauseBtn = HTML.getOne(".pause", optionsMenu);
	const stepBtn = HTML.getOne(".step", optionsMenu);
	const skipBtn = HTML.getOne(".skip", optionsMenu);
	const restartBtn = HTML.getOne(".restart", optionsMenu);

	pauseBtn?.addEventListener("click", () => {
		if (!simProps.canExecute) simProps.isPaused = false;
		else simProps.isPaused = !simProps.isPaused;
	});
	stepBtn?.addEventListener("click", () => {
		simProps.performStep = true;
	});
	skipBtn?.addEventListener("click", () => {
		simProps.performSkip = true;
	});
	restartBtn?.addEventListener("click", () => {
		if (!simProps.canExecute) return;

		// Only reset algorithms if they and their constructor exist
		if (simProps.generator && simProps.getGenerator) {
			simProps.grid.reset();
			simProps.generator = new simProps.getGenerator!(simProps.grid);
		} else if (simProps.solver && simProps.getSolver) {
			simProps.solver = new simProps.getSolver!(
				simProps.grid,
				simProps.solver.from,
				simProps.solver.dest
			);
		}
	});

	// Column-Row inputs
	const columnCountInput = HTML.getOne<HTMLInputElement>(
		"#columnCount",
		optionsMenu
	);
	const rowCountInput = HTML.getOne<HTMLInputElement>("#rowCount", optionsMenu);
	const minimumSize = 2;
	const maximumSize = 1000;

	columnCountInput?.addEventListener("change", () => {
		const newWidth = columnCountInput.valueAsNumber;
		if (isNaN(newWidth)) {
			columnCountInput.valueAsNumber = simProps.width;
		} else if (newWidth > minimumSize && newWidth < maximumSize) {
			simProps.width = newWidth;
		}
	});
	rowCountInput?.addEventListener("change", () => {
		const newHeight = rowCountInput.valueAsNumber;
		if (isNaN(newHeight)) {
			rowCountInput.valueAsNumber = simProps.height;
		} else if (newHeight > minimumSize && newHeight < maximumSize) {
			simProps.height = newHeight;
		}
	});

	// Maze exports
	const imageExportBtn = HTML.getOne(".exports .image", optionsMenu);
	const gridExportBtn = HTML.getOne(".exports .grid", optionsMenu);
	const graphExportBtn = HTML.getOne(".exports .graph", optionsMenu);

	imageExportBtn?.addEventListener("click", () => {
		if (!simProps.isAlgoComplete) return;

		// Disable offsets temporarily
		const offsetX = simProps.grid.offsetX;
		const offsetY = simProps.grid.offsetY;
		simProps.grid.offsetX = 0;
		simProps.grid.offsetY = 0;

		// Shrink canvas to exact grid size
		simProps.canvas.width = simProps.grid.cellSize * simProps.grid.colCnt;
		simProps.canvas.height = simProps.grid.cellSize * simProps.grid.rowCnt;

		// Get image of only the walls
		simProps.ctx.clearRect(0, 0, simProps.canvas.width, simProps.canvas.height);
		simProps.grid.drawWalls(simProps.ctx);
		const imgUrl = simProps.canvas.toDataURL();
		window.open(imgUrl, "_blank");

		// Reenable offsets
		simProps.grid.offsetX = offsetX;
		simProps.grid.offsetY = offsetY;

		// Reset canvas size
		simProps.canvas.width = innerWidth;
		simProps.canvas.height = innerHeight;
	});
	gridExportBtn?.addEventListener("click", () => {
		if (!simProps.isAlgoComplete) return;

		const simplifiedGrid = simProps.grid.cells.map((cell) => ({
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
	graphExportBtn?.addEventListener("click", () => {
		if (!simProps.isAlgoComplete) return;

		const graph = convertGridToGraph(simProps.grid);
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
}

function setUpCanvasResize(canvas: HTMLCanvasElement) {
	function updateCanvasSize() {
		canvas.width = innerWidth;
		canvas.height = innerHeight;
	}

	window.addEventListener("resize", updateCanvasSize);

	updateCanvasSize();
}

function setUpSolverStarter(simProps: SimulationProperties) {
	simProps.canvas.addEventListener("click", (e) => {
		if (!simProps.isAlgoComplete) return;

		const cellX = Math.floor(
			(e.x - simProps.grid.offsetX) / simProps.grid.cellSize
		);
		const cellY = Math.floor(
			(e.y - simProps.grid.offsetY) / simProps.grid.cellSize
		);

		if (
			cellX < 0 ||
			cellY < 0 ||
			cellX >= simProps.grid.colCnt ||
			cellY >= simProps.grid.rowCnt
		) {
			return;
		}
		const cellIndex = cellY * simProps.grid.colCnt + cellX;

		if (
			simProps.solverStartIndex !== null &&
			simProps.solverStartIndex !== cellIndex
		) {
			simProps.generator = null;
			simProps.solver = new MazeSolver(
				simProps.grid,
				simProps.solverStartIndex,
				cellIndex
			);
			simProps.solverStartIndex = null;
		} else {
			simProps.solverStartIndex = cellIndex;
			simProps.solver = null;
		}
	});
}

function simulationLoop(simProps: SimulationProperties, _: number) {
	requestAnimationFrame(simulationLoop.bind(null, simProps));

	// Run algorithm
	if (!simProps.isPaused || simProps.performStep || simProps.performSkip) {
		do {
			if (simProps.generator) simProps.generator.step();
			if (simProps.solver) simProps.solver.step();
		} while (simProps.performSkip && !simProps.isAlgoComplete);

		// if (simProps.generator?.isComplete) simProps.generator = null;
		// else if (simProps.solver?.isComplete) simProps.solver = null;
	}

	// DRAW
	// TODO: improve drawing/rendering
	// Clear screen
	simProps.ctx.clearRect(0, 0, simProps.canvas.width, simProps.canvas.height);

	// Draw algorithm visualization
	if (simProps.generator) simProps.generator.draw(simProps.ctx);
	else if (simProps.solver) simProps.solver.draw(simProps.ctx);

	// Draw solve starter cell
	if (simProps.solverStartIndex !== null) {
		const cell = simProps.grid.cells[simProps.solverStartIndex];
		simProps.ctx.fillStyle = "#00f";
		simProps.ctx.fillRect(
			simProps.grid.offsetX + cell.screenX,
			simProps.grid.offsetY + cell.screenY,
			simProps.grid.cellSize,
			simProps.grid.cellSize
		);
	}

	simProps.grid.drawWalls(simProps.ctx);

	if (simProps.performStep) simProps.performStep = false;
	if (simProps.performSkip) simProps.performSkip = false;
}

function initialize() {
	const canvas = HTML.getOne<HTMLCanvasElement>("canvas")!;
	setUpCanvasResize(canvas);

	const simulationProperties = new SimulationProperties(canvas);
	setUpSimulationControls(simulationProperties);
	setUpAlgorithmSelection(simulationProperties);
	setUpSolverStarter(simulationProperties);
	simulationLoop(simulationProperties, 0);
}

initialize();
