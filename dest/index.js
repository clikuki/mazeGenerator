import { generatorKeyMap, } from "./mazeGenerator.js";
import { HTML } from "./utils.js";
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
        // TODO: reimplement image export
    });
    gridExportBtn?.addEventListener("click", () => {
        // TODO: reimplement grid export
    });
    graphExportBtn?.addEventListener("click", () => {
        // TODO: reimplement graph export
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