const _getElementTransitionDurationMs = (element) => {
    const { transitionDuration } = window.getComputedStyle(element);
    const _float = parseFloat(transitionDuration);

    return isNaN(_float)
        ? 0
        : _float * (transitionDuration.indexOf("ms") > 0 ? 1 : 1000);
};

class SliderComponent extends HTMLElement {
    #play;

    constructor() {
        super();
        this.slider = this.querySelector("ul");
        if (!this.slider) return;

        this.pageCount = this.querySelector(".slider-counter--current");
        this.pageTotal = this.querySelector(".slider-counter--total");
        this.prevButton = this.querySelector('button[name="previous"]');
        this.nextButton = this.querySelector('button[name="next"]');
        this.pagination = this.querySelector(".slider-pagination");
        this.lastPaginationUpdate = 0;

        this.resizeObserver = new ResizeObserver((entries) => {
            this.initPages();
            this.stop();
            this.play();
        });
        this.handles = {
            onScroll: this.update.bind(this),
            onPrevNextClick: this.onButtonClick.bind(this),
        };

        // theme editor integration
        if (Shopify?.designMode) {
            this.handles.onBlockSelect = (event) => {
                if (this.slider.contains(event.target)) {
                    this.stop();
                    window.requestAnimationFrame(() => {
                        this.sliderScrollTo({ left: event.target.offsetLeft });
                    });
                }
            };
            this.handles.onBlockDeselect = (event) => {
                if (this.slider.contains(event.target)) {
                    this.stop();
                    this.play();
                }
            };
        }
    }

    collectSlides() {
        const slides = this.querySelectorAll(this.dataset?.sliderItem || "li");

        this.sliderItems = Array.from(slides).filter(
            (item) => item.offsetParent
        );
    }

    connectedCallback() {
        if (!this.slider) return;

        this.collectSlides();

        this.resizeObserver.observe(this.slider);
        this.slider.addEventListener("scroll", this.handles.onScroll);

        this.prevButton?.addEventListener?.(
            "click",
            this.handles.onPrevNextClick
        );
        this.nextButton?.addEventListener?.(
            "click",
            this.handles.onPrevNextClick
        );

        if (Shopify?.designMode) {
            document.addEventListener(
                "shopify:block:select",
                this.handles.onBlockSelect
            );
            document.addEventListener(
                "shopify:block:deselect",
                this.handles.onBlockDeselect
            );
        }
    }

    initPages() {
        this.collectSlides();
        if (this.sliderItems.length < 1) {
            return;
        }

        this.slidesPerPage = Math.round(
            this.slider.clientWidth / this.sliderItems[0].clientWidth
        );
        this.totalPages =
            this.slidesPerPage > this.sliderItems.length
                ? 1
                : this.sliderItems.length - this.slidesPerPage + 1;
        this.update();
    }

    update() {
        const { scrollLeft } = this.slider;
        const { clientWidth } = this.sliderItems[0];
        this.currentPage = Math.abs(Math.round(scrollLeft / clientWidth)) + 1;

        if (this.currentPage === 1) {
            this.prevButton && this.prevButton.setAttribute("disabled", true);
        } else {
            this.prevButton && this.prevButton.removeAttribute("disabled");
        }

        if (this.currentPage === this.totalPages) {
            this.nextButton && this.nextButton.setAttribute("disabled", true);
        } else {
            this.nextButton && this.nextButton.removeAttribute("disabled");
        }

        this.pagination !== null
            ? this.updatePagination()
            : this.activatePage(this.currentPage);

        this.unsetSlideActive();
        this.setSlideActive();

        if (!this.pageCount || !this.pageTotal) return;
        this.pageCount.textContent = this.currentPage;
        this.pageTotal.textContent = this.totalPages;
    }

    onButtonClick(event) {
        const button = event.currentTarget;
        const width = this.sliderItems[0]?.clientWidth;

        let direction = document.dir === "rtl" ? -1 : 1;

        if (button.name === "next") {
            direction = direction * 1;
        } else {
            direction = direction * -1;
        }

        event.preventDefault();
        this.sliderScrollTo({
            left: this.slider.scrollLeft + direction * width,
        });
        this.stop();
        this.play();
    }

    updatePagination() {
        const slider = this.slider;
        const pages = this.pagination.children;

        // implement pagination update with throttle
        if (Date.now() - this.lastPaginationUpdate > 100) {
            let index = 0;

            for (let page of pages) {
                if (index >= this.totalPages) page.setAttribute("hidden", true);
                else page.removeAttribute("hidden");

                index++;
            }

            this.activatePage(this.currentPage);
            this.lastPaginationUpdate = Date.now();
        }
    }

    activatePage(pageNumber) {
        const name = "page-active";
        const pages = this.pagination && this.pagination.children;
        const direction = document.dir === "rtl" ? -1 : 1;

        if (!pages) return;

        var page, pageLeft, pageTop;

        // remove active class from all pages
        for (page of pages) {
            page.classList.remove(name);
        }

        page = pages[pageNumber - 1];
        if (!page) return;

        // add active class to specific page
        page.classList.add(name);

        // check is page is fully visible
        pageLeft = page.offsetLeft - direction * this.pagination.scrollLeft;
        if (
            pageLeft > this.pagination.clientWidth - page.clientWidth ||
            pageLeft < 0
        ) {
            this.pagination.scrollTo({
                left: page.offsetLeft,
            });
        }

        pageTop = page.offsetTop - this.pagination.scrollTop;
        if (
            pageTop > this.pagination.clientHeight - page.clientHeight ||
            pageTop < 0
        ) {
            this.pagination.scrollTo({
                top: page.offsetTop,
            });
        }
    }

    activateSlide(slideIndex) {
        const slide = this.sliderItems[slideIndex];

        if (!slide) return;

        this.slider.scrollTo({
            left: slide.offsetLeft,
        });

        (async () =>
            (
                await import(
                    window?._importmap?.imports?.["helper"] || "helper"
                )
            ).pauseAllMedia())();
    }

    play() {
        const wait = parseFloat(this.dataset.autoplay);

        if (!wait || isNaN(wait)) {
            return;
        }

        if (this.sliderItems.length < 1) {
            return;
        }

        this.#play = setInterval(() => {
            const direction = document.dir === "rtl" ? -1 : 1;
            const scrollLeft =
                this.slider.scrollLeft +
                direction * this.sliderItems[0].clientWidth;
            const isLastPage = this.currentPage === this.totalPages;

            if (this.dataset.loop == "false" && isLastPage) {
                this.stop();
            } else {
                this.sliderScrollTo({
                    left: isLastPage ? 0 : scrollLeft,
                });
            }
        }, wait * 1000);
    }

    stop() {
        clearInterval(this.#play);
    }

    sliderScrollTo(options) {
        const delay = _getElementTransitionDurationMs(this.sliderItems[0]);

        this.unsetSlideActive();
        setTimeout(() => {
            this.slider.scrollTo(options);
        }, delay);
    }

    setSlideActive() {
        const slides = Array.from(this.slider.children).filter(
            (s) => s.nodeName === "LI"
        );
        let slide;

        if (document.dir === "rtl") {
            slide = slides.find(
                (s) =>
                    this.slider.scrollLeft + this.slider.clientWidth >=
                    s.offsetLeft + s.clientWidth
            );
        } else {
            slide = slides.find((s) => this.slider.scrollLeft <= s.offsetLeft);
        }

        if (slide) {
            slide.classList.add("slide-active");
        }
    }

    unsetSlideActive() {
        Array.from(this.slider.children)
            .filter((slide) => slide.nodeName === "LI")
            .forEach((slide) => slide.classList.remove("slide-active"));
    }

    disconnectedCallback() {
        if (!this.slider) return;
        this.resizeObserver.unobserve(this.slider);
        this.slider.removeEventListener("scroll", this.handles.onScroll);
        this.prevButton?.removeEventListener?.(
            "click",
            this.handles.onPrevNextClick
        );
        this.nextButton?.removeEventListener?.(
            "click",
            this.handles.onPrevNextClick
        );

        if (Shopify?.designMode) {
            document.removeEventListener(
                "shopify:block:select",
                this.handles.onBlockSelect
            );
            document.removeEventListener(
                "shopify:block:deselect",
                this.handles.onBlockDeselect
            );
        }
    }
}

export { SliderComponent };
