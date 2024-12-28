{
	for (const menu of document.body.getElementsByClassName("menu")) {
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
			});
		}
	}
}
