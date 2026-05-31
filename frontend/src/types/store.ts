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
  tree: SceneNode[];
  selectedIds: string[];
  setRoomDimensions: (dimensions: Partial<SceneDimensions>) => void;
  setRoomMaterials: (materials: Partial<SceneState["roomMaterials"]>) => void;
  setCameraState: (position: [number, number, number], target: [number, number, number]) => void;
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
  removeNode: (id: string) => void;
}
