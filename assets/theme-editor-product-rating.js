/* global SPR */
document.body.addEventListener("shopify:section:load", (event) => {
    // Initialize review badges once section was reloaded in theme editor
    if (!SPR) return;

    SPR.initDomEls();
    SPR.loadBadges();
});
