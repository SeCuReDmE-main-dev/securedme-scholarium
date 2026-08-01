const uiStorageKey = "securedme-ui-state";

const uiLabels = {
  en: { theme: "Theme", day: "Day", night: "Night", access: "Access", contrast: "High contrast", text: "Text size", base: "Base", large: "Large", larger: "Larger", motion: "Reduced motion" },
  fr: { theme: "Thème", day: "Jour", night: "Nuit", access: "Accessibilité", contrast: "Contraste élevé", text: "Taille du texte", base: "Base", large: "Grand", larger: "Très grand", motion: "Mouvement réduit" },
  es: { theme: "Tema", day: "Día", night: "Noche", access: "Accesibilidad", contrast: "Contraste alto", text: "Tamaño del texto", base: "Base", large: "Grande", larger: "Más grande", motion: "Movimiento reducido" },
};

function readUiState() {
  try {
    return { theme: "day", contrast: "normal", fontScale: "base", motion: "normal", ...JSON.parse(localStorage.getItem(uiStorageKey) || "{}") };
  } catch (_) {
    return { theme: "day", contrast: "normal", fontScale: "base", motion: "normal" };
  }
}

function applyUiState(state) {
  const root = document.documentElement;
  root.dataset.theme = state.theme === "night" ? "night" : "day";
  root.dataset.contrast = state.contrast === "high" ? "high" : "normal";
  root.dataset.fontScale = ["base", "large", "larger"].includes(state.fontScale) ? state.fontScale : "base";
  root.dataset.motion = state.motion === "reduced" ? "reduced" : "normal";
}

applyUiState(readUiState());

document.addEventListener("DOMContentLoaded", () => {
  const language = (document.documentElement.lang || "en").slice(0, 2);
  installUtilityConsole(language);
  installFilter("prompts", language);
  installFilter("videos", language);
});

const copy = {
  en: { all: "All", search: "Search", visible: "results", tool: "Tool", role: "Role", difficulty: "Difficulty", taskType: "Task", resultType: "Result", language: "Language", topic: "Topic", date: "Date", format: "Format" },
  fr: { all: "Tous", search: "Rechercher", visible: "résultats", tool: "Outil", role: "Rôle", difficulty: "Difficulté", taskType: "Tâche", resultType: "Résultat", language: "Langue", topic: "Sujet", date: "Date", format: "Format" },
  es: { all: "Todos", search: "Buscar", visible: "resultados", tool: "Herramienta", role: "Rol", difficulty: "Dificultad", taskType: "Tarea", resultType: "Resultado", language: "Idioma", topic: "Tema", date: "Fecha", format: "Formato" },
};

function installUtilityConsole(current) {
  const nav = document.querySelector(".wy-side-scroll");
  if (!nav || nav.querySelector(".se-doc-console")) return;
  const path = window.location.pathname;
  const localizedPath = (target) => {
    if (/\/(en|fr|es)(\/|$)/.test(path)) return path.replace(/\/(en|fr|es)(\/|$)/, `/${target}$2`);
    return `/${target}/`;
  };
  const labels = uiLabels[current] || uiLabels.en;
  const state = readUiState();
  const controls = document.createElement("section");
  controls.className = "se-doc-console";
  controls.setAttribute("aria-label", labels.access);
  controls.innerHTML = `
    <nav class="se-language-switcher" aria-label="Documentation language">
      ${["en", "fr", "es"].map((item) => `<a ${item === current ? 'aria-current="page"' : ""} data-language="${item}" href="${localizedPath(item)}">${item.toUpperCase()}</a>`).join("")}
    </nav>
    <button type="button" class="se-theme-toggle"></button>
    <details class="se-access-controls">
      <summary>${labels.access}</summary>
      <label><input type="checkbox" data-se-contrast> ${labels.contrast}</label>
      <label>${labels.text}<select data-se-font-scale aria-label="${labels.text}"><option value="base">${labels.base}</option><option value="large">${labels.large}</option><option value="larger">${labels.larger}</option></select></label>
      <label><input type="checkbox" data-se-motion> ${labels.motion}</label>
    </details>`;
  nav.appendChild(controls);

  const theme = controls.querySelector(".se-theme-toggle");
  const contrast = controls.querySelector("[data-se-contrast]");
  const fontScale = controls.querySelector("[data-se-font-scale]");
  const motion = controls.querySelector("[data-se-motion]");
  const refresh = () => {
    applyUiState(state);
    theme.textContent = `${labels.theme}: ${state.theme === "night" ? labels.night : labels.day}`;
    theme.setAttribute("aria-pressed", String(state.theme === "night"));
    contrast.checked = state.contrast === "high";
    fontScale.value = state.fontScale;
    motion.checked = state.motion === "reduced";
    try { localStorage.setItem(uiStorageKey, JSON.stringify(state)); } catch (_) { /* Current-session controls still work. */ }
  };
  theme.addEventListener("click", () => { state.theme = state.theme === "night" ? "day" : "night"; refresh(); });
  contrast.addEventListener("change", () => { state.contrast = contrast.checked ? "high" : "normal"; refresh(); });
  fontScale.addEventListener("change", () => { state.fontScale = fontScale.value; refresh(); });
  motion.addEventListener("change", () => { state.motion = motion.checked ? "reduced" : "normal"; refresh(); });
  controls.querySelectorAll("[data-language]").forEach((link) => link.addEventListener("click", () => {
    state.language = link.dataset.language;
    try { localStorage.setItem(uiStorageKey, JSON.stringify(state)); } catch (_) { /* Navigation remains available. */ }
  }));
  refresh();
}

function installFilter(kind, language) {
  const panel = document.querySelector(`[data-se-filter-panel="${kind}"]`);
  const grid = document.querySelector(`[data-se-filter-grid="${kind}"]`);
  if (!panel || !grid) return;
  const cards = [...grid.children];
  const labels = copy[language] || copy.en;
  const fields = kind === "prompts"
    ? ["tool", "role", "difficulty", "taskType", "resultType"]
    : ["tool", "language", "topic", "date", "format"];

  const search = document.createElement("input");
  search.type = "search";
  search.className = "se-filter-search";
  search.placeholder = labels.search;
  search.setAttribute("aria-label", labels.search);
  panel.appendChild(search);

  const selects = fields.map((field) => {
    const attribute = `data-${field.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
    const values = [...new Set(cards.map((card) => card.getAttribute(attribute)).filter(Boolean))].sort();
    const select = document.createElement("select");
    select.dataset.field = attribute;
    select.setAttribute("aria-label", labels[field]);
    select.innerHTML = `<option value="">${labels[field]}: ${labels.all}</option>` + values
      .map((value) => `<option value="${value}">${value}</option>`)
      .join("");
    panel.appendChild(select);
    return select;
  });

  if (kind === "prompts") {
    cards.forEach((card) => {
      const translated = card.getAttribute(`data-title-${language}`);
      const heading = card.querySelector("strong");
      if (translated && heading) heading.textContent = translated;
    });
  }

  const count = document.querySelector(`[data-se-filter-count="${kind}"]`);
  const apply = () => {
    const query = search.value.trim().toLocaleLowerCase(language);
    let visible = 0;
    cards.forEach((card) => {
      const matchesText = !query || card.textContent.toLocaleLowerCase(language).includes(query);
      const matchesFields = selects.every((select) => !select.value || card.getAttribute(select.dataset.field) === select.value);
      const show = matchesText && matchesFields;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (count) count.textContent = `${visible} / ${cards.length} ${labels.visible}`;
  };
  search.addEventListener("input", apply);
  selects.forEach((select) => select.addEventListener("change", apply));
  apply();
}
