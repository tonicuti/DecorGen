import { ABOUT_DECORGEN } from "@/api/mock-data";
import { AppInfoDialog } from "@/components/ui/app-dialog";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <AppInfoDialog
      open={open}
      onOpenChange={onOpenChange}
      title="About DecorGen"
      description={ABOUT_DECORGEN.tagline}
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{ABOUT_DECORGEN.description}</p>
      <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">v0.0.0</p>
    </AppInfoDialog>
  );
}

export { AboutDialog };
