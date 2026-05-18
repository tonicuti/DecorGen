import type { SceneNode } from "@/types";

export function renameNodeInTree(id: string, newName: string, nodes: SceneNode[]): SceneNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, name: newName };
    }

    if (node.children) {
      return { ...node, children: renameNodeInTree(id, newName, node.children) };
    }

    return node;
  });
}

export function toggleVisibility(id: string, nodes: SceneNode[]): SceneNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, visible: !node.visible };
    }

    if (node.children) {
      return { ...node, children: toggleVisibility(id, node.children) };
    }

    return node;
  });
}

export function toggleLock(id: string, nodes: SceneNode[]): SceneNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, locked: !node.locked };
    }

    if (node.children) {
      return { ...node, children: toggleLock(id, node.children) };
    }

    return node;
  });
}

export function toggleExpand(id: string, nodes: SceneNode[]): SceneNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, expanded: !node.expanded };
    }

    if (node.children) {
      return { ...node, children: toggleExpand(id, node.children) };
    }

    return node;
  });
}

export function deleteNode(id: string, nodes: SceneNode[]): SceneNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: node.children ? deleteNode(id, node.children) : undefined,
    }));
}
