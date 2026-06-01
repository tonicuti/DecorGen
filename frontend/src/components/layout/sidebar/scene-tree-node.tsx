import {
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
  Layers2,
  Lock,
  Pencil,
  Sun,
  Trash2,
  Unlock,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { toggleExpand, toggleLock, toggleVisibility } from "@/lib/node-hierarchy";
import type { SceneTreeNodeProps } from "@/types";

export function SceneTreeNode({
  node,
  depth = 0,
  selectedIds,
  setSelectedIds,
  tree,
  setTree,
  renamingId,
  renameValue,
  setRenameValue,
  setRenamingId,
  handleRenameConfirm,
  setNodeToDelete,
  parentVisible = true,
}: SceneTreeNodeProps & { parentVisible?: boolean }) {
  const isSelected = selectedIds.includes(node.id);
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isEffectivelyVisible = parentVisible && node.visible;
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isSelected && elementRef.current) {
      elementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isSelected]);

  return (
    <div className="flex flex-col" ref={elementRef}>
      <div
        onClick={(e) => {
          e.stopPropagation();

          if (e.ctrlKey || e.metaKey) {
            setSelectedIds((prev) =>
              prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id]
            );
          } else {
            setSelectedIds([node.id]);

            if (hasChildren) {
              setTree(toggleExpand(node.id, tree));
            }
          }
        }}
        className={`group flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-all ${
          isSelected
            ? "bg-indigo-50 font-medium text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
        } ${!isEffectivelyVisible ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {hasChildren ? (
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 dark:text-zinc-500 ${
                node.expanded ? "rotate-90" : ""
              }`}
            />
          ) : (
            <div className="w-3.5 shrink-0" />
          )}
          {node.type === "camera" && <Camera className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
          {node.type === "light" && <Sun className="h-3.5 w-3.5 shrink-0 text-yellow-500" />}
          {node.type === "group" && <Layers2 className="h-3.5 w-3.5 shrink-0 text-blue-500" />}
          {node.type === "model" && (
            <div className="h-2 w-2 shrink-0 rounded-full bg-indigo-500 dark:bg-indigo-400" />
          )}
          {renamingId === node.id ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameConfirm();
                } else if (e.key === "Escape") {
                  setRenamingId(null);
                }
              }}
              onBlur={handleRenameConfirm}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="h-5 w-32 rounded-md border border-indigo-500 bg-white px-1.5 py-0.5 text-xs text-zinc-900 focus-visible:outline-hidden dark:bg-zinc-800 dark:text-zinc-100"
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (node.locked) return;
                setRenamingId(node.id);
                setRenameValue(node.name);
              }}
              className="truncate select-none"
              title="Double click to rename"
            >
              {node.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
            onClick={(e) => {
              e.stopPropagation();
              setTree(toggleVisibility(node.id, tree));
            }}
            title={node.visible ? "Hide Object" : "Show Object"}
          >
            {isEffectivelyVisible ? (
              <Eye className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
            onClick={(e) => {
              e.stopPropagation();
              setTree(toggleLock(node.id, tree));
            }}
            title={node.locked ? "Unlock Object" : "Lock Object"}
          >
            {node.locked ? (
              <Lock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            ) : (
              <Unlock className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600" />
            )}
          </Button>
          {node.type !== "camera" && !node.locked && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
              onClick={(e) => {
                e.stopPropagation();
                setRenamingId(node.id);
                setRenameValue(node.name);
              }}
              title="Rename Object"
            >
              <Pencil className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            </Button>
          )}
          {node.type !== "camera" && !node.locked && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation();
                setNodeToDelete(node);
              }}
              title="Delete Object"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      {hasChildren && node.expanded && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {node.children!.map((child) => (
            <SceneTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
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
              parentVisible={isEffectivelyVisible}
            />
          ))}
        </div>
      )}
    </div>
  );
}
