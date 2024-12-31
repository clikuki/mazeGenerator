"use strict";
(() => {
    const minimumVisibleMenu = 30;
    const mouse = { x: 0, y: 0 };
    let grabbedMenu = 0 /* GrabStates.WAITING */;
    let isDraggingMenu = false;
    // Mouse events
    document.addEventListener("mousemove", (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
        if (grabbedMenu instanceof Object) {
            updateGrabbedPosition(grabbedMenu);
        }
    });
    document.addEventListener("mousedown", () => {
        if (!(grabbedMenu instanceof Object)) {
            grabbedMenu = 1 /* GrabStates.FAILED */;
        }
    });
    document.addEventListener("mouseup", () => {
        grabbedMenu = 0 /* GrabStates.WAITING */;
    });
    function updateGrabbedPosition(grabbed) {
        grabbed.position.x = clamp(mouse.x - grabbed.offset.x, minimumVisibleMenu - grabbed.size.w, innerWidth - minimumVisibleMenu);
        grabbed.position.y = clamp(mouse.y - grabbed.offset.y, minimumVisibleMenu - grabbed.size.h, innerHeight - minimumVisibleMenu);
        grabbed.menu.style.left = `${grabbed.position.x}px`;
        grabbed.menu.style.top = `${grabbed.position.y}px`;
    }
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    function updateMenuData(menu, pos, size) {
        const rectData = menu.getBoundingClientRect();
        pos.x = rectData.x;
        pos.y = rectData.y;
        size.w = rectData.width;
        size.h = rectData.height;
    }
    function getDropdownHeight(content) {
        content.style.height = "auto";
        const elHeight = content.offsetHeight;
        content.style.height = "";
        return elHeight;
    }
    const menus = Array.from(document.body.getElementsByClassName("menu"));
    menus.forEach((menu) => initializeMenu(menu));
    function initializeMenu(menu) {
        const position = { x: NaN, y: NaN };
        const size = { w: NaN, h: NaN };
        const grabOffset = { x: NaN, y: NaN };
        setupMenuToggle(menu);
        updateMenuData(menu, position, size);
        setupMenuDragging(menu, position, size, grabOffset);
        setupMenuDropdowns(menu, position, size);
    }
    function setupMenuToggle(menu) {
        let isOpen = menu.hasAttribute("data-open");
        const title = menu.firstElementChild;
        title.addEventListener("click", () => {
            // Don't toggle after dragging menu
            if (isDraggingMenu)
                return;
            isOpen = !isOpen;
            if (isOpen) {
                menu.setAttribute("data-open", "");
            }
            else {
                menu.removeAttribute("data-open");
            }
        });
        // Don't toggle on button clicks
        title.querySelectorAll("button").forEach((el) => {
            el.addEventListener("click", (e) => {
                e.stopImmediatePropagation();
            });
        });
    }
    function setupMenuDragging(menu, position, size, grabOffset) {
        menu.addEventListener("mousemove", () => {
            if (!(grabbedMenu instanceof Object)) {
                grabOffset.x = mouse.x - position.x;
                grabOffset.y = mouse.y - position.y;
            }
            else {
                isDraggingMenu = true;
            }
        });
        menu.addEventListener("mousedown", (e) => {
            isDraggingMenu = false;
            const invalidTargets = ["INPUT", "BUTTON"];
            const targetExists = e.target instanceof HTMLElement;
            const isInvalidTarget = targetExists && invalidTargets.includes(e.target.tagName);
            if (grabbedMenu === 0 /* GrabStates.WAITING */ && !isInvalidTarget) {
                grabbedMenu = { menu, position, size, offset: grabOffset };
                moveToTopOfStack(menu);
            }
        });
    }
    function moveToTopOfStack(menu) {
        const oldIndex = menus.findIndex((v) => v === menu);
        menus.splice(oldIndex, 1);
        menus.push(menu);
        menus.forEach((menu, index) => {
            menu.style.zIndex = `${index + 1}`;
        });
    }
    function setupMenuDropdowns(menu, position, size) {
        let isRequired = menu.hasAttribute("data-required");
        const focused = { current: null };
        const dropdowns = Array.from(menu.getElementsByClassName("dropdown"));
        dropdowns.forEach((dropdown) => {
            initializeDropdown(dropdown, menu, isRequired, position, size, focused);
            if (dropdown.hasAttribute("data-open")) {
                focused.current = dropdown;
            }
        });
        if (isRequired && !focused.current) {
            dropdowns[0].firstElementChild.click();
        }
    }
    function initializeDropdown(dropdown, menu, isRequired, position, size, focused) {
        const content = dropdown.children[1];
        let height = getDropdownHeight(content);
        content.style.setProperty("--height", `${height}px`);
        dropdown.firstElementChild.addEventListener("click", () => {
            if (isDraggingMenu || (isRequired && focused.current === dropdown))
                return;
            if (focused.current)
                focused.current.removeAttribute("data-open");
            if (focused.current === dropdown) {
                focused.current = null;
            }
            else {
                const newHeight = getDropdownHeight(content);
                if (newHeight !== height) {
                    height = newHeight;
                    content.style.setProperty("--height", `${height}px`);
                }
                requestAnimationFrame(() => {
                    focused.current = dropdown;
                    focused.current.setAttribute("data-open", "");
                });
            }
            updateMenuData(menu, position, size);
        });
    }
})();
//# sourceMappingURL=rehydrate.js.map