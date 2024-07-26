class FaqsAccordion extends HTMLElement {
    animateOptions = {
        duration: 300,
        easing: "linear",
    };

    constructor() {
        super();

        this.handle = {
            titleClick: (event) => {
                const content = this.getContent(event.target);
                const title = event.target.closest(".faq-title");

                event.preventDefault();

                if (title.classList.contains("open")) this.hide(content);
                else this.show(content);

                title.classList.toggle("open");
            },
        };
    }

    getContent(element) {
        return this.getDetails(element)?.querySelector?.(".faq-content");
    }

    getDetails(element) {
        return element?.closest?.("details");
    }

    connectedCallback() {
        this.querySelectorAll(".faq-title").forEach((title) => {
            const details = this.getDetails(title);
            const content = this.getContent(title);

            if (content) {
                details.open = true;
                content.style.height = "0px";
                content.style.overflow = "hidden";
            }

            title.addEventListener("click", this.handle.titleClick);
        });
    }

    show(element) {
        var animation = element.animate(
            { height: ["0", element.scrollHeight + "px"] },
            this.animateOptions
        );

        animation.onfinish = () => {
            element.style.height = "initial";
        };
    }

    hide(element) {
        var animation = element.animate(
            { height: [element.clientHeight + "px", "0"] },
            this.animateOptions
        );

        animation.onfinish = () => {
            element.style.height = "0";
        };
    }

    disconnectedCallback() {
        this.querySelectorAll(".faq-title").forEach((title) => {
            title.removeEventListener("click", this.handle.titleClick);
        });
    }
}

export { FaqsAccordion };
