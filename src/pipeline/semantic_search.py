from __future__ import annotations

import math
import os
import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache
from typing import Any


SEMANTIC_WEIGHT = 0.60
CATEGORY_WEIGHT = 0.25
KEYWORD_WEIGHT = 0.10
PLACEMENT_MATERIAL_WEIGHT = 0.05

DEFAULT_EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


PLACEMENT_ALIASES = {
    "center": ("center", "middle", "giua phong", "o giua", "chinh giua"),
    "near_window": ("near window", "by the window", "gan cua so", "canh cua so"),
    "left_wall": ("left wall", "tuong trai", "ben trai", "phia trai"),
    "right_wall": ("right wall", "tuong phai", "ben phai", "phia phai"),
    "ceiling": ("ceiling", "tran nha", "treo tran", "den tran"),
    "tabletop": ("tabletop", "on table", "tren ban", "mat ban"),
}

MATERIAL_ALIASES = {
    "wood": ("wood", "wooden", "go", "bang go"),
    "metal": ("metal", "kim loai", "bang kim loai"),
    "steel": ("steel", "thep", "khung thep"),
    "brass": ("brass", "dong", "bang dong"),
    "glass": ("glass", "kinh", "bang kinh"),
    "fabric": ("fabric", "vai", "boc vai"),
}


@dataclass(frozen=True)
class ParsedQuery:
    raw: str
    normalized: str
    search_text: str
    category: str | None
    keywords: list[str]
    materials: list[str]
    placements: list[str]


@dataclass(frozen=True)
class SearchResult:
    asset: dict[str, Any]
    final_score: float
    semantic_score: float
    category_score: float
    keyword_score: float
    placement_material_score: float
    parsed_query: ParsedQuery


def strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text)
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn")


def normalize_text(text: str) -> str:
    ascii_text = strip_accents(text).lower()
    ascii_text = re.sub(r"[^a-z0-9\s_-]", " ", ascii_text)
    return re.sub(r"\s+", " ", ascii_text.strip())


def tokenize(text: str) -> set[str]:
    return {token for token in normalize_text(text).split() if len(token) > 1}


def phrase_in_text(phrase: str, text: str) -> bool:
    normalized_phrase = normalize_text(phrase)
    if not normalized_phrase:
        return False
    return re.search(rf"(^|\s){re.escape(normalized_phrase)}(\s|$)", text) is not None


def unique_normalized(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        normalized = normalize_text(str(value))
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return result


def asset_terms(asset: dict[str, Any], field: str) -> list[str]:
    value = asset.get(field, [])
    if isinstance(value, str):
        return unique_normalized([value])
    if isinstance(value, list):
        return unique_normalized([str(item) for item in value])
    return []


def build_asset_embedding_text(asset: dict[str, Any]) -> str:
    aliases = ", ".join(asset_terms(asset, "aliases") or asset_terms(asset, "keywords"))
    tags = ", ".join(asset_terms(asset, "tags"))
    materials = ", ".join(asset_terms(asset, "materials"))
    placements = ", ".join(asset_terms(asset, "placements"))

    parts = [
        f"Label: {asset.get('label', '')}",
        f"Category: {asset.get('category', '')}",
        f"Description: {asset.get('description', '')}",
        f"Aliases: {aliases}",
        f"Tags: {tags}",
        f"Materials: {materials}",
        f"Placements: {placements}",
        f"File: {asset.get('file_name', '')}",
    ]
    return ". ".join(part for part in parts if part.split(":", 1)[-1].strip())


def parse_query(query: str, assets: list[dict[str, Any]]) -> ParsedQuery:
    normalized = normalize_text(query)
    category = infer_category_from_query(normalized, assets)
    keywords = infer_keyword_hits(normalized, assets)
    materials = infer_material_hits(normalized, assets)
    placements = infer_placement_hits(normalized)

    search_parts = [f"User object description: {query}"]
    if category:
        search_parts.append(f"Category: {category}")
    if keywords:
        search_parts.append(f"Related keywords: {', '.join(keywords)}")
    if materials:
        search_parts.append(f"Materials: {', '.join(materials)}")
    if placements:
        search_parts.append(f"Placements: {', '.join(placements)}")

    return ParsedQuery(
        raw=query,
        normalized=normalized,
        search_text=". ".join(search_parts),
        category=category,
        keywords=keywords,
        materials=materials,
        placements=placements,
    )


def infer_category_from_query(normalized_query: str, assets: list[dict[str, Any]]) -> str | None:
    candidates: list[tuple[int, str]] = []
    for asset in assets:
        category = normalize_text(str(asset.get("category", "")))
        terms = [category]
        terms.extend(asset_terms(asset, "aliases"))
        terms.extend(asset_terms(asset, "keywords"))
        for term in terms:
            if phrase_in_text(term, normalized_query):
                candidates.append((len(term), category))

    if not candidates:
        return None

    return sorted(candidates, reverse=True)[0][1]


def infer_keyword_hits(normalized_query: str, assets: list[dict[str, Any]]) -> list[str]:
    terms: list[str] = []
    for asset in assets:
        terms.extend(asset_terms(asset, "aliases"))
        terms.extend(asset_terms(asset, "keywords"))
        terms.extend(asset_terms(asset, "tags"))

    hits = [term for term in unique_normalized(terms) if phrase_in_text(term, normalized_query)]
    return sorted(hits, key=len, reverse=True)[:8]


def infer_material_hits(normalized_query: str, assets: list[dict[str, Any]]) -> list[str]:
    terms: list[str] = []
    for asset in assets:
        terms.extend(asset_terms(asset, "materials"))

    hits = set(term for term in unique_normalized(terms) if phrase_in_text(term, normalized_query))
    for material, aliases in MATERIAL_ALIASES.items():
        if any(phrase_in_text(alias, normalized_query) for alias in aliases):
            hits.add(material)
    return sorted(hits, key=len, reverse=True)


def infer_placement_hits(normalized_query: str) -> list[str]:
    hits: list[str] = []
    for placement, aliases in PLACEMENT_ALIASES.items():
        if any(phrase_in_text(alias, normalized_query) for alias in aliases):
            hits.append(placement)
    return hits


def keyword_score(asset: dict[str, Any], parsed_query: ParsedQuery) -> float:
    terms = []
    terms.extend(asset_terms(asset, "aliases"))
    terms.extend(asset_terms(asset, "keywords"))
    terms.extend(asset_terms(asset, "tags"))
    terms = unique_normalized(terms)

    if not terms:
        return 0.0

    hits = sum(1 for term in terms if phrase_in_text(term, parsed_query.normalized))
    token_overlap = len(tokenize(parsed_query.normalized) & set().union(*(tokenize(term) for term in terms)))
    raw_score = hits * 0.35 + token_overlap * 0.15
    return min(raw_score, 1.0)


def category_score(asset: dict[str, Any], parsed_query: ParsedQuery) -> float:
    if not parsed_query.category:
        return 0.0
    return 1.0 if normalize_text(str(asset.get("category", ""))) == parsed_query.category else 0.0


def placement_material_score(asset: dict[str, Any], parsed_query: ParsedQuery) -> float:
    expected = parsed_query.materials + parsed_query.placements
    if not expected:
        return 0.0

    available = set(asset_terms(asset, "materials") + asset_terms(asset, "placements"))
    hits = sum(1 for item in expected if item in available)
    return hits / len(expected)


def lexical_cosine_score(query_text: str, asset_text: str) -> float:
    query_tokens = tokenize(query_text)
    asset_tokens = tokenize(asset_text)
    if not query_tokens or not asset_tokens:
        return 0.0

    intersection = len(query_tokens & asset_tokens)
    denominator = math.sqrt(len(query_tokens)) * math.sqrt(len(asset_tokens))
    return intersection / denominator if denominator else 0.0


@lru_cache(maxsize=1)
def get_embedding_model() -> Any:
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise RuntimeError("sentence-transformers is not installed") from exc

    model_name = os.environ.get("SCENE_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL)
    return SentenceTransformer(model_name)


def embedding_cosine_score(query_text: str, asset_text: str) -> float:
    model = get_embedding_model()
    vectors = model.encode([query_text, asset_text], normalize_embeddings=True)
    return float(sum(float(a) * float(b) for a, b in zip(vectors[0], vectors[1])))


def semantic_score(query_text: str, asset_text: str) -> float:
    if os.environ.get("SCENE_USE_EMBEDDINGS") == "1":
        try:
            return max(0.0, min(embedding_cosine_score(query_text, asset_text), 1.0))
        except Exception:
            pass

    return lexical_cosine_score(query_text, asset_text)


def score_asset_hybrid(asset: dict[str, Any], parsed_query: ParsedQuery) -> SearchResult:
    asset_text = build_asset_embedding_text(asset)
    semantic = semantic_score(parsed_query.search_text, asset_text)
    category = category_score(asset, parsed_query)
    keyword = keyword_score(asset, parsed_query)
    placement_material = placement_material_score(asset, parsed_query)

    final = (
        SEMANTIC_WEIGHT * semantic
        + CATEGORY_WEIGHT * category
        + KEYWORD_WEIGHT * keyword
        + PLACEMENT_MATERIAL_WEIGHT * placement_material
    )

    return SearchResult(
        asset=asset,
        final_score=round(final, 4),
        semantic_score=round(semantic, 4),
        category_score=round(category, 4),
        keyword_score=round(keyword, 4),
        placement_material_score=round(placement_material, 4),
        parsed_query=parsed_query,
    )


def search_assets(query: str, assets: list[dict[str, Any]], limit: int = 5) -> list[SearchResult]:
    parsed_query = parse_query(query, assets)
    ranked = sorted(
        (score_asset_hybrid(asset, parsed_query) for asset in assets),
        key=lambda result: result.final_score,
        reverse=True,
    )
    return ranked[:limit]
