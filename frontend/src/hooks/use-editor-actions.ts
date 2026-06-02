import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { exportPlan2DPng } from "@/lib/export-plan-2d";
import { exportProjectGLB, exportSceneGLB, importProjectGLB } from "@/lib/export-scene-glb";
import {
  redoSceneHistory,
  undoSceneHistory,
  useSceneHistory,
  useSceneStore,
} from "@/store/use-scene-store";
import { useWorkspaceStore } from "@/store/use-workspace-store";

export function useEditorActions() {
  const { canUndo, canRedo } = useSceneHistory();

  const onUndo = useCallback(() => {
    try {
      undoSceneHistory();
    } catch {
      toast.error("Undo failed.");
    }
  }, []);

  const onRedo = useCallback(() => {
    try {
      redoSceneHistory();
    } catch {
      toast.error("Redo failed.");
    }
  }, []);

  const clearUserContent = useSceneStore((s) => s.clearUserContent);
  const setSceneSettings = useSceneStore((s) => s.setSceneSettings);
  const toggleGridSnapping = useWorkspaceStore((s) => s.toggleGridSnapping);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const onSave = useCallback(async () => {
    try {
      await exportProjectGLB();
      toast.success("Project saved as GLB.");
    } catch {
      toast.error("Failed to save project GLB.");
    }
  }, []);

  const onImportProject = useCallback(async (file: File) => {
    try {
      const metadata = await importProjectGLB(file);
      toast.success(`Imported ${metadata.objects.length} project objects.`);
    } catch {
      toast.error("Failed to import project GLB.");
    }
  }, []);

  const onDownload2D = useCallback(async () => {
    try {
      await exportPlan2DPng();
      toast.success("2D blueprint exported.");
    } catch {
      toast.error("Failed to export 2D blueprint.");
    }
  }, []);

  const onExport3D = useCallback(async () => {
    try {
      await exportSceneGLB();
      toast.success("3D model exported.");
    } catch {
      toast.error("Failed to export 3D model.");
    }
  }, []);

  const onClearScene = useCallback(() => {
    setClearDialogOpen(true);
  }, []);

  const confirmClearScene = useCallback(() => {
    clearUserContent();
    setClearDialogOpen(false);
    toast.success("Scene cleared.");
  }, [clearUserContent]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.key === "Escape") {
        const { dragNodeId, selectedIds, setSelectedIds } = useSceneStore.getState();
        if (!dragNodeId && selectedIds.length > 0) {
          e.preventDefault();
          setSelectedIds([]);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) onUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) onRedo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "E") {
        e.preventDefault();
        onDownload2D();
        return;
      }
      if (e.key === "g" || e.key === "G") {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setSceneSettings({
            gridOverlay: !useSceneStore.getState().sceneSettings.gridOverlay,
          });
        }
        return;
      }
      if (e.key === "s" || e.key === "S") {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleGridSnapping();
          return;
        }
      }

      if (!e.ctrlKey && !e.metaKey && !useSceneStore.getState().dragNodeId) {
        if (e.key === "q" || e.key === "Q" || e.key === "[") {
          e.preventDefault();
          window.dispatchEvent(
            new CustomEvent("request-rotation", { detail: { angle: -90 } })
          );
          return;
        }
        if (e.key === "e" || e.key === "E" || e.key === "]") {
          e.preventDefault();
          window.dispatchEvent(
            new CustomEvent("request-rotation", { detail: { angle: 90 } })
          );
          return;
        }
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          window.dispatchEvent(
            new CustomEvent("request-rotation", { detail: { angle: 180 } })
          );
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo, onSave, onDownload2D, setSceneSettings, toggleGridSnapping]);

  return {
    onSave,
    onImportProject,
    onDownload2D,
    onExport3D,
    onExport2D: onDownload2D,
    onClearScene,
    confirmClearScene,
    clearDialogOpen,
    setClearDialogOpen,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
  };
}
