import { Grid3X3, Info, Keyboard, MousePointer2, Settings, Sliders } from "lucide-react";
import { useState } from "react";
import { RENDER_QUALITY_OPTIONS } from "@/api/mock-data";
import { AboutDialog } from "@/components/layout/header/about-dialog";
import { ShortcutsDialog } from "@/components/layout/header/shortcuts-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSceneStore } from "@/store/use-scene-store";
import { useWorkspaceStore } from "@/store/use-workspace-store";

function SettingsNav() {
  const renderQuality = useWorkspaceStore((s) => s.renderQuality);
  const gridOverlay = useSceneStore((s) => s.sceneSettings.gridOverlay);
  const setSceneSettings = useSceneStore((s) => s.setSceneSettings);
  const gridSnapping = useWorkspaceStore((s) => s.gridSnapping);
  const setRenderQuality = useWorkspaceStore((s) => s.setRenderQuality);
  const toggleGridSnapping = useWorkspaceStore((s) => s.toggleGridSnapping);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const qualityLabel =
    RENDER_QUALITY_OPTIONS.find((o) => o.id === renderQuality)?.label ?? "High";

  return (
    <div className="pointer-events-auto">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <Settings className="h-4 w-4 transition-transform hover:rotate-45" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          align="end"
          style={{ willChange: "transform, opacity" }}
        >
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
              Workspace Settings
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
                <Sliders className="mr-2 h-4 w-4" />
                <span>Render Quality</span>
                <DropdownMenuShortcut>{qualityLabel}</DropdownMenuShortcut>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                {RENDER_QUALITY_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800"
                    onClick={() => setRenderQuality(option.id)}
                  >
                    {option.label}
                    {renderQuality === option.id && (
                      <span className="ml-auto text-xs text-indigo-500">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuCheckboxItem
              checked={gridOverlay}
              onCheckedChange={(checked) => setSceneSettings({ gridOverlay: checked })}
              className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800"
            >
              <Grid3X3 className="mr-2 h-4 w-4" />
              <span>Show Floor Grid</span>
              <DropdownMenuShortcut>G</DropdownMenuShortcut>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={gridSnapping}
              onCheckedChange={() => toggleGridSnapping()}
              className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800"
            >
              <MousePointer2 className="mr-2 h-4 w-4" />
              <span>Grid Snapping</span>
              <DropdownMenuShortcut>S</DropdownMenuShortcut>
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800"
              onClick={() => setShortcutsOpen(true)}
            >
              <Keyboard className="mr-2 h-4 w-4" />
              <span>Keyboard Shortcuts</span>
              <DropdownMenuShortcut>⌘/</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800"
              onClick={() => setAboutOpen(true)}
            >
              <Info className="mr-2 h-4 w-4" />
              <span>About DecorGen</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}

export { SettingsNav };
