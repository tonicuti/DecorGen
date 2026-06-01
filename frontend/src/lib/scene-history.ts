import type { SceneDimensions, SceneNode } from "@/types";

export type SceneHistorySnapshot = {
  tree: SceneNode[];
  roomDimensions: SceneDimensions;
};

/** UI-only fields excluded from undo diff (e.g. hierarchy expand). */
export function stripTreeForHistoryCompare(nodes: SceneNode[]): SceneNode[] {
  return nodes.map(({ expanded: _expanded, ...node }) => ({
    ...node,
    children: node.children ? stripTreeForHistoryCompare(node.children) : undefined,
  }));
}

export function sceneSnapshotEqual(a: SceneHistorySnapshot, b: SceneHistorySnapshot): boolean {
  const ad = a.roomDimensions;
  const bd = b.roomDimensions;
  if (
    ad.width !== bd.width ||
    ad.length !== bd.length ||
    ad.height !== bd.height ||
    ad.thickness !== bd.thickness
  ) {
    return false;
  }

  return (
    JSON.stringify(stripTreeForHistoryCompare(a.tree)) ===
    JSON.stringify(stripTreeForHistoryCompare(b.tree))
  );
}
