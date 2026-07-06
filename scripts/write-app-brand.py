#!/usr/bin/env python3
"""Write assets/app-brand.svg from pasted source (stdin or first arg)."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
dest = ROOT / "assets" / "app-brand.svg"

if len(sys.argv) > 1:
    data = Path(sys.argv[1]).read_text(encoding="utf-8")
else:
    data = sys.stdin.read()

if "<svg" not in data:
    raise SystemExit("Expected SVG content")

dest.write_text(data.strip() + "\n", encoding="utf-8")
print(f"Wrote {dest} ({dest.stat().st_size} bytes)")
