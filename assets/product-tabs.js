const { TabsComponent } = await import(
    window?._importmap?.imports?.["tabs"] || "tabs"
);

class ProductTabs extends TabsComponent {
    constructor() {
        super();

        this.handleExternalRatingClick = (event) => {
            const jdgmReviews = this.querySelector(
                '[role="tabpanel"] .jdgm-review-widget'
            );

            if (jdgmReviews) {
                event.preventDefault();
                this.activateTab(
                    jdgmReviews
                        .closest('[role="tabpanel"]')
                        .id.replace("--content", ""),
                    true
                );
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        document
            .querySelectorAll(".product__title--rating")
            .forEach((rating) => {
                rating.addEventListener(
                    "click",
                    this.handleExternalRatingClick
                );
            });
    }

    activateTab(tabId, scrollToTab = false) {
        const offsetTop = 160; // Improve. Calculate stucked header height.

        super.activateTab(tabId);
        if (scrollToTab) {
            let content = this.getContent(tabId);
            window.scroll({
                top: content.offsetTop - offsetTop,
                behavior: "smooth",
            });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document
            .querySelectorAll(".product__title--rating")
            .forEach((rating) => {
                rating.removeEventListener(
                    "click",
                    this.handleExternalRatingClick
                );
            });
    }
}

export { ProductTabs };
