#!/usr/bin/env python3
"""الحقني — static server with no-cache headers (the preview always gets fresh content)."""
import http.server


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, *args):
        pass  # quiet


if __name__ == "__main__":
    http.server.ThreadingHTTPServer(("0.0.0.0", 8000), NoCacheHandler).serve_forever()
