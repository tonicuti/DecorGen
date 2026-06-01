"""
Traditional-CV floor plan object extractor.

Detects simple rectangular objects in black-on-white 2D floor plans, extracts
rotated bounding boxes, deskews each object crop, runs OCR, and returns JSON.

CLI:
    python floor_plan_analyzer.py path/to/floor_plan.png --pretty

FastAPI:
    uvicorn floor_plan_analyzer:app --reload
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import cv2
import numpy as np
import pytesseract


LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class AnalyzerConfig:
    """Tunable parameters for floor-plan extraction."""

    min_contour_area: float = 350.0
    max_area_fraction: float = 0.95
    min_rectangularity: float = 0.55
    min_side_length: float = 20.0
    gaussian_kernel_size: int = 5
    morph_kernel_size: int = 3
    morph_close_iterations: int = 1
    ocr_scale: float = 2.5
    ocr_psm: int = 7
    tesseract_lang: str = "eng"
    duplicate_iou_threshold: float = 0.88
    container_min_children: int = 2
    container_area_ratio: float = 2.5
    object_min_room_area_fraction: float = 0.003
    object_max_room_area_fraction: float = 0.65


class FloorPlanAnalyzer:
    """Extract rectangular floor-plan items and labels using OpenCV + Tesseract."""

    def __init__(
        self,
        config: AnalyzerConfig | None = None,
        tesseract_cmd: str | None = None,
    ) -> None:
        self.config = config or AnalyzerConfig()
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def analyze_file(self, image_path: str | Path) -> dict[str, Any]:
        """Analyze an image from disk and return a JSON-serializable dict."""
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {path}")

        image = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError(f"OpenCV could not read image: {path}")

        result = self.analyze_image(image)
        result["source"] = str(path)
        return result

    def analyze_image(self, image: np.ndarray) -> dict[str, Any]:
        """Analyze an already-loaded BGR/RGB image array."""
        if image is None or image.size == 0:
            raise ValueError("Input image is empty.")

        bgr = self._ensure_bgr(image)
        height, width = bgr.shape[:2]
        binary = self._preprocess(bgr)
        contours = self._find_contours(binary)

        warnings: list[str] = []
        if not contours:
            warnings.append("No contours found.")

        candidates = self._extract_candidates(contours, width, height)
        candidates = self._deduplicate_candidates(candidates)
        room = self._select_room_candidate(candidates)

        if room is None:
            warnings.append("No room rectangle found.")
            return {
                "room": None,
                "items": [],
                "warnings": warnings,
            }

        try:
            room_axes = self._read_room_axes(bgr, room)
        except Exception as exc:
            LOGGER.exception("Failed to read room axes.")
            warnings.append(f"OCR failed for room axes: {exc}")
            room_axes = {
                "Ox": None,
                "Oy": None,
                "labels": [],
            }

        object_candidates = self._extract_room_object_candidates(candidates, room)

        items: list[dict[str, Any]] = []
        for index, candidate in enumerate(object_candidates, start=1):
            try:
                crop = self._extract_rotated_roi(bgr, candidate["rect"])
                ocr = self._read_text(crop)
                if not ocr["text"]:
                    ocr = self._read_nearby_text(bgr, candidate, room)
            except Exception as exc:  # Keep one bad object from killing the API.
                LOGGER.exception("Failed to process contour %s", index)
                warnings.append(f"OCR failed for candidate {index}: {exc}")
                ocr = {"text": "", "confidence": 0.0}

            label = ocr["text"] or f"object_{index}"
            item = {
                "label": label,
                "coordinates": self._format_room_relative_coordinates(
                    candidate,
                    room,
                    room_axes,
                ),
                "rotate": round(float(candidate["angle"]), 2),
                "ocr_confidence": round(float(ocr["confidence"]), 2),
            }
            items.append(item)

        self._deduplicate_item_labels(items)

        if not items:
            warnings.append("No valid rectangular items found after filtering.")

        return {
            "room": {
                "axes": {
                    "Ox": room_axes["Ox"],
                    "Oy": room_axes["Oy"],
                },
            },
            "items": items,
            "warnings": warnings,
        }

    def to_json(self, image_path: str | Path, pretty: bool = False) -> str:
        """Analyze a file and return JSON text."""
        result = self.analyze_file(image_path)
        return json.dumps(result, indent=2 if pretty else None, ensure_ascii=False)

    def _ensure_bgr(self, image: np.ndarray) -> np.ndarray:
        if len(image.shape) == 2:
            return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        if image.shape[2] == 4:
            return cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
        return image

    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        cfg = self.config
        kernel_size = cfg.gaussian_kernel_size
        if kernel_size % 2 == 0:
            kernel_size += 1

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (kernel_size, kernel_size), 0)

        _, binary = cv2.threshold(
            blurred,
            0,
            255,
            cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU,
        )

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (cfg.morph_kernel_size, cfg.morph_kernel_size),
        )
        binary = cv2.morphologyEx(
            binary,
            cv2.MORPH_CLOSE,
            kernel,
            iterations=cfg.morph_close_iterations,
        )
        return binary

    def _find_contours(self, binary: np.ndarray) -> list[np.ndarray]:
        contours, _ = cv2.findContours(
            binary,
            cv2.RETR_LIST,
            cv2.CHAIN_APPROX_SIMPLE,
        )
        return list(contours)

    def _extract_candidates(
        self,
        contours: Iterable[np.ndarray],
        image_width: int,
        image_height: int,
    ) -> list[dict[str, Any]]:
        cfg = self.config
        image_area = image_width * image_height
        candidates: list[dict[str, Any]] = []

        for contour in contours:
            contour_area = float(cv2.contourArea(contour))
            if contour_area < cfg.min_contour_area:
                continue
            if contour_area > image_area * cfg.max_area_fraction:
                continue

            rect = cv2.minAreaRect(contour)
            (cx, cy), (rw, rh), raw_angle = rect
            if rw < cfg.min_side_length or rh < cfg.min_side_length:
                continue

            rect_area = float(rw * rh)
            if rect_area <= 0:
                continue

            rectangularity = contour_area / rect_area
            if rectangularity < cfg.min_rectangularity:
                continue

            angle = self._normalize_rect_angle(raw_angle, rw, rh)
            width, height = self._normalize_rect_size(rw, rh)
            box = cv2.boxPoints(rect)
            x, y, w, h = cv2.boundingRect(box.astype(np.float32))

            candidates.append(
                {
                    "rect": rect,
                    "center": (cx, cy),
                    "size": (width, height),
                    "angle": angle,
                    "area": contour_area,
                    "axis_bbox": (x, y, w, h),
                }
            )

        candidates.sort(key=lambda item: (item["center"][1], item["center"][0]))
        return candidates

    def _normalize_rect_angle(self, angle: float, width: float, height: float) -> float:
        """Convert OpenCV minAreaRect angle to a stable [-90, 90) convention."""
        normalized = float(angle)
        if width < height:
            normalized += 90.0
        while normalized >= 90.0:
            normalized -= 180.0
        while normalized < -90.0:
            normalized += 180.0
        if math.isclose(normalized, -90.0, abs_tol=1e-6):
            normalized = 0.0
        return normalized

    def _normalize_rect_size(self, width: float, height: float) -> tuple[float, float]:
        """Report width as the longer object side for stable JSON output."""
        if height > width:
            return float(height), float(width)
        return float(width), float(height)

    def _deduplicate_candidates(
        self,
        candidates: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        kept: list[dict[str, Any]] = []
        for candidate in sorted(candidates, key=lambda item: item["area"], reverse=True):
            if all(
                self._axis_aligned_iou(candidate["axis_bbox"], old["axis_bbox"])
                < self.config.duplicate_iou_threshold
                for old in kept
            ):
                kept.append(candidate)
        kept.sort(key=lambda item: (item["center"][1], item["center"][0]))
        return kept

    def _select_room_candidate(
        self,
        candidates: list[dict[str, Any]],
    ) -> dict[str, Any] | None:
        if not candidates:
            return None
        return max(candidates, key=lambda item: self._bbox_area(item["axis_bbox"]))

    def _extract_room_object_candidates(
        self,
        candidates: list[dict[str, Any]],
        room: dict[str, Any],
    ) -> list[dict[str, Any]]:
        room_bbox = room["axis_bbox"]
        room_area = self._bbox_area(room_bbox)
        object_candidates: list[dict[str, Any]] = []

        for candidate in candidates:
            if candidate is room:
                continue
            if self._axis_aligned_iou(candidate["axis_bbox"], room_bbox) >= 0.80:
                continue
            if not self._bbox_contains_center(room_bbox, candidate["center"]):
                continue

            candidate_area = self._bbox_area(candidate["axis_bbox"])
            if candidate_area <= room_area * self.config.object_min_room_area_fraction:
                continue
            if candidate_area >= room_area * self.config.object_max_room_area_fraction:
                continue
            if self._is_nested_inside_non_room_candidate(candidate, candidates, room):
                continue

            object_candidates.append(candidate)

        object_candidates.sort(key=lambda item: (item["center"][1], item["center"][0]))
        return object_candidates

    def _is_nested_inside_non_room_candidate(
        self,
        candidate: dict[str, Any],
        candidates: list[dict[str, Any]],
        room: dict[str, Any],
    ) -> bool:
        candidate_area = self._bbox_area(candidate["axis_bbox"])
        for other in candidates:
            if other is candidate or other is room:
                continue
            other_area = self._bbox_area(other["axis_bbox"])
            if other_area < candidate_area * self.config.container_area_ratio:
                continue
            if self._bbox_contains_center(other["axis_bbox"], candidate["center"]):
                return True
        return False

    def _format_room_relative_coordinates(
        self,
        candidate: dict[str, Any],
        room: dict[str, Any],
        room_axes: dict[str, Any],
    ) -> dict[str, float]:
        room_x, room_y, room_width, room_height = room["axis_bbox"]
        room_bottom = room_y + room_height
        x_scale, y_scale = self._room_coordinate_scale(room, room_axes)
        cx, cy = candidate["center"]

        return {
            "x": round(float(cx - room_x) * x_scale, 2),
            "y": round(float(room_bottom - cy) * y_scale, 2)
        }

    def _room_coordinate_scale(
        self,
        room: dict[str, Any],
        room_axes: dict[str, Any],
    ) -> tuple[float, float]:
        _, _, room_width, room_height = room["axis_bbox"]
        width_units = room_axes.get("Ox") or room_width
        height_units = room_axes.get("Oy") or room_height
        return (
            float(width_units) / float(room_width),
            float(height_units) / float(room_height),
        )

    def _deduplicate_item_labels(self, items: list[dict[str, Any]]) -> None:
        label_counts: dict[str, int] = {}
        for item in items:
            label = str(item.get("label") or "").strip()
            label_key = self._label_duplicate_key(label)
            label_counts[label_key] = label_counts.get(label_key, 0) + 1

        seen: dict[str, int] = {}
        for item in items:
            label = str(item.get("label") or "").strip()
            label_key = self._label_duplicate_key(label)
            if label_counts.get(label_key, 0) <= 1:
                item["label"] = label
                continue

            seen[label_key] = seen.get(label_key, 0) + 1
            item["label"] = f"{label}_{seen[label_key]}"

    def _label_duplicate_key(self, label: str) -> str:
        return re.sub(r"\s+", " ", label.strip()).casefold()

    def _remove_enclosing_containers(
        self,
        candidates: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        cfg = self.config
        kept: list[dict[str, Any]] = []

        for index, candidate in enumerate(candidates):
            child_count = 0
            candidate_area = self._bbox_area(candidate["axis_bbox"])
            for other_index, other in enumerate(candidates):
                if index == other_index:
                    continue

                other_area = self._bbox_area(other["axis_bbox"])
                if candidate_area < other_area * cfg.container_area_ratio:
                    continue

                if self._bbox_contains_center(candidate["axis_bbox"], other["center"]):
                    child_count += 1

            if child_count >= cfg.container_min_children:
                continue

            kept.append(candidate)

        return kept

    def _bbox_area(self, bbox: tuple[int, int, int, int]) -> float:
        _, _, width, height = bbox
        return float(max(0, width) * max(0, height))

    def _bbox_contains_center(
        self,
        bbox: tuple[int, int, int, int],
        center: tuple[float, float],
    ) -> bool:
        x, y, width, height = bbox
        cx, cy = center
        return x <= cx <= x + width and y <= cy <= y + height

    def _axis_aligned_iou(
        self,
        a: tuple[int, int, int, int],
        b: tuple[int, int, int, int],
    ) -> float:
        ax, ay, aw, ah = a
        bx, by, bw, bh = b

        x1 = max(ax, bx)
        y1 = max(ay, by)
        x2 = min(ax + aw, bx + bw)
        y2 = min(ay + ah, by + bh)

        intersection = max(0, x2 - x1) * max(0, y2 - y1)
        union = aw * ah + bw * bh - intersection
        return float(intersection / union) if union else 0.0

    def _extract_rotated_roi(
        self,
        image: np.ndarray,
        rect: tuple[tuple[float, float], tuple[float, float], float],
    ) -> np.ndarray:
        box = cv2.boxPoints(rect).astype("float32")
        ordered = self._order_points(box)

        width_a = np.linalg.norm(ordered[2] - ordered[3])
        width_b = np.linalg.norm(ordered[1] - ordered[0])
        height_a = np.linalg.norm(ordered[1] - ordered[2])
        height_b = np.linalg.norm(ordered[0] - ordered[3])

        output_width = max(1, int(round(max(width_a, width_b))))
        output_height = max(1, int(round(max(height_a, height_b))))

        destination = np.array(
            [
                [0, 0],
                [output_width - 1, 0],
                [output_width - 1, output_height - 1],
                [0, output_height - 1],
            ],
            dtype="float32",
        )

        transform = cv2.getPerspectiveTransform(ordered, destination)
        crop = cv2.warpPerspective(image, transform, (output_width, output_height))

        if crop.shape[0] > crop.shape[1] * 1.25:
            crop = cv2.rotate(crop, cv2.ROTATE_90_CLOCKWISE)
        return crop

    def _order_points(self, points: np.ndarray) -> np.ndarray:
        """Return points ordered as top-left, top-right, bottom-right, bottom-left."""
        rect = np.zeros((4, 2), dtype="float32")
        point_sum = points.sum(axis=1)
        point_diff = np.diff(points, axis=1)

        rect[0] = points[np.argmin(point_sum)]
        rect[2] = points[np.argmax(point_sum)]
        rect[1] = points[np.argmin(point_diff)]
        rect[3] = points[np.argmax(point_diff)]
        return rect

    def _read_room_axes(
        self,
        image: np.ndarray,
        room: dict[str, Any],
    ) -> dict[str, Any]:
        room_bbox = room["axis_bbox"]
        x_axis_label = self._read_dimension_near_room_side(image, room_bbox, "width")
        y_axis_label = self._read_dimension_near_room_side(image, room_bbox, "height")
        x_axis_label, y_axis_label = self._repair_room_axis_labels(
            room_bbox,
            x_axis_label,
            y_axis_label,
        )

        selected_labels = []
        if x_axis_label is not None:
            selected_labels.append(x_axis_label)
        if y_axis_label is not None:
            selected_labels.append(y_axis_label)

        return {
            "Ox": x_axis_label["value"] if x_axis_label else None,
            "Oy": y_axis_label["value"] if y_axis_label else None,
            "labels": selected_labels,
        }

    def _repair_room_axis_labels(
        self,
        room_bbox: tuple[int, int, int, int],
        x_axis_label: dict[str, Any] | None,
        y_axis_label: dict[str, Any] | None,
    ) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
        if x_axis_label is None or y_axis_label is None:
            return x_axis_label, y_axis_label

        _, _, room_width, room_height = room_bbox
        if room_width <= 0 or room_height <= 0:
            return x_axis_label, y_axis_label

        x_value = float(x_axis_label["value"])
        y_value = float(y_axis_label["value"])
        if x_value <= 0 or y_value <= 0:
            return x_axis_label, y_axis_label

        expected_y = x_value * (float(room_height) / float(room_width))
        y_axis_label = self._repair_likely_missing_zero(y_axis_label, expected_y)

        repaired_y_value = float(y_axis_label["value"])
        expected_x = repaired_y_value * (float(room_width) / float(room_height))
        x_axis_label = self._repair_likely_missing_zero(x_axis_label, expected_x)
        return x_axis_label, y_axis_label

    def _repair_likely_missing_zero(
        self,
        label: dict[str, Any],
        expected_value: float,
    ) -> dict[str, Any]:
        if expected_value <= 0:
            return label

        value = float(label["value"])
        current_error = abs(value - expected_value) / expected_value
        best_value = value
        best_error = current_error

        for multiplier in (10.0, 100.0):
            candidate = value * multiplier
            candidate_error = abs(candidate - expected_value) / expected_value
            if candidate_error < best_error:
                best_value = candidate
                best_error = candidate_error

        if best_value == value:
            return label
        if current_error < 0.45 or best_error > 0.25 or best_error > current_error * 0.5:
            return label

        repaired = dict(label)
        repaired["value"] = self._format_axis_number(best_value)
        repaired["text"] = str(repaired["value"])
        repaired["corrected_from"] = label["value"]
        return repaired

    def _format_axis_number(self, value: float) -> int | float:
        rounded = round(float(value), 2)
        if float(rounded).is_integer():
            return int(rounded)
        return rounded

    def _read_dimension_near_room_side(
        self,
        image: np.ndarray,
        room_bbox: tuple[int, int, int, int],
        orientation: str,
    ) -> dict[str, Any] | None:
        image_height, image_width = image.shape[:2]
        room_x, room_y, room_width, room_height = room_bbox
        room_right = room_x + room_width
        room_bottom = room_y + room_height

        x_margin = int(round(room_width * 0.12))
        y_margin = int(round(room_height * 0.12))
        if orientation == "width":
            regions = [
                (
                    max(0, room_x - x_margin),
                    room_bottom,
                    min(image_width, room_right + x_margin),
                    image_height,
                ),
                (
                    max(0, room_x - x_margin),
                    0,
                    min(image_width, room_right + x_margin),
                    room_y,
                ),
            ]
        else:
            regions = [
                (
                    0,
                    max(0, room_y - y_margin),
                    room_x,
                    min(image_height, room_bottom + y_margin),
                ),
                (
                    room_right,
                    max(0, room_y - y_margin),
                    image_width,
                    min(image_height, room_bottom + y_margin),
                ),
            ]

        labels: list[dict[str, Any]] = []
        for region in regions:
            labels.extend(self._read_numeric_labels_from_region(image, region))

        return self._best_dimension_label(labels, room_bbox, orientation)

    def _read_numeric_labels_from_region(
        self,
        image: np.ndarray,
        region: tuple[int, int, int, int],
    ) -> list[dict[str, Any]]:
        x1, y1, x2, y2 = region
        if x2 <= x1 or y2 <= y1:
            return []

        crop = image[y1:y2, x1:x2]
        labels: list[dict[str, Any]] = []
        for psm in (8, 13):
            label = self._read_numeric_string_label(crop, offset=(x1, y1), psm=psm)
            if label is not None:
                labels.append(label)
        for psm in (8, 13, 7, 6, 11):
            labels.extend(self._read_numeric_labels(crop, offset=(x1, y1), psm=psm))
        return self._deduplicate_numeric_labels(labels)

    def _read_numeric_string_label(
        self,
        image: np.ndarray,
        offset: tuple[int, int],
        psm: int,
    ) -> dict[str, Any] | None:
        image, text_offset = self._crop_likely_numeric_text(image)
        offset = (offset[0] + text_offset[0], offset[1] + text_offset[1])
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        scale = 2.5
        gray = cv2.resize(
            gray,
            None,
            fx=scale,
            fy=scale,
            interpolation=cv2.INTER_CUBIC,
        )
        _, thresholded = cv2.threshold(
            gray,
            0,
            255,
            cv2.THRESH_BINARY | cv2.THRESH_OTSU,
        )
        config = f"--oem 3 --psm {psm} -c tessedit_char_whitelist=0123456789."
        text = pytesseract.image_to_string(
            thresholded,
            lang=self.config.tesseract_lang,
            config=config,
        )
        text = self._clean_numeric_text(text)
        value = self._parse_number(text)
        if value is None:
            return None

        foreground = np.where(thresholded < 128)
        if len(foreground[0]) == 0:
            return None
        x, y, width, height = cv2.boundingRect(
            np.column_stack((foreground[1], foreground[0])).astype(np.int32)
        )
        unscaled_x = float(x) / scale + offset[0]
        unscaled_y = float(y) / scale + offset[1]
        unscaled_width = float(width) / scale
        unscaled_height = float(height) / scale
        return {
            "text": text,
            "value": value,
            "confidence": 99.0,
            "coordinates": {
                "x": round(unscaled_x + unscaled_width / 2, 2),
                "y": round(unscaled_y + unscaled_height / 2, 2),
                "width": round(unscaled_width, 2),
                "height": round(unscaled_height, 2),
            },
        }

    def _crop_likely_numeric_text(
        self,
        image: np.ndarray,
    ) -> tuple[np.ndarray, tuple[int, int]]:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(
            gray,
            0,
            255,
            cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU,
        )
        contours, _ = cv2.findContours(
            binary,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        height, width = image.shape[:2]
        boxes: list[tuple[int, int, int, int]] = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if w < 4 or h < 8:
                continue
            if h > height * 0.45 and w < width * 0.08:
                continue
            if w > width * 0.45 and h < height * 0.08:
                continue
            boxes.append((x, y, w, h))

        if not boxes:
            return image, (0, 0)

        x1 = max(0, min(x for x, _, _, _ in boxes) - 8)
        y1 = max(0, min(y for _, y, _, _ in boxes) - 8)
        x2 = min(width, max(x + w for x, _, w, _ in boxes) + 8)
        y2 = min(height, max(y + h for _, y, _, h in boxes) + 8)
        return image[y1:y2, x1:x2], (x1, y1)

    def _read_numeric_labels(
        self,
        image: np.ndarray,
        offset: tuple[int, int] = (0, 0),
        psm: int = 11,
    ) -> list[dict[str, Any]]:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        scale = 2.5
        gray = cv2.resize(
            gray,
            None,
            fx=scale,
            fy=scale,
            interpolation=cv2.INTER_CUBIC,
        )
        _, thresholded = cv2.threshold(
            gray,
            0,
            255,
            cv2.THRESH_BINARY | cv2.THRESH_OTSU,
        )
        config = f"--oem 3 --psm {psm} -c tessedit_char_whitelist=0123456789."
        data = pytesseract.image_to_data(
            thresholded,
            lang=self.config.tesseract_lang,
            config=config,
            output_type=pytesseract.Output.DICT,
        )

        labels: list[dict[str, Any]] = []
        for index, raw_text in enumerate(data.get("text", [])):
            text = self._clean_numeric_text(raw_text)
            if not text:
                continue

            value = self._parse_number(text)
            if value is None:
                continue

            try:
                confidence = float(data.get("conf", [])[index])
            except (IndexError, TypeError, ValueError):
                confidence = 0.0
            if confidence < 0:
                continue

            x = float(data.get("left", [0])[index]) / scale + offset[0]
            y = float(data.get("top", [0])[index]) / scale + offset[1]
            width = float(data.get("width", [0])[index]) / scale
            height = float(data.get("height", [0])[index]) / scale
            labels.append(
                {
                    "text": text,
                    "value": value,
                    "confidence": round(confidence, 2),
                    "coordinates": {
                        "x": round(x + width / 2, 2),
                        "y": round(y + height / 2, 2),
                        "width": round(width, 2),
                        "height": round(height, 2),
                    },
                }
            )
        return labels

    def _deduplicate_numeric_labels(
        self,
        labels: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        kept: list[dict[str, Any]] = []
        for label in sorted(labels, key=lambda item: item["confidence"], reverse=True):
            bbox = self._coordinates_to_bbox(label["coordinates"])
            duplicate = False
            for old in kept:
                old_bbox = self._coordinates_to_bbox(old["coordinates"])
                if self._axis_aligned_iou(bbox, old_bbox) > 0.55:
                    duplicate = True
                    break
            if not duplicate:
                kept.append(label)
        return kept

    def _coordinates_to_bbox(
        self,
        coordinates: dict[str, float],
    ) -> tuple[int, int, int, int]:
        width = float(coordinates["width"])
        height = float(coordinates["height"])
        x = float(coordinates["x"]) - width / 2
        y = float(coordinates["y"]) - height / 2
        return (
            int(round(x)),
            int(round(y)),
            int(round(width)),
            int(round(height)),
        )

    def _classify_dimension_label(
        self,
        label: dict[str, Any],
        room_bbox: tuple[int, int, int, int],
    ) -> str | None:
        room_x, room_y, room_width, room_height = room_bbox
        room_right = room_x + room_width
        room_bottom = room_y + room_height
        center = label["coordinates"]
        cx = float(center["x"])
        cy = float(center["y"])

        horizontal_margin = max(room_width * 0.25, 80.0)
        vertical_margin = max(room_height * 0.25, 80.0)

        near_horizontal_side = room_x - horizontal_margin <= cx <= room_right + horizontal_margin
        outside_y = cy < room_y or cy > room_bottom
        if near_horizontal_side and outside_y:
            return "width"

        near_vertical_side = room_y - vertical_margin <= cy <= room_bottom + vertical_margin
        outside_x = cx < room_x or cx > room_right
        if near_vertical_side and outside_x:
            return "height"

        return None

    def _best_dimension_label(
        self,
        labels: list[dict[str, Any]],
        room_bbox: tuple[int, int, int, int],
        orientation: str,
    ) -> dict[str, Any] | None:
        if not labels:
            return None

        room_x, room_y, room_width, room_height = room_bbox
        room_center_x = room_x + room_width / 2
        room_center_y = room_y + room_height / 2

        def score(label: dict[str, Any]) -> tuple[float, float]:
            coordinates = label["coordinates"]
            if orientation == "width":
                distance = abs(float(coordinates["x"]) - room_center_x)
            else:
                distance = abs(float(coordinates["y"]) - room_center_y)
            return (float(label["confidence"]), -distance)

        return max(labels, key=score)

    def _clean_numeric_text(self, text: str) -> str:
        text = re.sub(r"[^0-9.]+", "", text or "")
        return text.strip(".")

    def _parse_number(self, text: str) -> int | float | None:
        if not text:
            return None
        try:
            number = float(text)
        except ValueError:
            return None
        if number.is_integer():
            return int(number)
        return number

    def _read_nearby_text(
        self,
        image: np.ndarray,
        candidate: dict[str, Any],
        room: dict[str, Any],
    ) -> dict[str, Any]:
        x, y, width, height = candidate["axis_bbox"]
        room_x, room_y, room_width, room_height = room["axis_bbox"]
        room_right = room_x + room_width
        room_bottom = room_y + room_height

        pad_x = max(8, int(round(width * 0.08)))
        pad_above = max(24, int(round(height * 2.4)))
        pad_below = max(8, int(round(height * 0.35)))

        crop_x1 = max(room_x, x - pad_x)
        crop_y1 = max(room_y, y - pad_above)
        crop_x2 = min(room_right, x + width + pad_x)
        crop_y2 = min(room_bottom, y + height + pad_below)

        if crop_x2 <= crop_x1 or crop_y2 <= crop_y1:
            return {"text": "", "confidence": 0.0}

        crop = image[crop_y1:crop_y2, crop_x1:crop_x2]
        return self._read_text(crop, trim_border=False)

    def _read_text(self, crop: np.ndarray, trim_border: bool = True) -> dict[str, Any]:
        prepared = self._prepare_crop_for_ocr(crop, trim_border=trim_border)
        best = {"text": "", "confidence": 0.0}

        for variant in self._ocr_variants(prepared):
            try:
                result = self._run_tesseract(variant)
            except pytesseract.TesseractNotFoundError:
                raise RuntimeError(
                    "Tesseract executable was not found. Install Tesseract-OCR "
                    "or pass tesseract_cmd to FloorPlanAnalyzer."
                )
            except Exception as exc:
                LOGGER.warning("Tesseract OCR failed for one crop: %s", exc)
                continue

            if result["confidence"] > best["confidence"]:
                best = result

        return best

    def _prepare_crop_for_ocr(
        self,
        crop: np.ndarray,
        trim_border: bool = True,
    ) -> np.ndarray:
        if trim_border:
            crop = self._trim_crop_border(crop)
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        if self.config.ocr_scale != 1.0:
            gray = cv2.resize(
                gray,
                None,
                fx=self.config.ocr_scale,
                fy=self.config.ocr_scale,
                interpolation=cv2.INTER_CUBIC,
            )

        gray = cv2.GaussianBlur(gray, (3, 3), 0)
        _, thresholded = cv2.threshold(
            gray,
            0,
            255,
            cv2.THRESH_BINARY | cv2.THRESH_OTSU,
        )
        return thresholded

    def _trim_crop_border(self, crop: np.ndarray) -> np.ndarray:
        height, width = crop.shape[:2]
        margin_x = min(int(round(width * 0.08)), max(0, width // 4 - 1))
        margin_y = min(int(round(height * 0.08)), max(0, height // 4 - 1))

        if margin_x <= 0 and margin_y <= 0:
            return crop
        if width - 2 * margin_x < 8 or height - 2 * margin_y < 8:
            return crop

        return crop[margin_y : height - margin_y, margin_x : width - margin_x]

    def _ocr_variants(self, image: np.ndarray) -> list[np.ndarray]:
        return [
            image,
            cv2.rotate(image, cv2.ROTATE_180),
            cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE),
            cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE),
        ]

    def _run_tesseract(self, image: np.ndarray) -> dict[str, Any]:
        config = (
            f"--oem 3 --psm {self.config.ocr_psm} "
            "-c tessedit_char_whitelist="
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_/ ."
        )
        data = pytesseract.image_to_data(
            image,
            lang=self.config.tesseract_lang,
            config=config,
            output_type=pytesseract.Output.DICT,
        )

        words: list[str] = []
        confidences: list[float] = []
        for text, confidence in zip(data.get("text", []), data.get("conf", [])):
            cleaned = self._clean_text(text)
            try:
                conf_value = float(confidence)
            except (TypeError, ValueError):
                conf_value = -1.0

            if cleaned and re.search(r"[A-Za-z0-9]", cleaned) and conf_value >= 0:
                words.append(cleaned)
                confidences.append(conf_value)

        text = self._clean_text(" ".join(words))
        confidence = float(np.mean(confidences)) if confidences else 0.0
        return {"text": text, "confidence": confidence}

    def _clean_text(self, text: str) -> str:
        text = re.sub(r"[^A-Za-z0-9\-_/ .]+", " ", text or "")
        text = re.sub(r"\s+", " ", text)
        return text.strip()


def create_app() -> Any:
    """Create a FastAPI app exposing the analyzer as POST /analyze."""
    from fastapi import FastAPI, File, HTTPException, UploadFile

    api = FastAPI(title="Floor Plan Analyzer", version="1.0.0")
    analyzer = FloorPlanAnalyzer()

    @api.post("/analyze")
    async def analyze_floor_plan(file: UploadFile = File(...)) -> dict[str, Any]:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=415, detail="Upload must be an image.")

        contents = await file.read()
        buffer = np.frombuffer(contents, dtype=np.uint8)
        image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="Could not decode image.")

        try:
            return analyzer.analyze_image(image)
        except Exception as exc:
            LOGGER.exception("Floor-plan analysis failed.")
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    return api


try:
    app = create_app()
except ImportError:
    app = None


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract metadata from a floor plan.")
    parser.add_argument("image", help="Path to the floor plan image.")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON.")
    parser.add_argument(
        "--tesseract-cmd",
        default=None,
        help="Optional path to the Tesseract executable.",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    analyzer = FloorPlanAnalyzer(tesseract_cmd=args.tesseract_cmd)
    print(analyzer.to_json(args.image, pretty=args.pretty))


if __name__ == "__main__":
    main()
