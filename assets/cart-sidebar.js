const { load: loadComponent } = await import(
    window?._importmap?.imports?.["deferred"] || "deferred"
);

const _findMessageWrapper = (element) => {
    const prevSibling = element.previousElementSibling;

    if (prevSibling && prevSibling.matches(".message-wrapper")) {
        return prevSibling;
    }

    return false;
};

class CartSidebar extends HTMLElement {
    constructor() {
        super();

        this.handles = {
            onBodyClick: this.handleBodyClick.bind(this),
            onCartButtonClick: (event) => {
                event.preventDefault();
                this.toggle(event.target);
            },
            onCloseButtonClick: this.close.bind(this),
            onKeydown: this.handleKeydown.bind(this),
        };

        this.cartButton = document.getElementById("cart-icon-bubble");
        this.closeButton = this.querySelector(".modal__close-button");

        this.bindCartUpdate();
    }

    connectedCallback() {
        this.cartButton.addEventListener(
            "click",
            this.handles.onCartButtonClick
        );
        this.closeButton?.addEventListener?.(
            "click",
            this.handles.onCloseButtonClick
        );
        this.addEventListener("keydown", this.handles.onKeydown);
    }

    handleBodyClick(event) {
        if (
            !this.cartButton.contains(event.target) &&
            !this.contains(event.target)
        ) {
            // unset active element when clicked somewhere on body
            // to prevent page jump back to active element once focus restored
            this.setActiveElement(null);
            this.close();
        }
    }

    handleKeydown(event) {
        if (event.code.toUpperCase() === "ESCAPE") this.close();
    }

    open(openedBy) {
        const focusElement =
            this.querySelector('[name="checkout"]') ||
            this.querySelector(".modal__close-button");

        if (this.dataset.status === "open") return;

        this.dataset.status = "open";
        document.body.dataset.cartStatus = this.dataset.status;
        if (this.parentNode.tagName === "BODY" && document.dir !== "rtl") {
            document.body.style.width = `${window.visualViewport.width}px`;
            document.body.style.overflow = "hidden";
        }

        document.body.addEventListener("click", this.handles.onBodyClick);

        // add short delay so browser could find element to focus
        // when there is animations it can be tricky for browser
        setTimeout(async () => {
            const { trapFocus } = await import(
                window?._importmap?.imports?.["helper"] || "helper"
            );

            if (openedBy) {
                this.setActiveElement(openedBy);
            }

            trapFocus(this, focusElement);
        }, 100);
    }

    close() {
        document.body.dataset.cartStatus = this.dataset.status = "close";
        document.body.removeEventListener("click", this.handles.onBodyClick);
        import(window?._importmap?.imports?.["helper"] || "helper").then(
            (helper) => {
                helper.removeTrapFocus(this.activeElement);
            }
        );
        if (!this.closest("header")) {
            setTimeout(() => {
                document.body.style.width = "";
                document.body.style.overflow = "";
            }, 200);
        }
        // clean up old messages
        this.querySelectorAll(".message-wrapper").forEach((el) => el.remove());
    }

    toggle(toggledBy) {
        if (this.dataset.status === "open") this.close();
        else this.open(toggledBy);
    }

    renderContents(parsedState) {
        this.productId = parsedState.id;
        this.getSectionsToRender().forEach((section) => {
            document.getElementById(section.id).innerHTML =
                this.getSectionInnerHTML(
                    parsedState.sections[section.id],
                    section.selector
                );
        });

        this.classList.remove("updating");
        this.revealStickyHeaderAndOpen() || this.open();
    }

    revealStickyHeaderAndOpen(openedBy) {
        const sticky = this.closest("sticky-header");
        const header = sticky && sticky.parentElement;
        const reveal = () => {
            const transitionDuration =
                getComputedStyle(header).transitionDuration;
            let delay = 0;

            if (transitionDuration.endsWith("s"))
                delay = parseFloat(transitionDuration) * 1000;
            else delay = parseFloat(transitionDuration);

            sticky.reveal();
            setTimeout(this.open.bind(this, openedBy), delay);
        };

        // sticky header already revealed
        if (header && header.classList.contains("section-header-sticky"))
            return false;

        if (sticky) {
            if (customElements.get("sticky-header")) reveal();
            else {
                customElements.whenDefined("sticky-header").then(reveal);
                loadComponent("stickyHeader");
            }

            return true;
        }

        return false;
    }

    getSectionsToRender() {
        return [
            {
                id: "cart-icon-bubble",
                section: "cart-icon-bubble",
            },
            {
                id: "cart-sidebar-items",
                section: "cart-sidebar-items",
            },
            {
                id: "cart-sidebar-footer",
                section: "cart-sidebar-footer",
            },
        ];
    }

    getSectionInnerHTML(html, selector = ".shopify-section") {
        return new DOMParser()
            .parseFromString(html, "text/html")
            .querySelector(selector)?.innerHTML;
    }

    bindCartUpdate() {
        const debouncedOnChange = debounce((event) => {
            const input = event.target;

            this.classList.add("updating");
            this.updateQuantity(input.dataset.line, input.value);
        }, 500);

        this.addEventListener("click", (event) => {
            const link = event.target.closest("a[href]");

            if (!link || link.href.indexOf(routes.cart_change_url) == -1)
                return;

            event.preventDefault();
            this.classList.add("updating");
            this.updateQuantity(
                new URL(link.href).searchParams.get("line"),
                new URL(link.href).searchParams.get("quantity")
            );
        });

        // listen qunatity change via input
        this.addEventListener("input", debouncedOnChange);
    }

    async updateQuantity(line, quantity) {
        const { fetchConfig } = await import(
            window?._importmap?.imports?.["helper"] || "helper"
        );
        const body = JSON.stringify({
            line,
            quantity,
            sections: this.getSectionsToRender().map((section) => section.id),
        });

        fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
            .then((response) => response.json())
            .then((response) => {
                const item = response?.items?.[line - 1];

                if (response.errors) {
                    this.showError(line, response.errors);
                } else {
                    this.renderContents(response);

                    if (quantity > 0 && item.quantity != quantity) {
                        this.showError(line, window.cartStrings.quantityError);
                    }
                }
            });
    }

    async showError(line, text) {
        const item = this.querySelector(
            `.cart-sidebar__item[data-line="${line}"]`
        );
        const show = (element) => {
            const qty = item.querySelector('[name="quantity"]').value;

            element.hidden = false;
            element.querySelector(".error-message").innerHTML = text.replace(
                "[quantity]",
                qty
            );
            this.classList.remove("updating");
        };

        let messageWrapper = _findMessageWrapper(item);

        if (!messageWrapper) {
            let html = await fetchSectionHTML(
                "template__message-wrapper",
                true,
                "/"
            );

            item.insertAdjacentHTML("beforebegin", html);
            messageWrapper = item.previousElementSibling;
        }

        show(messageWrapper);
    }

    setActiveElement(element) {
        this.activeElement = element;
    }

    updateSections(source = {}) {
        this.getSectionsToRender().forEach(({ id, section, selector }) => {
            const tagretSection = document.getElementById(id);
            const targetElement =
                tagretSection.querySelector(selector) || tagretSection;

            targetElement.innerHTML = this.getSectionInnerHTML(
                source[section],
                selector
            );
        });
    }

    reload() {
        this.classList.add("updating");

        return fetch(
            window.location.pathname +
                "?sections=" +
                this.getSectionsToRender()
                    .map((section) => section.id)
                    .join(",")
        )
            .then((response) => response.text())
            .then((text) => JSON.parse(text))
            .then((json) => {
                this.updateSections(json);
                this.classList.remove("updating");

                return json;
            });
    }

    disconnectedCallback() {
        document.body.removeEventListener("click", this.handles.onBodyClick);
        this.cartButton.removeEventListener(
            "click",
            this.handles.onCartButtonClick
        );
        this.closeButton?.removeEventListener?.(
            "click",
            this.handles.onCloseButtonClick
        );
        this.removeEventListener("keydown", this.handles.onKeydown);
    }
}

export { CartSidebar };
