import { ActionBar } from "@/components/layout/header/action-bar";
import { ClearSceneDialog } from "@/components/layout/header/clear-scene-dialog";
import { CommandBar } from "@/components/layout/header/command-bar";
import { Logo } from "@/components/layout/header/logo";
import { SettingsNav } from "@/components/layout/header/settings-nav";
import { ThemeToggle } from "@/components/layout/header/theme-toggle";
import { UserNav } from "@/components/layout/header/user-nav";
import type { HeaderProps } from "@/types";

function Header({
  setViewMode,
  onSave,
  onImportProject,
  onDownload2D,
  onExport3D,
  onExport2D,
  onClearScene,
  confirmClearScene,
  clearDialogOpen,
  setClearDialogOpen,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: HeaderProps) {
  return (
    <header className="pointer-events-none flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-md transition-colors duration-300 dark:border-zinc-800/60 dark:bg-zinc-950/80">
      <div className="flex items-center gap-4">
        <Logo />
      </div>
      <CommandBar
        onSwitchTo2D={() => setViewMode("2d")}
        onSwitchTo3D={() => setViewMode("3d")}
        onSave={onSave}
        onExport2D={onExport2D}
        onExport3D={onExport3D}
        onClearScene={onClearScene}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      <div className="flex items-center gap-3">
        <ActionBar
          onSave={onSave}
          onImportProject={onImportProject}
          onDownload2D={onDownload2D}
          onExport3D={onExport3D}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <div className="pointer-events-auto flex items-center justify-center">
          <ThemeToggle />
        </div>
        <SettingsNav />
        <UserNav />
      </div>
      <ClearSceneDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        onConfirm={confirmClearScene}
      />
    </header>
  );
}

export { Header };
