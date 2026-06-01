import { ABOUT_DECORGEN } from "@/api/mock-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-zinc-100">About DecorGen</DialogTitle>
          <DialogDescription className="text-zinc-600 dark:text-zinc-400">
            {ABOUT_DECORGEN.tagline}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{ABOUT_DECORGEN.description}</p>
        <p className="font-mono text-xs text-zinc-500">v0.0.0</p>
      </DialogContent>
    </Dialog>
  );
}

export { AboutDialog };
