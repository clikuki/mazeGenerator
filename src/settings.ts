type ObserverCallback<T> = (value: T, key: string) => void;

export const settings = {
	get<T extends any>(key: string): T {
		return settingMap.get(key);
	},
	set<T extends any>(key: string, value: T): void {
		settingMap.set(key, value);
		observerList.get(key)?.forEach((cb) => cb(value, key));
	},
	has(key: string): boolean {
		return settingMap.has(key);
	},
	observe<T>(key: string, cb: ObserverCallback<T>): void {
		let curObservers = observerList.get(key);
		if (!curObservers) {
			curObservers = [];
			observerList.set(key, curObservers);
		}

		curObservers.push(cb);
	},
	unobserve<T>(key: string, cb: ObserverCallback<T>): void {
		let curObservers = observerList.get(key);
		if (curObservers) {
			const index = curObservers.findIndex((f) => f == cb);
			curObservers.splice(index, 1);
		}
	},
};

// Initialize some values
const settingMap = new Map<string, any>([
	["graphTraversal", "bfs"],
	["maximumRoomSize", 3],
	["verticalCarve", "southCarve"],
	["horizontalCarve", "eastCarve"],
	["carveChance", 0.5],
	["verticalChance", 0.5],
	["heuristicDistance", "taxicab"],
	["pickNewest", 1],
	["pickRandom", 1],
	["pickOldest", 0],
	["pickMiddle", 0],

	["graphTraversalSolve", "bfs"],
]);
const observerList = new Map<string, ObserverCallback<any>[]>();
