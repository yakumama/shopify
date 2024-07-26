const { trapFocus } = await import(
    window?._importmap?.imports?.["helper"] || "helper"
);
const { MenuDrawer } = await import(
    window?._importmap?.imports?.["menu-drawer"] || "menu-drawer"
);

const switchers = [
    {
        target: ".localization-language-wrapper",
        source: ".localization-language-wrapper:not(:empty)",
    },
    {
        target: ".localization-currency-wrapper",
        source: ".localization-currency-wrapper:not(:empty)",
    },
];

class HeaderDrawer extends MenuDrawer {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback?.();

        // add currency and language switchers into drawer
        switchers.forEach(({ target, source }) => {
            const targetElement = this.querySelector(target);

            if (targetElement && !targetElement.innerHTML) {
                targetElement.insertAdjacentHTML(
                    "afterbegin",
                    document.querySelector(source)?.innerHTML
                );
            }
        });
    }

    openMenuDrawer(summaryElement) {
        this.header = this.header || this.closest(".shopify-section");
        this.borderOffset =
            this.borderOffset ||
            this.closest(".header-wrapper").classList.contains(
                "header-wrapper--border-bottom"
            )
                ? 1
                : 0;
        document.documentElement.style.setProperty(
            "--header-bottom-position",
            `${parseInt(
                this.header.getBoundingClientRect().bottom - this.borderOffset
            )}px`
        );

        setTimeout(() => {
            this.mainDetailsToggle.classList.add("menu-opening");
            this.mainDetailsToggle.open = true;
            trapFocus(this.mainDetailsToggle, summaryElement);
        });

        summaryElement.setAttribute("aria-expanded", true);
        document.body.classList.add("overflow-hidden-mobile");
    }
}

export { HeaderDrawer };
