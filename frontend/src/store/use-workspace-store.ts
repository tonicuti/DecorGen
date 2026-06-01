import { create } from "zustand";
import { DEFAULT_WORKSPACE_SETTINGS } from "@/api/mock-data";
import type { RenderQualityId } from "@/types";

export interface WorkspaceState {
  renderQuality: RenderQualityId;
  gridSnapping: boolean;
  setRenderQuality: (quality: RenderQualityId) => void;
  toggleGridSnapping: () => void;
  setGridSnapping: (value: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  ...DEFAULT_WORKSPACE_SETTINGS,
  setRenderQuality: (renderQuality) => set({ renderQuality }),
  toggleGridSnapping: () => set((s) => ({ gridSnapping: !s.gridSnapping })),
  setGridSnapping: (gridSnapping) => set({ gridSnapping }),
}));
