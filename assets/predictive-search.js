const isPredictiveSearchApiSupported = () => {
    const shopifyFeatures =
        document.getElementById("shopify-features")?.innerHTML;

    // details at https://shopify.dev/docs/api/ajax/reference/predictive-search#supported-languages
    try {
        return JSON.parse(shopifyFeatures)?.predictiveSearch;
    } catch (error) {
        return false;
    }
};

class PredictiveSearch extends HTMLElement {
    constructor() {
        super();
        this.input = this.querySelector('input[type="search"]');
        this.predictiveSearchResults = this.querySelector(
            "[data-predictive-search]"
        );
        this.isOpen = false;
    }

    connectedCallback() {
        const form = this.querySelector("form.search");

        this.handle = {
            onFormSubmit: this.onFormSubmit.bind(this),
            onInput: debounce(() => {
                this.onChange();
            }, 300),
            onFocus: this.onFocus.bind(this),
            onFocusOut: this.onFocusOut.bind(this),
            onKeyUp: this.onKeyup.bind(this),
            onKeyDown: this.onKeydown.bind(this),
        };

        if (isPredictiveSearchApiSupported()) {
            form.addEventListener("submit", this.handle.onFormSubmit);

            this.input.addEventListener("input", this.handle.onInput);
            this.input.addEventListener("focus", this.handle.onFocus);

            this.addEventListener("focusout", this.handle.onFocusOut);
            this.addEventListener("keyup", this.handle.onKeyUp);
            this.addEventListener("keydown", this.handle.onKeyDown);

            // clean up onclick for submit button
            this.querySelectorAll("button[onclick]").forEach((button) =>
                button.removeAttribute("onclick")
            );

            // run search event when search field has focus and some value
            if (document.activeElement === this.input && this.getQuery())
                this.onChange();
        }
    }

    getQuery() {
        return this.input.value.trim();
    }

    getMinQueryLength() {
        return parseInt(this.dataset.minQueryLength);
    }

    onChange() {
        const searchTerm = this.getQuery();
        const minQueryLimit = this.getMinQueryLength();

        if (!searchTerm.length) {
            this.close(true);
            return;
        }

        this.getSearchResults(searchTerm, minQueryLimit);
    }

    onFormSubmit(event) {
        if (
            !this.getQuery().length ||
            this.querySelector('[aria-selected="true"] a')
        )
            event.preventDefault();
    }

    onFocus() {
        const searchTerm = this.getQuery();

        if (!searchTerm.length) return;

        if (this.getAttribute("results") === "true") {
            this.open();
        } else {
            this.getSearchResults(searchTerm);
        }
    }

    onFocusOut() {
        setTimeout(() => {
            if (!this.contains(document.activeElement)) this.close();
        });
    }

    onKeyup(event) {
        if (!this.getQuery().length) this.close(true);
        event.preventDefault();

        switch (event.code) {
            case "ArrowUp":
                this.switchOption("up");
                break;
            case "ArrowDown":
                this.switchOption("down");
                break;
            case "Enter":
                this.selectOption();
                break;
        }
    }

    onKeydown(event) {
        // Prevent the cursor from moving in the input when using the up and down arrow keys
        if (event.code === "ArrowUp" || event.code === "ArrowDown") {
            event.preventDefault();
        }
    }

    switchOption(direction) {
        if (!this.getAttribute("open")) return;

        const moveUp = direction === "up";
        const selectedElement = this.querySelector('[aria-selected="true"]');
        const allElements = this.querySelectorAll("li");
        let activeElement = this.querySelector("li");

        if (moveUp && !selectedElement) return;

        this.statusElement.textContent = "";

        if (!moveUp && selectedElement) {
            activeElement =
                selectedElement.nextElementSibling || allElements[0];
        } else if (moveUp) {
            activeElement =
                selectedElement.previousElementSibling ||
                allElements[allElements.length - 1];
        }

        if (activeElement === selectedElement) return;

        activeElement.setAttribute("aria-selected", true);
        if (selectedElement)
            selectedElement.setAttribute("aria-selected", false);

        this.setLiveRegionText(activeElement.textContent);
        this.input.setAttribute("aria-activedescendant", activeElement.id);
    }

    selectOption() {
        const selectedProduct = this.querySelector(
            '[aria-selected="true"] a, [aria-selected="true"] button'
        );

        if (selectedProduct) selectedProduct.click();
    }

    getSearchResults(searchTerm, minQueryLimit = false) {
        /* min query length for appropriate search result */
        if (searchTerm.length < minQueryLimit) return;

        const queryKey = searchTerm.replace(" ", "-").toLowerCase();
        this.setLiveRegionLoadingState();

        this.predictiveSearchResults.innerHTML = "";
        fetchSectionHTML(
            "predictive-search",
            true,
            this.getPredictiveUrl(searchTerm)
        )
            .then((html) => {
                this.renderSearchResults(html);
            })
            .catch((error) => {
                this.close();
                throw error;
            });
    }

    getPredictiveUrl(term) {
        return (
            routes.predictive_search_url +
            [
                `?q=${encodeURIComponent(term)}`,
                `resources[type]=${this.dataset.types}`,
                "resources[limit]=6",
            ].join("&")
        );
    }

    setLiveRegionLoadingState() {
        this.statusElement =
            this.statusElement ||
            this.querySelector(".predictive-search-status");
        this.loadingText =
            this.loadingText || this.getAttribute("data-loading-text");

        this.setLiveRegionText(this.loadingText);
        this.setAttribute("loading", true);
    }

    setLiveRegionText(statusText) {
        this.statusElement.setAttribute("aria-hidden", "false");
        this.statusElement.textContent = statusText;

        setTimeout(() => {
            this.statusElement.setAttribute("aria-hidden", "true");
        }, 1000);
    }

    renderSearchResults(resultsMarkup) {
        this.predictiveSearchResults.innerHTML = resultsMarkup;
        this.setAttribute("results", true);

        this.open();
    }

    setLiveRegionResults() {
        this.removeAttribute("loading");
        this.setLiveRegionText(
            this.querySelector(
                "[data-predictive-search-live-region-count-value]"
            ).textContent
        );
    }

    getResultsMaxHeight() {
        const headerSection = this.closest(".shopify-section");
        this.resultsMaxHeight =
            window.innerHeight - headerSection.getBoundingClientRect().bottom;
        return this.resultsMaxHeight;
    }

    open() {
        this.predictiveSearchResults.style.maxHeight =
            this.resultsMaxHeight || `${this.getResultsMaxHeight()}px`;
        this.setAttribute("open", true);
        this.setLiveRegionResults();
        this.input.setAttribute("aria-expanded", true);
        this.isOpen = true;

        document.body.classList.add("overflow_hidden");
    }

    close(clearSearchTerm = false) {
        if (clearSearchTerm) {
            this.input.value = "";
            this.removeAttribute("results");
        }

        const selected = this.querySelector('[aria-selected="true"]');

        if (selected) selected.setAttribute("aria-selected", false);

        this.input.setAttribute("aria-activedescendant", "");
        this.removeAttribute("open");
        this.input.setAttribute("aria-expanded", false);
        this.resultsMaxHeight = false;
        this.predictiveSearchResults.removeAttribute("style");

        this.isOpen = false;

        document.body.classList.remove("overflow_hidden");
    }

    disconnectedCallback() {
        const form = this.querySelector("form.search");

        form.removeEventListener("submit", this.handle.onFormSubmit);

        this.input.removeEventListener("input", this.handle.onInput);
        this.input.removeEventListener("focus", this.handle.onFocus);

        this.removeEventListener("focusout", this.handle.onFocusOut);
        this.removeEventListener("keyup", this.handle.onKeyUp);
        this.removeEventListener("keydown", this.handle.onKeyDown);
    }
}

export { PredictiveSearch };
