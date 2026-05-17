// ==========================================
// AI Detection & Blueprint Types
// ==========================================

export interface DetectedObject {
  id: string;
  name: string;
  selected: boolean;
  details?: string;
  category?: "room" | "opening" | "furniture";
}

// ==========================================
// Bedroom Projects & Saved Layout Types
// ==========================================

export interface Bedroom {
  id: string;
  name: string;
  updatedAt: string;
  thumbnail: string;
  active?: boolean;
}

// ==========================================
// Asset Library & Catalog Types
// ==========================================

export interface Asset {
  id: string;
  name: string;
  category: string;
  image: string;
  premium?: boolean;
  placementType?: "floor" | "wall" | "tabletop" | "ceiling" | "opening";
  defaultScale?: [number, number, number];
  dimensions?: { w: number; d: number; h: number };
  glbUrl?: string;
  defaultMaterials?: Record<string, string>;
  swingDirection?: "left" | "right" | "both" | "none";
  defaultElevation?: number;
}

// ==========================================
// 3D Scene Node & Editor Hierarchy Types
// ==========================================

export interface SceneNode {
  id: string;
  name: string;
  type: "camera" | "light" | "model" | "group";
  visible: boolean;
  locked: boolean;
  expanded?: boolean;
  children?: SceneNode[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  parentId?: string;
  materials?: Record<string, string>;
  assetId?: string;
  placementType?: "floor" | "wall" | "tabletop" | "ceiling" | "opening";
  defaultScale?: [number, number, number];
  dimensions?: { w: number; d: number; h: number };
  glbUrl?: string;
  swingDirection?: "left" | "right" | "both" | "none";
  defaultElevation?: number;
}

export interface SceneObject {
  id: string;
  name: string;
  category: string;
}

export interface ObjectPart {
  id: string;
  name: string;
}

// ==========================================
// Material & Customization Preset Types
// ==========================================

export interface MaterialPreset {
  id: string;
  name: string;
  category: string;
}

export interface ColorSwatch {
  name: string;
  value: string;
}

export interface EnvironmentPreset {
  id: string;
  name: string;
}
