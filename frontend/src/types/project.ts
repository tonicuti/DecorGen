import type { SceneDimensions, SceneSettings } from "@/types/store";
import type { SceneNode } from "@/types/api";

export interface ProjectObjectMetadata {
  id: string;
  name: string;
  type: SceneNode["type"];
  assetId?: string;
  placementType?: SceneNode["placementType"];
  parentId?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  glbUrl?: string;
  dimensions?: SceneNode["dimensions"];
}

export interface GLBProjectMetadata {
  version: 1;
  projectName: string;
  savedAt: string;
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
  objects: ProjectObjectMetadata[];
}
