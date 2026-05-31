import * as React from "react";
import * as THREE from "three";
import type { Asset, SceneNode } from "@/types/api";
import type { SceneDimensions } from "@/types/store";

// ==========================================
// Header & Navigation Action Bar Types
// ==========================================

export interface HeaderProps {
  setViewMode: (mode: "3d" | "2d") => void;
}

export interface ActionBarProps {
  onSave?: () => void;
  onDownload2D?: () => void;
  onExport3D?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export interface CommandBarProps {
  onSwitchTo2D?: () => void;
  onSwitchTo3D?: () => void;
  onSave?: () => void;
  onExport2D?: () => void;
  onExport3D?: () => void;
  onClearScene?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

// ==========================================
// Sidebar & Control Panel Types
// ==========================================

export interface SidebarProps {
  viewMode: "3d" | "2d";
}

export interface SidebarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export interface ActivityBarProps {
  activeTab: "assets" | "scene" | "bedrooms" | "inspector" | "settings" | "blueprint";
  setActiveTab: (
    tab: "assets" | "scene" | "bedrooms" | "inspector" | "settings" | "blueprint"
  ) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export interface SceneTreeNodeProps {
  node: SceneNode;
  depth?: number;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  tree: SceneNode[];
  setTree: React.Dispatch<React.SetStateAction<SceneNode[]>>;
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (val: string) => void;
  setRenamingId: (id: string | null) => void;
  handleRenameConfirm: () => void;
  setNodeToDelete: (node: SceneNode | null) => void;
}

export interface CollapsiblePanelProps {
  title: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  titleColor?: string;
}

export interface AssetCardProps {
  asset: Asset;
  draggedId: string | null;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetId: string) => void;
}

// ==========================================
// Form Controls & Property Editor Types
// ==========================================

export interface NumberInputProps {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (val: number) => void;
  badgeColor: string;
}

export interface TransformValues {
  x: number;
  y: number;
  z: number;
}

// ==========================================
// Viewport & Main Canvas Types
// ==========================================

export interface ViewportProps {
  viewMode: "3d" | "2d";
  setViewMode: (mode: "3d" | "2d") => void;
}

export interface WallGroupProps {
  position: [number, number, number];
  args: [number, number, number];
  color: string;
  normal: THREE.Vector3;
  children?: React.ReactNode;
}

export interface WallDef {
  position: [number, number, number];
  normal: THREE.Vector3;
  threshold: number;
  axis: "x" | "z";
}

// ==========================================
// 2D Plan View Types
// ==========================================

export interface Room2DProps {
  dimensions: SceneDimensions;
}

export interface SceneNode2DProps {
  node: SceneNode;
  parentVisible?: boolean;
  legendMap?: Map<string, number>;
}
