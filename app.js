"use strict";

const TASKS_PER_LEVEL = 18;
const BASIS_GOAL = TASKS_PER_LEVEL;
const STORAGE_KEY = "mathe-fit-metall-progress-v2";
const LEGACY_STORAGE_KEY = "mathe-fit-metall-progress-v1";

const DIFFICULTIES = [
  { id: "basis", label: "Basis", note: "Pflicht", factor: 1 },
  { id: "training", label: "Training", note: "sicher werden", factor: 2 },
  { id: "plus", label: "Plus", note: "freiwillig", factor: 3 }
];

const CATEGORIES = [
  {
    id: "grund",
    title: "Grundrechenarten",
    intro: "Rechnen mit Klammern, Brüchen, Dezimalzahlen und Werkstattmaßen.",
    formulas: [
      ["Punkt vor Strich", "Erst Klammern, dann Mal/Geteilt, dann Plus/Minus."],
      ["Bruch", "Zähler durch Nenner teilen, wenn eine Dezimalzahl gefragt ist."],
      ["Runden", "Auf die geforderte Stelle runden, erst am Ende."]
    ]
  },
  {
    id: "einheiten",
    title: "Einheiten umrechnen",
    intro: "Längen, Flächen, Volumen, Masse, Zeit, Leistung und Geschwindigkeit.",
    formulas: [
      ["1 m", "1000 mm = 100 cm = 10 dm"],
      ["1 cm²", "100 mm²; bei Flächen wird der Faktor quadriert."],
      ["1 dm³", "1000 cm³ = 1 l"]
    ]
  },
  {
    id: "prozent",
    title: "Prozent und Zins",
    intro: "Prozentwert, Grundwert, Erhöhung, Rabatt und einfache Zinsen.",
    formulas: [
      ["Prozentwert", "W = G · p / 100"],
      ["Neuer Wert", "G neu = G · (1 ± p / 100)"],
      ["Zins", "Z = K · p · t / (100 · 12) bei Monaten"]
    ]
  },
  {
    id: "umstellen",
    title: "Formeln umstellen",
    intro: "Gesuchte Größe freistellen und danach mit passenden Einheiten einsetzen.",
    formulas: [
      ["v = s / t", "s = v · t und t = s / v"],
      ["A = a · b", "a = A / b und b = A / a"],
      ["m = rho · V", "rho = m / V und V = m / rho"]
    ]
  },
  {
    id: "pythagoras",
    title: "Pythagoras und Winkel",
    intro: "Rechtwinklige Dreiecke, Diagonalen, Steigungen und Winkelfunktionen.",
    formulas: [
      ["Pythagoras", "c² = a² + b²"],
      ["Tangens", "tan(alpha) = Gegenkathete / Ankathete"],
      ["Sinus und Kosinus", "sin(alpha) = Gegenkathete / Hypotenuse; cos(alpha) = Ankathete / Hypotenuse"]
    ]
  },
  {
    id: "flaechen",
    title: "Flächen",
    intro: "Rechteck, Dreieck, Kreis, Kreisring und zusammengesetzte Flächen.",
    formulas: [
      ["Rechteck", "A = a · b"],
      ["Dreieck", "A = g · h / 2"],
      ["Kreisring", "A = pi / 4 · (D² - d²)"]
    ]
  },
  {
    id: "volumen",
    title: "Volumen und Masse",
    intro: "Quader, Zylinder, Pyramide und Masse über Dichte.",
    formulas: [
      ["Quader", "V = l · b · h"],
      ["Zylinder", "V = pi · d² / 4 · h"],
      ["Masse", "m = rho · V"]
    ]
  },
  {
    id: "bewegung",
    title: "Geschwindigkeit und Maschinen",
    intro: "Weg, Zeit, Geschwindigkeit, Drehzahl, Schnittgeschwindigkeit und Vorschub.",
    formulas: [
      ["Geschwindigkeit", "v = s / t"],
      ["Schnittgeschwindigkeit", "v_c = pi · d · n / 1000"],
      ["Vorschub", "v_f = f_z · z · n"]
    ]
  },
  {
    id: "kraefte",
    title: "Kräfte, Hebel, Spannung",
    intro: "Gewichtskraft, Hebelgesetz, Federkraft, Druck und Spannung.",
    formulas: [
      ["Gewichtskraft", "F_G = m · g mit g ≈ 9,81 m/s²"],
      ["Hebelgesetz", "F1 · l1 = F2 · l2"],
      ["Spannung", "sigma = F / A"]
    ]
  }
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((category) => [category.id, category]));
const DIFFICULTY_MAP = Object.fromEntries(DIFFICULTIES.map((difficulty) => [difficulty.id, difficulty]));

const state = {
  categoryId: CATEGORIES[0].id,
  difficultyId: DIFFICULTIES[0].id,
  taskIndex: 0,
  hintIndex: -1,
  progress: loadProgress()
};

const refs = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheRefs();
  bindEvents();
  renderAll();
});

function cacheRefs() {
  [
    "categoryList",
    "categorySelect",
    "difficultyTabs",
    "categoryTitle",
    "categoryIntro",
    "sourceLabel",
    "difficultyPill",
    "taskCounter",
    "taskTitle",
    "taskQuestion",
    "diagramSlot",
    "answerForm",
    "answerInput",
    "answerUnit",
    "feedbackBox",
    "helpPanel",
    "hintButtons",
    "hintOutput",
    "showSolution",
    "prevTask",
    "nextTask",
    "randomTask",
    "formulaList",
    "mobileFormulaList",
    "difficultyNote",
    "basisProgress",
    "basisBar",
    "rubricAdvice",
    "totalSolved",
    "taskCountLabel",
    "practiceView",
    "dashboardView",
    "dashboardTitle",
    "dashboardTotal",
    "dashboardSummary",
    "dashboardList",
    "showProgress",
    "resetProgress"
  ].forEach((id) => {
    refs[id] = document.getElementById(id);
  });
}

function bindEvents() {
  refs.showProgress.addEventListener("click", () => showDashboard(refs.dashboardView.hidden));
  refs.categorySelect.addEventListener("change", () => selectCategory(refs.categorySelect.value));
  refs.answerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    checkAnswer();
  });

  refs.prevTask.addEventListener("click", () => moveTask(-1));
  refs.nextTask.addEventListener("click", () => moveTask(1));
  refs.randomTask.addEventListener("click", () => {
    const list = currentTaskList();
    state.taskIndex = Math.floor(Math.random() * list.length);
    state.hintIndex = -1;
    renderTask();
  });

  refs.showSolution.addEventListener("click", () => {
    state.hintIndex = 99;
    renderHints(true);
  });

  refs.resetProgress.addEventListener("click", () => {
    if (!window.confirm("Soll der lokale Fortschritt wirklich gelöscht werden?")) return;
    state.progress = {};
    saveProgress();
    renderAll();
  });
}

function showDashboard(show) {
  refs.practiceView.hidden = show;
  refs.dashboardView.hidden = !show;
  refs.showProgress.textContent = show ? "Aufgaben anzeigen" : "Fortschritt anzeigen";
  refs.showProgress.setAttribute("aria-expanded", String(show));
  if (show) {
    renderDashboard();
    refs.dashboardTitle.focus({ preventScroll: true });
  }
  window.scrollTo(0, 0);
}

function selectCategory(categoryId) {
  state.categoryId = categoryId;
  state.difficultyId = "basis";
  state.taskIndex = firstOpenTaskIndex(categoryId, "basis");
  state.hintIndex = -1;
  renderAll();
}

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved) || {};
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "{}");
    return Object.fromEntries(Object.entries(legacy).filter(([id]) => {
      const match = id.match(/^([a-z]+)-(training|plus)-(\d+)$/);
      if (!match) return false;
      const index = Number(match[3]);
      if (match[1] === "grund") return index <= 3;
      if (match[1] === "prozent") return index <= 6 && index !== 5;
      return index <= 6;
    }));
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function renderAll() {
  renderCategories();
  renderDifficulties();
  renderFormulaCard();
  renderTask();
  renderGlobalProgress();
  renderDashboard();
}

function dashboardMeter(categoryTitle, difficulty, solved, total) {
  const width = Math.round((solved / total) * 100);
  return `<div class="dashboard-meter dashboard-meter-${difficulty.id}" role="progressbar" aria-label="${categoryTitle}: ${difficulty.label}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${solved}"><span style="width:${width}%"></span></div>`;
}

function renderDashboard() {
  const totals = DIFFICULTIES.map((difficulty) => {
    const total = CATEGORIES.reduce((sum, category) => sum + generatedTasks[category.id][difficulty.id].length, 0);
    const solved = CATEGORIES.reduce((sum, category) => sum + countSolved(category.id, difficulty.id), 0);
    return { difficulty, solved, total };
  });
  const solvedAll = totals.reduce((sum, item) => sum + item.solved, 0);
  const totalAll = totals.reduce((sum, item) => sum + item.total, 0);
  refs.dashboardTotal.textContent = `${solvedAll} von ${totalAll} Aufgaben gelöst`;
  refs.dashboardSummary.innerHTML = totals.map(({ difficulty, solved, total }) => `
    <div class="dashboard-stat dashboard-stat-${difficulty.id}">
      <span>${difficulty.label}</span>
      <strong>${solved}<small>/${total}</small></strong>
      ${dashboardMeter("Insgesamt", difficulty, solved, total)}
    </div>
  `).join("");

  refs.dashboardList.innerHTML = CATEGORIES.map((category) => `
    <section class="dashboard-row" aria-label="${category.title}">
      <h3><button class="dashboard-category-link" type="button" data-category="${category.id}">${category.title}</button></h3>
      <div class="dashboard-levels">
        ${DIFFICULTIES.map((difficulty) => {
          const total = generatedTasks[category.id][difficulty.id].length;
          const solved = countSolved(category.id, difficulty.id);
          return `<div class="dashboard-level">
            <div class="dashboard-level-head"><span>${difficulty.label}</span><strong>${solved}/${total}</strong></div>
            ${dashboardMeter(category.title, difficulty, solved, total)}
          </div>`;
        }).join("")}
      </div>
    </section>
  `).join("");

  refs.dashboardList.querySelectorAll(".dashboard-category-link").forEach((button) => {
    button.addEventListener("click", () => {
      showDashboard(false);
      selectCategory(button.dataset.category);
    });
  });
}

function renderCategories() {
  refs.categorySelect.innerHTML = CATEGORIES.map((category) =>
    `<option value="${category.id}">${category.title}</option>`
  ).join("");
  refs.categorySelect.value = state.categoryId;
  refs.categoryList.innerHTML = CATEGORIES.map((category) => {
    const basis = generatedTasks[category.id].basis;
    const solved = countSolved(category.id, "basis");
    const width = Math.min(100, Math.round((solved / basis.length) * 100));
    return `
      <button class="category-button" type="button" data-category="${category.id}" aria-current="${category.id === state.categoryId}">
        <strong>${category.title}</strong>
        <small>${solved}/${basis.length} Basis gelöst</small>
        <span class="mini-progress" aria-hidden="true"><span style="width:${width}%"></span></span>
      </button>
    `;
  }).join("");

  refs.categoryList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => selectCategory(button.dataset.category));
  });
}

function renderDifficulties() {
  const category = CATEGORY_MAP[state.categoryId];
  refs.categoryTitle.textContent = category.title;
  refs.categoryIntro.textContent = category.intro;
  refs.sourceLabel.textContent = "Eigene Aufgaben nach Mustern aus Tabellenbuch-Übungsaufgaben";

  refs.difficultyTabs.innerHTML = DIFFICULTIES.map((difficulty) => {
    const solved = countSolved(state.categoryId, difficulty.id);
    const total = generatedTasks[state.categoryId][difficulty.id].length;
    return `
      <button class="difficulty-tab" type="button" role="tab" aria-selected="${difficulty.id === state.difficultyId}" data-difficulty="${difficulty.id}">
        ${difficulty.label}
        <span><span class="tab-note">${difficulty.note} · </span>${solved}/${total}</span>
      </button>
    `;
  }).join("");

  refs.difficultyTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.difficultyId = button.dataset.difficulty;
      state.taskIndex = firstOpenTaskIndex(state.categoryId, state.difficultyId);
      state.hintIndex = -1;
      renderAll();
    });
  });
}

function renderFormulaCard() {
  const category = CATEGORY_MAP[state.categoryId];
  const content = category.formulas.map(([name, formula]) => `
    <div class="formula-item">
      <code>${name}</code>
      <small>${formula}</small>
    </div>
  `).join("");
  refs.formulaList.innerHTML = content;
  refs.mobileFormulaList.innerHTML = content;
  typesetMath(refs.formulaList);
  typesetMath(refs.mobileFormulaList);

  const solved = countSolved(state.categoryId, "basis");
  const total = generatedTasks[state.categoryId].basis.length;
  refs.basisProgress.textContent = `${solved}/${total}`;
  refs.basisBar.style.width = `${Math.min(100, Math.round((solved / total) * 100))}%`;
  refs.rubricAdvice.textContent = solved >= BASIS_GOAL
    ? "Basis geschafft. Training und Plus sind freiwillige Zusatzaufgaben."
    : `Ziel: ${BASIS_GOAL} Basisaufgaben lösen. Training und Plus sind freiwillig.`;

  refs.difficultyNote.textContent = state.difficultyId === "plus" ? "Plus ist freiwillig" : "Basis zuerst sauber rechnen";
}

function renderTask() {
  const task = currentTask();
  const difficulty = DIFFICULTY_MAP[state.difficultyId];
  const list = currentTaskList();
  const result = state.progress[task.id];

  refs.difficultyPill.textContent = `${difficulty.label} · ${difficulty.note}`;
  refs.taskCounter.textContent = `Aufgabe ${state.taskIndex + 1}/${list.length}`;
  refs.taskTitle.textContent = task.title;
  typesetMath(refs.taskTitle);
  refs.taskQuestion.innerHTML = task.question;
  typesetMath(refs.taskQuestion);
  refs.answerUnit.textContent = task.unit || "";
  refs.answerInput.value = "";
  refs.answerInput.placeholder = task.placeholder || "z. B. 12,5";
  if (!refs.practiceView.hidden && window.matchMedia("(min-width: 721px)").matches) {
    refs.answerInput.focus({ preventScroll: true });
  }
  refs.diagramSlot.innerHTML = task.diagram || "";
  refs.diagramSlot.hidden = !task.diagram;
  refs.diagramSlot.parentElement.classList.toggle("has-diagram", Boolean(task.diagram));
  refs.feedbackBox.hidden = true;
  refs.feedbackBox.className = "feedback-box";
  refs.helpPanel.classList.toggle("needs-help", false);
  state.hintIndex = -1;
  renderHints(false);

  if (result?.ok) {
    refs.feedbackBox.hidden = false;
    refs.feedbackBox.classList.add("correct");
    refs.feedbackBox.innerHTML = `Schon gelöst. Richtige Antwort: <strong>${formatNumber(task.answer, task.decimals)} ${task.unit}</strong>`;
  }
}

function renderHints(showSolution) {
  const task = currentTask();
  refs.hintButtons.innerHTML = task.hints.map((hint, index) => `
    <button type="button" data-hint="${index}">Tipp ${index + 1}</button>
  `).join("");

  refs.hintButtons.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.hintIndex = Number(button.dataset.hint);
      renderHints(false);
    });
  });

  if (showSolution || state.hintIndex === 99) {
    refs.hintOutput.hidden = false;
    refs.hintOutput.innerHTML = `
      <strong>Lösungsweg</strong>
      <ol>${task.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
      <p>Ergebnis: <strong>${formatNumber(task.answer, task.decimals)} ${task.unit}</strong></p>
    `;
    typesetMath(refs.hintOutput);
    return;
  }

  if (state.hintIndex >= 0) {
    refs.hintOutput.hidden = false;
    refs.hintOutput.innerHTML = `<strong>Tipp ${state.hintIndex + 1}</strong><p>${task.hints[state.hintIndex]}</p>`;
    typesetMath(refs.hintOutput);
  } else {
    refs.hintOutput.hidden = true;
    refs.hintOutput.innerHTML = "";
  }
}

function typesetMath(root) {
  const atom = "(?:√(?:\\([^)]*\\)|\\d+(?:[.,]\\d+)?)|[A-Za-zα-ωΑ-Ω][A-Za-z0-9_₀-₉²³]*|[-+]?\\d+(?:[.,]\\d+)?[²³]?)";
  const pattern = new RegExp(`(${atom}(?:\\s*·\\s*${atom})*)\\s*\\/\\s*(\\([^)]*\\)|${atom})`, "g");
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const source = node.textContent;
    const fragment = document.createDocumentFragment();
    let start = 0;
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(source))) {
      if (/^[A-Z][a-z]+\/[A-Z][a-z]+$/.test(match[0])) continue;
      appendMathText(fragment, source.slice(start, match.index));
      const fraction = document.createElement("span");
      fraction.className = "math-frac";
      fraction.setAttribute("role", "math");
      fraction.setAttribute("aria-label", `${match[1]} geteilt durch ${match[2]}`);
      const top = document.createElement("span");
      const bottom = document.createElement("span");
      appendMathText(top, match[1]);
      appendMathText(bottom, match[2].replace(/^\((.*)\)$/, "$1"));
      fraction.append(top, bottom);
      fragment.append(fraction);
      start = pattern.lastIndex;
    }
    appendMathText(fragment, source.slice(start));
    node.replaceWith(fragment);
  }
}

function appendMathText(target, source) {
  const greek = { pi: "π", rho: "ρ", sigma: "σ", tau: "τ", alpha: "α" };
  const normalized = source.replace(/\b(pi|rho|sigma|tau|alpha)\b/g, (word) => greek[word]);
  const pattern = /([A-Za-zπρστα])_([A-Za-z0-9]+)|\b([Ffl])([12])\b/g;
  let start = 0;
  let match;
  while ((match = pattern.exec(normalized))) {
    target.append(document.createTextNode(normalized.slice(start, match.index)));
    target.append(document.createTextNode(match[1] || match[3]));
    const sub = document.createElement("sub");
    sub.textContent = match[2] || match[4];
    target.append(sub);
    start = pattern.lastIndex;
  }
  target.append(document.createTextNode(normalized.slice(start)));
}

function checkAnswer() {
  const task = currentTask();
  const parsed = parseNumber(refs.answerInput.value);

  if (parsed === null) {
    refs.feedbackBox.hidden = false;
    refs.feedbackBox.className = "feedback-box wrong";
    refs.feedbackBox.textContent = "Gib bitte eine Zahl ein. Komma ist erlaubt, die Einheit steht schon daneben.";
    refs.helpPanel.classList.add("needs-help");
    return;
  }

  const tolerance = task.tolerance ?? Math.max(Math.abs(task.answer) * 0.01, 0.02);
  const ok = Math.abs(parsed - task.answer) <= tolerance;
  const previous = state.progress[task.id] || { tries: 0 };
  state.progress[task.id] = {
    ok: previous.ok || ok,
    tries: previous.tries + 1,
    last: new Date().toISOString()
  };
  saveProgress();

  refs.feedbackBox.hidden = false;
  refs.feedbackBox.className = `feedback-box ${ok ? "correct" : "wrong"}`;

  if (ok) {
    refs.feedbackBox.innerHTML = `Richtig. Sauber gerechnet: <strong>${formatNumber(task.answer, task.decimals)} ${task.unit}</strong>`;
    refs.helpPanel.classList.remove("needs-help");
  } else {
    refs.feedbackBox.innerHTML = `Noch nicht. Deine Eingabe war <strong>${formatNumber(parsed, 4)} ${task.unit}</strong>. Öffne eine Hilfe und rechne den letzten Schritt noch einmal.`;
    refs.helpPanel.classList.add("needs-help");
  }

  renderCategories();
  renderDifficulties();
  renderFormulaCard();
  renderGlobalProgress();
  renderDashboard();
}

function moveTask(direction) {
  const list = currentTaskList();
  state.taskIndex = (state.taskIndex + direction + list.length) % list.length;
  state.hintIndex = -1;
  renderTask();
}

function currentTaskList() {
  return generatedTasks[state.categoryId][state.difficultyId];
}

function currentTask() {
  const list = currentTaskList();
  return list[state.taskIndex % list.length];
}

function firstOpenTaskIndex(categoryId, difficultyId) {
  const list = generatedTasks[categoryId][difficultyId];
  const openIndex = list.findIndex((task) => !state.progress[task.id]?.ok);
  return openIndex === -1 ? 0 : openIndex;
}

function countSolved(categoryId, difficultyId) {
  return generatedTasks[categoryId][difficultyId].filter((task) => state.progress[task.id]?.ok).length;
}

function renderGlobalProgress() {
  const all = Object.values(generatedTasks).flatMap((byLevel) => Object.values(byLevel).flat());
  const solved = all.filter((task) => state.progress[task.id]?.ok).length;
  refs.totalSolved.textContent = solved;
  refs.taskCountLabel.textContent = `${all.length} Aufgaben`;
}

function parseNumber(input) {
  const value = input.trim();
  if (!value) return null;

  const fraction = value.replace(/\s/g, "").replace(",", ".").match(/^([-+]?\d+(?:\.\d+)?)\/([-+]?\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return Number(fraction[1]) / denominator;
  }

  const match = value.replace(",", ".").match(/^[-+]?\d+(?:\.\d+)?$/);
  if (!match) return null;
  const number = Number(match[0]);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, decimals = 2) {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

function shortNumber(value, maxDecimals = 2) {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals
  }).format(value);
}

function hashString(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rngFactory(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function int(rng, min, max, step = 1) {
  const count = Math.floor((max - min) / step) + 1;
  return min + Math.floor(rng() * count) * step;
}

function pick(rng, values) {
  return values[Math.floor(rng() * values.length)];
}

function levelIndex(level) {
  return level === "basis" ? 0 : level === "training" ? 1 : 2;
}

function taskBase(title, question, answer, unit, decimals, hints, steps, diagram = "") {
  const roundedTolerance = 0.51 * 10 ** -decimals;
  const piTolerance = steps.some((step) => /(?:pi|π)/.test(step)) ? Math.abs(answer) * 0.00055 : 0;
  return {
    title,
    question,
    answer,
    unit,
    decimals,
    tolerance: Math.max(roundedTolerance, piTolerance),
    hints,
    steps,
    diagram
  };
}

function rectDiagram(aLabel, bLabel) {
  return `
    <svg viewBox="0 0 220 160" aria-hidden="true">
      <rect x="38" y="35" width="140" height="82" fill="#dceefa" stroke="#0b5c86" stroke-width="4"></rect>
      <line x1="38" y1="128" x2="178" y2="128" stroke="#18242f" stroke-width="2"></line>
      <line x1="26" y1="35" x2="26" y2="117" stroke="#18242f" stroke-width="2"></line>
      <text x="93" y="151" font-size="18" fill="#18242f">${aLabel}</text>
      <text x="5" y="82" font-size="18" fill="#18242f" transform="rotate(-90 10 80)">${bLabel}</text>
    </svg>`;
}

function triangleDiagram(aLabel, bLabel, cLabel = "c") {
  return `
    <svg viewBox="0 0 220 160" aria-hidden="true">
      <path d="M35 120H180L35 35Z" fill="#fff0c1" stroke="#0b5c86" stroke-width="4"></path>
      <path d="M35 104h16v16" fill="none" stroke="#18242f" stroke-width="3"></path>
      <text x="94" y="144" font-size="17" fill="#18242f">${aLabel}</text>
      <text x="8" y="82" font-size="17" fill="#18242f" transform="rotate(-90 15 82)">${bLabel}</text>
      <text x="106" y="68" font-size="17" fill="#18242f">${cLabel}</text>
    </svg>`;
}

function circleDiagram(label, inner = "") {
  return `
    <svg viewBox="0 0 220 160" aria-hidden="true">
      <circle cx="110" cy="80" r="56" fill="#dceefa" stroke="#0b5c86" stroke-width="4"></circle>
      ${inner ? `<circle cx="110" cy="80" r="26" fill="#fff" stroke="#0b5c86" stroke-width="4"></circle>` : ""}
      <line x1="54" y1="80" x2="166" y2="80" stroke="#18242f" stroke-width="2"></line>
      <text x="86" y="72" font-size="18" fill="#18242f">${label}</text>
      ${inner ? `<text x="96" y="112" font-size="16" fill="#18242f">${inner}</text>` : ""}
    </svg>`;
}

function cuboidDiagram(lLabel, bLabel, hLabel) {
  return `
    <svg viewBox="0 0 230 165" aria-hidden="true">
      <path d="M45 65h105l35 28H80Z" fill="#eef7fc" stroke="#0b5c86" stroke-width="3"></path>
      <path d="M45 65v55h105V65" fill="#dceefa" stroke="#0b5c86" stroke-width="3"></path>
      <path d="M150 65l35 28v55l-35-28" fill="#c6e1f1" stroke="#0b5c86" stroke-width="3"></path>
      <text x="82" y="143" font-size="17" fill="#18242f">${lLabel}</text>
      <text x="165" y="133" font-size="17" fill="#18242f">${bLabel}</text>
      <text x="18" y="98" font-size="17" fill="#18242f">${hLabel}</text>
    </svg>`;
}

const TEMPLATES = {
  grund: [
    (rng, level) => {
      const i = levelIndex(level);
      const a = level === "basis" ? int(rng, 20, 70, 10) : int(rng, 18, 80 + i * 60);
      const b = level === "basis" ? int(rng, 2, 8, 2) : int(rng, 4, 18 + i * 8);
      const c = level === "basis" ? int(rng, 2, 5) : int(rng, 3, 14 + i * 8);
      const answer = a + b * c;
      return taskBase(
        "Punkt vor Strich",
        `Berechne <strong>${a} + ${b} · ${c}</strong>.`,
        answer,
        "",
        0,
        ["Rechne zuerst die Multiplikation.", "Danach addierst du den ersten Wert.", "Schreibe einen Zwischenschritt auf, damit keine Zahl verloren geht."],
        [`${b} · ${c} = ${b * c}`, `${a} + ${b * c} = ${answer}`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const a = level === "basis" ? int(rng, 10, 20, 5) : int(rng, 8, 30 + i * 20);
      const b = level === "basis" ? pick(rng, [5, 10]) : int(rng, 2, 9 + i * 5);
      const c = level === "basis" ? int(rng, 2, 4) : int(rng, 4, 12 + i * 4);
      const answer = (a + b) * c;
      return taskBase(
        "Klammerrechnung",
        `Berechne <strong>(${a} + ${b}) · ${c}</strong>.`,
        answer,
        "",
        0,
        ["Rechne zuerst die Klammer.", "Das Ergebnis der Klammer wird mit dem letzten Faktor multipliziert.", "Prüfe, ob du die Klammer wirklich zuerst gerechnet hast."],
        [`${a} + ${b} = ${a + b}`, `${a + b} · ${c} = ${answer}`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const length = level === "basis" ? pick(rng, [100, 150, 200, 250]) : int(rng, 120, 480 + i * 360, 10);
      const pieces = level === "basis" ? int(rng, 2, 5) : int(rng, 3, 8 + i * 4);
      const answer = length * pieces;
      return taskBase(
        "Stückliste addieren",
        `Ein Halter braucht <strong>${pieces}</strong> gleiche Streifen mit je <strong>${length} mm</strong>. Wie viel Materiallänge wird ohne Verschnitt benötigt?`,
        answer,
        "mm",
        0,
        ["Gleiche Streifen werden multipliziert.", "Anzahl · Länge je Streifen.", "Die Einheit bleibt Millimeter."],
        [`${pieces} · ${length} mm = ${answer} mm`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const parts = level === "basis" ? pick(rng, [2, 4, 5, 10]) : pick(rng, [3, 4, 5, 6, 8, 10, 12]);
      const total = level === "basis" ? parts * pick(rng, [20, 25, 50, 75]) : int(rng, 240, 960 + i * 720, 20);
      const answer = total / parts;
      return taskBase(
        "Gleichmäßig teilen",
        `Eine Stange mit <strong>${total} mm</strong> soll in <strong>${parts}</strong> gleiche Abschnitte geteilt werden. Wie lang ist ein Abschnitt?`,
        answer,
        "mm",
        answer % 1 === 0 ? 0 : 1,
        ["Gleiche Teile bedeuten: Gesamtlänge durch Anzahl teilen.", "Rechne Länge : Anzahl.", "Runde nur, wenn eine Dezimalstelle entsteht."],
        [`${total} mm : ${parts} = ${formatNumber(answer, answer % 1 === 0 ? 0 : 1)} mm`]
      );
    },
    (rng, level) => {
      const [a, b, c, d] = pick(rng, {
        basis: [[1, 2, 1, 4], [1, 4, 2, 4], [1, 5, 3, 10], [3, 4, 1, 4]],
        training: [[3, 4, 1, 5], [7, 10, 2, 5], [2, 5, 1, 4]],
        plus: [[7, 10, 3, 5], [9, 10, 1, 4], [3, 4, 7, 10]]
      }[level]);
      const answer = a / b + c / d;
      return taskBase(
        "Brüche als Dezimalzahl",
        `Berechne <strong>${a}/${b} + ${c}/${d}</strong> als Dezimalzahl.`,
        answer,
        "",
        2,
        ["Teile Zähler durch Nenner.", "Addiere die beiden Dezimalzahlen.", "Bei Brüchen ist eine Antwort mit zwei Dezimalstellen hier ausreichend."],
        [`${a}/${b} = ${formatNumber(a / b, 3)}`, `${c}/${d} = ${formatNumber(c / d, 3)}`, `Summe = ${formatNumber(answer, 2)}`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const start = level === "basis" ? int(rng, 80, 160, 10) : int(rng, 80, 260 + i * 180);
      const subtract = level === "basis" ? int(rng, 20, 60, 10) : int(rng, 15, 70 + i * 55);
      const add = level === "basis" ? int(rng, 20, 80, 10) : int(rng, 20, 120 + i * 100);
      const answer = start - subtract + add;
      return taskBase(
        "Plus und Minus",
        `Im Lager liegen <strong>${start}</strong> Schrauben. Es werden <strong>${subtract}</strong> entnommen und <strong>${add}</strong> nachgelegt. Wie viele Schrauben liegen danach im Lager?`,
        answer,
        "Stück",
        0,
        ["Entnahme bedeutet minus.", "Nachlegen bedeutet plus.", "Rechne in der Reihenfolge der Handlung."],
        [`${start} - ${subtract} = ${start - subtract}`, `${start - subtract} + ${add} = ${answer}`]
      );
    }
  ],

  einheiten: [
    (rng, level) => {
      const i = levelIndex(level);
      const mm = level === "basis" ? pick(rng, [250, 500, 750, 1250]) : int(rng, 125, 2500 + i * 5000, 25);
      const answer = mm / 1000;
      return taskBase(
        "Millimeter in Meter",
        `Wandle <strong>${mm} mm</strong> in Meter um.`,
        answer,
        "m",
        3,
        ["Von mm nach m sind es drei Stellen nach links.", "1 m = 1000 mm.", "Teile durch 1000."],
        [`${mm} : 1000 = ${formatNumber(answer, 3)} m`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const m = level === "basis" ? pick(rng, [2, 3, 5]) : int(rng, 2, 16 + i * 18);
      const answer = m * 1000;
      return taskBase(
        "Meter in Millimeter",
        `Wandle <strong>${m} m</strong> in Millimeter um.`,
        answer,
        "mm",
        0,
        ["Von m nach mm sind es drei Stellen nach rechts.", "1 m = 1000 mm.", "Multipliziere mit 1000."],
        [`${m} · 1000 = ${answer} mm`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const cm2 = level === "basis" ? pick(rng, [2, 5, 10]) : int(rng, 4, 90 + i * 160);
      const answer = cm2 * 100;
      return taskBase(
        "Quadratzentimeter in Quadratmillimeter",
        `Wandle <strong>${cm2} cm²</strong> in Quadratmillimeter um.`,
        answer,
        "mm²",
        0,
        ["Bei Flächen wird der Längenfaktor quadriert.", "1 cm = 10 mm, also 1 cm² = 100 mm².", "Multipliziere mit 100."],
        [`${cm2} · 100 = ${answer} mm²`],
        rectDiagram("10 mm", "10 mm")
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const cm3 = level === "basis" ? pick(rng, [500, 1500, 2500]) : int(rng, 250, 8400 + i * 12000, 50);
      const answer = cm3 / 1000;
      return taskBase(
        "Kubikzentimeter in Kubikdezimeter",
        `Wandle <strong>${cm3} cm³</strong> in dm³ um.`,
        answer,
        "dm³",
        3,
        ["1 dm = 10 cm.", "Bei Volumen wird der Faktor dreimal gerechnet: 1 dm³ = 1000 cm³.", "Teile durch 1000."],
        [`${cm3} : 1000 = ${formatNumber(answer, 3)} dm³`],
        cuboidDiagram("10 cm", "10 cm", "10 cm")
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const ms = level === "basis" ? pick(rng, [5, 10, 20]) : int(rng, 2, 32 + i * 38);
      const answer = ms * 3.6;
      return taskBase(
        "m/s in km/h",
        `Wandle <strong>${ms} m/s</strong> in km/h um.`,
        answer,
        "km/h",
        1,
        ["Von m/s nach km/h wird mit 3,6 multipliziert.", "Das kommt aus 1000 m und 3600 s.", "Rechne v · 3,6."],
        [`${ms} · 3,6 = ${formatNumber(answer, 1)} km/h`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const kw = level === "basis" ? pick(rng, [2, 5, 10]) : int(rng, 3, 85 + i * 150);
      const answer = kw * 1000;
      return taskBase(
        "Kilowatt in Watt",
        `Wandle <strong>${kw} kW</strong> in Watt um.`,
        answer,
        "W",
        0,
        ["Kilo bedeutet 1000.", "1 kW = 1000 W.", "Multipliziere mit 1000."],
        [`${kw} · 1000 = ${answer} W`]
      );
    }
  ],

  prozent: [
    (rng, level) => {
      const i = levelIndex(level);
      const wage = level === "basis" ? pick(rng, [20, 25, 30]) : int(rng, 12, 28 + i * 20);
      const percent = level === "basis" ? pick(rng, [10, 20]) : int(rng, 2, 8 + i * 7);
      const answer = wage * (1 + percent / 100);
      return taskBase(
        "Lohnerhöhung",
        `Ein Stundenlohn von <strong>${formatNumber(wage, 2)} €</strong> wird um <strong>${percent} %</strong> erhöht. Wie hoch ist der neue Stundenlohn?`,
        answer,
        "€",
        2,
        ["Eine Erhöhung bedeutet: 100 % plus den Prozentsatz.", "Rechne mit dem Faktor 1 + p/100.", "Erst den Zuschlag berechnen, dann addieren."],
        [`Zuschlag: ${formatNumber(wage, 2)} · ${percent}/100 = ${formatNumber(wage * percent / 100, 2)} €`, `Neu: ${formatNumber(wage, 2)} + ${formatNumber(wage * percent / 100, 2)} = ${formatNumber(answer, 2)} €`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const price = level === "basis" ? pick(rng, [80, 100, 200]) : int(rng, 40, 420 + i * 900, 5);
      const percent = level === "basis" ? pick(rng, [10, 25, 50]) : int(rng, 5, 35 + i * 15);
      const answer = price * (1 - percent / 100);
      return taskBase(
        "Rabatt",
        `Ein Werkzeug kostet <strong>${formatNumber(price, 2)} €</strong>. Es gibt <strong>${percent} %</strong> Rabatt. Wie hoch ist der neue Preis?`,
        answer,
        "€",
        2,
        ["Rabatt wird abgezogen.", "Rechne Preis · (1 - p/100).", "Alternativ: Rabattbetrag berechnen und vom Preis abziehen."],
        [`Rabatt: ${formatNumber(price, 2)} · ${percent}/100 = ${formatNumber(price * percent / 100, 2)} €`, `Neuer Preis: ${formatNumber(price, 2)} - ${formatNumber(price * percent / 100, 2)} = ${formatNumber(answer, 2)} €`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const base = level === "basis" ? pick(rng, [100, 200, 400]) : int(rng, 80, 900 + i * 2500, 10);
      const percent = level === "basis" ? pick(rng, [5, 10, 20, 25]) : int(rng, 6, 42 + i * 22);
      const answer = base * percent / 100;
      return taskBase(
        "Prozentwert",
        `Wie viel sind <strong>${percent} %</strong> von <strong>${base}</strong>?`,
        answer,
        "",
        2,
        ["Gesucht ist der Prozentwert W.", "Formel: W = G · p / 100.", "Setze Grundwert und Prozentsatz ein."],
        [`W = ${base} · ${percent} / 100`, `W = ${formatNumber(answer, 2)}`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const capital = level === "basis" ? pick(rng, [600, 1200, 2400]) : int(rng, 500, 12000 + i * 22000, 250);
      const percent = level === "basis" ? pick(rng, [2, 4, 5]) : int(rng, 2, 6 + i * 5);
      const months = level === "basis" ? pick(rng, [3, 6, 12]) : pick(rng, [3, 4, 6, 9, 12, 18]);
      const answer = capital * percent * months / (100 * 12);
      return taskBase(
        "Zinsen",
        `Für <strong>${formatNumber(capital, 2)} €</strong> gibt es <strong>${percent} %</strong> Zinsen pro Jahr. Wie viel Zinsen entstehen in <strong>${months} Monaten</strong>?`,
        answer,
        "€",
        2,
        ["Zinsen hängen von Kapital, Prozentsatz und Zeit ab.", "Bei Monaten: t durch 12 teilen.", "Formel: Z = K · p · Monate / (100 · 12)."],
        [`Z = ${capital} · ${percent} · ${months} / (100 · 12)`, `Z = ${formatNumber(answer, 2)} €`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const percent = level === "basis" ? pick(rng, [10, 20, 25, 50]) : pick(rng, [10, 12, 15, 20, 25, 30, 40, 50]);
      const part = level === "basis" ? percent * pick(rng, [2, 4, 8]) / 10 : int(rng, 12, 180 + i * 320);
      const answer = part * 100 / percent;
      return taskBase(
        "Grundwert finden",
        `<strong>${part}</strong> Teile entsprechen <strong>${percent} %</strong> einer Lieferung. Wie groß ist die ganze Lieferung?`,
        answer,
        "Teile",
        0,
        ["Gesucht ist 100 %.", "Teile den Prozentwert durch p und multipliziere mit 100.", "G = W · 100 / p."],
        [`G = ${part} · 100 / ${percent}`, `G = ${formatNumber(answer, 0)} Teile`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const oldValue = level === "basis" ? pick(rng, [100, 200, 400]) : int(rng, 60, 440 + i * 800, 10);
      const newValue = oldValue + (level === "basis" ? oldValue / 10 : int(rng, 6, 80 + i * 160, 2));
      const answer = (newValue - oldValue) / oldValue * 100;
      return taskBase(
        "Prozentsatz berechnen",
        `Ein Messwert steigt von <strong>${oldValue}</strong> auf <strong>${newValue}</strong>. Um wie viel Prozent ist er gestiegen?`,
        answer,
        "%",
        1,
        ["Berechne zuerst die Änderung.", "Änderung durch alten Wert teilen.", "Dann mit 100 multiplizieren."],
        [`Änderung: ${newValue} - ${oldValue} = ${newValue - oldValue}`, `p = ${newValue - oldValue} / ${oldValue} · 100 = ${formatNumber(answer, 1)} %`]
      );
    }
  ],

  umstellen: [
    (rng, level) => {
      const i = levelIndex(level);
      const s = level === "basis" ? pick(rng, [60, 120]) : int(rng, 20, 180 + i * 380, 10);
      const v = level === "basis" ? pick(rng, [5, 10]) : int(rng, 2, 15 + i * 20);
      const answer = s / v;
      return taskBase(
        "t aus v = s / t",
        `Stelle <strong>v = s / t</strong> nach <strong>t</strong> um und berechne: s = ${s} m, v = ${v} m/min.`,
        answer,
        "min",
        2,
        ["Die gesuchte Größe t steht unten im Bruch.", "Multipliziere zuerst mit t, danach teile durch v.", "Umgestellt: t = s / v."],
        [`v = s / t`, `t = s / v`, `t = ${s} / ${v} = ${formatNumber(answer, 2)} min`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const area = level === "basis" ? pick(rng, [200, 300, 500]) : int(rng, 1200, 12000 + i * 22000, 100);
      const width = level === "basis" ? pick(rng, [10, 20, 25]) : int(rng, 20, 80 + i * 60, 5);
      const answer = area / width;
      return taskBase(
        "a aus A = a · b",
        `Ein Rechteck hat A = <strong>${area} mm²</strong> und b = <strong>${width} mm</strong>. Berechne a.`,
        answer,
        "mm",
        1,
        ["A = a · b.", "Teile durch die bekannte Seite b.", "a = A / b."],
        [`a = ${area} / ${width}`, `a = ${formatNumber(answer, 1)} mm`],
        rectDiagram("a", `${width} mm`)
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const rho = level === "basis" ? 2.7 : pick(rng, [2.7, 7.85, 8.9]);
      const volume = level === "basis" ? pick(rng, [100, 200]) : int(rng, 40, 380 + i * 900, 10);
      const answer = rho * volume;
      return taskBase(
        "m aus m = rho · V",
        `Berechne die Masse. Dichte rho = <strong>${formatNumber(rho, 2)} g/cm³</strong>, Volumen V = <strong>${volume} cm³</strong>.`,
        answer,
        "g",
        1,
        ["Masse ist Dichte mal Volumen.", "Die Einheiten passen hier direkt: g/cm³ · cm³ = g.", "m = rho · V."],
        [`m = ${formatNumber(rho, 2)} · ${volume}`, `m = ${formatNumber(answer, 1)} g`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const force = level === "basis" ? pick(rng, [100, 200, 400]) : int(rng, 1500, 24000 + i * 70000, 500);
      const area = level === "basis" ? pick(rng, [20, 25, 50]) : int(rng, 40, 300 + i * 700, 10);
      const answer = force / area;
      return taskBase(
        "sigma aus sigma = F / A",
        `Eine Kraft F = <strong>${force} N</strong> wirkt auf A = <strong>${area} mm²</strong>. Berechne die Spannung sigma.`,
        answer,
        "N/mm²",
        1,
        ["Spannung ist Kraft pro Fläche.", "Formel: sigma = F / A.", "Teile Newton durch Quadratmillimeter."],
        [`sigma = ${force} / ${area}`, `sigma = ${formatNumber(answer, 1)} N/mm²`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const vc = level === "basis" ? 31.4 : int(rng, 20, 90 + i * 140, 5);
      const d = level === "basis" ? 100 : int(rng, 20, 120 + i * 160, 5);
      const answer = vc * 1000 / (Math.PI * d);
      return taskBase(
        "n aus v_c = pi · d · n / 1000",
        `Stelle nach n um und berechne: v_c = <strong>${shortNumber(vc, 1)} m/min</strong>, d = <strong>${d} mm</strong>.`,
        answer,
        "min⁻¹",
        0,
        ["n steht im Produkt.", "Multipliziere v_c mit 1000.", "Teile durch pi · d."],
        [`n = v_c · 1000 / (pi · d)`, `n = ${shortNumber(vc, 1)} · 1000 / (pi · ${d}) = ${formatNumber(answer, 0)} min⁻¹`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const force = level === "basis" ? 1000 : int(rng, 800, 12000 + i * 32000, 200);
      const pressure = level === "basis" ? 20 : int(rng, 10, 90 + i * 160, 5);
      const answer = force / pressure;
      return taskBase(
        "A aus p = F / A",
        `Eine Pressung p = <strong>${pressure} N/mm²</strong> ist zulässig. Welche Fläche A braucht man mindestens bei F = <strong>${force} N</strong>?`,
        answer,
        "mm²",
        1,
        ["Gesucht ist A.", "p = F / A wird zu A = F / p.", "Eine größere Fläche verringert die Pressung."],
        [`A = ${force} / ${pressure}`, `A = ${formatNumber(answer, 1)} mm²`]
      );
    }
  ],

  pythagoras: [
    (rng, level) => {
      const i = levelIndex(level);
      const [a, b] = level === "basis" ? pick(rng, [[300, 400], [600, 800], [900, 1200]])
        : [int(rng, 300, 1400 + i * 1600, 50), int(rng, 200, 1100 + i * 1300, 50)];
      const answer = Math.sqrt(a * a + b * b);
      return taskBase(
        "Diagonale prüfen",
        `Ein rechteckiger Rahmen ist <strong>${a} mm</strong> lang und <strong>${b} mm</strong> breit. Wie lang ist die Diagonale?`,
        answer,
        "mm",
        1,
        ["Die Diagonale ist die Hypotenuse.", "Nutze c² = a² + b².", "Ziehe am Ende die Wurzel."],
        [`c = √(${a}² + ${b}²)`, `c = ${formatNumber(answer, 1)} mm`],
        triangleDiagram(`${a}`, `${b}`, "c")
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const [base, diag] = level === "basis" ? pick(rng, [[3, 5], [5, 13], [6, 10]])
        : (() => { const side = int(rng, 2, 8 + i * 8); return [side, side + int(rng, 2, 7 + i * 9)]; })();
      const answer = Math.sqrt(diag * diag - base * base);
      return taskBase(
        "Fehlende Kathete",
        `Eine schräge Strebe ist <strong>${diag} m</strong> lang. Der waagerechte Abstand beträgt <strong>${base} m</strong>. Wie groß ist die Höhe?`,
        answer,
        "m",
        2,
        ["Gegeben ist die Hypotenuse und eine Kathete.", "h² = c² - a².", "Die Wurzel liefert die Länge."],
        [`h = √(${diag}² - ${base}²)`, `h = ${formatNumber(answer, 2)} m`],
        triangleDiagram(`${base} m`, "h", `${diag} m`)
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const run = level === "basis" ? pick(rng, [40, 60, 100]) : int(rng, 40, 180 + i * 260, 10);
      const rise = level === "basis" ? run : int(rng, 10, 90 + i * 140, 5);
      const answer = Math.atan(rise / run) * 180 / Math.PI;
      return taskBase(
        "Steigungswinkel",
        `Eine Schräge steigt um <strong>${rise} mm</strong> auf einer waagerechten Länge von <strong>${run} mm</strong>. Berechne den Winkel alpha.`,
        answer,
        "°",
        1,
        ["Gegenkathete ist die Höhe.", "Ankathete ist die waagerechte Länge.", "tan(alpha) = Gegenkathete / Ankathete."],
        [`tan(alpha) = ${rise} / ${run}`, `alpha = arctan(${formatNumber(rise / run, 3)}) = ${formatNumber(answer, 1)}°`],
        triangleDiagram(`${run} mm`, `${rise} mm`, "")
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const angle = level === "basis" ? 30 : int(rng, 18, 55 + i * 15);
      const hyp = level === "basis" ? pick(rng, [80, 100, 120]) : int(rng, 80, 260 + i * 420, 10);
      const answer = Math.sin(angle * Math.PI / 180) * hyp;
      return taskBase(
        "Gegenkathete mit Sinus",
        `Eine Strebe ist <strong>${hyp} mm</strong> lang und steht unter <strong>${angle}°</strong>. Wie groß ist die senkrechte Höhe?`,
        answer,
        "mm",
        1,
        ["Gesucht ist die Gegenkathete zum Winkel.", "sin(alpha) = Gegenkathete / Hypotenuse.", "Gegenkathete = sin(alpha) · Hypotenuse."],
        [`h = sin(${angle}°) · ${hyp}`, `h = ${formatNumber(answer, 1)} mm`],
        triangleDiagram("", "h", `${hyp} mm`)
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const angle = level === "basis" ? 60 : int(rng, 20, 65 + i * 10);
      const adjacent = level === "basis" ? pick(rng, [40, 60, 100]) : int(rng, 70, 320 + i * 520, 10);
      const answer = adjacent / Math.cos(angle * Math.PI / 180);
      return taskBase(
        "Hypotenuse mit Kosinus",
        `Die waagerechte Länge beträgt <strong>${adjacent} mm</strong>, der Winkel ist <strong>${angle}°</strong>. Wie lang ist die schräge Seite?`,
        answer,
        "mm",
        1,
        ["Die waagerechte Seite ist die Ankathete.", "cos(alpha) = Ankathete / Hypotenuse.", "Hypotenuse = Ankathete / cos(alpha)."],
        [`c = ${adjacent} / cos(${angle}°)`, `c = ${formatNumber(answer, 1)} mm`],
        triangleDiagram(`${adjacent} mm`, "", "c")
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const [a, b] = level === "basis" ? pick(rng, [[60, 80], [90, 120], [120, 160]])
        : [int(rng, 80, 360 + i * 700, 10), int(rng, 80, 360 + i * 700, 10)];
      const answer = Math.sqrt(a * a + b * b);
      return taskBase(
        "Bohrbild diagonal",
        `Zwei Bohrungen liegen <strong>${a} mm</strong> waagerecht und <strong>${b} mm</strong> senkrecht auseinander. Wie groß ist ihr Abstand?`,
        answer,
        "mm",
        1,
        ["Der Bohrungsabstand ist eine Diagonale.", "Nutze Pythagoras.", "c = √(a² + b²)."],
        [`c = √(${a}² + ${b}²)`, `c = ${formatNumber(answer, 1)} mm`],
        triangleDiagram(`${a} mm`, `${b} mm`, "l")
      );
    }
  ],

  flaechen: [
    (rng, level) => {
      const i = levelIndex(level);
      const a = level === "basis" ? 20 : int(rng, 20, 180 + i * 360, 5);
      const b = level === "basis" ? 10 : int(rng, 15, 140 + i * 260, 5);
      const answer = a * b;
      return taskBase(
        "Rechteckfläche",
        `Eine Platte ist <strong>${a} mm</strong> lang und <strong>${b} mm</strong> breit. Berechne die Fläche A.`,
        answer,
        "mm²",
        0,
        ["Rechteck: Länge mal Breite.", "A = a · b.", "Die Einheit ist mm²."],
        [`A = ${a} · ${b}`, `A = ${answer} mm²`],
        rectDiagram(`${a} mm`, `${b} mm`)
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const g = level === "basis" ? 20 : int(rng, 30, 220 + i * 380, 5);
      const h = level === "basis" ? 10 : int(rng, 20, 170 + i * 320, 5);
      const answer = g * h / 2;
      return taskBase(
        "Dreieckfläche",
        `Ein Dreieck hat Grundseite g = <strong>${g} mm</strong> und Höhe h = <strong>${h} mm</strong>. Berechne A.`,
        answer,
        "mm²",
        1,
        ["Dreieck: Grundseite mal Höhe durch 2.", "Die Höhe steht senkrecht auf der Grundseite.", "A = g · h / 2."],
        [`A = ${g} · ${h} / 2`, `A = ${formatNumber(answer, 1)} mm²`],
        triangleDiagram(`${g} mm`, `${h} mm`, "")
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const d = level === "basis" ? 10 : int(rng, 20, 160 + i * 280, 5);
      const answer = Math.PI * d * d / 4;
      return taskBase(
        "Kreisfläche",
        `Ein rundes Blech hat Durchmesser d = <strong>${d} mm</strong>. Berechne die Fläche.`,
        answer,
        "mm²",
        1,
        ["Beim Kreis mit Durchmesser: A = pi · d² / 4.", "Quadriere zuerst den Durchmesser.", "Nutze pi ≈ 3,1416."],
        [`A = pi · ${d}² / 4`, `A = ${formatNumber(answer, 1)} mm²`],
        circleDiagram(`d=${d}`)
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const outer = level === "basis" ? 10 : int(rng, 40, 180 + i * 260, 5);
      const inner = level === "basis" ? 6 : int(rng, 10, outer - 15, 5);
      const answer = Math.PI * (outer * outer - inner * inner) / 4;
      return taskBase(
        "Unterlegscheibe",
        `Eine Scheibe hat Außendurchmesser D = <strong>${outer} mm</strong> und Innendurchmesser d = <strong>${inner} mm</strong>. Berechne die Ringfläche.`,
        answer,
        "mm²",
        1,
        ["Rechne Außenkreis minus Innenkreis.", "Mit Durchmessern: A = pi/4 · (D² - d²).", "Achte auf die Quadrate."],
        [`A = pi/4 · (${outer}² - ${inner}²)`, `A = ${formatNumber(answer, 1)} mm²`],
        circleDiagram(`D=${outer}`, `d=${inner}`)
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const a = level === "basis" ? 20 : int(rng, 30, 180 + i * 300, 5);
      const b = level === "basis" ? 10 : int(rng, 20, 120 + i * 240, 5);
      const hole = level === "basis" ? 4 : int(rng, 8, Math.min(a, b) - 5, 2);
      const answer = a * b - Math.PI * hole * hole / 4;
      return taskBase(
        "Rechteck mit Bohrung",
        `Eine Lasche ${a} mm × ${b} mm hat eine Bohrung mit d = <strong>${hole} mm</strong>. Berechne die verbleibende Fläche.`,
        answer,
        "mm²",
        1,
        ["Rechteckfläche minus Kreisfläche.", "A = a · b - pi · d² / 4.", "Die Bohrung wird abgezogen."],
        [`A = ${a} · ${b} - pi · ${hole}² / 4`, `A = ${formatNumber(answer, 1)} mm²`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const a = level === "basis" ? 4 : int(rng, 12, 80 + i * 140, 2);
      const answer = 3 * Math.sqrt(3) / 2 * a * a;
      return taskBase(
        "Regelmäßiges Sechseck",
        `Ein regelmäßiges Sechseck hat Seitenlänge a = <strong>${a} mm</strong>. Berechne die Fläche.`,
        answer,
        "mm²",
        1,
        ["Ein regelmäßiges Sechseck besteht aus 6 gleichseitigen Dreiecken.", "Formel: A = 3 · √3 / 2 · a².", "Setze die Seitenlänge ein."],
        [`A = 3 · √3 / 2 · ${a}²`, `A = ${formatNumber(answer, 1)} mm²`]
      );
    }
  ],

  volumen: [
    (rng, level) => {
      const i = levelIndex(level);
      const l = level === "basis" ? 10 : int(rng, 40, 240 + i * 460, 10);
      const b = level === "basis" ? 5 : int(rng, 20, 120 + i * 260, 10);
      const h = level === "basis" ? 2 : int(rng, 10, 90 + i * 180, 5);
      const answer = l * b * h;
      return taskBase(
        "Quader",
        `Ein Vierkantprisma hat l = <strong>${l} mm</strong>, b = <strong>${b} mm</strong>, h = <strong>${h} mm</strong>. Berechne das Volumen.`,
        answer,
        "mm³",
        0,
        ["Volumen beim Quader: Länge · Breite · Höhe.", "Alle Maße sind in mm, also wird das Ergebnis mm³.", "Rechne erst zwei Faktoren, dann den dritten."],
        [`V = ${l} · ${b} · ${h}`, `V = ${answer} mm³`],
        cuboidDiagram(`${l}`, `${b}`, `${h}`)
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const d = level === "basis" ? 10 : int(rng, 20, 130 + i * 240, 5);
      const h = level === "basis" ? 10 : int(rng, 30, 260 + i * 500, 10);
      const answer = Math.PI * d * d / 4 * h;
      return taskBase(
        "Zylinder",
        `Ein Rundstab hat d = <strong>${d} mm</strong> und Länge h = <strong>${h} mm</strong>. Berechne das Volumen.`,
        answer,
        "mm³",
        0,
        ["Zylinder: Grundfläche mal Höhe.", "Grundfläche mit Durchmesser: pi · d² / 4.", "V = pi · d² / 4 · h."],
        [`V = pi · ${d}² / 4 · ${h}`, `V = ${formatNumber(answer, 0)} mm³`],
        circleDiagram(`d=${d}`)
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const volume = level === "basis" ? 100 : int(rng, 20, 500 + i * 1200, 10);
      const rho = 7.85;
      const answer = volume * rho;
      return taskBase(
        "Stahlmasse",
        `Ein Stahlteil hat ein Volumen von <strong>${volume} cm³</strong>. Rechne mit rho = 7,85 g/cm³. Wie groß ist die Masse?`,
        answer,
        "g",
        1,
        ["Masse = Dichte · Volumen.", "Stahl wird hier mit 7,85 g/cm³ gerechnet.", "cm³ kürzt sich weg, übrig bleibt g."],
        [`m = 7,85 · ${volume}`, `m = ${formatNumber(answer, 1)} g`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const mass = level === "basis" ? 270 : int(rng, 500, 9000 + i * 16000, 100);
      const rho = level === "basis" ? 2.7 : pick(rng, [2.7, 7.85, 8.9]);
      const answer = mass / rho;
      return taskBase(
        "Volumen aus Masse",
        `Ein Werkstück hat m = <strong>${mass} g</strong> und rho = <strong>${formatNumber(rho, 2)} g/cm³</strong>. Berechne das Volumen.`,
        answer,
        "cm³",
        1,
        ["Stelle m = rho · V nach V um.", "V = m / rho.", "Die Einheit wird cm³."],
        [`V = ${mass} / ${formatNumber(rho, 2)}`, `V = ${formatNumber(answer, 1)} cm³`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const a = level === "basis" ? 10 : int(rng, 40, 180 + i * 320, 10);
      const h = level === "basis" ? 3 : int(rng, 30, 160 + i * 300, 10);
      const answer = a * a * h / 3;
      return taskBase(
        "Pyramide",
        `Eine Pyramide hat eine quadratische Grundfläche mit a = <strong>${a} mm</strong> und Höhe h = <strong>${h} mm</strong>. Berechne das Volumen.`,
        answer,
        "mm³",
        0,
        ["Pyramide: Grundfläche mal Höhe durch 3.", "Quadratische Grundfläche: A = a².", "V = a² · h / 3."],
        [`V = ${a}² · ${h} / 3`, `V = ${formatNumber(answer, 0)} mm³`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const cm3 = level === "basis" ? 1500 : int(rng, 500, 9500 + i * 18000, 100);
      const answer = cm3 / 1000;
      return taskBase(
        "Volumen umrechnen",
        `Wandle <strong>${cm3} cm³</strong> in Liter um.`,
        answer,
        "l",
        2,
        ["1 Liter entspricht 1 dm³.", "1 dm³ = 1000 cm³.", "Teile cm³ durch 1000."],
        [`${cm3} : 1000 = ${formatNumber(answer, 2)} l`],
        cuboidDiagram("10 cm", "10 cm", "10 cm")
      );
    }
  ],

  bewegung: [
    (rng, level) => {
      const i = levelIndex(level);
      const s = level === "basis" ? 60 : int(rng, 20, 180 + i * 420, 10);
      const t = level === "basis" ? 10 : int(rng, 4, 25 + i * 50);
      const answer = s / t;
      return taskBase(
        "Konstante Geschwindigkeit",
        `Ein Wagen fährt <strong>${s} m</strong> in <strong>${t} s</strong>. Berechne die Geschwindigkeit.`,
        answer,
        "m/s",
        2,
        ["Geschwindigkeit = Weg durch Zeit.", "v = s / t.", "Meter durch Sekunden ergibt m/s."],
        [`v = ${s} / ${t}`, `v = ${formatNumber(answer, 2)} m/s`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const v = level === "basis" ? 5 : int(rng, 2, 12 + i * 24);
      const s = level === "basis" ? 60 : int(rng, 30, 240 + i * 520, 10);
      const answer = s / v;
      return taskBase(
        "Zeit berechnen",
        `Ein Hallenkran fährt mit v = <strong>${v} m/min</strong> eine Strecke von <strong>${s} m</strong>. Wie lange dauert das?`,
        answer,
        "min",
        2,
        ["Stelle v = s / t nach t um.", "t = s / v.", "Die Einheit ist Minuten, weil v in m/min steht."],
        [`t = ${s} / ${v}`, `t = ${formatNumber(answer, 2)} min`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const d = level === "basis" ? 100 : int(rng, 40, 180 + i * 260, 5);
      const n = level === "basis" ? 100 : int(rng, 80, 700 + i * 1400, 20);
      const answer = Math.PI * d * n / 1000;
      return taskBase(
        "Schnittgeschwindigkeit",
        `Ein Werkzeug hat d = <strong>${d} mm</strong> und n = <strong>${n} min⁻¹</strong>. Berechne v_c.`,
        answer,
        "m/min",
        1,
        ["Formel: v_c = pi · d · n / 1000.", "Durch 1000, weil d in mm gegeben ist und v_c in m/min gefragt ist.", "Setze d und n ein."],
        [`v_c = pi · ${d} · ${n} / 1000`, `v_c = ${formatNumber(answer, 1)} m/min`],
        circleDiagram(`d=${d}`)
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const fz = level === "basis" ? 0.1 : pick(rng, [0.05, 0.08, 0.1, 0.12, 0.15, 0.2]);
      const z = level === "basis" ? 2 : int(rng, 2, 8 + i * 8);
      const n = level === "basis" ? 100 : int(rng, 120, 900 + i * 1800, 20);
      const answer = fz * z * n;
      return taskBase(
        "Vorschubgeschwindigkeit",
        `Ein Fräser hat f_z = <strong>${formatNumber(fz, 2)} mm</strong>, z = <strong>${z}</strong> Schneiden und n = <strong>${n} min⁻¹</strong>. Berechne v_f.`,
        answer,
        "mm/min",
        1,
        ["Vorschub: v_f = f_z · z · n.", "Alle Faktoren werden multipliziert.", "Das Ergebnis ist mm/min."],
        [`v_f = ${formatNumber(fz, 2)} · ${z} · ${n}`, `v_f = ${formatNumber(answer, 1)} mm/min`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const v0 = level === "basis" ? 12 : int(rng, 4, 30 + i * 40);
      const t = level === "basis" ? 3 : int(rng, 2, 12 + i * 20);
      const answer = v0 / t;
      return taskBase(
        "Verzögerung",
        `Ein Band bremst von <strong>${v0} m/s</strong> auf 0 in <strong>${t} s</strong>. Berechne die Verzögerung als positiven Wert.`,
        answer,
        "m/s²",
        2,
        ["Die Geschwindigkeitsänderung ist v0.", "a = Δv / t.", "Hier ist der Betrag der Verzögerung gefragt."],
        [`a = ${v0} / ${t}`, `a = ${formatNumber(answer, 2)} m/s²`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const d = level === "basis" ? 100 : int(rng, 80, 420 + i * 700, 20);
      const n = level === "basis" ? 600 : int(rng, 200, 1800 + i * 2200, 50);
      const answer = Math.PI * (d / 1000) * n / 60;
      return taskBase(
        "Umfangsgeschwindigkeit",
        `Eine Scheibe hat d = <strong>${d} mm</strong> und n = <strong>${n} min⁻¹</strong>. Berechne die Umfangsgeschwindigkeit in m/s.`,
        answer,
        "m/s",
        2,
        ["Umfang = pi · d.", "d zuerst in Meter umrechnen.", "Pro Minute durch 60 teilen."],
        [`d = ${formatNumber(d / 1000, 3)} m`, `v = pi · ${formatNumber(d / 1000, 3)} · ${n} / 60`, `v = ${formatNumber(answer, 2)} m/s`],
        circleDiagram(`d=${d}`)
      );
    }
  ],

  kraefte: [
    (rng, level) => {
      const i = levelIndex(level);
      const mass = level === "basis" ? 10 : int(rng, 10, 120 + i * 500, 5);
      const answer = mass * 9.81;
      return taskBase(
        "Gewichtskraft",
        `Ein Bauteil hat m = <strong>${mass} kg</strong>. Berechne die Gewichtskraft mit g = 9,81 m/s².`,
        answer,
        "N",
        1,
        ["Gewichtskraft: F_G = m · g.", "Setze m in kg ein.", "Das Ergebnis ist Newton."],
        [`F_G = ${mass} · 9,81`, `F_G = ${formatNumber(answer, 1)} N`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const f2 = level === "basis" ? 100 : int(rng, 100, 900 + i * 2400, 50);
      const l2 = level === "basis" ? 20 : int(rng, 80, 380 + i * 700, 20);
      const l1 = level === "basis" ? 50 : int(rng, 100, 700 + i * 1000, 20);
      const answer = f2 * l2 / l1;
      return taskBase(
        "Hebelgesetz",
        `Ein Hebel ist im Gleichgewicht. F₂ = <strong>${f2} N</strong>, l₂ = <strong>${l2} mm</strong>, l₁ = <strong>${l1} mm</strong>. Berechne F₁.`,
        answer,
        "N",
        1,
        ["Im Gleichgewicht gilt F1 · l1 = F2 · l2.", "Stelle nach F1 um.", "F1 = F2 · l2 / l1."],
        [`F1 = ${f2} · ${l2} / ${l1}`, `F1 = ${formatNumber(answer, 1)} N`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const rate = level === "basis" ? 5 : int(rng, 4, 18 + i * 30);
      const s = level === "basis" ? 10 : int(rng, 3, 30 + i * 60);
      const answer = rate * s;
      return taskBase(
        "Federkraft",
        `Eine Feder hat die Federrate R = <strong>${rate} N/mm</strong> und wird um s = <strong>${s} mm</strong> zusammengedrückt. Berechne F.`,
        answer,
        "N",
        0,
        ["Federkraft: F = R · s.", "N/mm mal mm ergibt N.", "Multipliziere Federrate und Weg."],
        [`F = ${rate} · ${s}`, `F = ${answer} N`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const force = level === "basis" ? 1000 : int(rng, 2000, 50000 + i * 120000, 1000);
      const area = level === "basis" ? 100 : int(rng, 40, 400 + i * 900, 10);
      const answer = force / area;
      return taskBase(
        "Zugspannung",
        `Ein Stab wird mit F = <strong>${formatNumber(force, 0)} N</strong> belastet. Querschnitt A = <strong>${area} mm²</strong>. Berechne sigma.`,
        answer,
        "N/mm²",
        1,
        ["Spannung ist Kraft pro Fläche.", "sigma = F / A.", "Setze N und mm² ein."],
        [`sigma = ${force} / ${area}`, `sigma = ${formatNumber(answer, 1)} N/mm²`]
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const tau = level === "basis" ? 100 : int(rng, 80, 180 + i * 260, 10);
      const d = level === "basis" ? 10 : int(rng, 8, 40 + i * 80, 2);
      const area = Math.PI * d * d / 4;
      const answer = tau * area / 1000;
      return taskBase(
        "Scherkraft am Bolzen",
        `Ein Bolzen hat d = <strong>${d} mm</strong>. Zulässige Scherspannung tau = <strong>${tau} N/mm²</strong>. Welche Scherkraft F ist zulässig?`,
        answer,
        "kN",
        1,
        ["Erst Bolzenfläche berechnen.", "A = pi · d² / 4.", "F = tau · A; anschließend N in kN umrechnen."],
        [`A = pi · ${d}² / 4 = ${formatNumber(area, 1)} mm²`, `F = ${tau} · ${formatNumber(area, 1)} = ${formatNumber(tau * area, 1)} N`, `F = ${formatNumber(answer, 1)} kN`],
        circleDiagram(`d=${d}`)
      );
    },
    (rng, level) => {
      const i = levelIndex(level);
      const force = level === "basis" ? 1000 : int(rng, 500, 12000 + i * 32000, 500);
      const d = level === "basis" ? 10 : int(rng, 10, 80 + i * 130, 5);
      const area = Math.PI * d * d / 4;
      const answer = force / area;
      return taskBase(
        "Flächenpressung",
        `Eine Kraft F = <strong>${force} N</strong> wirkt auf eine runde Fläche mit d = <strong>${d} mm</strong>. Berechne p.`,
        answer,
        "N/mm²",
        2,
        ["Zuerst Kreisfläche berechnen.", "A = pi · d² / 4.", "p = F / A."],
        [`A = pi · ${d}² / 4 = ${formatNumber(area, 1)} mm²`, `p = ${force} / ${formatNumber(area, 1)} = ${formatNumber(answer, 2)} N/mm²`],
        circleDiagram(`d=${d}`)
      );
    }
  ]
};

const generatedTasks = buildTasks();

function buildTasks() {
  const result = {};

  for (const category of CATEGORIES) {
    result[category.id] = {};
    for (const difficulty of DIFFICULTIES) {
      const rng = rngFactory(hashString(`${category.id}-${difficulty.id}`));
      const templates = [...TEMPLATES[category.id], ...EXTRA_TEMPLATES[category.id]];
      result[category.id][difficulty.id] = Array.from({ length: TASKS_PER_LEVEL }, (_, index) => {
        const template = templates[index];
        const task = template(rng, difficulty.id, index);
        return {
          ...task,
          id: `${category.id}-${difficulty.id}-${index + 1}`,
          categoryId: category.id,
          difficultyId: difficulty.id
        };
      });
    }
  }

  return result;
}
