import { AppConfirmDialog } from "@/components/ui/app-dialog";

interface ClearSceneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function ClearSceneDialog({ open, onOpenChange, onConfirm }: ClearSceneDialogProps) {
  return (
    <AppConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Clear scene?"
      description={
        <>
          This removes all furniture and groups. Camera and lights are kept. This action cannot be
          undone.
        </>
      }
      confirmLabel="Clear"
      onConfirm={onConfirm}
    />
  );
}

export { ClearSceneDialog };
