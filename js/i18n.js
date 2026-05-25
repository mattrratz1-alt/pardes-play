let uiLocale = localStorage.getItem("uiLocale") || (navigator.language.startsWith("he") ? "he" : "en");
let textLocale = localStorage.getItem("textLocale") || uiLocale;
const uiStrings = { en: {}, he: {} };

export async function initI18n() {
  const [en, he] = await Promise.all([
    fetch("i18n/ui.en.json").then((r) => r.json()),
    fetch("i18n/ui.he.json").then((r) => r.json()),
  ]);
  uiStrings.en = en;
  uiStrings.he = he;
  applyDocumentLocale();
  bindLangSelectors();
}

export function t(key, vars = {}) {
  let str = uiStrings[uiLocale]?.[key] ?? uiStrings.en[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replaceAll(`{${k}}`, String(v));
  });
  return str;
}

export function getUiLocale() {
  return uiLocale;
}

export function getTextLocale() {
  return textLocale;
}

export function setUiLocale(code) {
  uiLocale = code;
  localStorage.setItem("uiLocale", code);
  syncSelectors();
  applyDocumentLocale();
  refreshI18nDom();
  dispatchChange();
}

export function setTextLocale(code) {
  textLocale = code;
  localStorage.setItem("textLocale", code);
  syncSelectors();
  syncQuickPills();
  dispatchChange();
}

export function pickLocalized(bilingual, field) {
  const bag = field ? bilingual?.[field] : bilingual;
  if (!bag || typeof bag !== "object") return "";
  if (textLocale === "both") return null;
  return bag[textLocale] ?? bag.en ?? bag.he ?? "";
}

export function renderBilingualHtml(bilingual) {
  if (!bilingual) return "";
  if (textLocale === "both") {
    return `<div class="block-he" lang="he" dir="rtl">${bilingual.he || ""}</div>
            <div class="block-en" lang="en" dir="ltr">${bilingual.en || ""}</div>`;
  }
  const text = bilingual[textLocale] ?? bilingual.en ?? bilingual.he;
  const isHe = textLocale === "he";
  return `<div lang="${isHe ? "he" : "en"}" dir="${isHe ? "rtl" : "ltr"}">${text}</div>`;
}

function applyDocumentLocale() {
  document.documentElement.lang = uiLocale === "he" ? "he" : "en";
  document.documentElement.dir = uiLocale === "he" ? "rtl" : "ltr";
}

function dispatchChange() {
  document.dispatchEvent(
    new CustomEvent("localechange", { detail: { uiLocale, textLocale } })
  );
}

export function refreshI18nDom(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}

function bindLangSelectors() {
  const uiSel = document.getElementById("ui-lang");
  const textSel = document.getElementById("text-lang");
  if (uiSel) {
    uiSel.value = uiLocale;
    uiSel.addEventListener("change", (e) => setUiLocale(e.target.value));
  }
  if (textSel) {
    textSel.value = textLocale;
    textSel.addEventListener("change", (e) => setTextLocale(e.target.value));
  }
  document.querySelectorAll("[data-quick-text]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setTextLocale(btn.dataset.quickText);
    });
  });
  syncQuickPills();
}

function syncSelectors() {
  const uiSel = document.getElementById("ui-lang");
  const textSel = document.getElementById("text-lang");
  if (uiSel) uiSel.value = uiLocale;
  if (textSel) textSel.value = textLocale;
}

function syncQuickPills() {
  document.querySelectorAll("[data-quick-text]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.quickText === textLocale);
  });
}

export function onLocaleChange(fn) {
  document.addEventListener("localechange", fn);
}
