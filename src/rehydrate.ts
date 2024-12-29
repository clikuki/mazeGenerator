(() => {
	interface Grabbed {
		menu: HTMLElement;
		position: { x: number; y: number };
		size: { w: number; h: number };
		offset: { x: number; y: number };
	}

	const enum GrabStates {
		WAITING,
		FAILED,
	}

	const minimumVisibleMenu = 30;
	const mouse = { x: 0, y: 0 };
	let grabbedMenu: Grabbed | GrabStates = GrabStates.WAITING;
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
			grabbedMenu = GrabStates.FAILED;
		}
	});
	document.addEventListener("mouseup", () => {
		grabbedMenu = GrabStates.WAITING;
	});

	function updateGrabbedPosition(grabbed: Grabbed): void {
		grabbed.position.x = clamp(
			mouse.x - grabbed.offset.x,
			minimumVisibleMenu - grabbed.size.w,
			innerWidth - minimumVisibleMenu
		);
		grabbed.position.y = clamp(
			mouse.y - grabbed.offset.y,
			minimumVisibleMenu - grabbed.size.h,
			innerHeight - minimumVisibleMenu
		);
		grabbed.menu.style.left = `${grabbed.position.x}px`;
		grabbed.menu.style.top = `${grabbed.position.y}px`;
	}

	function clamp(value: number, min: number, max: number): number {
		return Math.min(Math.max(value, min), max);
	}

	function updateMenuData(
		menu: HTMLElement,
		pos: { x: number; y: number },
		size: { w: number; h: number }
	): void {
		const rectData = menu.getBoundingClientRect();
		pos.x = rectData.x;
		pos.y = rectData.y;
		size.w = rectData.width;
		size.h = rectData.height;
	}

	function getDropdownHeight(content: HTMLElement): number {
		content.style.height = "auto";
		const elHeight = content.offsetHeight;
		content.style.height = "";
		return elHeight;
	}

	const menus = Array.from(
		document.body.getElementsByClassName("menu")
	) as HTMLElement[];
	menus.forEach((menu) => initializeMenu(menu));

	function initializeMenu(menu: HTMLElement): void {
		const position = { x: NaN, y: NaN };
		const size = { w: NaN, h: NaN };
		const grabOffset = { x: NaN, y: NaN };

		setupMenuToggle(menu);
		updateMenuData(menu, position, size);
		setupMenuDragging(menu, position, size, grabOffset);
		setupMenuDropdowns(menu, position, size);
	}

	function setupMenuToggle(menu: HTMLElement): void {
		let isOpen = menu.hasAttribute("data-open");
		menu.firstElementChild!.addEventListener("click", () => {
			// Don't toggle after dragging menu
			if (isDraggingMenu) return;

			isOpen = !isOpen;
			if (isOpen) {
				menu.setAttribute("data-open", "");
			} else {
				menu.removeAttribute("data-open");
			}
		});
	}

	function setupMenuDragging(
		menu: HTMLElement,
		position: { x: number; y: number },
		size: { w: number; h: number },
		grabOffset: { x: number; y: number }
	): void {
		menu.addEventListener("mousemove", () => {
			if (!(grabbedMenu instanceof Object)) {
				grabOffset.x = mouse.x - position.x;
				grabOffset.y = mouse.y - position.y;
			} else {
				isDraggingMenu = true;
			}
		});

		menu.addEventListener("mousedown", (e) => {
			isDraggingMenu = false;

			const targetExists = e.target instanceof HTMLElement;
			const targetIsInput = targetExists && e.target.tagName !== "INPUT";
			if (grabbedMenu === GrabStates.WAITING && targetIsInput) {
				grabbedMenu = { menu, position, size, offset: grabOffset };
				moveToTopOfStack(menu);
			}
		});
	}

	function moveToTopOfStack(menu: HTMLElement): void {
		const oldIndex = menus.findIndex((v) => v === menu);
		menus.splice(oldIndex, 1);
		menus.push(menu);

		menus.forEach((menu, index) => {
			menu.style.zIndex = `${index + 1}`;
		});
	}

	function setupMenuDropdowns(
		menu: HTMLElement,
		position: { x: number; y: number },
		size: { w: number; h: number }
	): void {
		let isRequired = menu.hasAttribute("data-required");
		const sharedFocused = { current: null as Element | null };

		const dropdowns = Array.from(
			menu.getElementsByClassName("dropdown")
		) as HTMLElement[];
		dropdowns.forEach((dropdown) => {
			initializeDropdown(dropdown, menu, position, size, sharedFocused);
			if (dropdown.hasAttribute("data-open")) {
				sharedFocused.current = dropdown;
			}
		});

		if (isRequired && !sharedFocused.current) {
			(dropdowns[0].firstElementChild! as HTMLElement).click();
		}
	}

	function initializeDropdown(
		dropdown: HTMLElement,
		menu: HTMLElement,
		position: { x: number; y: number },
		size: { w: number; h: number },
		sharedFocused: { current: Element | null }
	): void {
		const content = dropdown.children[1] as HTMLElement;
		let height = getDropdownHeight(content);
		content.style.setProperty("--height", `${height}px`);

		dropdown.firstElementChild!.addEventListener("click", () => {
			if (isDraggingMenu) return;

			if (sharedFocused.current)
				sharedFocused.current.removeAttribute("data-open");

			if (sharedFocused.current === dropdown) {
				sharedFocused.current = null;
			} else {
				const newHeight = getDropdownHeight(content);
				if (newHeight !== height) {
					height = newHeight;
					content.style.setProperty("--height", `${height}px`);
				}

				requestAnimationFrame(() => {
					sharedFocused.current = dropdown;
					sharedFocused.current.setAttribute("data-open", "");
				});
			}

			updateMenuData(menu, position, size);
		});
	}
})();
