from __future__ import annotations

import os
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .asset_library import find_best_glb_asset


OBJECT_KEYWORDS = {
    "sofa": ("sofa", "couch", "ghe sofa"),
    "bench": ("bench", "ghe dai", "bang ghe"),
    "chair": ("chair", "ghe"),
    "table": ("table", "desk", "ban", "picnic table"),
    "bed": ("bed", "giuong"),
    "lamp": ("lamp", "den"),
    "cabinet": ("cabinet", "tu"),
    "shelf": ("shelf", "shelves", "ke", "gia sach", "steel frame shelves"),
}

COLOR_KEYWORDS = {
    "blue": ((0.0, 0.1, 1.0), ("blue", "xanh", "xanh duong")),
    "green": ((0.0, 0.75, 0.2), ("green", "xanh la")),
    "red": ((1.0, 0.05, 0.03), ("red", "do")),
    "yellow": ((1.0, 0.85, 0.05), ("yellow", "vang")),
    "white": ((1.0, 1.0, 1.0), ("white", "trang")),
    "black": ((0.02, 0.02, 0.02), ("black", "den")),
    "brown": ((0.45, 0.23, 0.08), ("brown", "nau")),
    "gray": ((0.45, 0.48, 0.5), ("gray", "grey", "xam")),
}

PLACEMENT_HINTS = {
    "near_window": {
        "keywords": ("canh cua so", "gan cua so", "near window", "by the window"),
        "position": [1.5, 0.0, -3.2],
        "rotation": [0.0, 90.0, 0.0],
    },
    "center": {
        "keywords": ("giua phong", "center", "middle"),
        "position": [0.0, 0.0, 0.0],
        "rotation": [0.0, 0.0, 0.0],
    },
    "left_wall": {
        "keywords": ("tuong trai", "left wall"),
        "position": [-2.5, 0.0, -1.0],
        "rotation": [0.0, 0.0, 0.0],
    },
    "right_wall": {
        "keywords": ("tuong phai", "right wall"),
        "position": [2.5, 0.0, -1.0],
        "rotation": [0.0, 180.0, 0.0],
    },
}


@dataclass
class ExtractionResult:
    category: str
    color_overlay: list[float]
    position: list[float]
    rotation: list[float]
    scale_multiplier: float
    confidence: float
    notes: list[str]


def strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text)
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn")


def normalize_text(text: str) -> str:
    ascii_text = strip_accents(text).lower()
    return re.sub(r"\s+", " ", ascii_text.strip())


def contains_any(text: str, keywords: tuple[str, ...]) -> bool:
    return any(re.search(rf"(^|\s){re.escape(keyword)}(\s|$)", text) for keyword in keywords)


def extract_with_rules(prompt: str) -> ExtractionResult:
    text = normalize_text(prompt)
    notes: list[str] = []

    category = "decor"
    confidence = 0.35
    for candidate, keywords in OBJECT_KEYWORDS.items():
        if contains_any(text, keywords):
            category = candidate
            confidence = 0.85
            break
    else:
        notes.append("No explicit object category found.")

    color_overlay = [1.0, 1.0, 1.0]
    for _, (rgb, keywords) in COLOR_KEYWORDS.items():
        if contains_any(text, keywords):
            color_overlay = list(rgb)
            break

    position = [0.0, 0.0, 0.0]
    rotation = [0.0, 0.0, 0.0]
    for hint in PLACEMENT_HINTS.values():
        if contains_any(text, hint["keywords"]):
            position = list(hint["position"])
            rotation = list(hint["rotation"])
            break

    scale_multiplier = 1.0
    if contains_any(text, ("lon", "big", "large")):
        scale_multiplier = 1.25
    elif contains_any(text, ("nho", "small", "mini")):
        scale_multiplier = 0.75

    return ExtractionResult(
        category=category,
        color_overlay=color_overlay,
        position=position,
        rotation=rotation,
        scale_multiplier=scale_multiplier,
        confidence=confidence,
        notes=notes,
    )


def extract_prompt(prompt: str) -> ExtractionResult:
    if os.environ.get("SCENE_USE_DISTILBERT") == "1":
        try:
            from .distilbert_extractor import extract_with_distilbert

            model_dir = Path(os.environ.get("SCENE_DISTILBERT_DIR", "inputs/distilbert_scene_classifier"))
            return extract_with_distilbert(prompt, model_dir)
        except RuntimeError as exc:
            fallback = extract_with_rules(prompt)
            fallback.notes.append(f"DistilBERT unavailable; used rule-based fallback. {exc}")
            return fallback

    return extract_with_rules(prompt)


def build_scene_object(prompt: str, assets: list[dict[str, Any]]) -> dict[str, Any]:
    extraction = extract_prompt(prompt)
    asset = find_best_glb_asset(assets, prompt, extraction.category)
    if asset is None:
        raise LookupError("No matching .glb asset found for this prompt.")

    default_scale = asset.get("default_scale", [1.0, 1.0, 1.0])
    scale = [round(float(value) * extraction.scale_multiplier, 4) for value in default_scale]

    return {
        "prompt": prompt,
        "asset_id": asset["asset_id"],
        "asset_url": asset["asset_url"],
        "file_name": asset["file_name"],
        "format": "glb",
        "transform": {
            "position": extraction.position,
            "rotation": extraction.rotation,
            "scale": scale,
        },
        "color_overlay": extraction.color_overlay,
        "metadata": {
            "matched_asset": asset,
            "category": extraction.category,
            "confidence": extraction.confidence,
            "extractor": "distilbert_cpu_or_rule_fallback"
            if os.environ.get("SCENE_USE_DISTILBERT") == "1"
            else "rule_based_cpu",
            "notes": extraction.notes,
        },
    }
