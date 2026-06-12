import { Box, Download, FileImage, Redo2, Save, Undo2, Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ActionBarProps } from "@/types";

function ActionBar({
  onSave,
  onImportProject,
  onDownload2D,
  onExport3D,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: ActionBarProps) {
  const importInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="pointer-events-auto flex items-center gap-1">
      <input
        ref={importInputRef}
        type="file"
        accept=".glb,model/gltf-binary"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImportProject?.(file);
          event.target.value = "";
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onSave}
        className="h-8 gap-1.5 px-3 text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <Save className="h-4 w-4 text-emerald-500" />
        <span className="hidden sm:inline">Save</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => importInputRef.current?.click()}
        className="h-8 gap-1.5 px-3 text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <Upload className="h-4 w-4 text-rose-500" />
        <span className="hidden sm:inline">Import Project</span>
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="mr-1 h-8 gap-1.5 px-3 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title="Download / Export Options"
          >
            <Download className="h-4 w-4 text-indigo-500" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 rounded-xl border-zinc-200/80 bg-white/95 p-1.5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95"
          style={{ willChange: "transform, opacity" }}
        >
          <DropdownMenuItem
            onClick={onDownload2D}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
          >
            <FileImage className="h-4 w-4 text-sky-500" />
            <span>Download 2D Plan</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onExport3D}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
          >
            <Box className="h-4 w-4 text-amber-500" />
            <span>Export 3D Model (.glb)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800/80 dark:bg-zinc-900/50">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canUndo}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUndo?.();
          }}
          className="h-7 w-7 rounded-sm text-zinc-600 transition-all hover:bg-zinc-200 hover:text-zinc-900 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canRedo}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRedo?.();
          }}
          className="h-7 w-7 rounded-sm text-zinc-600 transition-all hover:bg-zinc-200 hover:text-zinc-900 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export { ActionBar };
