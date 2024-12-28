"use strict";
{
    const minimumVisibleMenu = 30;
    const mouse = { x: 0, y: 0 };
    let grabbed = 0 /* GrabStates.WAITING */;
    document.addEventListener("mousemove", (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
        if (grabbed instanceof Object) {
            // Don't let menu disappear beyond edges
            grabbed.position.x = Math.min(Math.max(mouse.x - grabbed.offset.x, minimumVisibleMenu - grabbed.size.w), innerWidth - minimumVisibleMenu);
            grabbed.position.y = Math.min(Math.max(mouse.y - grabbed.offset.y, minimumVisibleMenu - grabbed.size.h), innerHeight - minimumVisibleMenu);
            grabbed.menu.style.left = `${grabbed.position.x}px`;
            grabbed.menu.style.top = `${grabbed.position.y}px`;
        }
    });
    document.addEventListener("mousedown", () => {
        if (!(grabbed instanceof Object)) {
            grabbed = 1 /* GrabStates.FAILED */;
        }
    });
    document.addEventListener("mouseup", () => {
        grabbed = 0 /* GrabStates.WAITING */;
    });
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
    for (const menu of menus) {
        // Drag
        const position = { x: NaN, y: NaN };
        const size = { w: NaN, h: NaN };
        const grabOffset = { x: 0, y: 0 };
        updateMenuData(menu, position, size);
        menu.addEventListener("mousemove", () => {
            if (!(grabbed instanceof Object)) {
                grabOffset.x = mouse.x - position.x;
                grabOffset.y = mouse.y - position.y;
            }
        });
        menu.addEventListener("mousedown", () => {
            if (grabbed === 0 /* GrabStates.WAITING */) {
                grabbed = { menu, position, size, offset: grabOffset };
                // Move to top of z-index stack
                const oldIndex = menus.findIndex((v) => v === menu);
                menus.splice(oldIndex, 1);
                menus.push(menu);
                for (let i = 0; i < menus.length; i++) {
                    const other = menus[i];
                    other.style.zIndex = `${i + 1}`;
                }
            }
        });
        menu
            .getElementsByClassName("dropdowns")[0]
            ?.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });
        // Dropdowns
        let focused = null;
        for (const dropdown of menu.getElementsByClassName("dropdown")) {
            if (dropdown.hasAttribute("data-open"))
                focused = dropdown;
            // Allow height to be animatable
            const content = dropdown.children[1];
            let height = getDropdownHeight(content);
            content.style.setProperty("--height", `${height}px`);
            dropdown.firstElementChild.addEventListener("click", () => {
                // Set focus to current dropdown and close all others
                // or if already focused, close this one
                if (focused)
                    focused.removeAttribute("data-open");
                if (focused === dropdown) {
                    focused = null;
                }
                else {
                    const newHeight = getDropdownHeight(content);
                    if (newHeight !== height) {
                        height = newHeight;
                        content.style.setProperty("--height", `${height}px`);
                    }
                    requestAnimationFrame(() => {
                        focused = dropdown;
                        focused.setAttribute("data-open", "");
                    });
                }
                updateMenuData(menu, position, size);
            });
        }
    }
}
//# sourceMappingURL=rehydrate.js.map