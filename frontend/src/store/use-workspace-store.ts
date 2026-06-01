import { create } from "zustand";
import { DEFAULT_WORKSPACE_SETTINGS } from "@/api/mock-data";
import type { RenderQualityId } from "@/types";

export interface WorkspaceState {
  renderQuality: RenderQualityId;
  showFloorGrid: boolean;
  gridSnapping: boolean;
  setRenderQuality: (quality: RenderQualityId) => void;
  toggleShowFloorGrid: () => void;
  toggleGridSnapping: () => void;
  setShowFloorGrid: (value: boolean) => void;
  setGridSnapping: (value: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  ...DEFAULT_WORKSPACE_SETTINGS,
  setRenderQuality: (renderQuality) => set({ renderQuality }),
  toggleShowFloorGrid: () => set((s) => ({ showFloorGrid: !s.showFloorGrid })),
  toggleGridSnapping: () => set((s) => ({ gridSnapping: !s.gridSnapping })),
  setShowFloorGrid: (showFloorGrid) => set({ showFloorGrid }),
  setGridSnapping: (gridSnapping) => set({ gridSnapping }),
}));
