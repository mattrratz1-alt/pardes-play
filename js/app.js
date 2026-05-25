import { initI18n, t, refreshI18nDom, onLocaleChange } from "./i18n.js";

const STREAMS = [
  { id: "tanakh", key: "tanakh" },
  { id: "talmud", key: "talmud" },
  { id: "gemara", key: "gemara" },
  { id: "shulchan_aruch", key: "shulchan_aruch" },
  { id: "kabbalah", key: "kabbalah" },
  { id: "chassidus", key: "chassidus" },
  { id: "chabad", key: "chabad" },
];

let counts = {};

async function loadCounts() {
  const all = await fetch("js/data/questions.json").then((r) => r.json());
  counts = {};
  for (const q of all) counts[q.stream] = (counts[q.stream] || 0) + 1;
}

function render() {
  document.getElementById("stream-grid").innerHTML = STREAMS.map((s) => {
    const n = counts[s.id] || 0;
    return `<a class="stream-card" href="game.html?stream=${s.id}">
      <h3>${t(`streams.${s.key}.title`)}</h3>
      <p>${t(`streams.${s.key}.desc`)}</p>
      <p class="meta">${t("streams.meta.questions", { n })}</p>
    </a>`;
  }).join("");
}

(async () => {
  await initI18n();
  await loadCounts();
  render();
  refreshI18nDom();
  onLocaleChange(() => { refreshI18nDom(); render(); });
})();
