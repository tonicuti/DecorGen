from __future__ import annotations

import json
import mimetypes
import os
import sys
from email.parser import BytesParser
from email.policy import default as email_policy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from importlib import util as importlib_util
from pathlib import Path
from urllib.parse import unquote, urlparse

from .asset_library import scan_asset_library
from .generate_scene import generate_scene
from .semantic_search import search_assets
from .template_library import scan_template_library, search_templates


ROOT = Path(__file__).resolve().parents[2]
INPUTS_DIR = ROOT / "inputs"
OUTPUTS_DIR = ROOT / "outputs"
TEMPLATE_DIR = OUTPUTS_DIR / "template"
FLOOR_PLAN_ANALYZER_PATH = ROOT / "src" / "2d_extract" / "floor_plan_analyzer.py"
_FLOOR_PLAN_MODULE = None
_FLOOR_PLAN_ANALYZER = None


def resolve_tesseract_cmd() -> str | None:
    configured = os.environ.get("TESSERACT_CMD")
    if configured:
        return configured

    for candidate in (
        Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe"),
        Path(r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"),
    ):
        if candidate.is_file():
            return str(candidate)

    return None


OPENAPI_SPEC = {
    "openapi": "3.0.3",
    "info": {
        "title": "Prompt to GLB API",
        "version": "1.0.0",
        "description": "Enter a prompt and receive the matching .glb model from inputs/.",
    },
    "servers": [{"url": "http://127.0.0.1:8000"}],
    "paths": {
        "/api/health": {
            "get": {
                "summary": "Health check",
                "responses": {"200": {"description": "API is running"}},
            }
        },
        "/api/assets": {
            "get": {
                "summary": "List available .glb assets",
                "responses": {
                    "200": {
                        "description": "Available assets",
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    }
                },
            }
        },
        "/api/assets/search": {
            "post": {
                "summary": "Search .glb assets with hybrid semantic scoring",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["prompt"],
                                "properties": {
                                    "prompt": {
                                        "type": "string",
                                        "example": "Mot cai ke sach bang kim loai dat ben trai phong",
                                    },
                                    "limit": {"type": "integer", "example": 5},
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "200": {
                        "description": "Ranked asset matches",
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    }
                },
            }
        },
        "/api/templates": {
            "get": {
                "summary": "List available room template .glb files",
                "responses": {
                    "200": {
                        "description": "Available room templates",
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    }
                },
            }
        },
        "/api/templates/search": {
            "post": {
                "summary": "Search room templates with hybrid semantic scoring",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["prompt"],
                                "properties": {
                                    "prompt": {
                                        "type": "string",
                                        "example": "Mot can phong nho phong cach retro am cung",
                                    },
                                    "limit": {"type": "integer", "example": 3},
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "200": {
                        "description": "Ranked template matches",
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    }
                },
            }
        },
        "/api/scene": {
            "post": {
                "summary": "Generate scene metadata from prompt",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["prompt"],
                                "properties": {
                                    "prompt": {
                                        "type": "string",
                                        "example": "Mot chiec sofa mau xanh dat canh cua so",
                                    }
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "200": {
                        "description": "Matched GLB metadata",
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    },
                    "404": {"description": "No matching GLB asset found"},
                },
            }
        },
        "/api/floor-plan/analyze": {
            "post": {
                "summary": "Analyze a 2D floor-plan image",
                "requestBody": {
                    "required": True,
                    "content": {
                        "multipart/form-data": {
                            "schema": {
                                "type": "object",
                                "required": ["file"],
                                "properties": {
                                    "file": {
                                        "type": "string",
                                        "format": "binary",
                                        "description": "Floor-plan image file",
                                    }
                                },
                            }
                        },
                        "image/png": {
                            "schema": {"type": "string", "format": "binary"}
                        },
                        "image/jpeg": {
                            "schema": {"type": "string", "format": "binary"}
                        },
                    },
                },
                "responses": {
                    "200": {
                        "description": "Detected floor-plan objects",
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    },
                    "400": {"description": "Invalid or unreadable image"},
                    "415": {"description": "Unsupported content type"},
                    "500": {"description": "Floor-plan analysis failed"},
                },
            }
        },
        "/api/glb": {
            "post": {
                "summary": "Generate and download matching .glb file",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["prompt"],
                                "properties": {
                                    "prompt": {
                                        "type": "string",
                                        "example": "Mot ban picnic go dat giua phong",
                                    }
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "200": {
                        "description": "Binary GLB model",
                        "content": {
                            "model/gltf-binary": {
                                "schema": {"type": "string", "format": "binary"}
                            },
                            "application/octet-stream": {
                                "schema": {"type": "string", "format": "binary"}
                            },
                        },
                    },
                    "404": {"description": "No matching GLB asset found"},
                },
            }
        },
    },
}


SWAGGER_UI_HTML = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Prompt to GLB API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/openapi.json",
          dom_id: "#swagger-ui",
          deepLinking: true
        });
      };
    </script>
  </body>
</html>
"""


def json_bytes(payload: dict) -> bytes:
    return json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")


def safe_join(root: Path, request_path: str) -> Path | None:
    relative = unquote(request_path).lstrip("/")
    candidate = (root / relative).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return None
    return candidate


def get_floor_plan_analyzer():
    """Lazy-load the analyzer from src/2d_extract, whose folder is not importable."""
    global _FLOOR_PLAN_MODULE, _FLOOR_PLAN_ANALYZER
    if _FLOOR_PLAN_MODULE is None or _FLOOR_PLAN_ANALYZER is None:
        spec = importlib_util.spec_from_file_location(
            "floor_plan_analyzer",
            FLOOR_PLAN_ANALYZER_PATH,
        )
        if spec is None or spec.loader is None:
            raise RuntimeError(f"Could not load analyzer module: {FLOOR_PLAN_ANALYZER_PATH}")

        module = importlib_util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)

        _FLOOR_PLAN_MODULE = module
        _FLOOR_PLAN_ANALYZER = module.FloorPlanAnalyzer(
            tesseract_cmd=resolve_tesseract_cmd()
        )

    return _FLOOR_PLAN_MODULE, _FLOOR_PLAN_ANALYZER


class PipelineHandler(BaseHTTPRequestHandler):
    server_version = "PromptSceneAPI/1.0"

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path

        if path in {"/", "/api/health"}:
            self.send_json(
                {
                    "status": "ok",
                    "service": "prompt-to-glb-api",
                    "endpoints": {
                        "assets": "GET /api/assets",
                        "templates": "GET /api/templates",
                        "search_templates": "POST /api/templates/search",
                        "analyze_floor_plan": "POST /api/floor-plan/analyze",
                        "generate": "POST /api/scene",
                        "download_glb": "POST /api/glb",
                        "glb_file": "GET /inputs/<file>.glb",
                        "template_file": "GET /outputs/template/<file>.glb",
                        "docs": "GET /docs",
                    },
                }
            )
            return

        if path == "/docs":
            self.send_html(SWAGGER_UI_HTML)
            return

        if path == "/openapi.json":
            self.send_json(OPENAPI_SPEC)
            return

        if path == "/api/assets":
            scan = scan_asset_library(INPUTS_DIR)
            self.send_json({"assets": scan.assets, "unsupported": scan.unsupported})
            return

        if path == "/api/templates":
            scan = scan_template_library(TEMPLATE_DIR)
            self.send_json({"templates": scan.templates, "unsupported": scan.unsupported})
            return

        if path.startswith("/inputs/"):
            self.serve_input_file(path.removeprefix("/inputs/"))
            return

        if path.startswith("/outputs/template/"):
            self.serve_template_file(path.removeprefix("/outputs/template/"))
            return

        self.send_json({"error": "Not found"}, status=404)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/floor-plan/analyze":
            self.handle_floor_plan_analysis()
            return

        if path not in {"/api/scene", "/api/glb", "/api/assets/search", "/api/templates/search"}:
            self.send_json({"error": "Not found"}, status=404)
            return

        body = self.read_json_body()
        if body is None:
            return

        prompt = self.get_prompt(body)
        if prompt is None:
            return

        if path == "/api/assets/search":
            scan = scan_asset_library(INPUTS_DIR)
            limit = int(body.get("limit", 5))
            matches = search_assets(prompt, scan.assets, limit=max(1, min(limit, 20)))
            parsed = matches[0].parsed_query if matches else None
            self.send_json(
                {
                    "prompt": prompt,
                    "parsed_query": {
                        "search_text": parsed.search_text,
                        "category": parsed.category,
                        "keywords": parsed.keywords,
                        "materials": parsed.materials,
                        "placements": parsed.placements,
                    }
                    if parsed
                    else None,
                    "matches": [
                        {
                            "asset_id": result.asset.get("asset_id"),
                            "label": result.asset.get("label"),
                            "category": result.asset.get("category"),
                            "asset_url": result.asset.get("asset_url"),
                            "description": result.asset.get("description"),
                            "aliases": result.asset.get("aliases"),
                            "tags": result.asset.get("tags"),
                            "materials": result.asset.get("materials"),
                            "placements": result.asset.get("placements"),
                            "dimensions": result.asset.get("dimensions"),
                            "default_scale": result.asset.get("default_scale"),
                            "final_score": result.final_score,
                            "semantic_score": result.semantic_score,
                            "category_score": result.category_score,
                            "keyword_score": result.keyword_score,
                            "placement_material_score": result.placement_material_score,
                        }
                        for result in matches
                    ],
                }
            )
            return

        if path == "/api/templates/search":
            scan = scan_template_library(TEMPLATE_DIR)
            limit = int(body.get("limit", 5))
            matches = search_templates(prompt, scan.templates, limit=max(1, min(limit, 20)))
            parsed = matches[0].parsed_query if matches else None
            self.send_json(
                {
                    "prompt": prompt,
                    "parsed_query": {
                        "search_text": parsed.search_text,
                        "category": parsed.category,
                        "keywords": parsed.keywords,
                        "materials": parsed.materials,
                        "placements": parsed.placements,
                    }
                    if parsed
                    else None,
                    "matches": [
                        {
                            "template_id": result.asset.get("template_id"),
                            "label": result.asset.get("label"),
                            "category": result.asset.get("category"),
                            "template_url": result.asset.get("template_url"),
                            "description": result.asset.get("description"),
                            "aliases": result.asset.get("aliases"),
                            "tags": result.asset.get("tags"),
                            "style": result.asset.get("style"),
                            "room_type": result.asset.get("room_type"),
                            "mood": result.asset.get("mood"),
                            "features": result.asset.get("features"),
                            "materials": result.asset.get("materials"),
                            "placements": result.asset.get("placements"),
                            "dimensions": result.asset.get("dimensions"),
                            "default_scale": result.asset.get("default_scale"),
                            "final_score": result.final_score,
                            "semantic_score": result.semantic_score,
                            "category_score": result.category_score,
                            "keyword_score": result.keyword_score,
                            "placement_material_score": result.placement_material_score,
                        }
                        for result in matches
                    ],
                }
            )
            return

        try:
            scene = generate_scene(prompt, OUTPUTS_DIR / "scene.json")
        except LookupError as exc:
            scan = scan_asset_library(INPUTS_DIR)
            self.send_json(
                {
                    "error": str(exc),
                    "prompt": prompt,
                    "available_assets": scan.assets,
                },
                status=404,
            )
            return

        if path == "/api/scene":
            self.send_json(scene)
            return

        self.send_glb_response(scene)

    def read_json_body(self) -> dict | None:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        try:
            body = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_json({"error": "Invalid JSON body"}, status=400)
            return None
        if not isinstance(body, dict):
            self.send_json({"error": "JSON body must be an object"}, status=400)
            return None
        return body

    def get_prompt(self, body: dict) -> str | None:
        prompt = str(body.get("prompt", "")).strip()
        if not prompt:
            self.send_json({"error": "Missing prompt"}, status=400)
            return None
        return prompt

    def read_raw_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", "0"))
        return self.rfile.read(length)

    def handle_floor_plan_analysis(self) -> None:
        raw = self.read_raw_body()
        if not raw:
            self.send_json({"error": "Missing image upload"}, status=400)
            return

        content_type = self.headers.get("Content-Type", "")
        if content_type.startswith("multipart/form-data"):
            image_bytes, file_name = self.extract_multipart_file(raw, content_type)
            if image_bytes is None:
                return
        elif content_type.startswith("image/"):
            image_bytes = raw
            file_name = None
        else:
            self.send_json(
                {
                    "error": "Unsupported content type",
                    "expected": "multipart/form-data with file field, or raw image/* body",
                },
                status=415,
            )
            return

        try:
            module, analyzer = get_floor_plan_analyzer()
        except Exception as exc:
            self.send_json({"error": f"Could not load floor-plan analyzer: {exc}"}, status=500)
            return

        buffer = module.np.frombuffer(image_bytes, dtype=module.np.uint8)
        image = module.cv2.imdecode(buffer, module.cv2.IMREAD_COLOR)
        if image is None:
            self.send_json({"error": "Could not decode image"}, status=400)
            return

        try:
            result = analyzer.analyze_image(image)
        except Exception as exc:
            self.send_json({"error": f"Floor-plan analysis failed: {exc}"}, status=500)
            return

        if file_name:
            result["source"] = file_name
        self.send_json(result)

    def extract_multipart_file(
        self,
        raw: bytes,
        content_type: str,
    ) -> tuple[bytes | None, str | None]:
        message = BytesParser(policy=email_policy).parsebytes(
            b"Content-Type: "
            + content_type.encode("utf-8")
            + b"\r\nMIME-Version: 1.0\r\n\r\n"
            + raw
        )
        if not message.is_multipart():
            self.send_json({"error": "Invalid multipart upload"}, status=400)
            return None, None

        for part in message.iter_parts():
            if part.get_content_disposition() != "form-data":
                continue

            field_name = part.get_param("name", header="content-disposition")
            file_name = part.get_filename()
            if field_name not in {"file", "image"} and not file_name:
                continue

            payload = part.get_payload(decode=True)
            if payload:
                return payload, file_name

        self.send_json({"error": "Missing file field in multipart upload"}, status=400)
        return None, None

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_html(self, html: str, status: int = 200) -> None:
        body = html.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_glb_response(self, scene: dict) -> None:
        asset_url = str(scene.get("asset_url", ""))
        file_path = safe_join(INPUTS_DIR, asset_url.removeprefix("/inputs/"))
        if file_path is None or not file_path.is_file() or file_path.suffix.lower() != ".glb":
            self.send_json({"error": "Matched GLB file not found", "scene": scene}, status=404)
            return

        metadata = {
            "asset_id": scene.get("asset_id"),
            "file_name": scene.get("file_name"),
            "asset_url": scene.get("asset_url"),
            "transform": scene.get("transform"),
            "color_overlay": scene.get("color_overlay"),
        }
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "model/gltf-binary")
        self.send_header("Content-Disposition", f'attachment; filename="{file_path.name}"')
        self.send_header("X-Scene-Metadata", json.dumps(metadata, ensure_ascii=True, separators=(",", ":")))
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_input_file(self, request_path: str) -> None:
        file_path = safe_join(INPUTS_DIR, request_path)
        if file_path is None or not file_path.is_file() or file_path.suffix.lower() != ".glb":
            self.send_json({"error": "GLB file not found"}, status=404)
            return

        content_type = mimetypes.guess_type(file_path.name)[0] or "model/gltf-binary"
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_template_file(self, request_path: str) -> None:
        file_path = safe_join(TEMPLATE_DIR, request_path)
        if file_path is None or not file_path.is_file() or file_path.suffix.lower() != ".glb":
            self.send_json({"error": "Template GLB file not found"}, status=404)
            return

        content_type = mimetypes.guess_type(file_path.name)[0] or "model/gltf-binary"
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    OUTPUTS_DIR.mkdir(exist_ok=True)
    host = "127.0.0.1"
    port = 8000
    httpd = ThreadingHTTPServer((host, port), PipelineHandler)
    print(f"Serving prompt-to-glb API at http://{host}:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
