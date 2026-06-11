import { Clock, ExternalLink, Folder, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import * as React from "react";
import { INITIAL_TREE } from "@/api/mock-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useBedroomStore } from "@/store/use-bedroom-store";
import { useSceneStore } from "@/store/use-scene-store";
import type { Bedroom } from "@/types";

const DEFAULT_ROOM_DIMENSIONS = {
  width: 4.0,
  length: 3.5,
  height: 2.8,
  thickness: 15,
};

const DEFAULT_ROOM_MATERIALS = {
  wallColor: "#f8fafc",
  floorColor: "#d97706",
};

function BedroomPanel() {
  const [search, setSearch] = React.useState("");
  const [bedroomToDelete, setBedroomToDelete] = React.useState<Bedroom | null>(null);
  const [lastBedroomToDelete, setLastBedroomToDelete] = React.useState<Bedroom | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newBedroomName, setNewBedroomName] = React.useState("");
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [bedroomToRename, setBedroomToRename] = React.useState<Bedroom | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const bedrooms = useBedroomStore((state) => state.bedrooms);
  const createBedroom = useBedroomStore((state) => state.createBedroom);
  const openBedroom = useBedroomStore((state) => state.openBedroom);
  const renameBedroom = useBedroomStore((state) => state.renameBedroom);
  const deleteBedroom = useBedroomStore((state) => state.deleteBedroom);
  const loadBedroomLayout = useSceneStore((state) => state.loadBedroomLayout);

  React.useEffect(() => {
    if (bedroomToDelete) {
      setLastBedroomToDelete(bedroomToDelete);
    }
  }, [bedroomToDelete]);

  const handleCreateBedroom = () => {
    const count = bedrooms.length + 1;
    setNewBedroomName(`New Bedroom ${count}`);
    setIsCreateOpen(true);
  };

  const confirmCreateBedroom = () => {
    const trimmed = newBedroomName.trim();
    if (!trimmed) return;

    const layout = {
      assets: [],
      tree: structuredClone(INITIAL_TREE),
      roomDimensions: { ...DEFAULT_ROOM_DIMENSIONS },
      roomMaterials: { ...DEFAULT_ROOM_MATERIALS },
    };

    createBedroom(trimmed, layout);
    loadBedroomLayout(layout);

    setIsCreateOpen(false);
    setNewBedroomName("");
  };

  const confirmRenameBedroom = () => {
    const trimmed = renameValue.trim();
    if (bedroomToRename && trimmed) {
      renameBedroom(bedroomToRename.id, trimmed);
      setIsRenameOpen(false);
      setBedroomToRename(null);
    }
  };

  const handleOpenBedroom = (bedroom: Bedroom) => {
    const layout = openBedroom(bedroom.id);
    if (layout) loadBedroomLayout(layout);
  };

  const filteredBedrooms = bedrooms.filter((bed) =>
    bed.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeBedroom = bedrooms.find((p) => p.active);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Bedroom Layouts
          </h2>
        </div>
        <Button
          size="sm"
          onClick={handleCreateBedroom}
          className="h-7 gap-1 rounded-lg bg-indigo-600 px-2.5 text-xs text-white hover:bg-indigo-700 active:scale-95 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Bedroom</span>
        </Button>
      </div>
      <div className="flex flex-col gap-4 p-4 pb-2">
        <div className="relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 transition-all duration-300 ease-in-out focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-9 items-center">
            <Search className="absolute left-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <Input
              placeholder="Search bedroom designs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full w-full border-0! bg-transparent! pr-3 pl-9 text-sm text-zinc-900 shadow-none! placeholder:text-zinc-400 focus-visible:ring-0! focus-visible:ring-offset-0! dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 transition-colors dark:border-zinc-800/80 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20">
              <Folder className="h-3.5 w-3.5" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-[9px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                Target Bedroom
              </span>
              <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {activeBedroom?.name || "No Active Bedroom"}
              </span>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            {activeBedroom ? "Active" : "Empty"}
          </span>
        </div>
      </div>
      <div className="flex-1 scrollbar-none overflow-y-auto p-4 pt-3 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-3">
          {filteredBedrooms.map((bed) => (
            <div
              key={bed.id}
              className={`group relative flex flex-col overflow-hidden rounded-xl border p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/50 hover:shadow-md dark:hover:border-indigo-500/50 ${
                bed.active
                  ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-500/5"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div className="relative mb-2.5 aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={bed.thumbnail}
                  alt={bed.name}
                  className="h-full w-full rounded-lg object-cover"
                />
                {bed.active && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm dark:bg-indigo-500">
                    <span>Active</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white shadow-lg hover:bg-indigo-500 active:scale-95"
                    onClick={() => handleOpenBedroom(bed)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Bedroom</span>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col overflow-hidden">
                  <h3 className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {bed.name}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>Updated {bed.updatedAt}</span>
                  </div>
                </div>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40 border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800"
                      onClick={() => console.log("Duplicate bedroom:", bed.name)}
                    >
                      <span>Duplicate</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800"
                      onClick={() => {
                        setBedroomToRename(bed);
                        setRenameValue(bed.name);
                        setIsRenameOpen(true);
                      }}
                    >
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-500/10"
                      onClick={() => setBedroomToDelete(bed)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dialog
        open={bedroomToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setBedroomToDelete(null);
        }}
      >
        <DialogContent className="max-w-md border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>Delete Bedroom Design</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete "
              {bedroomToDelete?.name || lastBedroomToDelete?.name || ""}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setBedroomToDelete(null)}
              className="border-zinc-200 dark:border-zinc-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
              onClick={() => {
                if (bedroomToDelete) {
                  deleteBedroom(bedroomToDelete.id);
                  setBedroomToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) setIsCreateOpen(false);
        }}
      >
        <DialogContent className="max-w-md border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>Create New Bedroom Design</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Start building a new bedroom layout.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Bedroom Name
            </label>
            <Input
              value={newBedroomName}
              onChange={(e) => setNewBedroomName(e.target.value)}
              onFocus={(e) => {
                const input = e.currentTarget;
                setTimeout(() => {
                  const val = input.value;
                  input.setSelectionRange(val.length, val.length);
                }, 0);
              }}
              className="h-9 border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900/50"
              placeholder="Enter bedroom name..."
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmCreateBedroom();
              }}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="border-zinc-200 dark:border-zinc-800"
            >
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              onClick={confirmCreateBedroom}
            >
              Create Bedroom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isRenameOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsRenameOpen(false);
            setBedroomToRename(null);
          }
        }}
      >
        <DialogContent className="max-w-md border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>Rename Bedroom Design</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Choose a new name for your bedroom: <strong>{bedroomToRename?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              New Bedroom Name
            </label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onFocus={(e) => {
                const input = e.currentTarget;
                setTimeout(() => {
                  const val = input.value;
                  input.setSelectionRange(val.length, val.length);
                }, 0);
              }}
              className="h-9 border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900/50"
              placeholder="Enter new bedroom name..."
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRenameBedroom();
              }}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameOpen(false);
                setBedroomToRename(null);
              }}
              className="border-zinc-200 dark:border-zinc-800"
            >
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              onClick={confirmRenameBedroom}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { BedroomPanel };
