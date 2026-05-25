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
  for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, String(v));
  return str;
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
  fire();
}

export function setTextLocale(code) {
  textLocale = code;
  localStorage.setItem("textLocale", code);
  syncSelectors();
  syncPills();
  fire();
}

export function renderBilingualHtml(obj) {
  if (!obj) return "";
  if (textLocale === "both") {
    return `<div class="block-he" lang="he" dir="rtl">${obj.he || ""}</div>
            <div class="block-en" lang="en">${obj.en || ""}</div>`;
  }
  const text = obj[textLocale] ?? obj.en ?? obj.he ?? "";
  const he = textLocale === "he";
  return `<div lang="${he ? "he" : "en"}" dir="${he ? "rtl" : "ltr"}">${text}</div>`;
}

function applyDocumentLocale() {
  document.documentElement.lang = uiLocale === "he" ? "he" : "en";
  document.documentElement.dir = uiLocale === "he" ? "rtl" : "ltr";
}

function fire() {
  document.dispatchEvent(new CustomEvent("localechange"));
}

export function refreshI18nDom() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
}

export function onLocaleChange(fn) {
  document.addEventListener("localechange", fn);
}

function bindLangSelectors() {
  const uiSel = document.getElementById("ui-lang");
  const textSel = document.getElementById("text-lang");
  if (uiSel) {
    uiSel.value = uiLocale;
    uiSel.onchange = (e) => setUiLocale(e.target.value);
  }
  if (textSel) {
    textSel.value = textLocale;
    textSel.onchange = (e) => setTextLocale(e.target.value);
  }
  document.querySelectorAll("[data-quick-text]").forEach((btn) => {
    btn.onclick = () => setTextLocale(btn.dataset.quickText);
  });
  syncPills();
}

function syncSelectors() {
  const u = document.getElementById("ui-lang");
  const t = document.getElementById("text-lang");
  if (u) u.value = uiLocale;
  if (t) t.value = textLocale;
}

function syncPills() {
  document.querySelectorAll("[data-quick-text]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.quickText === textLocale);
  });
}
