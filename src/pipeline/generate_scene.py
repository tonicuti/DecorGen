from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .asset_library import scan_asset_library
from .nlp_extractor import build_scene_object


ROOT = Path(__file__).resolve().parents[2]
INPUTS_DIR = ROOT / "inputs"
OUTPUTS_DIR = ROOT / "outputs"


def generate_scene(prompt: str, output_path: Path | None = None) -> dict:
    scan = scan_asset_library(INPUTS_DIR)
    scene = build_scene_object(prompt, scan.assets)
    scene["library"] = {
        "asset_count": len(scan.assets),
        "unsupported": scan.unsupported,
    }

    if output_path is not None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(scene, indent=2, ensure_ascii=False), encoding="utf-8")

    return scene


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Generate a scene JSON file from a text prompt.")
    parser.add_argument("prompt", help="Natural-language prompt, e.g. 'Một chiếc ghế sofa màu xanh đặt cạnh cửa sổ'.")
    parser.add_argument(
        "--out",
        default=str(OUTPUTS_DIR / "scene.json"),
        help="Output JSON path. Defaults to outputs/scene.json.",
    )
    args = parser.parse_args()

    scene = generate_scene(args.prompt, Path(args.out))
    print(json.dumps(scene, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
