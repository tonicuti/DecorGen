from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .semantic_search import search_assets


SUPPORTED_EXTENSION = ".glb"
UNSUPPORTED_EXTENSIONS = {".obj", ".gltf", ".max", ".fbx", ".blend", ".ma", ".mb", ".3ds"}


CATEGORY_KEYWORDS = {
    "sofa": ("sofa", "couch", "ghe sofa"),
    "chair": ("chair", "ghe", "seat"),
    "bench": ("bench", "ghe dai", "bang ghe"),
    "table": ("table", "desk", "ban"),
    "bed": ("bed", "giuong"),
    "lamp": ("lamp", "den"),
    "cabinet": ("cabinet", "wardrobe", "tu"),
    "shelf": ("shelf", "shelves", "ke", "gia sach"),
}


@dataclass(frozen=True)
class AssetScan:
    assets: list[dict[str, Any]]
    unsupported: list[dict[str, str]]


def slugify(value: str) -> str:
    clean = []
    for char in value.lower():
        if char.isalnum():
            clean.append(char)
        elif clean and clean[-1] != "_":
            clean.append("_")
    return "".join(clean).strip("_") or "asset"


def readable_label(path: Path) -> str:
    return path.stem.replace("_", " ").replace("-", " ")


def infer_category(path: Path) -> str:
    text = slugify(path.stem)
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(slugify(keyword) in text for keyword in keywords):
            return category
    return "decor"


def infer_keywords(path: Path, category: str) -> list[str]:
    tokens = set(readable_label(path).lower().split())
    tokens.add(category)
    for keyword in CATEGORY_KEYWORDS.get(category, ()):
        tokens.add(keyword.lower())
        tokens.add(slugify(keyword).replace("_", " "))
    return sorted(token for token in tokens if token)


def load_asset_metadata(inputs_dir: Path) -> dict[str, dict[str, Any]]:
    metadata: dict[str, dict[str, Any]] = {}
    metadata_paths = [Path(__file__).with_name("assets_metadata.json"), inputs_dir / "assets_metadata.json"]

    for metadata_path in metadata_paths:
        if not metadata_path.is_file():
            continue

        try:
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue

        if isinstance(data, dict):
            metadata.update(
                {str(asset_id): value for asset_id, value in data.items() if isinstance(value, dict)}
            )

    return metadata


def merge_asset_metadata(asset: dict[str, Any], metadata: dict[str, Any]) -> dict[str, Any]:
    merged = {**asset, **metadata}

    keywords = set(asset.get("keywords", []))
    for field in ("aliases", "tags"):
        value = merged.get(field, [])
        if isinstance(value, str):
            keywords.add(value.lower())
        elif isinstance(value, list):
            keywords.update(str(item).lower() for item in value)

    if merged.get("category"):
        keywords.add(str(merged["category"]).lower())

    merged["keywords"] = sorted(keyword for keyword in keywords if keyword)
    return merged


def scan_asset_library(inputs_dir: Path) -> AssetScan:
    assets: list[dict[str, Any]] = []
    unsupported: list[dict[str, str]] = []
    metadata_by_asset_id = load_asset_metadata(inputs_dir)

    if inputs_dir.exists():
        for file_path in sorted(inputs_dir.rglob("*")):
            if not file_path.is_file():
                continue

            suffix = file_path.suffix.lower()
            relative = file_path.relative_to(inputs_dir).as_posix()

            if suffix == SUPPORTED_EXTENSION:
                asset_id = slugify(file_path.stem)
                metadata = metadata_by_asset_id.get(asset_id, {})
                category = str(metadata.get("category") or infer_category(file_path))
                asset = {
                    "asset_id": asset_id,
                    "label": readable_label(file_path),
                    "category": category,
                    "asset_url": f"/inputs/{relative}",
                    "file_name": file_path.name,
                    "format": "glb",
                    "keywords": infer_keywords(file_path, category),
                    "default_scale": [1.0, 1.0, 1.0],
                }
                assets.append(merge_asset_metadata(asset, metadata))
            elif suffix in UNSUPPORTED_EXTENSIONS:
                unsupported.append(
                    {
                        "path": relative,
                        "reason": "Only .glb assets are supported by this API pipeline.",
                    }
                )

    return AssetScan(assets=assets, unsupported=unsupported)


def score_asset(asset: dict[str, Any], prompt: str, category: str) -> int:
    text = prompt.lower()
    normalized_text = slugify(prompt).replace("_", " ")
    score = 0

    if asset.get("category") == category:
        score += 8

    for keyword in asset.get("keywords", []):
        clean_keyword = keyword.lower()
        if clean_keyword and (clean_keyword in text or clean_keyword in normalized_text):
            score += 4

    label = str(asset.get("label", "")).lower()
    asset_id = str(asset.get("asset_id", "")).replace("_", " ").lower()
    if label and label in normalized_text:
        score += 10
    if asset_id and asset_id in normalized_text:
        score += 10

    return score


def find_best_glb_asset(assets: list[dict[str, Any]], prompt: str, category: str) -> dict[str, Any] | None:
    if not assets:
        return None

    semantic_results = search_assets(prompt, assets, limit=1)
    if semantic_results and semantic_results[0].final_score > 0:
        result = semantic_results[0]
        asset = dict(result.asset)
        asset["search_scores"] = {
            "final_score": result.final_score,
            "semantic_score": result.semantic_score,
            "category_score": result.category_score,
            "keyword_score": result.keyword_score,
            "placement_material_score": result.placement_material_score,
            "normalized_query": result.parsed_query.search_text,
        }
        return asset

    ranked = sorted(
        ((score_asset(asset, prompt, category), asset) for asset in assets),
        key=lambda item: item[0],
        reverse=True,
    )
    best_score, best_asset = ranked[0]
    return best_asset if best_score > 0 else None
