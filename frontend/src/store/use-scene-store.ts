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

const removeNodeFromTree = (
  nodes: SceneNode[],
  id: string
): { newTree: SceneNode[]; extractedNode: SceneNode | null } => {
  let extractedNode: SceneNode | null = null;
  const newTree = nodes
    .filter((node) => {
      if (node.id === id) {
        extractedNode = node;
        return false;
      }

      return true;
    })
    .map((node) => {
      if (node.children && !extractedNode) {
        const result = removeNodeFromTree(node.children, id);

        if (result.extractedNode) {
          extractedNode = result.extractedNode;
          return { ...node, children: result.newTree };
        }
      }

      return node;
    });
  return { newTree, extractedNode };
};

const insertNodeIntoTree = (
  nodes: SceneNode[],
  nodeToInsert: SceneNode,
  parentId: string | null
): SceneNode[] => {
  if (!parentId) {
    return [...nodes, nodeToInsert];
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children || []), nodeToInsert] };
    }

    if (node.children) {
      return { ...node, children: insertNodeIntoTree(node.children, nodeToInsert, parentId) };
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
  dragNodeId: null,
  dragPosition: null,
  dragRotation: null,
  isColliding: false,

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

  setDragState: (nodeId, position, rotation, isColliding) =>
    set(() => ({
      dragNodeId: nodeId,
      dragPosition: position,
      dragRotation: rotation,
      isColliding,
    })),

  reparentNode: (id, newParentId, newPosition) =>
    set((state) => {
      const { newTree, extractedNode } = removeNodeFromTree(state.tree, id);
      if (!extractedNode) return { tree: state.tree };

      const updatedNode = { ...extractedNode, position: newPosition };

      let targetParentId = newParentId;
      if (!targetParentId) {
        const hasGroup1 = newTree.some((n) => n.id === "group-1");
        if (hasGroup1) {
          targetParentId = "group-1";
        }
      }

      const finalTree = insertNodeIntoTree(newTree, updatedNode, targetParentId);
      return { tree: finalTree };
    }),
}));
