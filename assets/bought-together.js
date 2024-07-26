class BoughtTogether extends HTMLElement {
    constructor() {
        super();

        this.handles = {
            onChange: this.updateTotal.bind(this),
            onMainFormChange: (event) => {
                const mainForm = event.currentTarget;
                const variantId = mainForm.querySelector('[name="id"]').value;

                this.querySelector('[name="items[0][id]"]').value = variantId;
            },
            onMainPriceMutation: () => {
                const input = this.querySelector('[name="items[0][id]"]');

                this.updateTotal();
                input.disabled = this.isMainSoldout();
            },
        };

        // Mutation observer of price change for main product
        this.mainPriceMutation = new MutationObserver(() => {
            const input = this.querySelector('input[name="items[0][id]"]');

            this.updateTotal();
            input.disabled = this.isMainSoldout();
        });
    }

    connectedCallback() {
        const mainPrice = this.getMainPrice();
        const mainForm = this.getMainForm();

        // Update element total price
        this.addEventListener("change", this.handles.onChange);

        // Listen variant ID change for main product
        if (mainForm) {
            mainForm.addEventListener("change", this.handles.onMainFormChange);
        }

        this.mainPriceMutation.observe(
            mainPrice.closest('[data-updatable="true"]'),
            { childList: true, subtree: true }
        );

        this.updateTotal();
    }

    collectTotal() {
        var itemsTotal = 0;

        itemsTotal += this.isMainSoldout()
            ? 0 // doesn't add main product price if product is not available
            : parseInt(this.getMainPrice()?.dataset.amount.replace(/\D/g, ""));

        this.querySelectorAll(
            '[type="checkbox"]:checked ~ .item-link .price--final'
        ).forEach((el) => {
            itemsTotal += parseInt(el.dataset.amount.replace(/\D/g, ""));
        });

        return itemsTotal;
    }

    updateTotal() {
        const decimalsSeparator = this.getPriceDecimalSeparator();
        const template = this.querySelector(
            'template[data-id="price"]'
        ).innerHTML;
        const total = this.collectTotal().toString();

        let [int, dec] = this.getSamplePrice().split(decimalsSeparator);

        // such tricky replacement required to prevent issues
        // when total price has numbers similar to ones used in template
        this.querySelector(".summary .price--final").outerHTML = template
            .replaceAll(int, "{integerPart}")
            .replaceAll(dec, "{decimalPart}")
            .replaceAll(
                "{integerPart}",
                total.slice(0, total.length - dec.length)
            )
            .replaceAll("{decimalPart}", total.slice(-dec.length));
    }

    getMainPrice() {
        return document.querySelector(".product-section .price--final");
    }

    getMainForm() {
        return document.querySelector(".product-section product-form");
    }

    isMainSoldout() {
        return !!this.getMainPrice().closest(".price--sold-out");
    }

    getSamplePrice() {
        return this.querySelector('template[data-id="price"]')?.dataset
            .priceSample;
    }

    getPriceDecimalSeparator() {
        if (this.getSamplePrice().indexOf(",") !== -1) return ",";

        return ".";
    }

    disconnectedCallback() {
        const mainForm = this.getMainForm();

        // Update element total price
        this.removeEventListener("change", this.handles.onChange);

        // Listen variant ID change for main product
        if (mainForm) {
            mainForm.removeEventListener(
                "change",
                this.handles.onMainFormChange
            );
        }

        this.mainPriceMutation.disconnect();
    }
}

export { BoughtTogether };
