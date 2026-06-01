import {
  Box,
  FileImage,
  LayoutTemplate,
  Moon,
  Redo2,
  Save,
  Search,
  Sun,
  Trash2,
  Undo2,
} from "lucide-react";
import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme-provider";
import type { CommandBarProps } from "@/types";

function CommandBar({
  onSwitchTo2D,
  onSwitchTo3D,
  onSave,
  onExport2D,
  onExport3D,
  onClearScene,
  onUndo,
  onRedo,
}: CommandBarProps) {
  const [open, setOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (action?: () => void) => {
    action?.();
    setOpen(false);
  };

  return (
    <div className="pointer-events-auto mx-4 hidden max-w-md flex-1 items-center md:flex">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="group h-auto w-full justify-start gap-2 rounded-lg border-zinc-200 bg-zinc-100/80 px-3 py-1.5 text-sm font-normal text-zinc-500 shadow-sm hover:border-zinc-300 hover:bg-zinc-200/60 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-300"
      >
        <Search className="h-4 w-4 opacity-70 transition-transform duration-200 group-hover:scale-110 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
        <span className="flex-1 text-left transition-colors">Search commands...</span>
        <kbd className="pointer-events-none hidden h-5 items-center gap-1 rounded border border-zinc-300 bg-zinc-200/50 px-1.5 font-mono text-[10px] font-medium text-zinc-500 transition-colors select-none group-hover:border-zinc-400 sm:flex dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400 dark:group-hover:border-zinc-600">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 text-zinc-700 shadow-2xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/85 dark:text-zinc-300"
      >
        <CommandInput
          placeholder="Type a command or search..."
          className="border-b border-zinc-200/80 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-0 dark:border-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <CommandList className="h-80 scrollbar-none overflow-y-auto transition-all [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <CommandEmpty className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            No results found.
          </CommandEmpty>
          <CommandGroup heading="View Modes">
            <CommandItem
              onSelect={() => handleSelect(onSwitchTo2D)}
              className="my-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <LayoutTemplate className="mr-2 h-4 w-4 text-blue-500" />
              <span>Switch to 2D Blueprint Mode</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelect(onSwitchTo3D)}
              className="my-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <Box className="mr-2 h-4 w-4 text-indigo-500" />
              <span>Switch to 3D Layout Mode</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator className="bg-zinc-100 dark:bg-zinc-800/60" />
          <CommandGroup heading="File & Bedroom">
            <CommandItem
              onSelect={() => handleSelect(onSave)}
              className="my-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <Save className="mr-2 h-4 w-4 text-emerald-500" />
              <span>Save Bedroom Layout</span>
              <CommandShortcut className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Ctrl+S
              </CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelect(onExport2D)}
              className="my-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <FileImage className="mr-2 h-4 w-4 text-sky-500" />
              <span>Export as 2D Blueprint (.png)</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelect(onExport3D)}
              className="my-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <Box className="mr-2 h-4 w-4 text-amber-500" />
              <span>Export as 3D Model (.glb)</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelect(onClearScene)}
              className="my-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <span>Clear Scene</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator className="bg-zinc-100 dark:bg-zinc-800/60" />
          <CommandGroup heading="Edit & Tools">
            <CommandItem
              onSelect={() => handleSelect(onUndo)}
              className="my-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <Undo2 className="mr-2 h-4 w-4 text-zinc-500" />
              <span>Undo</span>
              <CommandShortcut className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Ctrl+Z
              </CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelect(onRedo)}
              className="my-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <Redo2 className="mr-2 h-4 w-4 text-zinc-500" />
              <span>Redo</span>
              <CommandShortcut className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Ctrl+Y
              </CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelect(() => setTheme(theme === "dark" ? "light" : "dark"))}
              className="my-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              {theme === "dark" ? (
                <Sun className="mr-2 h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="mr-2 h-4 w-4 text-blue-500" />
              )}
              <span>Toggle Theme ({theme === "dark" ? "Light" : "Dark"})</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

export { CommandBar };
