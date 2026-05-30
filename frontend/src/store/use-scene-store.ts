import { create } from "zustand";
import { INITIAL_TREE } from "@/api/mock-data";
import type { SceneNode, SceneState } from "@/types";

const updateNodeInTree = (
  nodes: SceneNode[],
  id: string,
  updates: Partial<SceneNode>
): SceneNode[] => {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, ...updates };
    }

    if (node.children) {
      return { ...node, children: updateNodeInTree(node.children, id, updates) };
    }

    return node;
  });
};

export const useSceneStore = create<SceneState>((set) => ({
  roomDimensions: {
    width: 4.0,
    length: 3.5,
    height: 2.8,
    thickness: 15,
  },
  roomMaterials: {
    wallColor: "#f8fafc",
    floorColor: "#d97706",
  },
  cameraState: {
    position: [0, 4, 6],
    target: [0, 1.4, 0],
  },

  tree: INITIAL_TREE,
  selectedIds: [],

  setRoomDimensions: (dimensions) =>
    set((state) => ({
      roomDimensions: { ...state.roomDimensions, ...dimensions },
    })),

  setRoomMaterials: (materials) =>
    set((state) => ({
      roomMaterials: { ...state.roomMaterials, ...materials },
    })),

  setCameraState: (position, target) =>
    set(() => ({
      cameraState: { position, target },
    })),

  setTree: (tree) =>
    set((state) => ({
      tree: typeof tree === "function" ? tree(state.tree) : tree,
    })),

  setSelectedIds: (ids) =>
    set((state) => ({
      selectedIds: typeof ids === "function" ? ids(state.selectedIds) : ids,
    })),

  updateNode: (id, updates) =>
    set((state) => ({
      tree: updateNodeInTree(state.tree, id, updates),
    })),
}));
