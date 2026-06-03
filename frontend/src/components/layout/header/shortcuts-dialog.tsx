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
  let lastSection: string | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(32rem,85vh)] max-w-md overflow-y-auto border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-zinc-100">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          {WORKSPACE_SHORTCUTS.map((shortcut, index) => {
            const showSection = shortcut.section && shortcut.section !== lastSection;
            if (shortcut.section) lastSection = shortcut.section;

            return (
              <div key={`${shortcut.keys}-${index}`}>
                {showSection && (
                  <p className="mt-3 mb-1.5 px-2 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase first:mt-0 dark:text-zinc-500">
                    {shortcut.section}
                  </p>
                )}
                <div className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{shortcut.description}</span>
                  <kbd className="shrink-0 rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {shortcut.keys}
                  </kbd>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ShortcutsDialog };
