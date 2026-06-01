import { WORKSPACE_SHORTCUTS } from "@/api/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-zinc-100">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {WORKSPACE_SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm"
            >
              <span className="text-zinc-600 dark:text-zinc-400">{shortcut.description}</span>
              <kbd className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ShortcutsDialog };
