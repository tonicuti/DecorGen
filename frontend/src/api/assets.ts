import { DEFAULT_ASSET_SVG } from "@/api/mock-data";
import type { Asset } from "@/types";

const API_BASE_URL = "http://127.0.0.1:8000";

type BackendAssetMatch = {
  asset_id: string;
  label: string;
  category?: string;
  asset_url: string;
  final_score?: number;
  description?: string;
  aliases?: string[];
  tags?: string[];
  materials?: string[];
  placements?: string[];
  dimensions?: { w: number; d: number; h: number };
  default_scale?: [number, number, number];
};

type SearchAssetsResponse = {
  prompt: string;
  matches: BackendAssetMatch[];
};

function toBackendUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

function toUiCategory(category?: string) {
  switch (category) {
    case "kitchenware":
      return "Kitchenware";
    case "lamp":
      return "Lighting";
    case "mirror":
    case "decor":
      return "Decor";
    case "sofa":
      return "Seating";
    case "shelving":
      return "Storage";
    case "table":
      return "Tables";
    case "plant":
      return "Plants";
    default:
      return category || "Decor";
  }
}

function toPlacementType(placements?: string[]): Asset["placementType"] {
  if (!placements?.length) return "floor";
  if (placements.includes("ceiling")) return "ceiling";
  if (placements.some((item) => item === "wall" || item.endsWith("_wall"))) return "wall";
  if (
    placements.some((item) =>
      ["tabletop", "countertop", "desk", "shelf", "windowsill", "stove"].includes(item)
    )
  ) {
    return "tabletop";
  }
  return "floor";
}

export async function searchBedroomAssets(prompt: string, limit = 10): Promise<Asset[]> {
  const response = await fetch(`${API_BASE_URL}/api/assets/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, limit }),
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  const data = (await response.json()) as SearchAssetsResponse;

  return data.matches.map((item) => ({
    id: item.asset_id,
    name: item.label,
    category: toUiCategory(item.category),
    image: DEFAULT_ASSET_SVG,
    glbUrl: toBackendUrl(item.asset_url),
    placementType: toPlacementType(item.placements),
    dimensions: item.dimensions || { w: 1, h: 1, d: 1 },
    defaultScale: item.default_scale || [1, 1, 1],
    metadataCategory: item.category,
    description: item.description,
    aliases: item.aliases,
    tags: item.tags,
    materials: item.materials,
    placements: item.placements,
  }));
}
