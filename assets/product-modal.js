const { ModalDialog } = await import(
    window?._importmap?.imports?.["modal-dialog"] || "modal-dialog"
);

class ProductModal extends ModalDialog {
    constructor() {
        super();
        this.bodyClass = "product-modal__opened";
        this.deferredName = "productModal";
        this.handle = Object.assign(this.handle || {}, {
            popstate: this.onPopstate.bind(this),
        });
    }

    connectedCallback() {
        window.addEventListener("popstate", this.handle.popstate);

        // afterLoadCallback assigned to element in `global.js`
        // when script load triggered by popstate event
        this.afterLoadCallback?.();
    }

    onPopstate(event) {
        if (window.location.hash === `#${this.id}`) this.show(null, false);
        else this.hide(false);
    }

    hide(pushToHistory = true) {
        super.hide();
        document.body.classList.remove(this.bodyClass);
        setTimeout(() => {
            document.body.style.width = "";
        }, 200);
        if (pushToHistory)
            history.pushState(
                {
                    deferredName: this.deferredName,
                    id: this.id,
                    action: "hide",
                },
                "",
                window.location.href.split("#")[0]
            );
    }

    show(opener, pushToHistory = true) {
        document.body.style.width = `${window.visualViewport.width}px`;
        document.body.classList.add(this.bodyClass);
        super.show(opener);
        if (this.hasChildNodes()) {
            this.showMedia();
        } else {
            this.showLoading();
            (async () => {
                let html = await fetchSectionHTML(
                    "product-modal__inner",
                    false,
                    window.Shopify.routes.root +
                        "products/" +
                        this.dataset.handle
                );

                let section = this.closest(".shopify-section");
                let thumbs = section.querySelector(".slider-thumbs--wrapper");

                this.insertAdjacentHTML("beforeend", html);
                this.querySelectorAll("[data-thumbnail-for]").forEach((el) => {
                    el.innerHTML =
                        thumbs &&
                        thumbs.querySelector(
                            `[href="#media-${el.dataset.thumbnailFor}"]`
                        )?.innerHTML;
                });
                this.showMedia();
            })();
        }

        if (pushToHistory)
            history.pushState(
                {
                    deferredName: this.deferredName,
                    id: this.id,
                },
                "",
                window.location.href.split("#")[0] + "#" + this.id
            );
    }

    showMedia(id) {
        const mediaId =
            id ||
            (this.openedBy || this.querySelector("[data-media-id]")).dataset
                ?.mediaId;
        const media = this.querySelector(`[data-media-id="${mediaId}"]`);
        const img =
            media.tagName === "IMG" ? media : media?.querySelector?.("img");

        this.querySelectorAll(`[data-media-id]`).forEach((el) => {
            el.classList.remove("active");
        });

        if (img && !img.complete) this.showLoading();

        media.classList.add("active");
        media.scrollIntoView();
        import(window?._importmap?.imports?.["helper"] || "helper").then(
            (helper) => {
                helper.pauseAllMedia();
            }
        );

        this.querySelectorAll(`[data-thumbnail-for]`).forEach((el) => {
            el.classList.remove("active");
            if (el.dataset.thumbnailFor == mediaId) {
                el.classList.add("active");
                el?.scrollIntoViewIfNeeded?.();
            }
        });
    }

    initLoader() {
        if (!this.loader) {
            this.insertAdjacentHTML(
                "afterbegin",
                document.getElementById("template__loading-overlay")?.innerHTML
            );

            this.loader = this.querySelector(".loading-overlay");
        }
    }

    showLoading() {
        if (!this.loader) {
            this.initLoader();
        }

        this.loader.classList.remove("hidden");
    }

    hideLoading() {
        if (!this.loader) {
            this.initLoader();
        }

        this.loader.classList.add("hidden");
    }

    disconnectedCallback() {
        window.addEventListener("popstate", this.handle.popstate);
    }
}

export { ProductModal };
