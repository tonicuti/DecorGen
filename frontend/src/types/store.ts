import type { SceneNode } from "@/types/api";

// ==========================================
// Scene Store State Types
// ==========================================

export interface SceneDimensions {
  width: number;
  length: number;
  height: number;
  thickness: number;
}

export interface RoomBoundary {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
}

export interface SceneSettings {
  environmentId: string;
  gridOverlay: boolean;
  realisticLighting: boolean;
  softShadows: boolean;
  cameraFov: number;
}

export interface SceneState {
  roomDimensions: SceneDimensions;
  roomMaterials: {
    wallColor: string;
    floorColor: string;
  };
  cameraState: {
    position: [number, number, number];
    target: [number, number, number];
  };
  sceneSettings: SceneSettings;
  tree: SceneNode[];
  selectedIds: string[];
  setRoomDimensions: (dimensions: Partial<SceneDimensions>) => void;
  setRoomMaterials: (materials: Partial<SceneState["roomMaterials"]>) => void;
  setCameraState: (position: [number, number, number], target: [number, number, number]) => void;
  setSceneSettings: (settings: Partial<SceneSettings>) => void;
  setTree: (tree: SceneNode[] | ((prev: SceneNode[]) => SceneNode[])) => void;
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  updateNode: (id: string, updates: Partial<SceneNode>) => void;
  dragNodeId: string | null;
  dragPosition: [number, number, number] | null;
  dragRotation: [number, number, number] | null;
  isColliding: boolean;
  collidingWithIds: string[];
  setDragState: (
    nodeId: string | null,
    position: [number, number, number] | null,
    rotation: [number, number, number] | null,
    isColliding: boolean,
    collidingWithIds: string[]
  ) => void;
  reparentNode: (
    id: string,
    newParentId: string | null,
    newPosition: [number, number, number]
  ) => void;
  addNode: (node: SceneNode, parentId?: string | null) => void;
  isAddingNode: boolean;
  setIsAddingNode: (isAdding: boolean) => void;
  removeNode: (id: string) => void;
  cancelDragNode: (
    id: string,
    isAdding: boolean,
    originalPos: [number, number, number] | null,
    originalRot: [number, number, number] | null
  ) => void;
  finalizeDragPlacement: (payload: {
    nodeId: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    parentId?: string | null;
  }) => void;
  clearUserContent: () => void;
  resetScene: () => void;
  loadBedroomLayout: (layout: {
    tree: SceneNode[];
    roomDimensions: SceneDimensions;
    roomMaterials: SceneState["roomMaterials"];
  }) => void;
}
