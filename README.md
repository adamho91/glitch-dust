# Glitch Dust Maker

Static local prototype for the fal glitch dust maker and related views.

## Local Development

Prerequisites:

- Python 3

Start a local server:

```sh
python3 scripts/serve.py
```

Then open:

- Main tool: http://127.0.0.1:5173/index.html
- Lite tool: http://127.0.0.1:5173/lite.html
- Lower thirds: http://127.0.0.1:5173/lower-thirds.html
- Typer (typography only): http://127.0.0.1:5173/typer.html
- Video Studio (Shift+6): http://127.0.0.1:5173/video.html

Gallery routes are disabled locally for now.

You can also run:

```sh
python3 scripts/serve.py --open
```

## Build Helpers

Regenerate derived files:

```sh
python3 scripts/build-default-presets.py
python3 build_lite.py
python3 scripts/build_app_brand.py
```

Individual generators:

```sh
python3 scripts/build-default-presets.py
python3 build_lite.py
python3 scripts/build_app_brand.py
python3 scripts/build-embed-runtime-min.py
```

Notes:

- `lite.html` is generated from `index.html` by `build_lite.py`.
- `default-presets.js` is generated from `default-presets.json`.
- `assets/app-brand.svg` is generated from `assets/app-brand.frag.svg` and `scripts/build_app_brand.py`.
- `webflow-embed-runtime.min.js` and `webflow-embed-runtime.min.src.js` are generated from `webflow-embed-runtime.js` by `scripts/build-embed-runtime-min.py` (requires `python3 -m pip install --user rjsmin`). Maxi loads the `.src.js` bundle via a script tag (works without a server) and inlines the minified runtime into embed exports to stay under Webflow's 50,000-character limit — rerun after editing the runtime.

## Video Studio

A scene-based video editor sharing the existing fal palettes, Focal Upright font, and local MP4 muxer. Open **Shift+6** from any main tool page; Video is hidden from the navigation bar. Serve it over localhost using the command above; ES modules and browser video encoding need a local server.

Colors opens with 30 true two-color pairings; shuffle follows both the color-count and family filters. Choose **All palettes** to browse all 90 combinations. New starter scenes use two hues across text, prompts, and diffusion; saved projects and imported presets retain their colors. The [dynamic chart plan](docs/video-chart-plan.md) describes proposed matrix, share-bar, and multi-series chart work.

- Fifty-one responsive layouts, a seeded diffusion field built from square/circle primitives, 90 palette combinations, and custom colors. Node size, maximum node count, min/max shape scale, primitive balance, sweep/softness, and weighted oversize tiers (2×–8×) follow the Glitch Dust Maker controls. Patterns are deterministic at any timeline position.
- **Copy SVG** copies the selected slide as editable SVG markup with fully revealed text and the pattern at the current time. SVG is also available in Export. Shapes and Focal text stay vector; placed photos and the current video frame are embedded PNGs. The local Focal font is embedded when readable; editors that ignore embedded fonts need Focal installed. Slide SVG excludes page transitions.
- **Chart from screenshot…** accepts a PNG, JPEG or WebP via upload, drop or paste. Local macOS Vision reads printed labels and values, then a review panel lets you correct the data, choose any data layout, and apply White/purple, Lt blue/royal, Lt pink/red, Olive/yellow, or your current palette. These visual rules are adapted from the supplied `fal-data-graphics` skill; this app keeps its shared canvas renderer and SVG export. The reader supports a single series with visible values, not chart digitization or AI inference of unlabeled marks. Review axis ticks, units and every value before adding a slide. Nothing is sent to a cloud service.
- Screenshot recognition requires macOS, Apple Command Line Tools, and `python3 scripts/serve.py` running. The first recognition compiles a small native helper into the system temporary directory. File-opened pages use the loopback server on port 5173; manual data entry remains available without it. Input images are capped at 20 MB / 40 megapixels and temporary files are removed after recognition.
- Chart labels and values use smaller Focal type and zero tracking, independently of headline tracking on type layouts.
- **Clear shapes under charts** reserves padded space around foreground charts and square grids, removing whole background nodes throughout their animation. It defaults on, saves per scene, and works independently of text clearing.
- **Clear shapes under text** removes entire diffusion primitives overlapping padded headline, prompt, and chart-label bounds, including entrance motion. It defaults on and saves per scene. Patterns default off on non-cover layouts until explicitly enabled.
- **Presets** in Design → Diffusion loads the shared Shift+1/Shift+2 preset library and built-ins. Preview on the current layout, optionally include preset text, then apply. Import exported preset JSON when switching browsers or between file and localhost addresses. Colors and supported pattern controls transfer into editable Video diffusion; source animation modes, wave envelopes, logos, palette media, and other unsupported effects are not reproduced. Video layout, media, data, and scene timing stay intact.
- The first ten additional layouts: Big Stat, Stat Grid, Bar Chart, Column Chart, Square Share (100 square cells), Progress, Comparison, Steps, Quote, and End Card. Filter the layout picker by Charts & stats, Type, or Media. Data layouts accept up to eight `Label | number` rows, with prefix/suffix, decimal places, and scale/goal controls. Bar and column charts support negative values; Square Share and Progress show a clamped percentage of the chosen goal (default 100). Each layout states how many input rows it uses.
- Focal-only headlines, optional captions, and word-by-word prompt backgrounds. Adjust weight, tracking, line height, alignment, prompt colors, padding, word gaps, corner radius, and entrance animation. No decorative scene footers or ornamental pattern modes.
- **Type → Type treatment → Background fill · no padding** adds a square fill tightly around each headline line using the Prompt background box/text colors. It keeps headline size, weight, spacing, alignment, and entrance motion; its padding is always zero, independent of the prompt padding control. This is useful for headlines over media and is included in SVG, still, and video exports.
- Import images and video, place an asset in a scene, or use **Build scenes from all media** to generate a sequence. Each scene has one media slot, with fit/crop, zoom, focal position, darkening, clip start, and looping controls.
- **Media → Placement → Adapt frame to media** fits the frame to the source aspect ratio within the layout. At 100% zoom the full image or video is visible; zoom crops within the adapted frame. Fit entire image keeps the original layout frame. In either mode, media darkening only covers the placed image, so empty margins retain the slide background. This setting saves with the scene and shares preview, still, SVG, and MP4 rendering.
- Click media in the preview and press **Delete/Backspace**, drag it beyond the preview edge, or use **Remove media** above the preview. Escape cancels a drag; releasing inside keeps the media. Removal affects only the selected scene, retains the original in Your material, and supports Undo/Redo. Keyboard users can focus the preview and press Enter to select its media.
- Each upload in **Media → Your material** has a **Delete** button. It removes that asset from the project library and every scene using it; Undo restores both the upload and its scene placements during the current editing session. Deleted uploads are excluded from autosave's active library and project exports. **Remove from scene** sits immediately beneath the selected filename and keeps the upload available for other scenes.
- **Media → Flow from previous scene** defaults on. Consecutive uses of the same upload move between frame, crop, zoom, and dimming settings with a 0.6-second symmetric quadratic curve (shortened for very short scenes), while surrounding content dissolves. Matching video trim/loop settings continue one playback clock across the run; changing those settings starts a new run. Different numbers of media windows dissolve between layouts. The storyboard labels these boundaries **Media flow**. Turn it off on the incoming scene to use its selected transition and restart the clip. Preview and MP4 use the same geometry and timing.
- Add, duplicate, delete, drag to reorder, or move scenes with arrow buttons. Set scene durations from 0.5–60 seconds, up to 100 scenes per project. Cuts, dissolves, wipes, and slides are available. Space toggles playback; Command/Ctrl+Z undoes edits.
- Landscape, vertical, square, and 4:5 compositions. Export the whole sequence as H.264 MP4 at 24/30/60 fps, or the current frame as PNG/JPG. Resolution choices are 720, 1080, and 2160 pixels on the short edge (3840 × 2160 for landscape 4K).
- IndexedDB autosaves the working project and media on this browser/device. **Save project** downloads a portable `.fal-video.json` including the media library. **Open** replaces the working project; save a file first to keep multiple projects. Browser storage can be cleared or run out, so use project files for durable backups.

Video playback and exports are **silent**; audio mixing, freeform multilayer editing, and animated-image decoding are not included. Use MP4 clips for deterministic animated media. MP4 export requires browser H.264 WebCodecs support (tested in the Codex Chromium browser); unsupported resolution/frame-rate combinations report an error and can be retried at 720p/30 fps. Export renders each frame and seeks imported clips before encoding, with cancellation and progress reporting. Long/4K projects use more memory because the MP4 is assembled locally.

Motion defaults to 0.6-second ease-out quad for entrances, chart values, and control feedback. Scene transitions use a symmetric ease-in-out quad curve over 0.6 seconds (shortened for very short scenes). Staggered elements retain their start offsets. The former 0.85-second entrance default updates to 0.6 seconds when restoring a project; other custom entrance lengths are preserved.

The 20 Swiss additions include Chapter, Agenda, Manifesto, Two Columns, Margin Title, Closing Note, four image layouts, Ranked Bars, Diverging Bars, Share Bar, Square Plot, Line Chart, Area Chart, Metric List, Featured Metric, Goal Blocks, and Leaderboard. All use Focal and the existing palette/prompt styling. Pattern opacity is passed through unchanged in every layout; the layout check page verifies 100% and 25% against rendered pixels.

Implementation: `video-swiss.mjs` renders the Swiss additions; `video-layouts.mjs` renders the additional data and editorial layouts; `video-motion.mjs` shares motion curves between preview and export; `video-diffusion.mjs` adapts the original seeded noise, diffusion, and rarity formulas; `video-core.mjs` owns scene validation, timeline math, and canvas rendering; `video-studio.js` owns the editor, media library, persistence, and export. No build step or external service is required.

Run the focused timeline, media-trim, deterministic-seed, import, and output-size checks:

```sh
node --test scripts/test-video-core.mjs scripts/test-video-import.mjs
```

Visual layout checks: open `http://127.0.0.1:5173/scripts/test-video-layouts.html` for the layout collection in landscape, vertical, and square formats.

The latest 15 layouts add Title + caption, Numbered story (index uses the Caption field), Paired statements, Prompt grid (up to four newline-separated prompt entries), Reading column, Image right, Image bottom, Two crops (two views of the same asset), Image corner, Waterfall (signed changes accumulating from zero), Square stems, Goal bars, Funnel (stage order preserved), Change (after minus before), and Area squares (area proportional to nonnegative values). New non-cover layouts keep diffusion off until enabled; all retain SVG, still and video export, and charts use zero tracking and node clearance.
