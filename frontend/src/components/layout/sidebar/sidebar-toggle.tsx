import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SidebarToggleProps } from "@/types";

function SidebarToggle({ isCollapsed, onToggle }: SidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="h-9 w-9 rounded-xl text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
    >
      {isCollapsed ? (
        <PanelLeftOpen className="h-4 w-4 transition-transform hover:scale-110" />
      ) : (
        <PanelLeftClose className="h-4 w-4 transition-transform hover:scale-110" />
      )}
    </Button>
  );
}

export { SidebarToggle };
