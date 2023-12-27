import { Grid } from './grid.js';

type Color = [number, number, number];
function arrayToClrStr([r, g, b]: Color) {
	return `rgb(${r}, ${g}, ${b})`;
}

interface Room {
	neighbors: [from: number, to: number, room: Room][];
	area: number[];
}
interface Node {
	index: number;
	next: Node[];
}
interface Track {
	room: Room;
	start: Node;
	stack: number[];
	goals?: Room['neighbors'];
	goalsReached: number;
}

export class MazeSolver {
	isComplete = false;
	grid: Grid;
	start: number;
	dest: number;
	path?: number[];
	phase: 'ROOM' | 'FILL' | 'TRACE' = 'ROOM';

	offsets: [number, number, number, number];
	lineWidth: number;

	// Room identification
	rooms: Room[];
	roomStack: [number, Room][];
	indexToRoomDict: Room[] = [];
	roomClrDict = new Map<Room, Color>();

	// Dead-end filling
	roomsToCheck: Room[];
	filled = new Set<Room>();
	ignoreRooms: Room[];
	filledClr: Color = [74, 4, 4];

	// Path tracing
	rootNode: Node;
	trackedPaths: Track[];
	searched = new Set<number>();
	indexParentGrid: number[] = [];
	indexToNodeDict: Node[] = [];
	trackedClr: Color = [100, 200, 100];
	constructor(grid: Grid, start: number, dest: number) {
		this.grid = grid;
		this.start = start;
		this.dest = dest;

		this.offsets = [-this.grid.colCnt, 1, this.grid.colCnt, -1];
		this.rooms = [{ neighbors: [], area: [start] }];
		this.roomStack = [[start, this.rooms[0]]];
		this.rootNode = { index: this.start, next: [] };
		this.indexToNodeDict[this.start] = this.rootNode;
		this.indexToRoomDict[this.start] = this.rooms[0];
		this.lineWidth = Math.max(
			Math.ceil(50 / Math.min(grid.rowCnt, grid.colCnt)),
			1,
		);
	}
	step() {
		if (this.isComplete) return;

		if (this.phase === 'ROOM') {
			// Room identification
			if (this.roomStack.length === 0) {
				this.phase = 'FILL';
				this.ignoreRooms = [
					this.indexToRoomDict[this.start],
					this.indexToRoomDict[this.dest],
				];
				console.log(`MOVING TO PHASE "${this.phase}"`);
				return;
			}

			const [index, room] = this.roomStack.pop()!;
			const head = this.grid.cells[index];

			for (let i = 0; i < this.offsets.length; i++) {
				if (head.walls[i]) continue;
				const dir = this.offsets[i];
				const neighbor = head.index + dir;
				if (!this.grid.cells[neighbor] || this.indexToRoomDict[neighbor]) continue;

				// Check if there are walls at either side to the neighbor
				const [left, right] = i % 2 == 0 ? [3, 1] : [0, 2];
				if (
					(head.walls[left] ||
						this.grid.cells[head.index + this.offsets[left]].walls[i]) &&
					(head.walls[right] ||
						this.grid.cells[head.index + this.offsets[right]].walls[i])
				) {
					// Create new room through opening
					if (this.indexToRoomDict[neighbor]) continue;
					const newRoom: Room = {
						neighbors: [[neighbor, index, room]],
						area: [neighbor],
					};
					room.neighbors.push([index, neighbor, newRoom]);
					this.rooms.push(newRoom);

					this.roomStack.push([neighbor, newRoom]);
					this.indexToRoomDict[neighbor] = newRoom;
				} else {
					// Expand current room
					room.area.push(neighbor);
					this.roomStack.push([neighbor, room]);
					this.indexToRoomDict[neighbor] = room;
				}
			}
		} else if (this.phase === 'FILL') {
			// Dead-end filling
			if (!this.roomsToCheck) {
				this.roomsToCheck = this.rooms.filter((r) => {
					return r.neighbors.length === 1 && !this.ignoreRooms.includes(r);
				});
			} else {
				const newChecks: Room[] = [];
				while (this.roomsToCheck.length) {
					const room = this.roomsToCheck.pop()!;
					const filledNeighbors = room.neighbors.filter(([, , r]) =>
						this.filled.has(r),
					);
					if (room.neighbors.length - filledNeighbors.length === 1) {
						this.filled.add(room);
						if (!this.ignoreRooms.includes(room.neighbors[0][2])) {
							newChecks.push(room.neighbors[0][2]);
						}
					}
				}

				if (newChecks.length) this.roomsToCheck = newChecks;
				else {
					this.phase = 'TRACE';
					console.log(`MOVING TO PHASE "${this.phase}"`);
					this.trackedPaths = [
						{
							room: this.indexToRoomDict[this.start],
							start: this.rootNode,
							stack: [this.start],
							goalsReached: 0,
						},
					];
				}
			}
		} else if (this.phase === 'TRACE') {
			// Trace a path out of unfilled rooms
			const toDelete: Track[] = [];
			const toAdd: Track[] = [];
			main: for (const track of this.trackedPaths) {
				const { room, start, stack } = track;
				if (stack.length === 0) {
					toDelete.push(track);
					continue main;
				}

				// Goals array not set yet
				if (!track.goals) {
					track.goals = room.neighbors.filter(
						([, t, r]) => !this.indexToNodeDict[t] && !this.filled.has(r),
					);
					for (const [goal, afterGoal] of track.goals) {
						this.indexToNodeDict[afterGoal] = { index: afterGoal, next: [] };
						this.indexParentGrid[afterGoal] = goal;
					}
				}
				const goals = track.goals;
				const head = stack.shift()!;

				if (head === this.dest) {
					console.log('DEST REACHED');
					this.isComplete = true;

					// Add remaining nodes to dest
					let index = this.dest;
					let prevNode: Node | null = null;
					while (true) {
						const node: Node = index === start.index ? start : { index, next: [] };
						if (prevNode) node.next.push(prevNode);
						if (node === start) break;

						prevNode = node;
						index = this.indexParentGrid[index];
					}

					// Trace from rootNode to dest
					const traceStack: [Node, number[]][] = [[this.rootNode, []]];
					while (traceStack.length) {
						const [head, path] = traceStack.pop()!;
						path.push(head.index);
						if (head.index === this.dest) {
							this.path = path;
							return;
						}
						for (const node of head.next) {
							traceStack.push([node, path]);
						}
					}

					return;
				} else if (
					goals.find(([f]) => f === head) &&
					++track.goalsReached === goals.length
				) {
					// All paths to next rooms reached, end track!
					toDelete.push(track);
					console.log('ALL GOALS REACHED');

					for (const [goal, afterGoal] of goals) {
						toAdd.push({
							room: this.indexToRoomDict[afterGoal],
							start: this.indexToNodeDict[afterGoal],
							stack: [afterGoal],
							goalsReached: 0,
						});

						let index = goal;
						let prevNode: Node = this.indexToNodeDict[afterGoal];
						while (true) {
							let node: Node = this.indexToNodeDict[index];
							if (!node) node = { index, next: [] };

							node.next.push(prevNode);
							if (this.indexToNodeDict[index]) break;

							prevNode = node;
							this.indexToNodeDict[index] = node;
							index = this.indexParentGrid[index];
						}
					}

					continue main;
				}

				// BFS search
				for (let i = 0; i < this.offsets.length; i++) {
					const offset = this.offsets[i];
					const neighbor = head + offset;
					if (
						this.indexParentGrid[neighbor] !== undefined ||
						this.grid.cells[head].walls[i] ||
						this.searched.has(neighbor) ||
						!room.area.includes(neighbor)
					) {
						continue;
					}

					stack.push(neighbor);
					this.indexParentGrid[neighbor] = head;
					this.searched.add(neighbor);
				}
			}

			for (const track of toDelete) {
				this.trackedPaths.splice(
					this.trackedPaths.findIndex((t) => t === track),
					1,
				);
			}
			if (toAdd.length) this.trackedPaths.push(...toAdd);
		}
	}
	draw(ctx: CanvasRenderingContext2D) {
		// Draw color of rooms
		for (const room of this.rooms) {
			let clr: Color | undefined;
			if (this.filled.has(room)) {
				clr = this.filledClr;
			} else if (
				this.trackedPaths?.find((t) => t.room === room) &&
				!this.isComplete
			) {
				clr = this.trackedClr;
			} else if (this.phase !== 'TRACE') {
				clr = this.roomClrDict.get(room);
				if (!clr) {
					clr = [
						Math.floor(Math.random() * 255),
						Math.floor(Math.random() * 255),
						Math.floor(Math.random() * 255),
					];
					this.roomClrDict.set(room, clr);
				}
			} else continue;

			const tmp = ctx.fillStyle;
			ctx.fillStyle = arrayToClrStr(clr);
			for (const index of room.area) {
				const cell = this.grid.cells[index];
				ctx.fillRect(
					cell.screenX,
					cell.screenY,
					this.grid.cellSize,
					this.grid.cellSize,
				);
			}
			ctx.fillStyle = tmp;
		}

		if (this.phase === 'TRACE') {
			ctx.lineWidth = this.lineWidth;
			ctx.lineCap = 'round';

			// BFS paths
			// Go over each cell in a room and draw a path from it to the start
			// Ignore cells that have already been pathed over
			if (!this.isComplete) {
				for (const {
					room: { area },
					start: { index: start },
				} of this.trackedPaths ?? []) {
					const BfsPath = new Path2D();
					const pathed = new Set<number>();

					for (const index of area) {
						if (pathed.has(index)) continue;

						let head = index;
						while (this.indexParentGrid[head] !== undefined || head === start) {
							const cell = this.grid.cells[head];
							if (head === index) BfsPath.moveTo(cell.screenX, cell.screenY);
							else BfsPath.lineTo(cell.screenX, cell.screenY);

							if (pathed.has(head) || head === start) break;
							pathed.add(head);
							head = this.indexParentGrid[head];
						}
					}

					if (pathed.size) {
						ctx.strokeStyle = arrayToClrStr([50, 50, 200]);
						ctx.save();
						ctx.translate(this.grid.cellSize / 2, this.grid.cellSize / 2);
						ctx.stroke(BfsPath);
						ctx.restore();
					}
				}
			}

			// Node paths
			// Traverse node tree and draw path from one cell to the next
			const stack: Node[] = [this.rootNode];
			const nodePath = new Path2D();
			while (stack.length) {
				const head = stack.pop()!;
				const cell = this.grid.cells[head.index];
				if (head === this.rootNode) nodePath.moveTo(cell.screenX, cell.screenY);
				else nodePath.lineTo(cell.screenX, cell.screenY);
				stack.push(...head.next);
			}
			ctx.strokeStyle = arrayToClrStr([50, 200, 50]);
			ctx.save();
			ctx.translate(this.grid.cellSize / 2, this.grid.cellSize / 2);
			ctx.stroke(nodePath);
			ctx.restore();
		}
	}
}
