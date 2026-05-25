import {
  initI18n,
  t,
  refreshI18nDom,
  onLocaleChange,
  renderBilingualHtml,
  getTextLocale,
} from "./i18n.js";

const params = new URLSearchParams(location.search);
const streamId = params.get("stream") || "gemara";

const STREAM_META = {
  tanakh: { i18n: "tanakh", sefariaPrefix: "" },
  talmud: { i18n: "talmud" },
  gemara: { i18n: "gemara" },
  shulchan_aruch: { i18n: "shulchan_aruch" },
  kabbalah: { i18n: "kabbalah" },
  chassidus: { i18n: "chassidus" },
  chabad: { i18n: "chabad" },
};

let allQuestions = [];
let deck = [];
let index = 0;
let score = 0;
let streak = 0;
let selected = -1;
let answered = false;

const el = {
  title: document.getElementById("stream-title"),
  desc: document.getElementById("stream-desc"),
  score: document.getElementById("score"),
  streak: document.getElementById("streak"),
  qNum: document.getElementById("q-num"),
  qTotal: document.getElementById("q-total"),
  prompt: document.getElementById("prompt-text"),
  choices: document.getElementById("choices"),
  feedback: document.getElementById("feedback"),
  submit: document.getElementById("btn-submit"),
  next: document.getElementById("btn-next"),
  explainBox: document.getElementById("explain-box"),
  explainText: document.getElementById("explain-text"),
  sefaria: document.getElementById("sefaria-link"),
  source: document.getElementById("source-ref"),
  modal: document.getElementById("game-over"),
  finalScore: document.getElementById("final-score"),
  replay: document.getElementById("btn-replay"),
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setHeader() {
  const meta = STREAM_META[streamId] || STREAM_META.gemara;
  el.title.textContent = t(`streams.${meta.i18n}.title`);
  el.desc.textContent = t(`streams.${meta.i18n}.desc`);
}

function current() {
  return deck[index];
}

function renderQuestion() {
  const q = current();
  if (!q) return endGame();

  answered = false;
  selected = -1;
  el.qNum.textContent = index + 1;
  el.qTotal.textContent = deck.length;
  el.source.textContent = q.source || "";
  el.prompt.innerHTML = renderBilingualHtml(q.prompt);
  el.choices.innerHTML = (q.choices.en || []).map((_, i) => {
    const label =
      getTextLocale() === "he"
        ? q.choices.he[i]
        : getTextLocale() === "both"
          ? `${q.choices.he[i]} — ${q.choices.en[i]}`
          : q.choices.en[i];
    return `<button type="button" class="choice-btn" data-i="${i}">${label}</button>`;
  }).join("");

  el.choices.querySelectorAll(".choice-btn").forEach((btn) => {
    btn.addEventListener("click", () => selectChoice(Number(btn.dataset.i)));
  });

  el.feedback.hidden = true;
  el.explainBox.hidden = true;
  el.submit.disabled = true;
  el.submit.hidden = false;
  el.next.hidden = true;
}

function selectChoice(i) {
  if (answered) return;
  selected = i;
  el.choices.querySelectorAll(".choice-btn").forEach((b, j) => {
    b.classList.toggle("selected", j === i);
  });
  el.submit.disabled = false;
}

function submitAnswer() {
  if (selected < 0 || answered) return;
  const q = current();
  answered = true;
  const correct = selected === q.answerIndex;

  el.choices.querySelectorAll(".choice-btn").forEach((b, j) => {
    if (j === q.answerIndex) b.classList.add("correct");
    else if (j === selected && !correct) b.classList.add("wrong");
    b.disabled = true;
  });

  if (correct) {
    score += 10 + Math.min(streak, 5) * 2;
    streak += 1;
    el.feedback.textContent = t("game.correct");
    el.feedback.className = "feedback ok";
  } else {
    streak = 0;
    el.feedback.textContent = t("game.incorrect");
    el.feedback.className = "feedback no";
  }
  el.feedback.hidden = false;
  el.score.textContent = score;
  el.streak.textContent = streak;

  el.explainText.innerHTML = renderBilingualHtml(q.explain);
  el.explainBox.hidden = false;

  if (q.sefariaRef) {
    el.sefaria.href = `https://www.sefaria.org/${encodeURIComponent(q.sefariaRef)}`;
    el.sefaria.hidden = false;
  } else {
    el.sefaria.hidden = true;
  }

  el.submit.hidden = true;
  el.next.hidden = false;
}

function nextQuestion() {
  index += 1;
  if (index >= deck.length) endGame();
  else renderQuestion();
}

function endGame() {
  el.modal.hidden = false;
  el.finalScore.textContent = t("game.finalScore", {
    score,
    total: deck.length * 10,
  });
}

el.submit.addEventListener("click", submitAnswer);
el.next.addEventListener("click", nextQuestion);
el.replay.addEventListener("click", () => location.reload());

(async () => {
  await initI18n();
  const data = await fetch("js/data/questions.json").then((r) => r.json());
  allQuestions = data.filter((q) => q.stream === streamId);
  deck = shuffle(allQuestions).slice(0, Math.min(10, allQuestions.length));
  if (!deck.length) {
    el.prompt.textContent = "No questions for this stream yet.";
    return;
  }
  setHeader();
  refreshI18nDom();
  renderQuestion();

  onLocaleChange(() => {
    refreshI18nDom();
    setHeader();
    if (!answered) renderQuestion();
    else {
      const q = current();
      el.prompt.innerHTML = renderBilingualHtml(q.prompt);
      el.explainText.innerHTML = renderBilingualHtml(q.explain);
    }
  });
})();
