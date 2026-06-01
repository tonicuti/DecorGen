import { CheckIcon, ChevronRight, Grid3X3, Info, Keyboard, MousePointer2, Settings, Sliders } from "lucide-react";
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
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrailing,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSceneStore } from "@/store/use-scene-store";
import { useWorkspaceStore } from "@/store/use-workspace-store";

const settingsItemClass =
  "cursor-pointer pl-2 focus:bg-zinc-100 dark:focus:bg-zinc-800";

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
              <DropdownMenuSubTrigger
                className={`${settingsItemClass} [&>svg:last-child]:hidden`}
              >
                <Sliders className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1">Render Quality</span>
                <DropdownMenuTrailing
                  shortcut={qualityLabel}
                  end={<ChevronRight className="size-4 shrink-0 opacity-70" />}
                />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                {RENDER_QUALITY_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    className={settingsItemClass}
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => setRenderQuality(option.id)}
                  >
                    <span className="min-w-0 flex-1">{option.label}</span>
                    <DropdownMenuTrailing
                      indicator={
                        renderQuality === option.id ? (
                          <CheckIcon className="size-4 text-zinc-900 dark:text-white" />
                        ) : null
                      }
                    />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuCheckboxItem
              checked={gridOverlay}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(checked) => setSceneSettings({ gridOverlay: checked })}
              className={`${settingsItemClass} [&>span:first-child]:hidden`}
            >
              <Grid3X3 className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">Show Floor Grid</span>
              <DropdownMenuTrailing
                indicator={<DropdownMenuItemIndicator />}
                shortcut="G"
              />
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={gridSnapping}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => toggleGridSnapping()}
              className={`${settingsItemClass} [&>span:first-child]:hidden`}
            >
              <MousePointer2 className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">Grid Snapping</span>
              <DropdownMenuTrailing
                indicator={<DropdownMenuItemIndicator />}
                shortcut="S"
              />
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className={settingsItemClass}
              onClick={() => setShortcutsOpen(true)}
            >
              <Keyboard className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">Keyboard Shortcuts</span>
              <DropdownMenuTrailing shortcut="⌘/" />
            </DropdownMenuItem>
            <DropdownMenuItem className={settingsItemClass} onClick={() => setAboutOpen(true)}>
              <Info className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">About DecorGen</span>
              <DropdownMenuTrailing />
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
