import type { SceneNode } from "@/types";

type Dimensions = NonNullable<SceneNode["dimensions"]>;

function isAsset(node: SceneNode, assetId: string) {
  return node.assetId?.toLowerCase() === assetId || node.name.toLowerCase() === assetId;
}

export function resolveNodeDimensions(node: SceneNode): Dimensions {
  const dimensions = node.dimensions || { w: 1, d: 1, h: 1 };

  if (isAsset(node, "tv")) {
    return {
      w: dimensions.w,
      d: Math.min(dimensions.d, 0.06),
      h: Math.min(dimensions.h, dimensions.w * 0.36),
    };
  }

  if (isAsset(node, "hanging_tv")) {
    return {
      w: dimensions.w,
      d: Math.min(dimensions.d, 0.05),
      h: Math.min(dimensions.h, dimensions.w * 0.56),
    };
  }

  return dimensions;
}
