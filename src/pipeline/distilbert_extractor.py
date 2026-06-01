from __future__ import annotations

from pathlib import Path

from .nlp_extractor import COLOR_KEYWORDS, PLACEMENT_HINTS, ExtractionResult, extract_with_rules


DEFAULT_MODEL_DIR = Path("inputs/distilbert_scene_classifier")


def label_to_fields(labels: list[tuple[str, float]], prompt: str) -> ExtractionResult:
    base = extract_with_rules(prompt)
    category = base.category
    color_overlay = base.color_overlay
    position = base.position
    rotation = base.rotation
    scale_multiplier = base.scale_multiplier
    confidence = base.confidence

    for label, score in labels:
        normalized = label.lower().replace("_", ":")
        if ":" not in normalized:
            continue

        field, value = normalized.split(":", 1)
        confidence = max(confidence, float(score))

        if field == "category":
            category = value
        elif field == "color":
            for color_name, (rgb, _) in COLOR_KEYWORDS.items():
                if value == color_name:
                    color_overlay = list(rgb)
                    break
        elif field == "placement":
            hint = PLACEMENT_HINTS.get(value)
            if hint:
                position = list(hint["position"])
                rotation = list(hint["rotation"])
        elif field == "scale":
            if value in {"large", "big"}:
                scale_multiplier = 1.25
            elif value in {"small", "mini"}:
                scale_multiplier = 0.75

    return ExtractionResult(
        category=category,
        color_overlay=color_overlay,
        position=position,
        rotation=rotation,
        scale_multiplier=scale_multiplier,
        confidence=round(confidence, 4),
        notes=["Extracted with local DistilBERT adapter."],
    )


def extract_with_distilbert(prompt: str, model_dir: Path = DEFAULT_MODEL_DIR) -> ExtractionResult:
    if not model_dir.exists():
        raise RuntimeError(f"DistilBERT model directory not found: {model_dir}")

    try:
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
    except ImportError as exc:
        raise RuntimeError("Install optional dependencies: transformers and torch.") from exc

    tokenizer = AutoTokenizer.from_pretrained(model_dir, local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir, local_files_only=True)
    model.eval()

    with torch.no_grad():
        encoded = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=128)
        logits = model(**encoded).logits[0]

    id_to_label = model.config.id2label
    if len(id_to_label) == 1:
        scores = torch.sigmoid(logits)
    else:
        scores = torch.softmax(logits, dim=-1)

    ranked = sorted(
        ((id_to_label[index], float(score)) for index, score in enumerate(scores)),
        key=lambda item: item[1],
        reverse=True,
    )
    selected = [item for item in ranked if item[1] >= 0.35][:6]
    return label_to_fields(selected, prompt)
