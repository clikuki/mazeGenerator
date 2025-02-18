export const settings = {
    get(key) {
        return settingMap.get(key);
    },
    set(key, value) {
        settingMap.set(key, value);
        observerList.get(key)?.forEach((cb) => cb(value, key));
    },
    has(key) {
        return settingMap.has(key);
    },
    observe(key, cb) {
        let curObservers = observerList.get(key);
        if (!curObservers) {
            curObservers = [];
            observerList.set(key, curObservers);
        }
        curObservers.push(cb);
    },
    unobserve(key, cb) {
        let curObservers = observerList.get(key);
        if (curObservers) {
            const index = curObservers.findIndex((f) => f == cb);
            curObservers.splice(index, 1);
        }
    },
};
// Initialize some values
const settingMap = new Map([
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
const observerList = new Map();
//# sourceMappingURL=settings.js.map