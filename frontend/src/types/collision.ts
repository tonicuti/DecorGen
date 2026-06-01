import * as THREE from "three";
import type { SceneNode } from "@/types/api";

// ==========================================
// Collision System Types
// ==========================================

export interface CollisionResult {
  isValid: boolean;
  isColliding: boolean;
  isOutOfBounds: boolean;
  violatesClearance: boolean;
  collidingWith: string[];
}

export interface NodeWithWorldMatrix {
  node: SceneNode;
  worldMatrix: THREE.Matrix4;
}
