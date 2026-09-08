# Dynamic charts for Video Studio

Status: proposed implementation plan. The two-color palette defaults are implemented; the chart work below is planned.

## Direction

Use the supplied matrix, horizontal bars, and paired trend chart as structural references. Keep the existing Glitch Dust identity: Focal throughout, zero tracking on chart labels and values, square geometry, flat fills, generous gutters, prompt-style callouts, and no decorative borders. The blue editor outlines in the third reference are selection guides, not part of the design.

Make motion explain a comparison: reveal a row, advance a period, isolate a threshold, then hold the conclusion. Every chart must also work as a settled still. Keep existing diffusion controls and node clearance, with patterns off on data slides by default.

Start with one background and one foreground color. Encode extra information using direct labels, solid versus dashed strokes, and discrete tints derived from the pair. A second series hue or categorical palette is an explicit option for data that needs it. Keep node opacity independent of chart tints and never fade the background pattern as a side effect.

## First release: three chart families

| Family | Composition and editable data | Motion and focal point |
| --- | --- | --- |
| Threshold matrix | Row and column headings with aligned rectangular cells. Up to 6 × 6, editable values, units, threshold boundaries and labels. Discrete shades of the selected foreground, with text in the pair's contrasting color. Missing values display a dash and never become zero. | Reveal columns as concurrency or time increases. Finish by emphasizing a selected row, column, or threshold crossing with an inset square marker and prompt callout. Keep cell values fixed while revealing them so colors never imply a false intermediate measurement. |
| Share-of-total bars | Extend Goal bars with a common denominator, aligned value column, optional empty tracks, and endpoint ticks. Up to 8 categories on wide formats; responsive row limits keep labels readable. Offer raw units or percentages, with explicit total and optional sum validation. | Grow bars from a shared zero baseline with a short stagger. Keep labels stationary. Optionally show one row at a time, then the full comparison. One selected row can carry the takeaway; every category need not get a different hue. |
| Multi-series trend | Shared category/time axis with 2–3 named series and up to 12 points. Solid and dashed lines with square markers, labels at line ends, and at most 3–4 grid levels. Explicit gaps for missing observations; no smoothed or invented curves. | Reveal each segment in period order. Labels attach only to observed points. End labels remain readable and separated. An optional final prompt reports a chosen delta or comparison. Start with the reference's generated-versus-retained story. |

For the references' richer palettes, provide a deliberate “Series colors” choice after the minimal default. Four threshold bands can use four discrete shades of a single foreground; color plus written values and range labels communicates the bands. Avoid continuous gradients and color changes unrelated to the data.

## Next directions

| Direction | Why it earns a separate layout | Proposed motion |
| --- | --- | --- |
| Before / after pairs | Two values per subject, joined by a thin connector with square endpoints; directly shows magnitude and direction of change. | Reveal the baseline, then move to the second measured state and hold its delta. |
| Ranked change | Compare category ranks across named snapshots while maintaining category identity. | Stable row keys animate to new positions; value changes and movement share the same 0.6-second beat. |
| Contribution bridge | Extend Waterfall with explicit subtotal and total rows and optional grouping. | Build each signed contribution in sequence, then emphasize the total. |
| Small multiples | Repeat one chart on a shared scale to compare segments without piling several series into one plot. | Reveal panels in reading order; synchronize time steps across panels. |
| Range comparison | Low, central, and high values per subject, with the meaning of each bound stated. | Reveal the interval, then its central square marker. Never imply uncertainty when the supplied bounds mean something else. |
| Cohort matrix | A matrix with a cohort axis and elapsed-period axis, including intentionally unavailable cells. | Reveal elapsed periods together to make retention patterns comparable. |

These are extensions of the same grid and type system. Build the first three before expanding the picker again.

## Editing experience

1. Choose a chart family. Show the fields that family needs, with a compact editable table for matrices and multiple series. Keep the existing `Label | value` input for simple charts.
2. Paste tab-separated spreadsheet cells or CSV with headers. Preview the parsed table and validate units, missing values, row limits, totals, and category order before applying it.
3. Select the focal row, series, cell, or comparison. Edit one optional takeaway in the existing prompt style. Source and units are optional fields, not automatic micro-text on every slide.
4. Choose a motion preset: Together, By row, By period, or Compare states. Expose only relevant choices. Each preset has a settled end state and a readable hold.
5. Use the existing scene duration and storyboard. Add small labeled internal beat markers to the selected chart scene, visually distinct from page transition markers. Clicking a beat seeks the preview; keep beat detail out of unselected scene strips.

Screenshot import first proposes the chart family and its table, then asks for correction in the review panel. The current single-series OCR cannot reliably reconstruct matrices or multiple lines: extend header/cell association and show uncertain or blank cells explicitly. Never synthesize hidden values from unlabeled marks. A screenshot is a reference, not an authoritative dataset.

## Shared data and rendering

- Add an optional versioned `chartData` object to a scene. It holds stable row/category keys, series keys and labels, nullable numeric values, units, and explicit domain/threshold settings. Matrix cells index row and column keys; series values index category keys.
- Add `chartMotion` for reveal order, selected focus, and optional named snapshots. Keep it separate from slide transitions. Validate keys, finite numbers, limits, and snapshot compatibility during project import.
- Preserve legacy `dataRows`: adapt it to one series when a richer renderer needs it, without rewriting existing projects. Existing layouts and exports retain their current behavior.
- Resolve the entire chart geometry once from the data, format, and Focal metrics. Reserve axes, end labels, callouts, and source space before drawing marks. Report excessive content instead of shrinking into micro-text.
- Share a deterministic time-based chart-state function between preview, thumbnails, MP4, and still export. Derive geometry from time rather than advancing mutable animation state so backward scrubbing is identical to forward playback.
- Use 0.6-second out-quad for entrances and position/value changes; use the symmetric 50/50 curve for comparisons between complete states. Stagger starts, then compress the sequence for short scenes so the conclusion still gets a hold. No spring overshoot on quantitative marks.
- Keep scale domains fixed over a reveal or comparison sequence. Bar lengths use a zero baseline; trend domains may be tailored if clearly labeled. Treat gaps, signed values, all-zero data, and equal-value domains explicitly.
- Extend the existing Canvas/SVG recorder only for primitives the new charts actually need, including dashed line support if absent. Continue editable SVG text, Focal embedding, whole-node exclusion, and seam-free squares. No separate export-only chart implementation.
- PNG/JPG keep the current playhead frame. Copy SVG retains its settled-slide behavior, using the selected chart snapshot; expose snapshot selection explicitly for charts with multiple states. MP4 reproduces all beats.

## Build order and acceptance

1. **Data foundation and share bars:** add the structured data adapter/table editor, scale validation, and reveal-state helper; extend Goal bars as the first end-to-end chart. Check raw/percent modes, explicit totals, and save/open roundtrips.
2. **Matrix:** implement cell layout, threshold validation, missing cells, readable text contrast, row/column focus, and responsive capacity. Add reviewed matrix OCR only after manual input works.
3. **Multi-series trend:** implement shared scales, dashed/solid differentiation, square markers, end-label collision handling, missing-point gaps, and ordered reveals. Add reviewed table import before attempting screenshot association.
4. **Story controls:** add focus callouts, internal beat markers, and named comparison snapshots. Reuse them for the later chart directions.
5. **Visual and export checks:** verify wide, portrait, square, and 4:5; long labels; negative, zero, missing, and equal values; reduced motion; saved legacy projects; forward/backward scrubbing; and final-frame parity across preview, SVG, PNG, and MP4. At 100% pattern opacity, nodes must remain fully opaque outside chart/text clearance zones.

Done means the three reference-inspired families are editable and exportable, with one coherent minimal default and meaningful motion. Adding picker labels alone is not completion.
