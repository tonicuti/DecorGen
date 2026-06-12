import type { RoomTemplate } from "@/types";

const API_BASE_URL = "http://127.0.0.1:8000";

type BackendTemplateMatch = {
  template_id: string;
  label: string;
  category?: string;
  template_url: string;
  preview_url?: string;
  description?: string;
  aliases?: string[];
  tags?: string[];
  style?: string;
  room_type?: string;
  mood?: string[];
  features?: string[];
  materials?: string[];
  placements?: string[];
  dimensions?: { w: number; d: number; h: number };
  default_scale?: [number, number, number];
};

type SearchTemplatesResponse = {
  prompt: string;
  matches: BackendTemplateMatch[];
};

function toBackendUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

function toRoomTemplate(item: BackendTemplateMatch): RoomTemplate {
  return {
    id: item.template_id,
    name: item.label,
    category: item.category || "room_template",
    glbUrl: toBackendUrl(item.template_url),
    previewUrl: item.preview_url ? toBackendUrl(item.preview_url) : undefined,
    description: item.description,
    aliases: item.aliases,
    tags: item.tags,
    style: item.style,
    roomType: item.room_type,
    mood: item.mood,
    features: item.features,
    materials: item.materials,
    placements: item.placements,
    dimensions: item.dimensions,
    defaultScale: item.default_scale || [1, 1, 1],
  };
}

export async function searchRoomTemplates(prompt: string, limit = 5): Promise<RoomTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/api/templates/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, limit }),
  });

  if (!response.ok) {
    throw new Error(`Template search failed: ${response.status}`);
  }

  const data = (await response.json()) as SearchTemplatesResponse;
  return data.matches.map(toRoomTemplate);
}
