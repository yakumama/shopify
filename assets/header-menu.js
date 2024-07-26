class HeaderMenu extends HTMLElement {
    constructor() {
        super();

        this.container = this.querySelector(".header__inline-menu > ul");
        this.itemsDetails = this.querySelectorAll("[data-items-menu] details");

        if (!this.itemsDetails.length) return;

        this.itemsDetails.forEach((detail) => {
            // remove dropdown menu links if config option is checked
            this.removeDropdownMenuLinks(detail);

            // open megamenu dropdown inner
            if (detail.lastElementChild.dataset.typeMenu == "full-width") {
                detail.setAttribute("open", true);
                // set dropdown inner max-height (Fix for Firefox and Safari browsers)
                this.setMaxHeight(detail);
            }
        });

        this.handles = {
            onItemClick: this.activateItemMenuOnClick.bind(this),
            onItemHover: this.activateItemMenuOnHover.bind(this),
            onDetailsToggle: async (event) => {
                const helper = await import(
                    window?._importmap?.imports?.["helper"] || "helper"
                );
                const details = event.target;
                const _getDropdown = (d) =>
                    [...d.children].find((el) => el.tagName !== "SUMMARY");
                const _trapIntoParent = (el) => {
                    let details = el.closest("details[open]");
                    details && helper.trapFocus(_getDropdown(details));
                };

                if (details.open) {
                    helper.trapFocus(_getDropdown(details));
                } else {
                    helper.removeTrapFocus();
                    _trapIntoParent(details);
                }
            },
        };
    }

    connectedCallback() {
        this.itemsDetails.forEach((detail) => {
            // activate items on click else on hover
            if (this.container.dataset?.activateMenu == "on_click")
                detail.addEventListener("click", this.handles.onItemClick);
            else
                detail.addEventListener("mouseenter", this.handles.onItemHover);
            // trap focus when menu opened
            detail.addEventListener("toggle", this.handles.onDetailsToggle);
        });
    }

    activateItemMenuOnClick(e) {
        let detail = e.target.closest("details");

        if (
            detail.parentElement.nodeName === "DETAILS-DISCLOSURE" &&
            e.target.nodeName !== "A"
        ) {
            e.preventDefault();
            e.stopPropagation();

            this.activateItemMenu(detail);
        }
    }

    activateItemMenuOnHover(e) {
        let detail = e.target.closest("details");

        // megamenu dropdown inner - prevent hiding child menu on leaving parent caterory item
        if (
            detail.lastElementChild.dataset.typeMenu == "full-width" &&
            detail.closest("ul.header__submenu")
        )
            return;

        this.activateItemMenu(detail);
        detail.addEventListener(
            "mouseleave",
            this.diactivateItemMenu.bind(this)
        );
    }

    activateItemMenu(detail) {
        detail.open = true;
        detail.dataset.active = "true";
    }

    diactivateItemMenu(event) {
        const detail = event.target;

        detail.dataset.active = "false";
        setTimeout(() => {
            detail.open = detail.dataset.active === "true";
        }, 300);
    }

    removeDropdownMenuLinks(detail) {
        let dropdownInner = detail.closest(".dropdown-inner");

        if (
            dropdownInner?.classList.contains("full-width") &&
            dropdownInner?.firstElementChild?.classList.contains("remove-menu")
        ) {
            dropdownInner.querySelector(
                ".col-items"
            ).dataset.menuRemoved = true;
            dropdownInner.querySelector(".col-items").children[0].remove();
        }
    }

    setMaxHeight(detail) {
        let dropdownInner = detail.closest(".dropdown-inner");
        if (!dropdownInner) return;

        let inner_height = window.innerHeight,
            inner_width = window.innerWidth;

        if (inner_width < 980) return;

        let headerSectionHeight = document.querySelectorAll(
                ".shopify-section-group-header-group"
            ),
            sum = 0;

        headerSectionHeight?.forEach((el) => {
            if (el.id.indexOf("_header") > 0) sum += el.offsetHeight; // get all header top sections height
        });

        dropdownInner.style.maxHeight = inner_height - sum + "px";
        dropdownInner.style.overflowX = "auto";
    }

    disconnectedCallback() {
        this.itemsDetails.forEach((detail) => {
            if (this.container.dataset?.activateMenu == "on_click")
                detail.removeEventListener("click", this.handles.onItemClick);
            else
                detail.removeEventListener(
                    "mouseenter",
                    this.handles.onItemHover
                );
            detail.removeEventListener("toggle", this.handles.onDetailsToggle);
        });
    }
}

export { HeaderMenu };
