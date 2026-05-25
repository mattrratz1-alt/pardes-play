import { initI18n, t, refreshI18nDom, onLocaleChange, renderBilingualHtml, getTextLocale } from "./i18n.js";

const streamId = new URLSearchParams(location.search).get("stream") || "gemara";
const LIVES_MAX = 3;
const NO_REPEAT = 6;

const META = {
  tanakh: "tanakh", talmud: "talmud", gemara: "gemara",
  shulchan_aruch: "shulchan_aruch", kabbalah: "kabbalah",
  chassidus: "chassidus", chabad: "chabad",
};

let pool = [], recent = [], current = null;
let display = null; // shuffled choices + answerIndex for this screen
let score = 0, streak = 0, answered = 0, lives = LIVES_MAX;
let selected = -1, done = false;

const $ = (id) => document.getElementById(id);

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Randomize option order; correct index moves with its text */
function shuffleChoices(q) {
  const n = q.choices.en.length;
  const order = shuffleArray(Array.from({ length: n }, (_, i) => i));
  return {
    en: order.map((i) => q.choices.en[i]),
    he: order.map((i) => q.choices.he[i]),
    answerIndex: order.indexOf(q.answerIndex),
  };
}

function pick() {
  if (!pool.length) return null;
  const avoid = new Set(recent);
  let opts = pool.filter((q) => !avoid.has(q.id));
  if (!opts.length) opts = pool;
  const q = opts[Math.floor(Math.random() * opts.length)];
  recent.push(q.id);
  if (recent.length > NO_REPEAT) recent.shift();
  return q;
}

function livesHtml() {
  return "❤️".repeat(lives) + "🖤".repeat(LIVES_MAX - lives);
}

function header() {
  const k = META[streamId] || "gemara";
  $("stream-title").textContent = t(`streams.${k}.title`);
  $("stream-desc").textContent = t(`streams.${k}.desc`);
}

function choiceLabel(i) {
  const loc = getTextLocale();
  if (loc === "he") return display.he[i];
  if (loc === "both") return `${display.he[i]} — ${display.en[i]}`;
  return display.en[i];
}

function showQuestion() {
  current = pick();
  if (!current) {
    $("prompt-text").textContent = "No questions in this stream.";
    return;
  }
  display = shuffleChoices(current);
  done = false;
  selected = -1;
  $("source-ref").textContent = current.source || "";
  $("prompt-text").innerHTML = renderBilingualHtml(current.prompt);
  $("choices").innerHTML = display.en.map((_, i) =>
    `<button type="button" class="choice-btn" data-i="${i}">${choiceLabel(i)}</button>`
  ).join("");
  $("choices").querySelectorAll(".choice-btn").forEach((b) => {
    b.onclick = () => {
      if (done) return;
      selected = +b.dataset.i;
      $("choices").querySelectorAll(".choice-btn").forEach((x, j) =>
        x.classList.toggle("selected", j === selected));
      $("btn-submit").disabled = false;
    };
  });
  $("feedback").hidden = true;
  $("explain-box").hidden = true;
  $("btn-submit").disabled = true;
  $("btn-submit").hidden = false;
  $("btn-next").hidden = true;
}

function endSession(msg) {
  $("game-over").hidden = false;
  $("final-score").textContent = msg || t("game.finalScore", { score, answered });
}

function submit() {
  if (selected < 0 || done || !current || !display) return;
  done = true;
  const ok = selected === display.answerIndex;
  $("choices").querySelectorAll(".choice-btn").forEach((b, j) => {
    b.disabled = true;
    if (j === display.answerIndex) b.classList.add("correct");
    else if (j === selected) b.classList.add("wrong");
  });
  answered++;
  $("answered-count").textContent = answered;
  if (ok) {
    streak++;
    const combo = Math.min(streak, 12);
    score += 10 + combo * 4;
    $("feedback").textContent = streak > 2 ? `${t("game.correct")} ${t("game.combo", { combo })}` : t("game.correct");
    $("feedback").className = "feedback ok";
  } else {
    streak = 0;
    lives--;
    $("lives").textContent = livesHtml();
    $("feedback").textContent = t("game.incorrect");
    $("feedback").className = "feedback no";
  }
  $("score").textContent = score;
  $("streak").textContent = streak;
  $("feedback").hidden = false;
  $("explain-text").innerHTML = renderBilingualHtml(current.explain);
  $("explain-box").hidden = false;
  if (current.sefariaRef) {
    $("sefaria-link").href = `https://www.sefaria.org/${encodeURIComponent(current.sefariaRef)}`;
    $("sefaria-link").hidden = false;
  } else $("sefaria-link").hidden = true;
  $("btn-submit").hidden = true;
  if (lives > 0) $("btn-next").hidden = false;
  else setTimeout(() => endSession(t("game.livesOut")), 700);
}

function refreshChoiceLabels() {
  if (!display || done) return;
  $("choices").querySelectorAll(".choice-btn").forEach((b, i) => {
    b.textContent = choiceLabel(i);
  });
}

$("btn-submit").onclick = submit;
$("btn-next").onclick = () => showQuestion();
$("btn-replay").onclick = () => location.reload();
$("btn-end").onclick = () => endSession();

(async () => {
  await initI18n();
  const all = await fetch("js/data/questions.json").then((r) => r.json());
  pool = all.filter((q) => q.stream === streamId);
  $("game-over").hidden = true;
  if (!pool.length) return;
  lives = LIVES_MAX;
  $("lives").textContent = livesHtml();
  header();
  refreshI18nDom();
  showQuestion();
  onLocaleChange(() => {
    refreshI18nDom();
    header();
    if (!done) {
      $("prompt-text").innerHTML = renderBilingualHtml(current.prompt);
      refreshChoiceLabels();
    } else if (current) {
      $("prompt-text").innerHTML = renderBilingualHtml(current.prompt);
      $("explain-text").innerHTML = renderBilingualHtml(current.explain);
      refreshChoiceLabels();
    }
  });
})();
