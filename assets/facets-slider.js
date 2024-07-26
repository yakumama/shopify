class FacetsSlider extends HTMLElement {
    constructor() {
        super();

        this.inner = this.querySelector(".facets__wrapper");
        this.handle = {
            innerScroll: this.updateButtons.bind(this),
            click: this.onClick.bind(this),
        };
    }

    connectedCallback() {
        this.style.position = "relative";
        this.style.display = "block";
        this.inner.style.overflowX = "hidden";
        this.inner.style.flexWrap = "nowrap";
        this.inner.style.whiteSpace = "nowrap";
        this.insertAdjacentHTML(
            "afterbegin",
            document.getElementById("filters-in-toolbar--prev-button").innerHTML
        );
        this.insertAdjacentHTML(
            "beforeend",
            document.getElementById("filters-in-toolbar--next-button").innerHTML
        );

        this.inner.addEventListener("scroll", this.handle.innerScroll);
        this.addEventListener("click", this.handle.click);
        setTimeout(this.updateButtons.bind(this), 200);
    }

    updateButtons() {
        const { scrollLeft, scrollWidth, clientWidth } = this.inner;

        this.querySelector("[name=prev]").hidden = scrollLeft === 0;
        this.querySelector("[name=next]").hidden =
            document.dir === "rtl"
                ? scrollWidth + scrollLeft == clientWidth
                : scrollWidth - scrollLeft == clientWidth;
    }

    onClick(event) {
        function scrollTo(element, direction) {
            const { parentElement, clientWidth, offsetLeft } = element;

            let scrollLeft = parentElement.scrollLeft + clientWidth + 10;

            if (direction === "left") {
                scrollLeft = offsetLeft - 20;
            }

            if (document.dir === "rtl") {
                if (direction === "left") {
                    scrollLeft = parentElement.scrollLeft + clientWidth + 10;
                } else {
                    scrollLeft = offsetLeft - 20;
                }
            }

            element.parentElement.scroll({
                left: scrollLeft,
                behavior: "smooth",
            });
        }

        function getNextHidden(parent) {
            const { children, scrollLeft, clientWidth } = parent;

            return Array.from(children)
                .filter((child) => child.offsetParent /* element not hidden */)
                .find((child) => {
                    return document.dir === "rtl"
                        ? scrollLeft > child.offsetLeft
                        : scrollLeft + clientWidth <
                              child.offsetLeft + child.clientWidth;
                });
        }

        function getPrevHidden(parent) {
            const { children, scrollLeft } = parent;

            let candidates = Array.from(children)
                .filter((child) => child.offsetParent /* element not hidden */)
                .filter((child) => {
                    return scrollLeft > child.offsetLeft;
                });

            return candidates.length ? candidates[candidates.length - 1] : null;
        }

        const button = event.target.closest("[name=prev],[name=next]");
        const summary = event.target.closest(" summary");
        const slider = this.inner;

        if (button) {
            if (button.name === "next") {
                let element = getNextHidden(slider);
                let direction = document.dir === "rtl" ? -1 : 1;

                event.preventDefault();
                if (element) scrollTo(element, "right");
                else
                    slider.scroll({
                        left: slider.scrollLeft + direction * 24,
                        behavior: "smooth",
                    });
            } else if (button.name === "prev") {
                let element = getPrevHidden(slider);

                event.preventDefault();
                if (element) scrollTo(element, "left");
                else slider.scroll({ left: 0, behavior: "smooth" });
            }
        }

        if (summary) {
            if (summary.parentElement === getNextHidden(slider)) {
                scrollTo(summary.parentElement, "right");
            } else if (summary.parentElement === getPrevHidden(slider)) {
                scrollTo(summary.parentElement, "left");
            }
        }
    }

    disconnectedCallback() {
        this.inner.removeEventListener("scroll", this.handle.innerScroll);
        this.removeEventListener("click", this.handle.click);
    }
}

export { FacetsSlider };
