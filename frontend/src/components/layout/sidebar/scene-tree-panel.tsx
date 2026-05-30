import { Layers2, Search } from "lucide-react";
import * as React from "react";
import { SceneTreeNode } from "@/components/layout/sidebar/scene-tree-node";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteNode, renameNodeInTree } from "@/lib/node-hierarchy";
import { useSceneStore } from "@/store/use-scene-store";
import type { SceneNode } from "@/types";

function SceneTreePanel() {
  const [search, setSearch] = React.useState("");
  const tree = useSceneStore((state) => state.tree);
  const setTree = useSceneStore((state) => state.setTree);
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const setSelectedIds = useSceneStore((state) => state.setSelectedIds);
  const [nodeToDelete, setNodeToDelete] = React.useState<SceneNode | null>(null);
  const [lastNodeToDelete, setLastNodeToDelete] = React.useState<SceneNode | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");

  React.useEffect(() => {
    if (nodeToDelete) {
      setLastNodeToDelete(nodeToDelete);
    }
  }, [nodeToDelete]);

  const handleRenameConfirm = () => {
    if (!renamingId) return;

    const trimmed = renameValue.trim();
    if (trimmed) {
      setTree((prev) => renameNodeInTree(renamingId, trimmed, prev));
    }

    setRenamingId(null);
  };

  const totalObjectsCount = React.useMemo(() => {
    const count = (nodes: SceneNode[]): number => {
      return nodes.reduce((acc, node) => acc + 1 + (node.children ? count(node.children) : 0), 0);
    };

    return count(tree);
  }, [tree]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Layers2 className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Scene Hierarchy
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            {totalObjectsCount} objects
          </span>
        </div>
      </div>
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <Input
            autoFocus
            placeholder="Filter scene objects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-zinc-200 bg-zinc-50 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>
      <div
        onClick={() => setSelectedIds([])}
        className="flex-1 scrollbar-none overflow-y-auto p-4 pt-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex flex-col gap-1">
          {tree.map((node) => (
            <SceneTreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              tree={tree}
              setTree={setTree}
              renamingId={renamingId}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              setRenamingId={setRenamingId}
              handleRenameConfirm={handleRenameConfirm}
              setNodeToDelete={setNodeToDelete}
            />
          ))}
        </div>
      </div>
      <Dialog
        open={nodeToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setNodeToDelete(null);
        }}
      >
        <DialogContent className="max-w-md border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>Delete Object</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete "{nodeToDelete?.name || lastNodeToDelete?.name || ""}
              "? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setNodeToDelete(null)}
              className="border-zinc-200 dark:border-zinc-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
              onClick={() => {
                if (nodeToDelete) {
                  setTree(deleteNode(nodeToDelete.id, tree));
                  setNodeToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { SceneTreePanel };
