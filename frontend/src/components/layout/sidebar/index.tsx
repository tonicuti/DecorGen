import * as React from "react";
import { ActivityBar } from "@/components/layout/sidebar/activity-bar";
import { AssetPanel } from "@/components/layout/sidebar/asset-panel";
import { BedroomPanel } from "@/components/layout/sidebar/bedroom-panel";
import { BlueprintPanel } from "@/components/layout/sidebar/blueprint-panel";
import { InspectorPanel } from "@/components/layout/sidebar/inspector-panel";
import { SceneSettingsPanel } from "@/components/layout/sidebar/scene-settings-panel";
import { SceneTreePanel } from "@/components/layout/sidebar/scene-tree-panel";
import { TemplatePanel } from "@/components/layout/sidebar/template-panel";
import { useSceneStore } from "@/store/use-scene-store";
import type { SidebarProps } from "@/types";

function Sidebar({}: SidebarProps) {
  const [activeTab, setActiveTab] = React.useState<
    "assets" | "templates" | "scene" | "bedrooms" | "inspector" | "settings" | "blueprint"
  >("bedrooms");
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const walkthroughMode = useSceneStore((state) => state.walkthroughMode);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (isCtrlOrMeta && e.key.toLowerCase() === "b") {
        e.preventDefault();

        if (
          document.querySelector('[data-slot="command"]') ||
          document.querySelector('[role="dialog"]')
        ) {
          return;
        }

        setIsCollapsed((prev) => !prev);
      }
    };

    const handleOpenInspector = () => {
      setActiveTab("inspector");
      setIsCollapsed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-inspector", handleOpenInspector);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-inspector", handleOpenInspector);
    };
  }, []);

  return (
    <aside
      onScroll={(e) => {
        e.currentTarget.scrollLeft = 0;
      }}
      className={`absolute top-14 bottom-0 left-0 z-20 flex h-[calc(100vh-3.5rem)] overflow-hidden border-r border-zinc-200 bg-white/90 backdrop-blur-md transition-[width,background-color,border-color,translate] duration-500 ease-out dark:border-zinc-800/60 dark:bg-zinc-950/80 ${
        isCollapsed ? "w-16" : "w-100"
      } ${walkthroughMode ? "pointer-events-none -translate-x-full" : "pointer-events-auto translate-x-0"}`}
    >
      <ActivityBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />
      <div
        className={`flex h-full w-84 shrink-0 flex-col transition-opacity duration-500 ease-out ${
          isCollapsed ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        {activeTab === "assets" && <AssetPanel />}
        {activeTab === "templates" && <TemplatePanel />}
        {activeTab === "scene" && <SceneTreePanel />}
        <div
          className={
            activeTab === "inspector" ? "flex h-full w-full flex-col overflow-hidden" : "hidden"
          }
        >
          <InspectorPanel />
        </div>
        {activeTab === "settings" && <SceneSettingsPanel />}
        {activeTab === "bedrooms" && <BedroomPanel />}
        {activeTab === "blueprint" && <BlueprintPanel />}
      </div>
    </aside>
  );
}

export { Sidebar };
