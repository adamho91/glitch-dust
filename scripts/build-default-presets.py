#!/usr/bin/env python3
"""Regenerate default-presets.js from default-presets.json."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = ROOT / "default-presets.json"
data = json.loads(src.read_text(encoding="utf-8"))

store = {
    "version": 1,
    "builtinDefaultsRev": 6,
    "activeId": data.get("activeId") or "builtin-transition",
    "presets": [
        {
            "id": p["id"],
            "name": p["name"],
            "builtin": bool(p.get("builtin")),
            "settings": p["settings"],
        }
        for p in data.get("presets", [])
    ],
}

default = next(p for p in store["presets"] if p["id"] == "builtin-default")
transition = next(p for p in store["presets"] if p["id"] == "builtin-transition")

out = ROOT / "default-presets.js"
out.write_text(
    "// Generated from default-presets.json — do not edit by hand.\n"
    "const DEFAULT_PRESET_STORE = "
    + json.dumps(store, indent=2)
    + ";\n\n"
    "const BUILTIN_DEFAULT_SETTINGS = "
    + json.dumps(default["settings"], indent=2)
    + ";\n\n"
    "const BUILTIN_TRANSITION_SETTINGS = "
    + json.dumps(transition["settings"], indent=2)
    + ";\n\n"
    "function getDefaultPresetStoreTemplate() {\n"
    "  return JSON.parse(JSON.stringify(DEFAULT_PRESET_STORE));\n"
    "}\n",
    encoding="utf-8",
)
print(f"Wrote {out.name} ({len(store['presets'])} presets, activeId={store['activeId']})")
