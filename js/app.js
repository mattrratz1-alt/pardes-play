import { initI18n, t, refreshI18nDom, onLocaleChange } from "./i18n.js";

const STREAMS = [
  { id: "tanakh", i18n: "tanakh", color: "#6b8e6b", pardes: "peshat" },
  { id: "talmud", i18n: "talmud", color: "#5c4033", pardes: "drash" },
  { id: "gemara", i18n: "gemara", color: "#3d2914", pardes: "drash" },
  { id: "shulchan_aruch", i18n: "shulchan_aruch", color: "#6b4423", pardes: "drash" },
  { id: "kabbalah", i18n: "kabbalah", color: "#2c3e6b", pardes: "sod" },
  { id: "chassidus", i18n: "chassidus", color: "#4a6741", pardes: "sod" },
  { id: "chabad", i18n: "chabad", color: "#1a4d8c", pardes: "sod" },
];

let questionCounts = {};

async function loadCounts() {
  const data = await fetch("js/data/questions.json").then((r) => r.json());
  questionCounts = data.reduce((acc, q) => {
    acc[q.stream] = (acc[q.stream] || 0) + 1;
    return acc;
  }, {});
}

function renderGrid() {
  const grid = document.getElementById("stream-grid");
  grid.innerHTML = STREAMS.map((s) => {
    const n = questionCounts[s.id] || 0;
    return `
      <a class="stream-card" href="game.html?stream=${s.id}" style="--stream-color:${s.color}">
        <h3>${t(`streams.${s.i18n}.title`)}</h3>
        <p>${t(`streams.${s.i18n}.desc`)}</p>
        <p class="meta">${t("streams.meta.questions", { n })} · ${s.pardes.toUpperCase()}</p>
      </a>`;
  }).join("");
}

(async () => {
  await initI18n();
  await loadCounts();
  renderGrid();
  refreshI18nDom();
  onLocaleChange(() => {
    refreshI18nDom();
    renderGrid();
  });
})();
