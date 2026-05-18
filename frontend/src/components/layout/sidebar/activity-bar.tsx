import { Folder, Layers, Package, Settings, SlidersHorizontal, Wand2 } from "lucide-react";
import { SidebarToggle } from "@/components/layout/sidebar/sidebar-toggle";
import { Button } from "@/components/ui/button";
import type { ActivityBarProps } from "@/types";

function ActivityBar({ activeTab, setActiveTab, isCollapsed, onToggleCollapse }: ActivityBarProps) {
  const tabs = [
    { id: "bedrooms", label: "Saved Bedrooms", icon: Folder },
    { id: "assets", label: "3D Assets", icon: Package },
    { id: "scene", label: "Scene Hierarchy", icon: Layers },
    { id: "inspector", label: "Inspector", icon: SlidersHorizontal },
    { id: "settings", label: "Scene Settings", icon: Settings },
    { id: "blueprint", label: "AI Blueprint", icon: Wand2 },
  ] as const;

  return (
    <div className="flex w-16 shrink-0 flex-col items-center justify-between border-r border-zinc-200 py-3 dark:border-zinc-800/60">
      <div className="flex w-full flex-col items-center gap-3 px-3">
        <SidebarToggle isCollapsed={isCollapsed} onToggle={onToggleCollapse} />
        <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-800" />
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <div key={tab.id} className="relative flex w-full items-center justify-center py-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (isCollapsed) {
                    onToggleCollapse();
                  }
                }}
                className={`group h-10 w-10 rounded-xl transition-all duration-300 active:scale-95 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md dark:bg-indigo-600 dark:text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                }`}
                title={tab.label}
              >
                <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
              </Button>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-2"></div>
    </div>
  );
}

export { ActivityBar };
