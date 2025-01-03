import { generatorKeyMap, } from "./mazeGenerator.js";
import { convertGridToGraph, HTML } from "./utils.js";
import { Grid } from "./grid.js";
class SimulationProperties {
    width = 10;
    height = 10;
    isPaused = true;
    performStep = false;
    performSkip = false;
    canvas;
    ctx;
    grid;
    generator = null;
    solver = null;
    getGenerator = null;
    getSolver = null;
    constructor(canvas) {
        this.grid = new Grid(this.width, this.height, canvas);
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }
    get canExecute() {
        return !!(this.generator || this.solver);
    }
    get isAlgoComplete() {
        return !!(this.generator?.isComplete || this.solver?.isComplete);
    }
}
function initialize() {
    const canvas = HTML.getOne("canvas");
    setUpCanvasResize(canvas);
    const simulationProperties = new SimulationProperties(canvas);
    setUpSimulationControls(simulationProperties);
    setUpAlgorithmSelection(simulationProperties);
    simulationLoop(simulationProperties, 0);
}
function setUpAlgorithmSelection(simProps) {
    const generatorMenu = HTML.getOne(".menu.generator");
    function updateGenerator() {
        const generatorKey = generatorMenu.getAttribute("data-value");
        if (!generatorKey)
            return;
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
function setUpSimulationControls(simProps) {
    const optionsMenu = HTML.getOne(".menu.options");
    const pauseBtn = HTML.getOne(".pause", optionsMenu);
    const stepBtn = HTML.getOne(".step", optionsMenu);
    const skipBtn = HTML.getOne(".skip", optionsMenu);
    const restartBtn = HTML.getOne(".restart", optionsMenu);
    pauseBtn?.addEventListener("click", () => {
        if (!simProps.canExecute)
            simProps.isPaused = false;
        else
            simProps.isPaused = !simProps.isPaused;
    });
    stepBtn?.addEventListener("click", () => {
        simProps.performStep = true;
    });
    skipBtn?.addEventListener("click", () => {
        simProps.performSkip = true;
    });
    restartBtn?.addEventListener("click", () => {
        if (!simProps.canExecute)
            return;
        // Only reset algorithms if they and their constructor exist
        if (simProps.generator && simProps.getGenerator) {
            simProps.grid.reset();
            simProps.generator = new simProps.getGenerator(simProps.grid);
        }
        else if (simProps.solver && simProps.getSolver) {
            simProps.solver = new simProps.getSolver(simProps.grid);
        }
    });
    // Column-Row inputs
    const columnCountInput = HTML.getOne("#columnCount", optionsMenu);
    const rowCountInput = HTML.getOne("#rowCount", optionsMenu);
    const minimumSize = 2;
    const maximumSize = 1000;
    columnCountInput?.addEventListener("change", () => {
        const newWidth = columnCountInput.valueAsNumber;
        if (isNaN(newWidth)) {
            columnCountInput.valueAsNumber = simProps.width;
        }
        else if (newWidth > minimumSize && newWidth < maximumSize) {
            simProps.width = newWidth;
        }
    });
    rowCountInput?.addEventListener("change", () => {
        const newHeight = rowCountInput.valueAsNumber;
        if (isNaN(newHeight)) {
            rowCountInput.valueAsNumber = simProps.height;
        }
        else if (newHeight > minimumSize && newHeight < maximumSize) {
            simProps.height = newHeight;
        }
    });
    // Maze exports
    const imageExportBtn = HTML.getOne(".exports .image", optionsMenu);
    const gridExportBtn = HTML.getOne(".exports .grid", optionsMenu);
    const graphExportBtn = HTML.getOne(".exports .graph", optionsMenu);
    imageExportBtn?.addEventListener("click", () => {
        if (!simProps.isAlgoComplete)
            return;
        // Disable offsets temporarily
        const offsetX = simProps.grid.offsetX;
        const offsetY = simProps.grid.offsetY;
        simProps.grid.offsetX = 0;
        simProps.grid.offsetY = 0;
        // Shrink canvas to exact grid size
        simProps.canvas.width = simProps.grid.cellSize * simProps.grid.colCnt;
        simProps.canvas.height = simProps.grid.cellSize * simProps.grid.rowCnt;
        // Get image of only the walls
        simProps.ctx.fillStyle = "black";
        simProps.ctx.fillRect(0, 0, simProps.canvas.width, simProps.canvas.height);
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
        if (!simProps.isAlgoComplete)
            return;
        const simplifiedGrid = simProps.grid.cells.map((cell) => ({
            x: cell.x,
            y: cell.y,
            top: cell.walls[0],
            right: cell.walls[1],
            bottom: cell.walls[2],
            left: cell.walls[3],
        }));
        const file = new File([JSON.stringify(simplifiedGrid)], `maze_grid_${new Date().getTime()}.json`, { type: "application/json" });
        const fileLink = URL.createObjectURL(file);
        window.open(fileLink, "_blank");
        URL.revokeObjectURL(fileLink);
    });
    graphExportBtn?.addEventListener("click", () => {
        if (!simProps.isAlgoComplete)
            return;
        const graph = convertGridToGraph(simProps.grid);
        const simplifiedGraph = {};
        let idCounter = 0;
        const nodeIdMap = new Map();
        function getNodeId(node) {
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
        const file = new File([JSON.stringify(simplifiedGraph)], `maze_graph_${new Date().getTime()}.json`, { type: "application/json" });
        const fileLink = URL.createObjectURL(file);
        window.open(fileLink, "_blank");
        URL.revokeObjectURL(fileLink);
    });
}
function setUpCanvasResize(canvas) {
    function updateCanvasSize() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
    }
    window.addEventListener("resize", updateCanvasSize);
    updateCanvasSize();
}
function simulationLoop(simProps, _) {
    requestAnimationFrame(simulationLoop.bind(null, simProps));
    // Run algorithm
    if (!simProps.isPaused || simProps.performStep || simProps.performSkip) {
        do {
            if (simProps.generator)
                simProps.generator.step();
            else if (simProps.solver)
                simProps.solver.step();
        } while (simProps.performSkip && !simProps.isAlgoComplete);
    }
    // DRAW
    // TODO: improve drawing/rendering
    // Clear screen
    simProps.ctx.clearRect(0, 0, simProps.canvas.width, simProps.canvas.height);
    simProps.grid.drawGrayedCells(simProps.ctx);
    // Draw algorithm visualization
    if (simProps.generator)
        simProps.generator.draw(simProps.ctx);
    else if (simProps.solver)
        simProps.solver.draw(simProps.ctx);
    simProps.grid.drawWalls(simProps.ctx);
    if (simProps.performStep)
        simProps.performStep = false;
    if (simProps.performSkip)
        simProps.performSkip = false;
}
initialize();
//# sourceMappingURL=index.js.map