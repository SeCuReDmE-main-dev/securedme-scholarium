from __future__ import annotations

import argparse
import subprocess
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run_script(name: str, *arguments: str) -> None:
    subprocess.run([sys.executable, str(ROOT / "tools" / name), *arguments], cwd=ROOT, check=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Operate the SeCuReDmE Sphinx documentation pipeline.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    for command in ("sync", "validate", "build"):
        subparser = subparsers.add_parser(command)
        subparser.add_argument("--source-root", type=Path, default=ROOT.parent)
        if command == "build":
            subparser.add_argument("--clean", action="store_true")
            subparser.add_argument("--skip-sync", action="store_true")
    preview = subparsers.add_parser("preview")
    preview.add_argument("--host", default="127.0.0.1")
    preview.add_argument("--port", type=int, default=8770)
    preview.add_argument("--directory", type=Path, default=ROOT / "build" / "html")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.command == "sync":
        run_script("sync_suite_docs.py", "--source-root", str(args.source_root))
    elif args.command == "validate":
        run_script("validate_sphinx_portal.py", "--source-root", str(args.source_root))
    elif args.command == "build":
        command = ["--source-root", str(args.source_root)]
        if args.clean:
            command.append("--clean")
        if args.skip_sync:
            command.append("--skip-sync")
        run_script("build_sphinx_docs.py", *command)
    else:
        directory = args.directory.resolve()
        if not (directory / "index.html").is_file():
            raise SystemExit(f"Build output is missing: {directory}")
        handler = lambda *handler_args, **kwargs: SimpleHTTPRequestHandler(
            *handler_args, directory=str(directory), **kwargs
        )
        server = ThreadingHTTPServer((args.host, args.port), handler)
        print(f"Serving {directory} at http://{args.host}:{args.port}")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            server.server_close()


if __name__ == "__main__":
    main()
