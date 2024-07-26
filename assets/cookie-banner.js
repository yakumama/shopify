function handleAccept(cookieBanner) {
    // Set a cookie to remember user consent for a certain period
    var expirationDate = new Date(),
        lifetime = cookieBanner.dataset.lifetime;

    expirationDate.setDate(expirationDate.getDate() + lifetime);
    document.cookie =
        "private_cookie_consent=true; expires=" +
        expirationDate.toUTCString() +
        "; path=/";

    // Hide the banner
    window.Shopify.customerPrivacy.setTrackingConsent(true, () => {
        cookieBanner.style.display = "none";
    });
}

function handleDecline(cookieBanner) {
    // Hide the banner
    window.Shopify.customerPrivacy.setTrackingConsent(false, () => {
        cookieBanner.style.display = "none";
    });
}

function getCookie(name) {
    let value = "; " + document.cookie,
        parts = value.split("; " + name + "=");

    if (parts.length === 2) return parts.pop().split(";").shift();
}

function showCookieBanner() {
    let consentCookie = getCookie("private_cookie_consent");
    const cookieBanner = document.getElementById("cookie-consent-banner");

    //if the consent cookie does not exist, display the Cookie Consent Banner
    if (cookieBanner && !consentCookie) {
        // show cookie banner
        cookieBanner.style.display = "block";

        const actions = cookieBanner.querySelectorAll("button");

        // handle banner actions
        actions.forEach((btn) => {
            if (btn.dataset.action === "accept")
                btn.addEventListener("click", (e) =>
                    handleAccept(cookieBanner)
                );
            else
                btn.addEventListener("click", (e) =>
                    handleDecline(cookieBanner)
                );
        });
    }
}

function initCookieBanner() {
    const userCanBeTracked = window.Shopify.customerPrivacy.userCanBeTracked();
    const userTrackingConsent =
        window.Shopify.customerPrivacy.getTrackingConsent();

    if (!userCanBeTracked && userTrackingConsent === "no_interaction") {
        fetch("/?section_id=cookie-banner")
            .then((result) => result.text())
            .then((html) => {
                document.body.insertAdjacentHTML(
                    "beforeend",
                    new DOMParser()
                        .parseFromString(html, "text/html")
                        .querySelector(".shopify-section").innerHTML
                );
            })
            .then(showCookieBanner);
    }
}

window.Shopify.loadFeatures(
    [
        {
            name: "consent-tracking-api",
            version: "0.1",
        },
    ],
    (error) => {
        if (error) throw error;

        /*
         * use Shopify loadFeatures to Collect customers data
         * must be selected Shopify Customer Privacy option "Collected after consent" - Online Store -> Preferences
         */
        initCookieBanner();
    }
);
