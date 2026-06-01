import type {
  Asset,
  Bedroom,
  ColorSwatch,
  DetectedObject,
  EnvironmentPreset,
  MaterialPreset,
  ObjectPart,
  SceneNode,
  SceneObject,
} from "@/types";

// ============================================================================
// Image Previews
// ============================================================================

// --- Bedroom Preview Images ---
const BEDROOM_1_IMG = "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600";
const BEDROOM_2_IMG = "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600";
const BEDROOM_3_IMG = "https://images.unsplash.com/photo-1616593969747-4797dc75033e?w=600";
const BEDROOM_4_IMG = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600";

// --- 3D Library Asset Previews ---
const ASSET_BED_1 = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300";
const ASSET_BED_2 = "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=300";
const ASSET_STORAGE_1 = "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=300";
const ASSET_STORAGE_2 = "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=300";
const ASSET_CHAIR_1 = "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=300";
const ASSET_BENCH_1 = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300";
const ASSET_LAMP_1 = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300";
const ASSET_DECOR_1 = "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=300";
const ASSET_DECOR_2 = "https://images.unsplash.com/photo-1617103996702-96ff29b1c467?w=300";
const ASSET_DECOR_3 = "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=300";
const ASSET_PET_1 = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300";
const ASSET_PET_2 = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300";
const ASSET_DOOR_1 = "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300";
const ASSET_WINDOW_1 = "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=300";

// --- Generic Fallback Previews ---
export const DEFAULT_ASSET_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23818cf8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect width='24' height='24' rx='4' fill='%23f4f4f5'/><path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/><polyline points='3.27 6.96 12 12.01 20.73 6.96'/><line x1='12' y1='22.08' x2='12' y2='12'/></svg>`;
export const DEFAULT_BEDROOM_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%2318181b"/><g transform="translate(150, 100)" stroke="%236366f1" stroke-width="2" fill="none"><path d="M-40,-20 L0,-40 L40,-20 L40,20 L0,40 L-40,20 Z" /><path d="M-40,-20 L0,0 L40,-20" /><path d="M0,0 L0,40" /><circle cx="0" cy="-40" r="4" fill="%23a855f7" stroke="none"/><circle cx="-40" cy="-20" r="4" fill="%23ec4899" stroke="none"/><circle cx="40" cy="-20" r="4" fill="%23ec4899" stroke="none"/></g></svg>`;

// ============================================================================
// Layout and Scene Tree Catalog
// ============================================================================

// --- Saved Projects / Bedroom Layouts ---
export const SAMPLE_BEDROOMS: Bedroom[] = [
  {
    id: "proj-1",
    name: "Minimalist Master Bedroom",
    updatedAt: "2 hours ago",
    thumbnail: BEDROOM_1_IMG,
    active: true,
  },
  {
    id: "proj-2",
    name: "Cozy Scandinavian Bedroom",
    updatedAt: "2 days ago",
    thumbnail: BEDROOM_2_IMG,
  },
  {
    id: "proj-3",
    name: "Modern Japandi Bedroom",
    updatedAt: "1 week ago",
    thumbnail: BEDROOM_3_IMG,
  },
  {
    id: "proj-4",
    name: "Rustic Loft Bedroom",
    updatedAt: "2 weeks ago",
    thumbnail: BEDROOM_4_IMG,
  },
];

// --- Available 3D Catalog Assets ---
export const SAMPLE_ASSETS: Asset[] = [
  {
    id: "bed-1",
    name: "King Size Velvet Bed",
    category: "Beds",
    image: ASSET_BED_1,
    premium: true,
    placementType: "floor",
    dimensions: { w: 2.0, d: 2.2, h: 1.0 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/furniture/king_bed.glb",
    defaultElevation: 0,
    defaultMaterials: {
      body: "wood-walnut",
      cushion: "fabric-velvet",
      legs: "metal-gold",
    },
  },
  {
    id: "bed-2",
    name: "Japandi Platform Bed",
    category: "Beds",
    image: ASSET_BED_2,
    placementType: "floor",
    dimensions: { w: 1.8, d: 2.1, h: 0.8 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/furniture/platform_bed.glb",
    defaultElevation: 0,
    defaultMaterials: {
      body: "wood-oak",
      cushion: "fabric-linen",
    },
  },
  {
    id: "storage-1",
    name: "Oak Wood Nightstand",
    category: "Storage",
    image: ASSET_STORAGE_1,
    placementType: "floor",
    dimensions: { w: 0.5, d: 0.45, h: 0.55 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/furniture/nightstand.glb",
    defaultElevation: 0,
    defaultMaterials: {
      body: "wood-oak",
    },
  },
  {
    id: "storage-2",
    name: "Modern 3-Door Wardrobe",
    category: "Storage",
    image: ASSET_STORAGE_2,
    premium: true,
    placementType: "floor",
    dimensions: { w: 1.6, d: 0.65, h: 2.1 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/furniture/wardrobe.glb",
    defaultElevation: 0,
    defaultMaterials: {
      body: "wood-walnut",
      handles: "metal-brushed",
    },
  },
  {
    id: "chair-1",
    name: "Bouclé Accent Chair",
    category: "Seating",
    image: ASSET_CHAIR_1,
    placementType: "floor",
    dimensions: { w: 0.85, d: 0.8, h: 0.78 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/furniture/accent_chair.glb",
    defaultElevation: 0,
    defaultMaterials: {
      cushion: "fabric-linen",
      legs: "wood-walnut",
    },
  },
  {
    id: "bench-1",
    name: "Tufted Bed-End Bench",
    category: "Seating",
    image: ASSET_BENCH_1,
    placementType: "floor",
    dimensions: { w: 1.3, d: 0.45, h: 0.48 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/furniture/bench.glb",
    defaultElevation: 0,
    defaultMaterials: {
      cushion: "leather-vintage",
      legs: "metal-brushed",
    },
  },
  {
    id: "lamp-1",
    name: "Bedside Brass Lamp",
    category: "Lighting",
    image: ASSET_LAMP_1,
    placementType: "tabletop",
    dimensions: { w: 0.28, d: 0.28, h: 0.58 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/furniture/brass_lamp.glb",
    defaultElevation: 0.55,
    defaultMaterials: {
      shade: "fabric-linen",
      base: "metal-gold",
    },
  },
  {
    id: "decor-1",
    name: "Monochrome Wool Rug",
    category: "Decor",
    image: ASSET_DECOR_1,
    placementType: "floor",
    dimensions: { w: 2.0, d: 2.8, h: 0.02 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/furniture/rug.glb",
    defaultElevation: 0.005,
    defaultMaterials: {
      body: "fabric-linen",
    },
  },
  {
    id: "decor-2",
    name: "Full-Length Standing Mirror",
    category: "Decor",
    image: ASSET_DECOR_2,
    placementType: "wall",
    dimensions: { w: 0.7, d: 0.08, h: 1.8 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/furniture/mirror.glb",
    defaultElevation: 0.1,
    defaultMaterials: {
      frame: "metal-gold",
      glass: "glass-frosted",
    },
  },
  {
    id: "decor-3",
    name: "Monstera Floor Plant",
    category: "Decor",
    image: ASSET_DECOR_3,
    placementType: "floor",
    dimensions: { w: 0.75, d: 0.75, h: 1.15 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/furniture/monstera.glb",
    defaultElevation: 0,
    defaultMaterials: {
      pot: "ceramic-marble",
    },
  },
  {
    id: "pet-1",
    name: "Golden Retriever Dog",
    category: "Pets",
    image: ASSET_PET_1,
    placementType: "floor",
    dimensions: { w: 0.45, d: 0.85, h: 0.65 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/pets/dog.glb",
    defaultElevation: 0,
  },
  {
    id: "pet-2",
    name: "British Shorthair Cat",
    category: "Pets",
    image: ASSET_PET_2,
    placementType: "tabletop",
    dimensions: { w: 0.3, d: 0.45, h: 0.35 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/pets/cat.glb",
    defaultElevation: 0.55,
  },
  {
    id: "door-1",
    name: "Modern Wooden Door",
    category: "Openings",
    image: ASSET_DOOR_1,
    placementType: "opening",
    dimensions: { w: 0.9, d: 0.1, h: 2.0 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/openings/door.glb",
    defaultElevation: 0,
    swingDirection: "right",
    defaultMaterials: {
      body: "wood-walnut",
      handle: "metal-brushed",
    },
  },
  {
    id: "window-1",
    name: "Panoramic Glass Window",
    category: "Openings",
    image: ASSET_WINDOW_1,
    placementType: "opening",
    dimensions: { w: 1.4, d: 0.15, h: 1.2 },
    defaultScale: [1.0, 1.0, 1.0],
    glbUrl: "/models/openings/window.glb",
    defaultElevation: 0.9,
    swingDirection: "none",
    defaultMaterials: {
      frame: "metal-brushed",
      glass: "glass-frosted",
    },
  },
];

// --- Workspace & scene settings defaults ---
export const RENDER_QUALITY_OPTIONS = [
  { id: "low" as const, label: "Low" },
  { id: "medium" as const, label: "Medium" },
  { id: "high" as const, label: "High" },
];

export const DEFAULT_WORKSPACE_SETTINGS = {
  renderQuality: "high" as const,
  showFloorGrid: true,
  gridSnapping: true,
};

export const DEFAULT_SCENE_SETTINGS = {
  environmentId: "hdri-studio",
  gridOverlay: true,
  realisticLighting: true,
  softShadows: true,
  cameraFov: 50,
};

export const WORKSPACE_SHORTCUTS = [
  { keys: "Ctrl+K", description: "Open command palette" },
  { keys: "Ctrl+Z", description: "Undo" },
  { keys: "Ctrl+Y", description: "Redo" },
  { keys: "Ctrl+S", description: "Save bedroom layout (coming soon)" },
  { keys: "Ctrl+Shift+E", description: "Export 2D blueprint" },
  { keys: "G", description: "Toggle 3D floor grid" },
  { keys: "S", description: "Toggle grid snapping" },
];

export const ABOUT_DECORGEN = {
  tagline: "AI-powered bedroom layout designer",
  description:
    "DecorGen helps you plan and visualize bedroom layouts in 2D and 3D before committing to furniture purchases.",
};

// --- Initial Scene Node Tree (R3F Hierarchy) ---
export const INITIAL_TREE: SceneNode[] = [
  {
    id: "cam-1",
    name: "Main Camera",
    type: "camera",
    visible: true,
    locked: true,
    fov: 50,
  },
  {
    id: "light-1",
    name: "Directional Sun Light",
    type: "light",
    visible: true,
    locked: false,
    lightKind: "directional",
    intensity: 1.35,
    castShadow: true,
    position: [5, 12, 5],
  },
  {
    id: "light-2",
    name: "Ambient Light",
    type: "light",
    visible: true,
    locked: false,
    lightKind: "ambient",
    intensity: 0.65,
  },
  {
    id: "group-1",
    name: "Bedroom Furniture",
    type: "group",
    visible: true,
    locked: false,
    expanded: true,
    children: [
      {
        id: "model-1",
        name: "King Size Velvet Bed",
        type: "model",
        visible: true,
        locked: false,
        position: [-0.5, 0.5, -0.4],
        rotation: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        color: "#6366f1",
        assetId: "bed-1",
        placementType: "floor",
        dimensions: { w: 2.0, d: 2.2, h: 1.0 },
        glbUrl: "/models/furniture/king_bed.glb",
        defaultElevation: 0,
        materials: {
          body: "wood-walnut",
          cushion: "fabric-velvet",
          legs: "metal-gold",
        },
      },
      {
        id: "model-2",
        name: "Oak Wood Nightstand",
        type: "model",
        visible: true,
        locked: false,
        expanded: true,
        position: [0.9, 0.275, -1.0],
        rotation: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        color: "#f59e0b",
        assetId: "storage-1",
        placementType: "floor",
        dimensions: { w: 0.5, d: 0.45, h: 0.55 },
        glbUrl: "/models/furniture/nightstand.glb",
        defaultElevation: 0,
        materials: {
          body: "wood-oak",
        },
        children: [
          {
            id: "model-3",
            name: "Bedside Brass Lamp",
            type: "model",
            visible: true,
            locked: false,
            position: [0, 0.565, 0],
            rotation: [0, 0, 0],
            scale: [1.0, 1.0, 1.0],
            color: "#10b981",
            assetId: "lamp-1",
            placementType: "tabletop",
            dimensions: { w: 0.28, d: 0.28, h: 0.58 },
            glbUrl: "/models/furniture/brass_lamp.glb",
            defaultElevation: 0.55,
            materials: {
              shade: "fabric-linen",
              base: "metal-gold",
            },
          },
        ],
      },
      {
        id: "model-4",
        name: "Modern Entrance Door",
        type: "model",
        visible: true,
        locked: false,
        position: [-1.2, 1.0, 1.7],
        rotation: [0, Math.PI, 0],
        scale: [-1.0, 1.0, 1.0],
        color: "#d97706",
        assetId: "door-1",
        placementType: "opening",
        dimensions: { w: 0.9, d: 0.1, h: 2.0 },
        swingDirection: "left",
        glbUrl: "/models/openings/door.glb",
        defaultElevation: 0,
      },
      {
        id: "model-5",
        name: "Panoramic Glass Window",
        type: "model",
        visible: true,
        locked: false,
        position: [0, 0.9 + 0.6, -1.7],
        rotation: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        color: "#60a5fa",
        assetId: "window-1",
        placementType: "opening",
        dimensions: { w: 1.4, d: 0.15, h: 1.2 },
        swingDirection: "none",
        glbUrl: "/models/openings/window.glb",
        defaultElevation: 0.9,
      },
      {
        id: "model-6",
        name: "Wall-Mounted Smart TV",
        type: "model",
        visible: true,
        locked: false,
        position: [1.95, 1.2, 0],
        rotation: [0, -Math.PI / 2, 0],
        scale: [1.0, 1.0, 1.0],
        color: "#475569",
        assetId: "electronics-1",
        placementType: "wall",
        dimensions: { w: 1.2, d: 0.05, h: 0.7 },
        glbUrl: "/models/electronics/smart_tv.glb",
        defaultElevation: 1.2,
        materials: {
          screen: "glass-frosted",
          frame: "metal-brushed",
        },
      },
    ],
  },
];

// ============================================================================
// Design Presets and Customization Options
// ============================================================================

// --- Material Texture Presets ---
export const MATERIAL_PRESETS: MaterialPreset[] = [
  { id: "fabric-velvet", name: "Premium Velvet Fabric", category: "Fabric" },
  { id: "fabric-linen", name: "Natural Linen", category: "Fabric" },
  { id: "wood-walnut", name: "Polished Walnut Wood", category: "Wood" },
  { id: "wood-oak", name: "Light Oak Wood", category: "Wood" },
  { id: "metal-brushed", name: "Brushed Steel", category: "Metal" },
  { id: "metal-gold", name: "Polished Gold", category: "Metal" },
  { id: "leather-vintage", name: "Vintage Brown Leather", category: "Leather" },
  { id: "glass-frosted", name: "Frosted Glass", category: "Glass" },
  { id: "ceramic-marble", name: "White Calacatta Marble", category: "Ceramic" },
];

// --- Theme Color Swatches ---
export const COLOR_SWATCHES: ColorSwatch[] = [
  { name: "Emerald", value: "#10b981" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Slate", value: "#64748b" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Crimson", value: "#be123c" },
  { name: "Navy", value: "#1e3a8a" },
  { name: "Charcoal", value: "#18181b" },
];

export const WALL_COLORS = [
  { name: "Pure White", value: "#f8fafc" },
  { name: "Off-White", value: "#fafaf9" },
  { name: "Sage Green", value: "#dcfce7" },
  { name: "Sky Blue", value: "#e0f2fe" },
  { name: "Cool Gray", value: "#e2e8f0" },
];

export const FLOOR_COLORS = [
  { name: "Oak Wood", value: "#d97706" },
  { name: "Walnut Wood", value: "#b45309" },
  { name: "Slate Tile", value: "#475569" },
  { name: "Light Marble", value: "#f1f5f9" },
  { name: "Ash Gray", value: "#94a3b8" },
];

// --- Configurable Object Sub-parts ---
export const OBJECT_PARTS: ObjectPart[] = [
  { id: "body", name: "Main Frame" },
  { id: "cushion", name: "Cushions/Mattress" },
  { id: "legs", name: "Legs/Base" },
];

// --- Search / Filters Category Listing ---
export const CATEGORIES = [
  "All",
  "Beds",
  "Storage",
  "Seating",
  "Lighting",
  "Decor",
  "Pets",
  "Openings",
];

// --- Search Suggestion Objects ---
export const SCENE_OBJECTS: SceneObject[] = [
  { id: "1", name: "King Size Velvet Bed", category: "Beds" },
  { id: "2", name: "Japandi Platform Bed", category: "Beds" },
  { id: "3", name: "Oak Wood Nightstand", category: "Storage" },
  { id: "4", name: "Modern 3-Door Wardrobe", category: "Storage" },
  { id: "5", name: "Bouclé Accent Chair", category: "Seating" },
  { id: "6", name: "Bedside Brass Lamp", category: "Lighting" },
  { id: "7", name: "Monochrome Wool Rug", category: "Decor" },
  { id: "8", name: "Full-Length Standing Mirror", category: "Decor" },
  { id: "9", name: "Modern Wooden Door", category: "Openings" },
  { id: "10", name: "Panoramic Glass Window", category: "Openings" },
];

/** HDRI crossfade duration when switching environment presets (seconds). */
export const ENV_TRANSITION_SEC = 0.45;

/** Default scene.environmentIntensity when a preset omits `intensity`. */
export const ENVIRONMENT_INTENSITY = 0.45;

// --- 3D Environment Map Lighting Presets ---
export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  {
    id: "hdri-studio",
    name: "Studio Light (Neutral)",
    dreiPreset: "studio",
    intensity: 0.22,
  },
  { id: "hdri-sunset", name: "Warm Sunset", dreiPreset: "sunset", intensity: 0.5 },
  { id: "hdri-daylight", name: "Bright Daylight", dreiPreset: "city", intensity: 0.48 },
  { id: "hdri-interior", name: "Cozy Interior", dreiPreset: "apartment", intensity: 0.58 },
  { id: "hdri-forest", name: "Moody Forest", dreiPreset: "forest", intensity: 0.42 },
];

export const SYSTEM_NODE_IDS = ["cam-1", "light-1", "light-2"] as const;

// ============================================================================
// AI Detection Blueprint Mock Data
// ============================================================================

// --- List of OCR Detected Layout Items ---
export const SAMPLE_DETECTED_OBJECTS: DetectedObject[] = [
  {
    id: "obj-1",
    name: "Room",
    selected: true,
    details: "Size: 4.0m × 3.5m",
    category: "room",
  },
  {
    id: "obj-2",
    name: "Bed",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-3",
    name: "Window",
    selected: true,
    details: "Width: 1.2m",
    category: "opening",
  },
  {
    id: "obj-4",
    name: "Chair",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-5",
    name: "Nightstand",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-6",
    name: "Wardrobe",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-7",
    name: "Lamp",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-8",
    name: "Window",
    selected: true,
    details: "Width: 1.2m",
    category: "opening",
  },
  {
    id: "obj-9",
    name: "Window",
    selected: true,
    details: "Width: 1.5m",
    category: "opening",
  },
  {
    id: "obj-10",
    name: "Chair",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-11",
    name: "Nightstand",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-12",
    name: "Lamp",
    selected: true,
    category: "furniture",
  },
];

// --- Raw JSON layout output from AI model ---
export const DETECTED_RAW_JSON = {
  room: {
    width: 4000,
    length: 3500,
    height: 2800,
  },
  openings: [
    {
      type: "window",
      x: 4000,
      y: 1750,
      width: 1200,
      rotation: 90,
    },
    {
      type: "window",
      x: 0,
      y: 1750,
      width: 1200,
      rotation: -90,
    },
    {
      type: "window",
      x: 2000,
      y: 3500,
      width: 1500,
      rotation: 0,
    },
  ],
  furniture: [
    {
      label: "bed",
      x: 900,
      y: 1000,
      rotation: -90,
    },
    {
      label: "chair",
      x: 3000,
      y: 2500,
      rotation: 180,
    },
    {
      label: "chair",
      x: 3000,
      y: 2000,
      rotation: 180,
    },
    {
      label: "nightstand",
      x: 900,
      y: 2000,
      rotation: 0,
    },
    {
      label: "nightstand",
      x: 900,
      y: 2500,
      rotation: 0,
    },
    {
      label: "wardrobe",
      x: 2000,
      y: 500,
      rotation: 90,
    },
    {
      label: "lamp",
      x: 900,
      y: 2200,
      rotation: 0,
    },
    {
      label: "lamp",
      x: 900,
      y: 2700,
      rotation: 0,
    },
  ],
};
