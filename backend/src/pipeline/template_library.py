from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .asset_library import SUPPORTED_EXTENSION, readable_label, slugify
from .semantic_search import search_assets


@dataclass(frozen=True)
class TemplateScan:
    templates: list[dict[str, Any]]
    unsupported: list[dict[str, str]]


def load_template_metadata(template_dir: Path) -> dict[str, dict[str, Any]]:
    metadata: dict[str, dict[str, Any]] = {}
    metadata_paths = [
        Path(__file__).with_name("template_metadata.json"),
        template_dir / "template_metadata.json",
    ]

    for metadata_path in metadata_paths:
        if not metadata_path.is_file():
            continue

        try:
            data = json.loads(metadata_path.read_text(encoding="utf-8") or "{}")
        except (json.JSONDecodeError, OSError):
            continue

        if isinstance(data, dict):
            metadata.update(
                {
                    str(template_id): value
                    for template_id, value in data.items()
                    if isinstance(value, dict)
                }
            )

    return metadata


def infer_template_keywords(path: Path, category: str) -> list[str]:
    tokens = set(readable_label(path).lower().split())
    tokens.add(category)
    tokens.add("room")
    tokens.add("template")
    return sorted(token for token in tokens if token)


def merge_template_metadata(template: dict[str, Any], metadata: dict[str, Any]) -> dict[str, Any]:
    merged = {**template, **metadata}

    keywords = set(str(item).lower() for item in template.get("keywords", []))
    for field in ("aliases", "tags", "style", "room_type", "mood", "features"):
        value = merged.get(field, [])
        if isinstance(value, str):
            keywords.add(value.lower())
        elif isinstance(value, list):
            keywords.update(str(item).lower() for item in value)

    if merged.get("category"):
        keywords.add(str(merged["category"]).lower())

    merged["keywords"] = sorted(keyword for keyword in keywords if keyword)
    return merged


def scan_template_library(template_dir: Path) -> TemplateScan:
    templates: list[dict[str, Any]] = []
    unsupported: list[dict[str, str]] = []
    metadata_by_template_id = load_template_metadata(template_dir)

    if template_dir.exists():
        for file_path in sorted(template_dir.rglob("*")):
            if not file_path.is_file():
                continue

            suffix = file_path.suffix.lower()
            relative = file_path.relative_to(template_dir).as_posix()

            if suffix == SUPPORTED_EXTENSION:
                template_id = slugify(file_path.stem)
                metadata = metadata_by_template_id.get(template_id, {})
                category = str(metadata.get("category") or "room_template")
                template = {
                    "template_id": template_id,
                    "asset_id": template_id,
                    "label": readable_label(file_path),
                    "category": category,
                    "template_url": f"/outputs/template/{relative}",
                    "asset_url": f"/outputs/template/{relative}",
                    "file_name": file_path.name,
                    "format": "glb",
                    "keywords": infer_template_keywords(file_path, category),
                    "default_scale": [1.0, 1.0, 1.0],
                }
                templates.append(merge_template_metadata(template, metadata))
            elif suffix:
                unsupported.append(
                    {
                        "path": relative,
                        "reason": "Only .glb room templates are supported by this API pipeline.",
                    }
                )

    return TemplateScan(templates=templates, unsupported=unsupported)


def search_templates(query: str, templates: list[dict[str, Any]], limit: int = 5, min_score: float = 0.15):
    results = search_assets(query, templates, limit=max(limit, len(templates)))
    if not results:
        return []

    best_score = results[0].final_score
    score_floor = max(min_score, best_score * 0.75)
    filtered = [result for result in results if result.final_score >= score_floor]
    return filtered[:limit]
