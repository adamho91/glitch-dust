#!/usr/bin/env python3
"""Serve the static prototype locally."""

from __future__ import annotations

import argparse
import functools
import http.server
import socketserver
import webbrowser
import json
import os
import subprocess
import tempfile
import sys
import threading
import hashlib
from urllib.parse import urlparse
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 5173
OCR_LOCK = threading.Lock()

def ocr_executable():
    source = ROOT / "scripts/chart-ocr.m"
    digest = hashlib.sha256(source.read_bytes()).hexdigest()[:16]
    cache = Path(tempfile.gettempdir()) / ("fal-chart-ocr-" + str(os.getuid()))
    cache.mkdir(mode=0o700, exist_ok=True)
    executable = cache / digest
    with OCR_LOCK:
        if not executable.exists():
            subprocess.run(["/usr/bin/clang", "-fobjc-arc", "-framework", "Foundation", "-framework", "Vision", "-framework", "ImageIO", "-framework", "CoreGraphics", str(source), "-o", str(executable)], capture_output=True, check=True, timeout=45)
    return str(executable)

DISABLED_LOCAL_PATHS = {"/gallery.html", "/gallery.js"}


class ReusableTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True


class LocalRequestHandler(http.server.SimpleHTTPRequestHandler):
    def chart_origin(self):
        origin = self.headers.get("Origin", "")
        if origin == "null" or not origin:
            return origin or "null"
        parsed = urlparse(origin)
        if parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost"}:
            return origin
        return None

    def chart_response(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", self.chart_origin() or "null")
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        if self.path == "/api/chart-ocr" and self.chart_origin():
            self.chart_response(200, {})
        else:
            self.send_error(403)

    def do_POST(self):
        if self.path != "/api/chart-ocr" or not self.chart_origin():
            self.send_error(403)
            return
        if sys.platform != "darwin":
            self.chart_response(503, {"error": "Screenshot recognition needs the local macOS server. You can enter the data below."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 20 * 1024 * 1024:
                self.chart_response(413, {"error": "Choose an image smaller than 20 MB."})
                return
            with tempfile.NamedTemporaryFile(suffix=".image") as image:
                image.write(self.rfile.read(length))
                image.flush()
                result = subprocess.run([ocr_executable(), image.name],
                    capture_output=True, timeout=45)
                if result.returncode:
                    self.chart_response(422, {"error": "Could not read this image. Use a clear PNG or JPEG, or enter the data below."})
                    return
                self.chart_response(200, json.loads(result.stdout))
        except subprocess.TimeoutExpired:
            self.chart_response(504, {"error": "Recognition took too long. Try a smaller image or enter the data below."})
        except (ValueError, OSError, subprocess.CalledProcessError):
            self.chart_response(500, {"error": "Local screenshot recognition is unavailable. Enter the data below."})

    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] in DISABLED_LOCAL_PATHS:
            self.send_error(404, "Gallery is disabled locally")
            return
        super().do_GET()

    def do_HEAD(self) -> None:
        if self.path.split("?", 1)[0] in DISABLED_LOCAL_PATHS:
            self.send_error(404, "Gallery is disabled locally")
            return
        super().do_HEAD()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", default=DEFAULT_PORT, type=int)
    parser.add_argument("--open", action="store_true", help="Open index.html in the default browser.")
    args = parser.parse_args()

    handler = functools.partial(LocalRequestHandler, directory=str(ROOT))
    url = f"http://{args.host}:{args.port}/index.html"

    with ReusableTCPServer((args.host, args.port), handler) as server:
        print(f"Serving {ROOT}")
        print(f"Main tool: {url}")
        print("Press Ctrl-C to stop.")
        if args.open:
            webbrowser.open(url)
        server.serve_forever()


if __name__ == "__main__":
    main()
