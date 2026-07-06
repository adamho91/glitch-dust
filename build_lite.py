#!/usr/bin/env python3
"""Generate lite.html from index.html — run after changing index.html structure."""

from pathlib import Path

ROOT = Path(__file__).parent
src = (ROOT / "index.html").read_text(encoding="utf-8")

html = src
html = html.replace("<title>fal — Glitch Dust</title>", "<title>fal — Glitch Dust Lite</title>")
html = html.replace(
    '<script src="dial-sliders.js"></script>',
    '<script src="dial-sliders.js"></script>\n<script src="preset-io.js"></script>\n<link rel="stylesheet" href="lite-ui.css">\n<script>window.GLITCH_DUST_LITE = true;</script>\n<script src="lite-ui.js"></script>',
)
html = html.replace("<body>", '<body class="lite-app">')
html = html.replace(
    "<script>\nconst SVG_NS",
    "<script>\nconst GLITCH_DUST_LITE = true;\nconst SVG_NS",
)

old_header = """<aside class="sidebar">
<h1><span>fal</span> Glitch Dust</h1>
<p class="subtitle">Controls · settings saved locally</p>
<div class="layout" id="controls">

  <div class="sect">Presets</div>
  <div class="preset-bar">"""

new_header = """<aside class="sidebar">
<h1><span>fal</span> Glitch Dust Lite</h1>
<p class="subtitle">Pick a look · aspect ratio · colors · text</p>
<div class="layout" id="controls">

  <div class="sect">Presets</div>
  <div id="litePresetGrid" class="lite-preset-grid"></div>
  <div class="lite-preset-actions">
    <button type="button" id="litePresetImport" class="primary">Import presets…</button>
    <button type="button" id="litePresetExport">Export all presets</button>
    <input type="file" id="litePresetImportFile" accept="application/json,.json" hidden>
  </div>
  <p class="hint lite-full-link">Craft looks in the <a href="index.html">full editor</a>, export JSON, import here.</p>

  <div class="lite-hide">
  <div class="preset-bar">"""

if old_header not in html:
    raise SystemExit("Could not find sidebar header marker")
html = html.replace(old_header, new_header, 1)

# Close lite-hide after old preset hint, reopen for grid through distribution
html = html.replace(
    '  <div class="hint">Built-in Default loads on first visit · edits auto-save to the active preset · <a href="lite.html" style="color:#AB77FF;text-decoration:none">Lite editor</a></div>\n\n  <div class="sect">Canvas Size</div>',
    '  <div class="hint">Built-in Default loads on first visit · edits auto-save to the active preset</div>\n  </div>\n\n  <div class="sect">Aspect ratio</div>\n  <div class="lite-canvas-size">',
    1,
)

html = html.replace(
    '  <div class="hint">Output is full resolution; preview on the right is half-size.</div>\n\n  <div class="sect">Grid</div>',
    '  <div class="ctrl lite-ratio-row"><label>Ratio</label><div></div></div>\n  </div>\n\n  <div class="lite-hide">\n  <div class="sect">Grid</div>',
    1,
)

html = html.replace(
    '      <option value="3">3</option>\n    </select>\n  </div>\n\n  <div class="sect">Tonal Colors</div>',
    '      <option value="3">3</option>\n    </select>\n  </div>\n  </div>\n\n  <div class="sect">Tonal Colors</div>',
    1,
)

html = html.replace(
    '  <div class="hint">fal brand combos — faded chip = suggested background.</div>\n\n  <div class="sect">Custom Weights',
    '  <div class="hint">fal brand combos — faded chip = suggested background.</div>\n\n  <div class="lite-text-block">\n  <div class="sect">Headline</div>\n  <textarea id="overlayText" class="text-area" placeholder="Headline text…" spellcheck="false"></textarea>\n  </div>\n  <div class="lite-text-block">\n  <div class="sect">Prompt</div>\n  <textarea id="promptText" class="text-area" placeholder="Caption / prompt…" spellcheck="false" style="min-height:52px"></textarea>\n  </div>\n\n  <div class="lite-hide">\n  <div class="sect">Custom Weights',
    1,
)

html = html.replace(
    '  <div class="btn-row">\n    <button class="primary" id="genBtn">Generate</button>\n    <button id="animBtn">Pause</button>',
    '  </div>\n\n  <div class="btn-row lite-play-row">\n    <button class="primary" id="genBtn">Generate</button>\n    <button id="animBtn">Pause</button>',
    1,
)

html = html.replace(
    '<div class="canvas-text-panel" id="canvasTextPanel">',
    '<div class="canvas-text-panel lite-hide" id="canvasTextPanel">',
    1,
)
html = html.replace(
    '<div class="canvas-logo-panel" id="canvasLogoPanel">',
    '<div class="canvas-logo-panel lite-hide" id="canvasLogoPanel">',
    1,
)

# Remove duplicate textareas from hidden canvas panel (keep ids in sidebar only)
import re
panel_start = html.find('<div class="canvas-text-panel lite-hide"')
panel_end = html.find('<div class="canvas-logo-panel lite-hide"')
if panel_start == -1 or panel_end == -1:
    raise SystemExit("Could not find canvas panels")
panel = html[panel_start:panel_end]
panel = re.sub(
    r'<textarea id="overlayText"[^>]*>.*?</textarea>\s*',
    '<textarea id="overlayTextStub" class="lite-hide" hidden aria-hidden="true"></textarea>\n      ',
    panel,
    count=1,
    flags=re.DOTALL,
)
panel = re.sub(
    r'<textarea id="promptText"[^>]*>.*?</textarea>\s*',
    '<textarea id="promptTextStub" class="lite-hide" hidden aria-hidden="true"></textarea>\n      ',
    panel,
    count=1,
    flags=re.DOTALL,
)
html = html[:panel_start] + panel + html[panel_end:]

html = html.replace(
    "initPresetSystem();\nupdateTextMarginLabel();",
    "initPresetSystem();\nif (typeof initLiteUi === 'function') initLiteUi();\nupdateTextMarginLabel();",
    1,
)

(ROOT / "lite.html").write_text(html, encoding="utf-8")
print("Wrote lite.html")
