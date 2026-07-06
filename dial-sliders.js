function decimalsForStep(step) {
  const s = String(step);
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

function roundToStep(value, min, max, step) {
  const n = Math.round((value - min) / step);
  const v = min + n * step;
  const d = decimalsForStep(step);
  return Math.max(min, Math.min(max, Number(v.toFixed(d))));
}

function formatValue(value, step) {
  return value.toFixed(decimalsForStep(step));
}

function hashMarks(min, max, step) {
  const discreteSteps = (max - min) / step;
  if (discreteSteps <= 10) {
    return Array.from({ length: Math.max(discreteSteps - 1, 0) }, (_, i) => ({
      left: (((i + 1) * step) / (max - min)) * 100,
    }));
  }
  return Array.from({ length: 9 }, (_, i) => ({ left: (i + 1) * 10 }));
}

function snapClickValue(raw, min, max, step) {
  const steps = (max - min) / step;
  if (steps <= 10) {
    return roundToStep(raw, min, max, step);
  }
  const decile = Math.round(((raw - min) / (max - min)) * 10) / 10;
  return roundToStep(min + decile * (max - min), min, max, step);
}

function suffixFromValEl(valEl) {
  if (!valEl) return "";
  const match = valEl.textContent.trim().match(/^[-\d.]+(.*)$/);
  return match && match[1] ? match[1] : "";
}

function initDialSlider(input) {
  if (input.dataset.dialReady === "true") return;

  const min = Number(input.min);
  const max = Number(input.max);
  const step = Number(input.step) || 1;
  const rowEl = input.closest(".ctrl") || input.closest(".ctl");
  const sideLabel = rowEl?.querySelector(":scope > label");
  const labelText =
    sideLabel?.textContent?.trim() ||
    rowEl?.querySelector(".label-head span:first-child, .row label")?.textContent?.trim() ||
    input.id.replace(/^slider-/, "");

  let valEl =
    document.getElementById(`${input.id}V`) ||
    rowEl?.querySelector(":scope > .val") ||
    rowEl?.querySelector(".val") ||
    document.getElementById(`v_${input.id}`) ||
    document.getElementById(`val-${input.id.replace("slider-", "")}`);
  const valueSuffix = suffixFromValEl(valEl);
  if (!valEl) {
    valEl = document.createElement("span");
    valEl.id = `${input.id}V`;
    valEl.hidden = true;
    rowEl?.appendChild(valEl);
  } else {
    valEl.hidden = true;
  }

  if (sideLabel) sideLabel.hidden = true;
  rowEl?.querySelector(".label-head, .row")?.remove();
  if (rowEl) rowEl.classList.add("dial-row");

  input.classList.add("dial-source");
  input.tabIndex = -1;

  const wrap = document.createElement("div");
  wrap.className = "dial-slider-wrap";

  const track = document.createElement("div");
  track.className = "dial-slider";
  track.setAttribute("role", "slider");
  track.setAttribute("aria-valuemin", String(min));
  track.setAttribute("aria-valuemax", String(max));
  track.setAttribute("aria-label", labelText);

  const marksEl = document.createElement("div");
  marksEl.className = "dial-hashmarks";
  for (const mark of hashMarks(min, max, step)) {
    const m = document.createElement("div");
    m.className = "dial-hashmark";
    m.style.left = `${mark.left}%`;
    marksEl.appendChild(m);
  }

  const fill = document.createElement("div");
  fill.className = "dial-fill";

  const handle = document.createElement("div");
  handle.className = "dial-handle";

  const name = document.createElement("span");
  name.className = "dial-label";
  name.textContent = labelText;

  const value = document.createElement("span");
  value.className = "dial-value";

  track.append(marksEl, fill, handle, name, value);
  wrap.appendChild(track);
  input.before(wrap);

  let dragging = false;
  let clickMode = true;
  let downPos = null;

  const percent = (v) => ((v - min) / (max - min)) * 100;
  const formatDialValue = (v) => formatValue(v, step) + valueSuffix;

  const setVisual = (v, active = false) => {
    const p = percent(v);
    fill.style.width = `${p}%`;
    handle.style.left = `max(4px, calc(${p}% - 7px))`;
    track.classList.toggle("dial-slider-active", active);
    value.textContent = formatDialValue(v);
    track.setAttribute("aria-valuenow", String(v));
  };

  const commit = (v, { live = false } = {}) => {
    const next = roundToStep(v, min, max, step);
    const active = live || dragging || track.matches(":hover");
    if (Number(input.value) !== next) {
      input.value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      setVisual(next, active);
      if (valEl) valEl.textContent = formatDialValue(next);
    }
  };

  const valueFromX = (clientX) => {
    const rect = track.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return min + t * (max - min);
  };

  track.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    track.setPointerCapture(e.pointerId);
    dragging = false;
    clickMode = true;
    downPos = { x: e.clientX, y: e.clientY };
    setVisual(Number(input.value), true);
  });

  track.addEventListener("pointermove", (e) => {
    if (!downPos) return;
    const dx = e.clientX - downPos.x;
    const dy = e.clientY - downPos.y;
    if (clickMode && Math.hypot(dx, dy) > 3) {
      clickMode = false;
      dragging = true;
      track.classList.add("dial-dragging");
    }
    if (!clickMode) {
      commit(valueFromX(e.clientX), { live: true });
    }
  });

  const endPointer = (e) => {
    if (!downPos) return;
    if (clickMode) {
      commit(snapClickValue(valueFromX(e.clientX), min, max, step));
    } else {
      commit(valueFromX(e.clientX));
    }
    dragging = false;
    clickMode = false;
    downPos = null;
    track.classList.remove("dial-dragging");
    setVisual(Number(input.value), false);
    try {
      track.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  track.addEventListener("pointerup", endPointer);
  track.addEventListener("pointercancel", endPointer);

  track.addEventListener("mouseenter", () => setVisual(Number(input.value), true));
  track.addEventListener("mouseleave", () => {
    if (!downPos) setVisual(Number(input.value), false);
  });

  const refreshVisual = () => {
    setVisual(Number(input.value), dragging || track.matches(":hover"));
  };

  input.addEventListener("input", refreshVisual);
  input.addEventListener("change", refreshVisual);

  setVisual(Number(input.value), false);
  input.dataset.dialReady = "true";
}

function initDialSliders(root) {
  if (!root) return;
  root.classList.add("dialkit-controls");
  root.querySelectorAll('input[type="range"]').forEach(initDialSlider);
}

function initAllDialSliders() {
  ["controls", "canvasTextPanel", "canvasLogoPanel"].forEach((id) => {
    initDialSliders(document.getElementById(id));
  });
}

function syncDialSliders() {
  document.querySelectorAll(".dial-source").forEach((input) => {
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
