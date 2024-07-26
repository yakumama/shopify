/* Mutation observer to listen rating element appeare for squama elements */
(() => {
    const updateSquama = (mutationList, observer) => {
        for (const mutation of mutationList) {
            mutation.addedNodes.forEach((node) => {
                // console.log(node);
                if (
                    node &&
                    node.classList &&
                    (node.classList.contains("spr-badge") ||
                        node.querySelector(".jdgm-prev-badge__stars"))
                ) {
                    const squama = node.closest("squama-item");
                    const rating = parseFloat(node.dataset.rating);

                    if (!squama) return;

                    squama.reinit && squama.reinit(true);
                    squama.dataset.hasRating = rating > 0;
                }
            });
        }
    };

    const options = { attributes: false, childList: true, subtree: true };
    const observer = new MutationObserver(updateSquama);

    observer.observe(document.body, options);
})();

/* Render rating at product listing after ajax requests */
subscribe(PUB_SUB_EVENTS.fetcherUpdate, (event) => {
    if (typeof SPR === "undefined") return;

    SPR.initDomEls();
    SPR.loadBadges();
});
