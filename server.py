from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os


ROOT = Path(__file__).parent
HOST = "127.0.0.1"
PORT = int(os.getenv("PORT", "8000"))


class AppHandler(SimpleHTTPRequestHandler):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, directory=ROOT, **kwargs)

	def log_message(self, format: str, *args: object) -> None:
		print(f"[site] {self.address_string()} - {format % args}")


if __name__ == "__main__":
	server = ThreadingHTTPServer((HOST, PORT), AppHandler)
	print(f"Сайт сапёра запущен: http://localhost:{PORT}")
	print("Для остановки нажми Ctrl+C")
	try:
		server.serve_forever()
	except KeyboardInterrupt:
		print("\nСайт остановлен")
	finally:
		server.server_close()
