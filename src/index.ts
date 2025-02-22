import {
	GeneratorConstructor,
	GeneratorKeyMap,
	GeneratorStructure,
} from "./mazeGenerator.js";
import {
	solverKeyMap,
	SolverConstructor,
	SolverStructure,
} from "./mazeSolver.js";
import { convertGridToGraph, GraphNode, HTML, NullOr } from "./utils.js";
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

class SimulationProperties {
	width = 10;
	height = 10;
	solverStartIndex: NullOr<number> = null;
	isPaused = true;
	performStep = false;
	performSkip = false;
	speedExponent = 0;
	frameCount = 0;
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
	step() {}
	draw() {}
}

function setUpAlgorithmSelection(simProps: SimulationProperties) {
	const generatorMenu = HTML.getOne(".menu.generator")!;
	const solverMenu = HTML.getOne(".menu.solver")!;

	function updateGenerator() {
		const generatorKey = generatorMenu.getAttribute("data-value");
		if (!generatorKey) return;

		const Generator = GeneratorKeyMap.get(generatorKey);
		if (Generator) {
			simProps.grid = new Grid(simProps.width, simProps.height, simProps.canvas);

			simProps.getGenerator = Generator;
			simProps.generator = new Generator(simProps.grid);
		}
	}

	function updateSolver() {
		const solverKey = solverMenu.getAttribute("data-value");
		if (!solverKey) return;

		const Solver = solverKeyMap.get(solverKey);
		if (Solver) {
			simProps.getSolver = Solver;

			if (simProps.solver) {
				simProps.solver = new Solver(
					simProps.grid,
					simProps.solver.from,
					simProps.solver.to
				);
			}
		}
	}

	generatorMenu.addEventListener("change", updateGenerator);
	solverMenu.addEventListener("change", updateSolver);
	updateGenerator();
	updateSolver();
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
		// Only reset algorithms if they and their constructor exist
		if (simProps.generator && simProps.getGenerator) {
			simProps.grid = new Grid(simProps.width, simProps.height, simProps.canvas);
			simProps.generator = new simProps.getGenerator!(simProps.grid);
		} else if (simProps.solver && simProps.getSolver) {
			simProps.solver = new simProps.getSolver(
				simProps.grid,
				simProps.solver.from,
				simProps.solver.to
			);
		}
	});

	// Column-Row inputs
	const columnCountInput = HTML.getOne<HTMLInputElement>(
		"#columnCount",
		optionsMenu
	)!;
	const rowCountInput = HTML.getOne<HTMLInputElement>("#rowCount", optionsMenu)!;
	const minimumSize = 2;
	const maximumSize = 1000;

	columnCountInput.valueAsNumber = simProps.width;
	rowCountInput.valueAsNumber = simProps.height;

	function resetAfterResize() {
		simProps.grid = new Grid(simProps.width, simProps.height, simProps.canvas);
		simProps.solverStartIndex = null;

		simProps.solver = null;
		if (simProps.getGenerator) {
			simProps.generator = new simProps.getGenerator(simProps.grid);
		}
	}

	columnCountInput.addEventListener("change", () => {
		const newWidth = columnCountInput.valueAsNumber;

		if (isNaN(newWidth)) {
			columnCountInput.valueAsNumber = simProps.width;
		} else if (newWidth >= minimumSize && newWidth <= maximumSize) {
			simProps.width = newWidth;
			resetAfterResize();
		}
	});
	rowCountInput.addEventListener("change", () => {
		const newHeight = rowCountInput.valueAsNumber;

		if (isNaN(newHeight)) {
			rowCountInput.valueAsNumber = simProps.height;
		} else if (newHeight >= minimumSize && newHeight <= maximumSize) {
			simProps.height = newHeight;
			resetAfterResize();
		}
	});

	// Speed controls
	const speedDecreaseBtn = HTML.getOne<HTMLButtonElement>(
		".simulSpeed .decrease",
		optionsMenu
	)!;
	const speedIncreaseBtn = HTML.getOne<HTMLButtonElement>(
		".simulSpeed .increase",
		optionsMenu
	)!;
	const speedDisplay = HTML.getOne<HTMLInputElement>(
		".simulSpeed .display",
		optionsMenu
	)!;
	function updateSpeedDisplay(change: number) {
		if (Math.abs(simProps.speedExponent + change) > 4) return;

		simProps.speedExponent += change;

		const numerator = simProps.speedExponent < 0 ? "1/" : "";
		const expoVal = 2 ** Math.abs(simProps.speedExponent);
		speedDisplay.value = `${numerator}${expoVal}×`;
	}
	speedDecreaseBtn.addEventListener("click", updateSpeedDisplay.bind(null, -1));
	speedIncreaseBtn.addEventListener("click", updateSpeedDisplay.bind(null, 1));
	updateSpeedDisplay(0);

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
		if (!simProps.getSolver) return;

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
			simProps.solver = new simProps.getSolver(
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
	try {
		if (!simProps.isPaused || simProps.performStep || simProps.performSkip) {
			const frameLimit = 2 ** Math.abs(simProps.speedExponent);
			const speedUp = simProps.speedExponent > 0;
			const slowDown = simProps.speedExponent < 0;

			if (!slowDown || ++simProps.frameCount >= frameLimit) {
				do {
					if (simProps.generator) simProps.generator.step();
					if (simProps.solver) simProps.solver.step();
				} while (
					!simProps.isAlgoComplete &&
					(simProps.performSkip || (speedUp && ++simProps.frameCount < frameLimit))
				);
			}

			if (speedUp || (slowDown && simProps.frameCount >= frameLimit)) {
				simProps.frameCount = 0;
			}
		}

		// DRAW
		// Clear screen
		simProps.ctx.clearRect(0, 0, simProps.canvas.width, simProps.canvas.height);

		// Draw algorithm visualization
		if (simProps.generator) simProps.generator.draw(simProps.ctx);
		else if (simProps.solver) simProps.solver.draw(simProps.ctx);

		// Draw solver endpoints
		if (simProps.solverStartIndex !== null) {
			simProps.grid.paintCircle(simProps.ctx, simProps.solverStartIndex, "#d20");
		}
		if (simProps.solver) {
			simProps.grid.paintCircle(simProps.ctx, simProps.solver.from, "#d20");
			simProps.grid.paintCircle(simProps.ctx, simProps.solver.to, "#03d");
		}

		simProps.grid.drawWalls(simProps.ctx);

		if (simProps.performStep) simProps.performStep = false;
		if (simProps.performSkip) simProps.performSkip = false;
	} catch (error) {
		// PANIC; disable everything
		simProps.generator = null;
		simProps.solver = null;
		simProps.isPaused = true;
		throw error;
	}
}

function initialize() {
	const canvas = HTML.getOne<HTMLCanvasElement>("canvas")!;
	setUpCanvasResize(canvas);

	const simulationProperties = new SimulationProperties(canvas);
	setUpSimulationControls(simulationProperties);
	setUpAlgorithmSelection(simulationProperties);
	setUpSolverStarter(simulationProperties);
	simulationLoop(simulationProperties, 0);

	// @ts-expect-error NOTE: remove later
	window.simProps = simulationProperties;
}

initialize();
