#!/usr/bin/env python3
"""Generate lite.html from index.html — run after changing index.html structure."""

from pathlib import Path

ROOT = Path(__file__).parent
src = (ROOT / "index.html").read_text(encoding="utf-8")

html = src
html = html.replace("<title>fal glitch dust maker - social media</title>", "<title>fal glitch dust maker - social media lite</title>")
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
<div class="app-brand-wrap">
  <img class="app-brand" src="assets/app-brand.svg" alt="fal Glitch Dust" width="562" height="175">
</div>
<div class="layout" id="controls">

  <div class="sect">Presets</div>
  <div class="preset-bar">"""

new_header = """<aside class="sidebar">
<div class="app-brand-wrap">
  <img class="app-brand" src="assets/app-brand.svg" alt="fal Glitch Dust" width="562" height="175">
</div>
<div class="layout" id="controls">

  <div class="sect">Presets</div>
  <div id="litePresetGrid" class="lite-preset-grid"></div>
  <div class="lite-preset-actions">
    <button type="button" id="litePresetImport" class="primary">Import presets…</button>
    <button type="button" id="litePresetExport">Export all presets</button>
    <button type="button" id="litePresetClearAll" class="danger">Clear all presets</button>
    <input type="file" id="litePresetImportFile" accept="application/json,.json" hidden>
  </div>
  <p class="hint lite-full-link">Craft looks in Glitch Dust (⇧1), export JSON, import here.</p>

  <div class="lite-hide">
  <div class="preset-bar">"""

if old_header not in html:
    raise SystemExit("Could not find sidebar header marker")
html = html.replace(old_header, new_header, 1)

# Close lite-hide after old preset hint, reopen for grid through distribution
html = html.replace(
    '  <div class="hint">Built-in Default loads on first visit · edits auto-save to the active preset · ⇧1/2/3 switch pages</div>\n\n  <div class="sect">Canvas Size</div>',
    '  <div class="hint">Built-in Default loads on first visit · edits auto-save to the active preset · ⇧1/2/3 switch pages</div>\n  </div>\n\n  <div class="sect">Aspect ratio</div>\n  <div class="lite-canvas-size">',
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

PALETTE_MEDIA_IN_GRID = """  <div class="sect">Palette Media</div>
  <div class="ctrl-check">
    <input type="checkbox" id="nodeMediaEnabled">
    <label for="nodeMediaEnabled">Mask image / video per palette color</label>
  </div>
  <div id="nodeMediaPanel">
    <div class="ctrl">
      <label>Palette blend</label>
      <input type="range" id="nodeMediaBlend" min="0" max="100" value="0" step="1">
      <span class="val" id="nodeMediaBlendV">0</span>
    </div>
    <div class="ctrl-check">
      <input type="checkbox" id="nodeMediaGifLoop" checked>
      <label for="nodeMediaGifLoop">Loop GIFs in preview</label>
    </div>
    <div id="paletteMediaList"></div>
    <div class="hint">One upload per swatch · image, GIF, or video · union mask · GIFs loop when enabled below</div>
  </div>

"""

LITE_PALETTE_MEDIA_BLOCK = """  <div class="lite-palette-media">
  <div class="sect">Palette Media</div>
  <div class="ctrl-check">
    <input type="checkbox" id="nodeMediaEnabled">
    <label for="nodeMediaEnabled">Image / GIF / video per color</label>
  </div>
  <div id="nodeMediaPanel">
    <div class="ctrl lite-palette-media-advanced">
      <label>Palette blend</label>
      <input type="range" id="nodeMediaBlend" min="0" max="100" value="0" step="1">
      <span class="val" id="nodeMediaBlendV">0</span>
    </div>
    <div class="ctrl-check lite-palette-media-advanced">
      <input type="checkbox" id="nodeMediaGifLoop" checked>
      <label for="nodeMediaGifLoop">Loop GIFs in preview</label>
    </div>
    <div id="paletteMediaList"></div>
    <div class="hint">Upload one file per swatch · image, GIF, or MP4</div>
  </div>
  </div>

"""

if PALETTE_MEDIA_IN_GRID not in html:
    raise SystemExit("Could not find Palette Media block in index.html")
html = html.replace(PALETTE_MEDIA_IN_GRID, "", 1)

tonal_tail = (
    '  <div class="ctrl bg-custom-row" id="bgCustomRow" style="display:none">\n'
    '    <label>Custom</label>\n'
    '    <input type="color" id="bgCustom" value="#004012">\n'
    '  </div>\n\n'
    '  <div class="sect">Custom Weights'
)
if tonal_tail not in html:
    raise SystemExit("Could not find tonal colors section tail")
html = html.replace(
    tonal_tail,
    '  <div class="ctrl bg-custom-row" id="bgCustomRow" style="display:none">\n'
    '    <label>Custom</label>\n'
    '    <input type="color" id="bgCustom" value="#004012">\n'
    '  </div>\n\n'
    + LITE_PALETTE_MEDIA_BLOCK
    + '  <div class="sect">Custom Weights',
    1,
)

LITE_SIDEBAR_TEXT = """
  <div class="lite-text-block">
  <div class="sect">Headline</div>
  <textarea id="overlayText" class="text-area" placeholder="Headline text…" spellcheck="false"></textarea>
  </div>
  <div class="lite-text-block">
  <div class="sect">Prompt</div>
  <textarea id="promptText" class="text-area" placeholder="Caption / prompt…" spellcheck="false" style="min-height:52px"></textarea>
  </div>

  <div class="ctrl-check lite-logo-toggle">
    <input type="checkbox" id="liteLogoEnabled">
    <label for="liteLogoEnabled">Show fal logo</label>
  </div>

  <div class="lite-hide">
"""

custom_weights_marker = '  <div class="sect">Custom Weights'
tonal_presets_pos = html.find('id="tonalPresets"')
custom_weights_pos = html.find(custom_weights_marker)
if tonal_presets_pos == -1 or custom_weights_pos == -1 or tonal_presets_pos > custom_weights_pos:
    raise SystemExit("Could not find tonal presets / Custom Weights marker for lite sidebar text")
html = html[:custom_weights_pos] + LITE_SIDEBAR_TEXT + html[custom_weights_pos:]

html = html.replace(
    '    <div class="btn-row action-play">',
    '    <div class="btn-row action-play lite-play-row">',
    1,
)

html = html.replace(
    '    <div class="action-group-label">Video</div>\n    <div class="btn-grid action-export">',
    '    <div class="action-group-label lite-video-label">Video</div>\n    <div class="btn-grid action-export lite-video-export">',
    1,
)
if 'lite-video-export' not in html:
    raise SystemExit("Could not tag lite video export buttons")

html = html.replace(
    '<div class="canvas-text-panel" id="canvasTextPanel">',
    '<div class="canvas-text-panel lite-hide" id="canvasTextPanel">',
    1,
)
html = html.replace(
    '<div class="canvas-logo-panel is-collapsed" id="canvasLogoPanel">',
    '<div class="canvas-logo-panel lite-hide is-collapsed" id="canvasLogoPanel">',
    1,
)

# Remove duplicate textareas from hidden canvas panel (keep ids in sidebar only)
import re
panel_start = html.find('<div class="canvas-text-panel lite-hide"')
panel_end = html.find('<div class="canvas-logo-panel lite-hide')
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

if 'id="overlayText"' not in html or 'id="promptText"' not in html:
    raise SystemExit("lite build missing overlayText/promptText in sidebar")
if 'id="overlayTextStub"' not in html:
    raise SystemExit("lite build missing canvas textarea stubs")
if 'lite-palette-media' not in html or 'id="paletteMediaList"' not in html:
    raise SystemExit("lite build missing palette media block")

(ROOT / "lite.html").write_text(html, encoding="utf-8")
print("Wrote lite.html")
