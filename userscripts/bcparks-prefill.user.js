// ==UserScript==
// @name         BC Parks Joffre Lakes Prefill
// @namespace    kelly.bcparks
// @version      1.4
// @description  Open the Joffre Lakes booking flow, then select Joffre Lakes and July 24, 2026.
// @match        https://reserve.bcparks.ca/dayuse/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    const CONFIG = {
        targetPass: "Joffre Lakes - Trail",
        targetDate: "2026-07-25"
    };

    const WAIT_TIMEOUT = 20000;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function normalize(text) {
        return String(text || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    function visible(element) {
        if (!element) {
            return false;
        }

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 0 &&
            rect.height > 0
        );
    }

    async function waitFor(callback, timeout = WAIT_TIMEOUT) {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const result = callback();

            if (result) {
                return result;
            }

            await sleep(100);
        }

        throw new Error("Timed out waiting for page element.");
    }

    function dispatchEvents(element) {
        element.dispatchEvent(
            new Event("input", { bubbles: true })
        );

        element.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        element.dispatchEvent(
            new Event("blur", { bubbles: true })
        );
    }

    function showStatus(message, isError = false) {
        let banner = document.querySelector(
            "#bc-parks-prefill-status"
        );

        if (!banner) {
            banner = document.createElement("div");
            banner.id = "bc-parks-prefill-status";

            Object.assign(banner.style, {
                position: "fixed",
                top: "12px",
                right: "12px",
                zIndex: "999999",
                maxWidth: "420px",
                padding: "12px 16px",
                borderRadius: "8px",
                fontFamily: "Arial, sans-serif",
                fontSize: "14px",
                fontWeight: "600",
                lineHeight: "1.4",
                boxShadow: "0 3px 12px rgba(0, 0, 0, 0.25)"
            });

            document.body.appendChild(banner);
        }

        banner.textContent = message;
        banner.style.background = isError
            ? "#ffd6d6"
            : "#fff3a6";
        banner.style.color = "#222";
    }

    async function openJoffreBooking() {
        const button = await waitFor(() => {
            const element = document.querySelector(
                'button[aria-label="Book a pass for Joffre Lakes Provincial Park"]'
            );

            return element && visible(element)
                ? element
                : null;
        });

        button.click();

        console.log(
            "[BC Parks] Clicked Joffre Lakes Book a Pass."
        );
    }

    function getAvailablePasses(select) {
        return [...select.options]
            .map(option => option.textContent.trim())
            .filter(text =>
                text &&
                !normalize(text).includes("select a pass type")
            );
    }

    function detectBookingFlow(passes) {
        const normalizedPasses = passes.map(normalize);

        if (
            normalizedPasses.some(pass =>
                pass.includes("joffre lakes")
            )
        ) {
            return "joffre";
        }

        if (
            normalizedPasses.some(pass =>
                pass.includes("rubble creek")
            )
        ) {
            return "garibaldi";
        }

        return passes.length > 0
            ? "other"
            : "unknown";
    }

    async function getPassTypeSelect() {
        return await waitFor(() => {
            const select = document.querySelector("#passType");

            if (!select || select.options.length < 2) {
                return null;
            }

            return select;
        });
    }

    async function selectPassType() {
        showStatus("Waiting for pass options…");

        const select = await getPassTypeSelect();
        const availablePasses = getAvailablePasses(select);
        const flow = detectBookingFlow(availablePasses);

        console.log("[BC Parks] Booking flow:", flow);
        console.log(
            "[BC Parks] Available passes:",
            availablePasses
        );

        const option = [...select.options].find(item =>
            normalize(item.textContent).includes(
                normalize(CONFIG.targetPass)
            )
        );

        if (!option) {
            throw new Error(
                `Could not find "${CONFIG.targetPass}". Available passes: ${availablePasses.join(", ")}`
            );
        }

        if (select.value !== option.value) {
            select.value = option.value;
            dispatchEvents(select);
        }

        console.log(
            `[BC Parks] Selected ${CONFIG.targetPass}.`
        );
    }

    async function selectDate() {
        showStatus("Waiting for date field…");

        const input = await waitFor(() => {
            const selectors = [
                'input[type="date"]',
                'input[formcontrolname="date"]',
                'input[formcontrolname*="date" i]',
                'input[id*="date" i]',
                'input[data-testid*="date" i]'
            ];

            for (const selector of selectors) {
                const element =
                    document.querySelector(selector);

                if (element && visible(element)) {
                    return element;
                }
            }

            return null;
        });

        const nativeSetter =
            Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                "value"
            )?.set;

        if (nativeSetter) {
            nativeSetter.call(input, CONFIG.targetDate);
        } else {
            input.value = CONFIG.targetDate;
        }

        dispatchEvents(input);

        console.log(
            `[BC Parks] Selected date ${CONFIG.targetDate}.`
        );
    }

    async function run() {
        try {
            if (!document.querySelector("#passType")) {
                showStatus("Opening Joffre Lakes booking form…");
                await openJoffreBooking();
            }

            await selectPassType();
            await selectDate();

            showStatus(
                `Ready: ${CONFIG.targetPass}, ${CONFIG.targetDate}. Review and continue manually.`
            );

            console.log(
                `[BC Parks] Prefilled ${CONFIG.targetPass} for ${CONFIG.targetDate}.`
            );
        } catch (error) {
            console.error("[BC Parks]", error);

            showStatus(
                `BC Parks prefill: ${error.message}`,
                true
            );
        }
    }

    run();
})();