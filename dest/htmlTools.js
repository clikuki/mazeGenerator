export const HTML = {
    getOne(selectors, base = document.body) {
        return base.querySelector(selectors);
    },
    getAll(selectors, base = document.body) {
        return Array.from(base.querySelectorAll(selectors));
    },
};
//# sourceMappingURL=htmlTools.js.map