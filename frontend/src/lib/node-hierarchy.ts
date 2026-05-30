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

export function expandParentsOfNode(
  selectedId: string,
  nodes: SceneNode[]
): { updated: SceneNode[]; found: boolean; changed: boolean } {
  let anyFound = false;
  let anyChanged = false;

  const updatedNodes = nodes.map((node) => {
    if (node.id === selectedId) {
      anyFound = true;
      return node;
    }

    if (node.children && node.children.length > 0) {
      const {
        updated: updatedChildren,
        found,
        changed,
      } = expandParentsOfNode(selectedId, node.children);

      if (found) {
        anyFound = true;

        if (!node.expanded || changed) {
          anyChanged = true;
          return { ...node, expanded: true, children: updatedChildren };
        }

        return node;
      }

      if (changed) {
        anyChanged = true;
        return { ...node, children: updatedChildren };
      }
    }

    return node;
  });

  return { updated: anyChanged ? updatedNodes : nodes, found: anyFound, changed: anyChanged };
}
