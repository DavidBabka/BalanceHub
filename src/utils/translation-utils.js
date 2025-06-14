import { translations } from "./translations.js";

export function translatePage(lang) {
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach(el => {
        const key = el.getAttribute("data-i18n");
        el.textContent = translations[lang][key] || key;
    });
}

let currentLang = "en";
translatePage(currentLang);

export function getCurrentLang() {
    return currentLang;
}

const buttons = document.querySelectorAll(".lang-btn");

buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        const selectedLang = btn.getAttribute("data-lang");
        currentLang = selectedLang;
        translatePage(selectedLang);

        // Update active state
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});


