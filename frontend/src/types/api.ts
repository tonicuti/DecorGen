// ==========================================
// AI Detection & Blueprint Types
// ==========================================

export interface DetectedObject {
  id: string;
  name: string;
  selected: boolean;
  details?: string;
  category?: "room" | "opening" | "furniture";
  floorPlan?: {
    label: string;
    coordinates?: {
      x: number;
      y: number;
      width?: number;
      height?: number;
    };
    rotate?: number;
    ocrConfidence?: number;
  };
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
  layout?: BedroomLayout;
}

export interface BedroomAssetMetadata {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  glbUrl?: string;
}

export interface BedroomLayout {
  assets: BedroomAssetMetadata[];
  tree: SceneNode[];
  roomDimensions: {
    width: number;
    length: number;
    height: number;
    thickness: number;
  };
  roomMaterials: {
    wallColor: string;
    floorColor: string;
  };
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
  description?: string;
  aliases?: string[];
  tags?: string[];
  materials?: string[];
  placements?: string[];
  metadataCategory?: string;
  placementType?: "floor" | "wall" | "tabletop" | "ceiling" | "opening";
  defaultScale?: [number, number, number];
  dimensions?: { w: number; d: number; h: number };
  wallClearance?: number;
  glbUrl?: string;
  defaultMaterials?: Record<string, string>;
  swingDirection?: "left" | "right" | "both" | "none";
  defaultElevation?: number;
}

export interface RoomTemplate {
  id: string;
  name: string;
  category: string;
  glbUrl: string;
  previewUrl?: string;
  description?: string;
  aliases?: string[];
  tags?: string[];
  style?: string;
  roomType?: string;
  mood?: string[];
  features?: string[];
  materials?: string[];
  placements?: string[];
  defaultScale?: [number, number, number];
  dimensions?: { w: number; d: number; h: number };
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
  roughness?: number;
  metalness?: number;
  assetId?: string;
  placementType?: "floor" | "wall" | "tabletop" | "ceiling" | "opening";
  defaultScale?: [number, number, number];
  dimensions?: { w: number; d: number; h: number };
  wallClearance?: number;
  glbUrl?: string;
  swingDirection?: "left" | "right" | "both" | "none";
  defaultElevation?: number;
  fov?: number;
  lightKind?: "directional" | "ambient" | "hemisphere";
  intensity?: number;
  castShadow?: boolean;
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
  dreiPreset?: string;
  /** Target scene.environmentIntensity; studio HDRI is very bright by default. */
  intensity?: number;
}

export type RenderQualityId = "low" | "medium" | "high";

export interface RenderQualityOption {
  id: RenderQualityId;
  label: string;
}

export interface WorkspaceShortcut {
  keys: string;
  description: string;
  section?: string;
}
