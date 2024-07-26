const _getGapInPx = (element) => {
    const computedStyles = window.getComputedStyle(element);
    const gap = parseFloat(computedStyles.gap);

    return gap === NaN ? 0 : gap;
};

class SliderVertical extends HTMLElement {
    constructor() {
        super();
        this.upButton = this.querySelector('button[name="up"]');
        this.downButton = this.querySelector('button[name="down"]');
        this.panel = this.querySelector(".slider-vertical--panel");

        this.bindedUpdateButtons = this.updateButtons.bind(this);
        this.handles = {
            onDownButtonClick: (event) => {
                const gap = _getGapInPx(this.panel);

                event.preventDefault();
                this.panel.scrollTop +=
                    this.panel.children[0].offsetHeight + gap;
                setTimeout(this.bindedUpdateButtons, 200);
            },
            onUpButtonClick: (event) => {
                const gap = _getGapInPx(this.panel);

                event.preventDefault();
                this.panel.scrollTop -=
                    this.panel.children[0].offsetHeight + gap;
                setTimeout(this.bindedUpdateButtons, 200);
            },
        };
    }

    connectedCallback() {
        this.updateButtons();
        this.dataset.status = "ready";
        this.unsubscribeResize = subscribe(
            PUB_SUB_EVENTS.windowResizeX,
            this.updateButtons.bind(this)
        );
        this.panel.addEventListener("scroll", this.bindedUpdateButtons);
        this.upButton.addEventListener("click", this.handles.onUpButtonClick);
        this.downButton.addEventListener(
            "click",
            this.handles.onDownButtonClick
        );
    }

    updateButtons() {
        const panel = this.panel;

        if (panel.scrollTop == 0) {
            this.upButton.style.setProperty("display", "none", "important");
        } else {
            this.upButton.style.setProperty("display", "");
        }

        if (panel.scrollHeight - panel.scrollTop == panel.clientHeight) {
            this.downButton.style.setProperty("display", "none", "important");
        } else {
            this.downButton.style.setProperty("display", "");
        }
    }

    disconnectedCallback() {
        delete this.dataset.status;
        this.unsubscribeResize?.();
        this.panel.removeEventListener("scroll", this.bindedUpdateButtons);
        this.upButton.removeEventListener(
            "click",
            this.handles.onUpButtonClick
        );
        this.downButton.removeEventListener(
            "click",
            this.handles.onDownButtonClick
        );
    }
}

export { SliderVertical };
