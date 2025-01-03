import { settings } from "./settings.js";
const dropdownEvent = new Event("change");
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
function setupMenus(menus) {
    for (const menu of menus) {
        const position = { x: NaN, y: NaN };
        const size = { w: NaN, h: NaN };
        const grabOffset = { x: NaN, y: NaN };
        updateMenuData(menu, position, size); // Initialize on first appearance
        setupMenuToggle(menu);
        setupInputs(menu);
        setupMenuRepositionOnWindowResize(menu, position, size);
        setupMenuDragging(menu, menus, position, size, grabOffset);
        setupMenuDropdowns(menu, position, size);
    }
}
function setupMenuRepositionOnWindowResize(menu, position, size) {
    window.addEventListener("resize", () => {
        position.x = clamp(position.x, minimumVisibleMenu - size.w, innerWidth - minimumVisibleMenu);
        position.y = clamp(position.y, minimumVisibleMenu - size.h, innerHeight - minimumVisibleMenu);
        menu.style.left = `${position.x}px`;
        menu.style.top = `${position.y}px`;
    });
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
            e.stopPropagation();
        });
    });
}
function setupMenuDragging(menu, menus, position, size, grabOffset) {
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
            moveToTopOfStack(menus, menu);
        }
    });
}
function moveToTopOfStack(menus, menu) {
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
        setupDropdown(dropdown, menu, isRequired, position, size, focused);
        if (dropdown.hasAttribute("data-open")) {
            focused.current = dropdown;
        }
    });
    if (isRequired && !focused.current) {
        dropdowns[0].firstElementChild.click();
    }
}
function setupDropdown(dropdown, menu, isRequired, position, size, focused) {
    const dropdownValue = dropdown.getAttribute("data-key");
    if (!dropdownValue)
        throw Error("Dropdown has no value");
    // Set value if dropdown is preselected
    if (dropdown.hasAttribute("data-open"))
        menu.setAttribute("data-value", dropdownValue);
    // Get and set height of dropdown for css transition
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
            menu.setAttribute("data-value", "");
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
            menu.setAttribute("data-value", dropdownValue);
        }
        updateMenuData(menu, position, size);
        menu.dispatchEvent(dropdownEvent);
    });
}
function setupInputs(menu) {
    const brackets = /\[.+?]/g;
    const inputs = menu.getElementsByTagName("input");
    const keyGroups = new Map();
    for (const input of inputs) {
        if (input.hasAttribute("data-ignore"))
            continue;
        const key = (input.name || input.id).replace(brackets, "").trim();
        // Use initial setting svalues
        if (settings.has(key)) {
            if (input.type !== "radio")
                input.value = settings.get(key);
            else {
                const val = input.id.replace(brackets, "").trim();
                if (val === settings.get(key))
                    input.checked = true;
            }
        }
        // Keep track of same key inputs
        let keyGroup = keyGroups.get(key);
        if (!keyGroup) {
            keyGroup = [];
            keyGroups.set(key, keyGroup);
        }
        keyGroup.push(input);
        input.addEventListener("change", () => {
            let value;
            switch (input.type) {
                case "number":
                case "range":
                    const min = +(input.getAttribute("min") ?? -Infinity);
                    const max = +(input.getAttribute("max") ?? Infinity);
                    value = input.valueAsNumber;
                    if (value < min || value > max)
                        return;
                    break;
                case "radio":
                    value = input.id.replace(brackets, "").trim();
                    break;
                default:
                    value = input.value;
                    break;
            }
            settings.set(key, value);
            // Update same-key inputs
            for (const oInput of keyGroups.get(key)) {
                if (oInput.type !== "radio")
                    oInput.value = input.value;
                else {
                    const oValue = oInput.id.replace(brackets, "").trim();
                    if (oValue === value)
                        oInput.checked = true;
                }
            }
        });
    }
}
setupMenus(Array.from(document.getElementsByClassName("menu")));
//# sourceMappingURL=rehydrate.js.map