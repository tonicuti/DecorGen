import { create } from "zustand";
import { useStore } from "zustand";
import { temporal } from "zundo";
import type { StateCreator } from "zustand";
import { toast } from "sonner";
import { DEFAULT_SCENE_SETTINGS, INITIAL_TREE } from "@/api/mock-data";
import { countInvalidPlacements } from "@/lib/collision";
import {
  type SceneHistorySnapshot,
  sceneSnapshotEqual,
} from "@/lib/scene-history";
import type { SceneDimensions, SceneNode, SceneState } from "@/types";

export type { SceneHistorySnapshot };

let historyGestureActive = false;
let historyApplying = false;
let historyGestureBaseline: SceneHistorySnapshot | null = null;

function cloneSnapshot(snapshot: SceneHistorySnapshot): SceneHistorySnapshot {
  return {
    tree: structuredClone(snapshot.tree),
    roomDimensions: { ...snapshot.roomDimensions },
  };
}

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

const getWallClearance = (node: SceneNode) => {
  if (node.placementType !== "floor") return 0;
  if (node.wallClearance !== undefined) return Math.max(0, node.wallClearance);
  if (node.assetId === "wooden_display_shelves_01") return 0.02;
  return 0;
};

const clampFloorPositionToRoom = (
  node: SceneNode,
  position: [number, number, number],
  rotation: [number, number, number] | undefined,
  roomDimensions: SceneDimensions
): [number, number, number] => {
  if (node.placementType !== "floor") return position;

  const w = node.dimensions?.w || 1;
  const d = node.dimensions?.d || 1;
  const yaw = rotation?.[1] ?? node.rotation?.[1] ?? 0;
  const cos = Math.abs(Math.cos(yaw));
  const sin = Math.abs(Math.sin(yaw));
  const extentX = (w * cos + d * sin) / 2;
  const extentZ = (w * sin + d * cos) / 2;
  const clearance = getWallClearance(node);
  const maxX = roomDimensions.width / 2 - extentX - clearance;
  const maxZ = roomDimensions.length / 2 - extentZ - clearance;

  if (maxX < 0 || maxZ < 0) {
    return [0, position[1], 0];
  }

  return [
    Math.max(-maxX, Math.min(maxX, position[0])),
    position[1],
    Math.max(-maxZ, Math.min(maxZ, position[2])),
  ];
};

/** Pull floor furniture back inside the room after W/L shrink. */
const clampTreePositionsToRoom = (
  nodes: SceneNode[],
  roomDimensions: SceneDimensions
): SceneNode[] => {
  return nodes.map((node) => {
    let updated: SceneNode = { ...node };

    if (node.children?.length) {
      updated.children = clampTreePositionsToRoom(node.children, roomDimensions);
    }

    if (node.type === "model" && node.position && node.placementType === "floor") {
      const h = node.dimensions?.h ?? 1;
      const clamped = clampFloorPositionToRoom(
        node,
        node.position,
        node.rotation,
        roomDimensions
      );
      const floorY = Math.min(h / 2, Math.max(0.01, roomDimensions.height - 0.01));
      updated.position = [clamped[0], floorY, clamped[2]];
    }

    return updated;
  });
};

const isSystemNode = (node: SceneNode) => node.type === "camera" || node.type === "light";

const isValidSnapshot = (snapshot: Partial<SceneHistorySnapshot> | undefined): snapshot is SceneHistorySnapshot =>
  Boolean(snapshot?.tree && Array.isArray(snapshot.tree));

function pushSceneHistorySnapshot(before: SceneHistorySnapshot) {
  const snapshot = cloneSnapshot(before);
  const temporal = useSceneStore.temporal.getState();
  const past = temporal.pastStates as SceneHistorySnapshot[];

  if (past.length > 0) {
    const last = past[past.length - 1];
    if (sceneSnapshotEqual(last, snapshot)) return;
  }

  const limit = 100;
  const pastStates = [...past, snapshot];
  if (pastStates.length > limit) {
    pastStates.shift();
  }
  useSceneStore.temporal.setState({
    pastStates,
    futureStates: [],
  });
}

const getCurrentSnapshot = (): SceneHistorySnapshot => {
  const { tree, roomDimensions } = useSceneStore.getState();
  return { tree, roomDimensions };
};

const pruneSelection = (tree: SceneNode[]) => {
  const { selectedIds } = useSceneStore.getState();
  if (selectedIds.length === 0) return;

  const ids = new Set<string>();
  const walk = (nodes: SceneNode[]) => {
    for (const node of nodes) {
      ids.add(node.id);
      if (node.children) walk(node.children);
    }
  };
  walk(tree);

  const nextSelected = selectedIds.filter((id) => ids.has(id));
  if (nextSelected.length !== selectedIds.length) {
    useSceneStore.setState({ selectedIds: nextSelected });
  }
};

const applySnapshot = (snapshot: SceneHistorySnapshot) => {
  useSceneStore.setState({
    tree: structuredClone(snapshot.tree),
    roomDimensions: { ...snapshot.roomDimensions },
    selectedIds: [],
    dragNodeId: null,
    dragPosition: null,
    dragRotation: null,
    isColliding: false,
    collidingWithIds: [],
    isAddingNode: false,
  });
  pruneSelection(snapshot.tree);
};

const sceneStoreCreator: StateCreator<SceneState> = (set) => ({
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
  sceneSettings: { ...DEFAULT_SCENE_SETTINGS },

  tree: INITIAL_TREE,
  selectedIds: [],
  walkthroughMode: false,
  petMode: false,
  dragNodeId: null,
  dragPosition: null,
  dragRotation: null,
  isColliding: false,
  collidingWithIds: [],

  setRoomDimensions: (dimensions) =>
    set((state) => {
      const oldDims = state.roomDimensions;
      const newDims = { ...oldDims, ...dimensions };
      const resizedTree = updateTreeOnRoomResize(state.tree, oldDims, newDims);
      const newTree = clampTreePositionsToRoom(resizedTree, newDims);
      const invalidCount = countInvalidPlacements(newTree, newDims);

      if (invalidCount > 0) {
        queueMicrotask(() => {
          toast.warning(
            invalidCount === 1
              ? "1 object still does not fit the smaller room (overlap or too large)."
              : `${invalidCount} objects still do not fit the smaller room (overlap or too large).`
          );
        });
      }

      return {
        roomDimensions: newDims,
        tree: newTree,
        collidingWithIds: [],
        isColliding: false,
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

  setSceneSettings: (settings) =>
    set((state) => ({
      sceneSettings: { ...state.sceneSettings, ...settings },
    })),

  setTree: (tree) =>
    set((state) => ({
      tree: typeof tree === "function" ? tree(state.tree) : tree,
    })),

  setSelectedIds: (ids) =>
    set((state) => ({
      selectedIds: typeof ids === "function" ? ids(state.selectedIds) : ids,
    })),

  setWalkthroughMode: (on) =>
    set(() => ({
      walkthroughMode: on,
      ...(on ? { selectedIds: [] } : {}),
    })),

  setPetMode: (on) => set(() => ({ petMode: on })),

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

  isAddingNode: false,

  setIsAddingNode: (isAdding) => set(() => ({ isAddingNode: isAdding })),

  removeNode: (id) =>
    set((state) => {
      const node = findNodeInTree(state.tree, id);
      if (node?.locked) return {};

      const { newTree } = removeNodeFromTree(state.tree, id);
      const isSelected = state.selectedIds.includes(id);

      return {
        tree: newTree,
        selectedIds: isSelected ? [] : state.selectedIds,
      };
    }),

  finalizeDragPlacement: ({ nodeId, position, rotation, parentId }) =>
    set((state) => {
      let newTree = state.tree;

      if (parentId !== undefined) {
        const { newTree: without, extractedNode } = removeNodeFromTree(state.tree, nodeId);
        if (extractedNode) {
          const nextRotation = rotation ?? extractedNode.rotation;
          const nextPosition = clampFloorPositionToRoom(
            extractedNode,
            position,
            nextRotation,
            state.roomDimensions
          );
          const updatedNode = {
            ...extractedNode,
            position: nextPosition,
            rotation: nextRotation,
          };
          let targetParentId = parentId;
          if (!targetParentId) {
            const hasGroup1 = without.some((n) => n.id === "group-1");
            if (hasGroup1) targetParentId = "group-1";
          }
          newTree = insertNodeIntoTree(without, updatedNode, targetParentId);
        }
      } else {
        const node = findNodeInTree(state.tree, nodeId);
        const nextPosition = node
          ? clampFloorPositionToRoom(node, position, rotation, state.roomDimensions)
          : position;
        newTree = updateNodeInTree(state.tree, nodeId, {
          position: nextPosition,
          rotation: rotation ?? undefined,
        });
      }

      return {
        tree: newTree,
        isAddingNode: false,
        dragNodeId: null,
        dragPosition: null,
        dragRotation: null,
        isColliding: false,
        collidingWithIds: [],
      };
    }),

  cancelDragNode: (id, isAdding, originalPos, originalRot) =>
    set((state) => {
      let newTree = state.tree;
      let newSelectedIds = state.selectedIds;

      if (isAdding) {
        newTree = removeNodeFromTree(state.tree, id).newTree;
        newSelectedIds = state.selectedIds.filter((sId) => sId !== id);
      } else if (originalPos) {
        newTree = updateNodeInTree(state.tree, id, {
          position: originalPos,
          rotation: originalRot || undefined,
        });
      }

      return {
        tree: newTree,
        selectedIds: newSelectedIds,
        isAddingNode: false,
        dragNodeId: null,
        dragPosition: null,
        dragRotation: null,
        isColliding: false,
        collidingWithIds: [],
      };
    }),

  addNode: (node, parentId) =>
    set((state) => {
      let targetParentId: string | null = parentId ?? null;
      if (!targetParentId) {
        const hasGroup1 = state.tree.some((n) => n.id === "group-1");
        if (hasGroup1) {
          targetParentId = "group-1";
        }
      }

      return { tree: insertNodeIntoTree(state.tree, node, targetParentId) };
    }),

  clearUserContent: () =>
    set((state) => ({
      tree: state.tree.filter(isSystemNode),
      selectedIds: [],
    })),

  resetScene: () =>
    set(() => ({
      tree: structuredClone(INITIAL_TREE),
      selectedIds: [],
      sceneSettings: { ...DEFAULT_SCENE_SETTINGS },
      roomDimensions: {
        width: 4.0,
        length: 3.5,
        height: 2.8,
        thickness: 15,
      },
    })),

  loadBedroomLayout: (layout) =>
    set(() => ({
      tree: structuredClone(layout.tree),
      roomDimensions: { ...layout.roomDimensions },
      roomMaterials: { ...layout.roomMaterials },
      selectedIds: [],
      dragNodeId: null,
      dragPosition: null,
      dragRotation: null,
      isColliding: false,
      collidingWithIds: [],
      isAddingNode: false,
    })),
});

function findNodeInTree(nodes: SceneNode[], id: string): SceneNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeInTree(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export const useSceneStore = create<SceneState>()(
  temporal(sceneStoreCreator, {
    partialize: (state): SceneHistorySnapshot => ({
      tree: state.tree,
      roomDimensions: state.roomDimensions,
    }),
    /** true = skip history (states equal). */
    equality: (past, current) =>
      sceneSnapshotEqual(past as SceneHistorySnapshot, current as SceneHistorySnapshot),
    limit: 100,
    handleSet: ((handleSet) => (...args: unknown[]) => {
      if (historyGestureActive || historyApplying) return;
      (handleSet as (...a: unknown[]) => void)(...args);
    }) as never,
  })
);

export function pauseSceneHistory() {
  useSceneStore.temporal.getState().pause();
}

export function resumeSceneHistory() {
  useSceneStore.temporal.getState().resume();
}

/** Coalesce drag / multi-step edits into a single undo step. */
export function beginSceneHistoryGesture() {
  if (historyGestureActive) return;
  historyGestureActive = true;
  historyGestureBaseline = cloneSnapshot(getCurrentSnapshot());
  pauseSceneHistory();
}

/** One undo step for a single store mutation (when not inside a gesture). */
export function commitSceneHistory(mutator: () => void) {
  if (historyGestureActive) {
    mutator();
    return;
  }
  const before = cloneSnapshot(getCurrentSnapshot());
  pauseSceneHistory();
  mutator();
  const after = getCurrentSnapshot();
  if (!sceneSnapshotEqual(before, after)) {
    pushSceneHistorySnapshot(before);
  }
  resumeSceneHistory();
}

export function endSceneHistoryGesture() {
  if (!historyGestureActive) return;
  historyGestureActive = false;

  const before = historyGestureBaseline;
  historyGestureBaseline = null;

  if (before) {
    const after = getCurrentSnapshot();
    if (!sceneSnapshotEqual(before, after)) {
      pushSceneHistorySnapshot(before);
    }
  }

  resumeSceneHistory();
}

export function isSceneHistoryGestureActive() {
  return historyGestureActive;
}

export function cancelSceneHistoryGesture() {
  if (!historyGestureActive) return;
  historyGestureActive = false;
  historyGestureBaseline = null;
  resumeSceneHistory();
}

export function undoSceneHistory() {
  const temporal = useSceneStore.temporal.getState();
  if (temporal.pastStates.length === 0) return;

  const previous = temporal.pastStates[temporal.pastStates.length - 1] as Partial<SceneHistorySnapshot>;
  if (!isValidSnapshot(previous)) {
    temporal.clear();
    return;
  }

  const current = cloneSnapshot(getCurrentSnapshot());
  const target = cloneSnapshot(previous);

  historyApplying = true;
  pauseSceneHistory();
  applySnapshot(target);
  resumeSceneHistory();
  historyApplying = false;

  useSceneStore.temporal.setState({
    pastStates: temporal.pastStates.slice(0, -1),
    futureStates: [...temporal.futureStates, current],
  });
}

export function redoSceneHistory() {
  const temporal = useSceneStore.temporal.getState();
  if (temporal.futureStates.length === 0) return;

  const next = temporal.futureStates[temporal.futureStates.length - 1] as Partial<SceneHistorySnapshot>;
  if (!isValidSnapshot(next)) {
    temporal.clear();
    return;
  }

  const current = cloneSnapshot(getCurrentSnapshot());
  const target = cloneSnapshot(next);

  historyApplying = true;
  pauseSceneHistory();
  applySnapshot(target);
  resumeSceneHistory();
  historyApplying = false;

  useSceneStore.temporal.setState({
    pastStates: [...temporal.pastStates, current],
    futureStates: temporal.futureStates.slice(0, -1),
  });
}

export function useSceneHistory() {
  const pastStates = useStore(useSceneStore.temporal, (s) => s.pastStates);
  const futureStates = useStore(useSceneStore.temporal, (s) => s.futureStates);

  return {
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
    undo: undoSceneHistory,
    redo: redoSceneHistory,
  };
}
