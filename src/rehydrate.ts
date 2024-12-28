{
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
	let grabbed: Grabbed | GrabStates = GrabStates.WAITING;
	document.addEventListener("mousemove", (e) => {
		mouse.x = e.x;
		mouse.y = e.y;

		if (grabbed instanceof Object) {
			// Don't let menu disappear beyond edges
			grabbed.position.x = Math.min(
				Math.max(mouse.x - grabbed.offset.x, minimumVisibleMenu - grabbed.size.w),
				innerWidth - minimumVisibleMenu
			);
			grabbed.position.y = Math.min(
				Math.max(mouse.y - grabbed.offset.y, minimumVisibleMenu - grabbed.size.h),
				innerHeight - minimumVisibleMenu
			);
			grabbed.menu.style.left = `${grabbed.position.x}px`;
			grabbed.menu.style.top = `${grabbed.position.y}px`;
		}
	});
	document.addEventListener("mousedown", () => {
		if (!(grabbed instanceof Object)) {
			grabbed = GrabStates.FAILED;
		}
	});
	document.addEventListener("mouseup", () => {
		grabbed = GrabStates.WAITING;
	});

	const menus = Array.from(
		document.body.getElementsByClassName("menu")
	) as HTMLElement[];
	for (const menu of menus) {
		// Drag
		const position = { x: NaN, y: NaN };
		const size = { w: NaN, h: NaN };
		const grabOffset = { x: 0, y: 0 };
		const initRectData = menu.getBoundingClientRect();
		position.x = initRectData.x;
		position.y = initRectData.y;
		size.w = initRectData.width;
		size.h = initRectData.height;
		menu.firstElementChild!.addEventListener("mousemove", () => {
			if (!(grabbed instanceof Object)) {
				grabOffset.x = mouse.x - position.x;
				grabOffset.y = mouse.y - position.y;
			}
		});
		menu.firstElementChild!.addEventListener("mousedown", () => {
			if (grabbed === GrabStates.WAITING) {
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

		// Dropdowns
		let focused: Element | null = null;
		for (const dropdown of menu.getElementsByClassName("dropdown")) {
			if (dropdown.hasAttribute("data-open")) focused = dropdown;

			dropdown.firstElementChild!.addEventListener("click", () => {
				if (focused) focused.removeAttribute("data-open");
				if (focused === dropdown) {
					focused = null;
				} else {
					focused = dropdown;
					focused.setAttribute("data-open", "");
				}

				const rectData = menu.getBoundingClientRect();
				position.x = rectData.x;
				position.y = rectData.y;
				size.w = rectData.width;
				size.h = rectData.height;
			});
		}
	}
}
