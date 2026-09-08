// Brand choices adapted from the user's fal-data-graphics skill. Existing scene
// palettes remain available; import applies only a reviewed, explicit choice.
export const CHART_PALETTES = {
  house: {
    bg: "#ffffff",
    fg: "#121216",
    accent: "#5718c0",
  },
  blue: { bg: "#c5e9ff", fg: "#0a2a6b", accent: "#115ef3" },
  pink: { bg: "#ffc4d8", fg: "#4a0018", accent: "#ec0649" },
  olive: {
    bg: "#403700",
    fg: "#ffffff",
    accent: "#ffff00",
  },
};
export function chartNumber(raw) {
  const match = String(raw)
    .trim()
    .replace(/−/g, "-")
    .match(
      /^([$€£]?)([-+]?\d[\d,]*(?:\.\d+)?|[-+]?\.\d+)\s*([kmb])?\s*(%|ms|s|×|x)?$/i,
    );
  if (!match) return null;
  const value =
    Number(match[2].replace(/,/g, "")) *
    ({ k: 1e3, m: 1e6, b: 1e9 }[match[3]?.toLowerCase()] || 1);
  return Number.isFinite(value) && Math.abs(value) <= 1e12
    ? { value, prefix: match[1], suffix: match[4] || "" }
    : null;
}
export function suggestChart(lines) {
  const clean = lines
    .filter(
      (l) =>
        typeof l.text === "string" &&
        Number.isFinite(l.x) &&
        Number.isFinite(l.y),
    )
    .map((l) => ({
      ...l,
      text: l.text.trim(),
      cx: l.x + l.width / 2,
      cy: l.y + l.height / 2,
    }));
  const numbers = clean
    .map((l) => ({ ...l, number: chartNumber(l.text) }))
    .filter((l) => l.number);
  const labels = clean.filter((l) => !chartNumber(l.text));
  const inline = [];
  for (const label of labels) {
    const m = label.text.match(
      /^(.+?)\s+[|:]?\s*([$€£]?[-+−]?\d[\d,.]*\s*[kmb]?\s*(?:%|ms|s|×|x)?)$/i,
    );
    if (m && chartNumber(m[2]))
      inline.push({
        label: m[1].trim().replace(/\s*[|:]$/, ""),
        ...chartNumber(m[2]),
        x: label.x,
        y: label.y,
      });
  }
  function match(orientation) {
    const used = new Set(),
      pairs = [];
    for (const label of [...labels].sort((a, b) =>
      orientation === "horizontal" ? a.y - b.y : a.x - b.x,
    )) {
      const options = numbers
        .filter((n) => !used.has(n))
        .map((n) => ({
          n,
          d:
            orientation === "horizontal"
              ? Math.abs(n.cy - label.cy)
              : Math.abs(n.cx - label.cx),
        }))
        .filter(({ n, d }) =>
          orientation === "horizontal"
            ? d < Math.max(0.025, label.height * 0.8) &&
              n.x > label.x + label.width * 0.6
            : d < 0.065 && n.cy < label.cy,
        )
        .sort((a, b) => a.d - b.d);
      if (options.length) {
        const { n } = options[0];
        used.add(n);
        pairs.push({ label: label.text, ...n.number, x: label.x, y: label.y });
      }
    }
    return pairs;
  }
  const horizontal = match("horizontal"),
    vertical = match("vertical");
  let rows =
    inline.length >= Math.max(horizontal.length, vertical.length)
      ? inline
      : horizontal.length > vertical.length
        ? horizontal
        : vertical;
  const layout = rows === vertical ? "columns" : "bars";
  const units = new Set(rows.map((r) => r.prefix + "|" + r.suffix));
  const mixedUnits = units.size > 1;
  const overflow = rows.length > 8;
  rows = rows.slice(0, 8);
  const usedLabels = new Set(rows.map((r) => r.label));
  const title =
    labels
      .filter(
        (l) =>
          l.y < 0.2 &&
          !usedLabels.has(l.text) &&
          !inline.some((r) => r.y === l.y),
      )
      .sort((a, b) => b.height - a.height)[0]?.text || "";
  return {
    rows,
    title,
    layout,
    prefix: mixedUnits ? "" : rows[0]?.prefix || "",
    suffix: mixedUnits ? "" : rows[0]?.suffix || "",
    mixedUnits,
    overflow,
    message: !rows.length
      ? "No reliable label/value pairs found. Enter the values visible in your reference."
      : mixedUnits
        ? "Mixed units detected. Use one unit per chart and check the values below."
        : overflow
          ? "More than 8 items found. Split the data across slides; only the first 8 are included."
          : "Check every label and value against the reference. Axis ticks can be mistaken for data; unlabeled values are not estimated.",
  };
}
