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

/** Filter hierarchy by node name; expands branches that contain matches. */
export function filterSceneTree(nodes: SceneNode[], query: string): SceneNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const filterNode = (node: SceneNode): SceneNode | null => {
    const nameMatch = node.name.toLowerCase().includes(q);
    const filteredChildren =
      node.children
        ?.map(filterNode)
        .filter((child): child is SceneNode => child !== null) ?? [];

    if (nameMatch) {
      return { ...node, expanded: node.children?.length ? true : node.expanded };
    }

    if (filteredChildren.length > 0) {
      return { ...node, expanded: true, children: filteredChildren };
    }

    return null;
  };

  return nodes.map(filterNode).filter((node): node is SceneNode => node !== null);
}

export function countSceneNodes(nodes: SceneNode[]): number {
  return nodes.reduce(
    (acc, node) => acc + 1 + (node.children ? countSceneNodes(node.children) : 0),
    0
  );
}
