#!/usr/bin/env python3
"""Assemble assets/app-brand.svg from logo, bar, text paths, and dust blocks."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "assets" / "app-brand.svg"
FRAG = ROOT / "assets" / "app-brand.frag.svg"

LOGO = (
    "M77.9139 12.0312C79.7162 12.0312 81.1606 13.4895 81.3329 15.2744C82.8697 31.1953 "
    "95.6049 43.8655 111.607 45.3945C113.401 45.5659 114.867 47.0029 114.867 48.7959V78.7744"
    "C114.867 80.5675 113.401 82.0053 111.607 82.1768C95.605 83.7058 82.8697 96.376 "
    "81.3329 112.297C81.1604 114.082 79.7161 115.539 77.9139 115.539H47.7821C45.98 115.539 "
    "44.5357 114.082 44.3632 112.297C42.8263 96.376 30.0911 83.7058 14.0887 82.1768C12.2947 "
    "82.0053 10.829 80.5675 10.829 78.7744V48.7959C10.8291 47.0029 12.2948 45.5659 "
    "14.0887 45.3945C30.0911 43.8655 42.8263 31.1953 44.3632 15.2744C44.5355 13.4895 "
    "45.9798 12.0312 47.7821 12.0312H77.9139ZM63.0262 32.5166C45.7357 32.5168 31.7187 "
    "46.4774 31.7186 63.6992C31.7186 80.9211 45.7357 94.8826 63.0262 94.8828C80.317 "
    "94.8828 94.3339 80.9212 94.3339 63.6992C94.3337 46.4773 80.3169 32.5166 63.0262 32.5166Z"
)

def main() -> None:
    body = FRAG.read_text(encoding="utf-8").strip() if FRAG.exists() else ""
    svg = (
        '<svg width="562" height="175" viewBox="0 0 562 175" fill="none" '
        'xmlns="http://www.w3.org/2000/svg">\n'
        '<rect width="125.5" height="125.5" fill="white"/>\n'
        f'<path d="{LOGO}" fill="black"/>\n'
        '<rect width="510.73" height="50" transform="translate(0 125)" fill="#ADFF00"/>\n'
        f"{body}\n"
        '<rect x="511" y="74" width="51" height="51" fill="#ADFF00"/>\n'
        '<rect x="460" y="23" width="51" height="51" fill="#ADFF00"/>\n'
        "</svg>\n"
    )
    DEST.write_text(svg, encoding="utf-8")
    print(f"Wrote {DEST} ({DEST.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
