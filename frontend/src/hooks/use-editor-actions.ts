import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { exportPlan2DPng } from "@/lib/export-plan-2d";
import { exportSceneGLB } from "@/lib/export-scene-glb";
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

  const onSave = useCallback(() => {
    toast.info("Save bedroom layout requires backend — coming soon.");
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
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo, onSave, onDownload2D, setSceneSettings, toggleGridSnapping]);

  return {
    onSave,
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
