import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const APP_DIALOG_CONTENT_CLASS =
  "max-w-md border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100";

export const APP_DIALOG_DESCRIPTION_CLASS = "text-zinc-500 dark:text-zinc-400";

type AppConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmDisabled?: boolean;
};

function AppConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmDisabled = false,
}: AppConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={APP_DIALOG_CONTENT_CLASS}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={APP_DIALOG_DESCRIPTION_CLASS}>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-200 dark:border-zinc-800"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={confirmDisabled}
            className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type AppInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  closeLabel?: string;
  contentClassName?: string;
};

function AppInfoDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  closeLabel = "Close",
  contentClassName,
}: AppInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(APP_DIALOG_CONTENT_CLASS, contentClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription className={APP_DIALOG_DESCRIPTION_CLASS}>
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        {children ? <div className="flex flex-col gap-3">{children}</div> : null}
        <DialogFooter className="mt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-200 dark:border-zinc-800"
          >
            {closeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AppConfirmDialog, AppInfoDialog };
