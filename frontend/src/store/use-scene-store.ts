import { create } from "zustand";
import { INITIAL_TREE } from "@/api/mock-data";
import type { SceneDimensions, SceneNode, SceneState } from "@/types";

const updateTreeOnRoomResize = (
  nodes: SceneNode[],
  oldDims: SceneDimensions,
  newDims: SceneDimensions
): SceneNode[] => {
  return nodes.map((node) => {
    let updatedNode = { ...node };

    if (node.position) {
      const [x, y, z] = node.position;
      let newX = x;
      let newY = y;
      let newZ = z;

      if (node.placementType === "opening" || node.placementType === "wall") {
        const wOldHalf = oldDims.width / 2;
        const lOldHalf = oldDims.length / 2;
        const dLeft = Math.abs(x - -wOldHalf);
        const dRight = Math.abs(x - wOldHalf);
        const dBack = Math.abs(z - -lOldHalf);
        const dFront = Math.abs(z - lOldHalf);
        const minDist = Math.min(dLeft, dRight, dBack, dFront);

        if (minDist === dLeft) {
          newX = x - (newDims.width - oldDims.width) / 2;
        } else if (minDist === dRight) {
          newX = x + (newDims.width - oldDims.width) / 2;
        } else if (minDist === dBack) {
          newZ = z - (newDims.length - oldDims.length) / 2;
        } else if (minDist === dFront) {
          newZ = z + (newDims.length - oldDims.length) / 2;
        }
      } else if (node.placementType === "ceiling") {
        newY = y + (newDims.height - oldDims.height);
      }

      updatedNode.position = [newX, newY, newZ];
    }

    if (node.children && node.children.length > 0) {
      updatedNode.children = updateTreeOnRoomResize(node.children, oldDims, newDims);
    }

    return updatedNode;
  });
};

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
  collidingWithIds: [],

  setRoomDimensions: (dimensions) =>
    set((state) => {
      const oldDims = state.roomDimensions;
      const newDims = { ...oldDims, ...dimensions };
      const newTree = updateTreeOnRoomResize(state.tree, oldDims, newDims);

      return {
        roomDimensions: newDims,
        tree: newTree,
      };
    }),

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

  setDragState: (nodeId, position, rotation, isColliding, collidingWithIds) =>
    set(() => ({
      dragNodeId: nodeId,
      dragPosition: position,
      dragRotation: rotation,
      isColliding,
      collidingWithIds,
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

  removeNode: (id) =>
    set((state) => {
      const { newTree } = removeNodeFromTree(state.tree, id);
      const isSelected = state.selectedIds.includes(id);

      return {
        tree: newTree,
        selectedIds: isSelected ? [] : state.selectedIds,
      };
    }),
}));
