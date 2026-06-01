import type { SceneNode } from "@/types";

const flattenNodes = (nodes: SceneNode[]): SceneNode[] => {
  return nodes.reduce((acc, node) => {
    acc.push(node);
    if (node.children) acc.push(...flattenNodes(node.children));
    return acc;
  }, [] as SceneNode[]);
};

const getAngle = (node: SceneNode) => {
  const x = node.position?.[0] || 0;
  const y = node.position?.[2] || 0;
  let angle = Math.atan2(-y, x);
  if (angle < 0) angle += 2 * Math.PI;
  return angle;
};

const getDistance = (node: SceneNode) => {
  const x = node.position?.[0] || 0;
  const y = node.position?.[2] || 0;
  return x * x + y * y;
};

export function buildLegendItems(tree: SceneNode[]): SceneNode[] {
  return flattenNodes(tree)
    .filter((n) => {
      if (!n.dimensions || n.type === "camera" || n.type === "light") return false;
      const isOpening = n.placementType === "opening";
      if (n.placementType === "tabletop" || n.placementType === "ceiling") return false;
      if (isOpening || n.placementType === "floor" || n.placementType === "wall") return true;
      return false;
    })
    .sort((a, b) => {
      const angleA = getAngle(a);
      const angleB = getAngle(b);
      if (Math.abs(angleA - angleB) < 0.0001) {
        return getDistance(a) - getDistance(b);
      }
      return angleA - angleB;
    });
}

export function buildLegendMap(tree: SceneNode[]): Map<string, number> {
  const items = buildLegendItems(tree);
  return new Map(items.map((item, index) => [item.id, index + 1]));
}
