import {
  Box,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import * as React from "react";
import { searchBedroomAssets } from "@/api/assets";
import { CATEGORIES, DEFAULT_ASSET_SVG, SAMPLE_ASSETS } from "@/api/mock-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getPlacementSpawnPose } from "@/lib/placement-defaults";
import { generateModelThumbnail } from "@/lib/thumbnail-generator";
import { beginSceneHistoryGesture, useSceneStore } from "@/store/use-scene-store";
import type { Asset, AssetCardProps, SceneNode } from "@/types";

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function assetMatchesSearch(asset: Asset, query: string) {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (!normalizedQuery) return true;

  const searchableValues = [
    asset.id,
    asset.name,
    asset.category,
    asset.description,
    asset.metadataCategory,
    ...(asset.aliases || []),
    ...(asset.tags || []),
    ...(asset.materials || []),
    ...(asset.placements || []),
  ];

  return searchableValues.some(
    (value) => value && normalizeSearchText(value).includes(normalizedQuery)
  );
}

function AssetCard({
  asset,
  draggedId,
  handleDragStart,
  handleDragOver,
  handleDrop,
}: AssetCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const addNode = useSceneStore((state) => state.addNode);
  const setSelectedIds = useSceneStore((state) => state.setSelectedIds);
  const setDragState = useSceneStore((state) => state.setDragState);

  const setIsAddingNode = useSceneStore((state) => state.setIsAddingNode);
  const currentDragNodeId = useSceneStore((state) => state.dragNodeId);

  React.useEffect(() => {
    setImageError(false);
  }, [asset.image]);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentDragNodeId) return;

    let placementType: "floor" | "wall" | "ceiling" | "opening" | "tabletop" = "floor";
    let w = 1,
      h = 1,
      d = 1;

    if (asset.name.toLowerCase().includes("door") || asset.category === "Doors") {
      placementType = "opening";
      w = 0.9;
      h = 2.1;
      d = 0.1;
    } else if (asset.name.toLowerCase().includes("window") || asset.category === "Windows") {
      placementType = "opening";
      w = 1.2;
      h = 1.2;
      d = 0.1;
    } else if (asset.category === "Beds") {
      w = 1.6;
      h = 0.5;
      d = 2.0;
    } else if (asset.category === "Tables" || asset.category === "Desks") {
      w = 1.2;
      h = 0.75;
      d = 0.8;
    } else if (asset.category === "Chairs" || asset.category === "Seating") {
      w = 0.5;
      h = 0.9;
      d = 0.5;
    } else if (asset.category === "Storage" || asset.category === "Cabinets") {
      w = 0.8;
      h = 2.0;
      d = 0.5;
    } else if (
      asset.category === "Decor" ||
      asset.category === "Lighting" ||
      asset.category === "Plants"
    ) {
      placementType = "tabletop";
      w = 0.3;
      h = 0.4;
      d = 0.3;
    } else if (asset.category === "Rugs") {
      w = 2.0;
      h = 0.02;
      d = 3.0;
    }

    const newNodeId = `${asset.id}-${Date.now()}`;
    const dims = asset.dimensions || { w, h, d };
    const resolvedPlacement = asset.placementType || placementType;
    const { position: initialPos, rotation: initialRot } = getPlacementSpawnPose(
      dims,
      resolvedPlacement
    );

    const newNode: SceneNode = {
      id: newNodeId,
      name: asset.name,
      type: "model",
      assetId: asset.id,
      glbUrl: asset.glbUrl,
      placementType: resolvedPlacement,
      position: initialPos,
      rotation: initialRot,
      scale: asset.defaultScale || [1, 1, 1],
      dimensions: dims,
      wallClearance: asset.wallClearance,
      color: "#e2e8f0",
      visible: true,
      locked: false,
    };

    beginSceneHistoryGesture();
    addNode(newNode, null);
    setSelectedIds([newNodeId]);
    setIsAddingNode(true);
    setDragState(newNodeId, initialPos, initialRot, false, []);
  };

  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, asset.id)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, asset.id)}
      className={`group relative flex flex-col overflow-hidden rounded-xl border p-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/50 hover:shadow-md dark:hover:border-indigo-500/50 ${
        draggedId === asset.id
          ? "border-indigo-500 bg-indigo-50/50 opacity-50 dark:bg-indigo-500/10"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <img
          src={imageError ? DEFAULT_ASSET_SVG : asset.image}
          alt={asset.name}
          onError={() => setImageError(true)}
          className={`h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105 ${
            imageError ? "p-4 dark:invert-[0.1]" : ""
          }`}
        />
        {asset.premium && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-linear-to-r from-indigo-500 to-indigo-600 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white uppercase shadow-sm">
            <Sparkles className="h-2.5 w-2.5" />
            <span>Pro</span>
          </div>
        )}
        <Button
          type="button"
          size="icon-sm"
          className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-zinc-900/80 text-white opacity-0 shadow-sm backdrop-blur-md transition-all duration-200 group-hover:opacity-100 hover:scale-105 hover:bg-zinc-800 dark:bg-black/60"
          onClick={handleAddClick}
          title="Add Asset"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-start justify-between gap-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <h3
            className="line-clamp-2 min-h-8 text-xs leading-tight font-medium wrap-break-word text-zinc-900 dark:text-zinc-100"
            title={asset.name}
          >
            {asset.name}
          </h3>
          <span className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
            {asset.category}
          </span>
        </div>
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-500" />
      </div>
    </div>
  );
}

function AssetPanel() {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [assets, setAssets] = React.useState<Asset[]>(SAMPLE_ASSETS);
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [isAiSearch, setIsAiSearch] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const aiSearchRef = React.useRef<HTMLTextAreaElement | null>(null);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isAiSearch) {
      aiSearchRef.current?.focus();
    } else {
      searchInputRef.current?.focus();
    }
  }, [isAiSearch]);

  const [uploadingFile, setUploadingFile] = React.useState<File | null>(null);
  const [uploadName, setUploadName] = React.useState("");
  const [uploadCategory, setUploadCategory] = React.useState("Decor");
  const [uploadThumbnail, setUploadThumbnail] = React.useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = React.useState(false);
  const [isSearchingAssets, setIsSearchingAssets] = React.useState(false);

  const handleAiSearchAssets = async () => {
    const prompt = search.trim();
    if (!prompt) return;

    setIsSearchingAssets(true);
    try {
      const results = await searchBedroomAssets(prompt, 12);
      setAssets(results);
      setSelectedCategory("All");
      setSearch("");
    } catch (err) {
      console.error("Failed to search backend assets:", err);
    } finally {
      setIsSearchingAssets(false);
    }
  };

  const handleSearchSubmit = () => {
    if (isAiSearch) {
      void handleAiSearchAssets();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(file);
      setUploadName(file.name.replace(/\.[^/.]+$/, ""));
      setUploadCategory("Beds");
      setUploadThumbnail(null);
      setIsGeneratingThumbnail(true);

      try {
        const thumbnail = await generateModelThumbnail(file);
        setUploadThumbnail(thumbnail);
      } catch (err) {
        console.error("Failed to generate model thumbnail:", err);
      } finally {
        setIsGeneratingThumbnail(false);
      }

      e.target.value = "";
    }
  };

  const handleConfirmUpload = () => {
    if (!uploadingFile) return;

    const newAsset: Asset = {
      id: `custom-${Date.now()}`,
      name: uploadName.trim() || uploadingFile.name.replace(/\.[^/.]+$/, ""),
      category: uploadCategory,
      image: uploadThumbnail || DEFAULT_ASSET_SVG,
    };
    setAssets((prev) => [newAsset, ...prev]);
    setSelectedCategory(uploadCategory);

    const catIndex = CATEGORIES.indexOf(uploadCategory);
    if (catIndex !== -1) {
      setCategoryStartIndex((prev) => {
        if (catIndex < prev) {
          return catIndex;
        }

        if (catIndex >= prev + itemsPerPage) {
          const newStart = catIndex - itemsPerPage + 1;
          const maxStart = CATEGORIES.length - itemsPerPage;
          return Math.min(Math.max(0, newStart), maxStart);
        }

        return prev;
      });
    }

    setUploadingFile(null);
    setUploadThumbnail(null);
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesCategory = selectedCategory === "All" || asset.category === selectedCategory;
    const matchesSearch = isAiSearch || assetMatchesSearch(asset, search);
    return matchesCategory && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = assets.findIndex((a) => a.id === draggedId);
    const targetIndex = assets.findIndex((a) => a.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newAssets = [...assets];
      const [draggedItem] = newAssets.splice(draggedIndex, 1);
      newAssets.splice(targetIndex, 0, draggedItem);
      setAssets(newAssets);
    }
    setDraggedId(null);
  };

  const [categoryStartIndex, setCategoryStartIndex] = React.useState(0);
  const itemsPerPage = 3;
  const maxStartIndex = Math.max(0, CATEGORIES.length - itemsPerPage);
  const visibleCategories = CATEGORIES.slice(categoryStartIndex, categoryStartIndex + itemsPerPage);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Asset Library</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            {assets.length} items
          </span>
          <Button
            size="sm"
            onClick={handleUploadClick}
            className="h-7 gap-1 rounded-lg bg-indigo-600 px-2.5 text-xs text-white hover:bg-indigo-700 active:scale-95 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            title="Upload GLB Model"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Asset</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".glb,.gltf"
            className="hidden"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <div
              className={`relative w-full overflow-hidden rounded-lg border transition-all duration-300 ease-in-out ${
                isAiSearch
                  ? "h-33 border-indigo-500/80 bg-indigo-50/10 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-indigo-500/60 dark:bg-indigo-950/10"
                  : "h-9 border-zinc-200 bg-zinc-50 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 flex h-9 items-center transition-all duration-300 ease-in-out ${
                  isAiSearch
                    ? "pointer-events-none -translate-y-2.5 opacity-0"
                    : "translate-y-0 opacity-100"
                }`}
              >
                <Search className="absolute left-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <Input
                  autoFocus
                  ref={searchInputRef}
                  placeholder="Search bedroom models..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                  className="h-full w-full border-0! bg-transparent! pr-3 pl-9 text-sm text-zinc-900 shadow-none! placeholder:text-zinc-400 focus-visible:ring-0! focus-visible:ring-offset-0! dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>
              <div
                className={`absolute inset-0 flex items-start p-2.5 pl-9 transition-all duration-300 ease-in-out ${
                  isAiSearch
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2.5 opacity-0"
                }`}
              >
                <Sparkles className="absolute top-3 left-3 z-10 h-4 w-4 animate-pulse text-indigo-500" />
                <Textarea
                  autoFocus
                  ref={aiSearchRef}
                  placeholder="Describe bedroom styles with AI prompt..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      void handleAiSearchAssets();
                    }
                  }}
                  className="h-28 w-full resize-none overflow-y-auto rounded-none! border-0! bg-transparent! p-0! pr-1 text-sm text-zinc-900 shadow-none! placeholder:text-xs placeholder:text-zinc-400 focus-visible:ring-0! focus-visible:ring-offset-0! dark:text-zinc-100 dark:placeholder:text-zinc-500 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800/80 [&::-webkit-scrollbar-track]:bg-transparent"
                />
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            disabled={isSearchingAssets}
            onClick={() => {
              if (search.trim()) {
                handleSearchSubmit();
                return;
              }

              setIsAiSearch((prev) => !prev);
            }}
            className={`h-9 w-9 rounded-lg border transition-all ${
              isAiSearch
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/20"
                : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
            title={
              search.trim()
                ? "Search Assets"
                : isAiSearch
                  ? "Switch to Regular Search"
                  : "Use AI Prompt Search"
            }
          >
            <Sparkles className={`h-4 w-4 ${isSearchingAssets ? "animate-pulse" : ""}`} />
          </Button>
        </div>
        <div className="flex w-full items-center justify-between gap-1 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-1 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <Button
            variant="ghost"
            size="icon"
            disabled={categoryStartIndex === 0}
            onClick={() => setCategoryStartIndex(0)}
            className="h-7 w-7 shrink-0 rounded-lg text-zinc-600 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none dark:text-zinc-400 dark:hover:bg-zinc-800"
            title="First Categories"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={categoryStartIndex === 0}
            onClick={() => setCategoryStartIndex((prev) => Math.max(0, prev - 1))}
            className="h-7 w-7 shrink-0 rounded-lg text-zinc-600 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none dark:text-zinc-400 dark:hover:bg-zinc-800"
            title="Previous Categories"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-1 items-center justify-center gap-1 overflow-hidden">
            {visibleCategories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`h-7 flex-1 rounded-lg px-1 text-xs font-medium tracking-tight transition-all active:scale-95 ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                    : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span className="whitespace-nowrap">{cat}</span>
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            disabled={categoryStartIndex >= maxStartIndex}
            onClick={() => setCategoryStartIndex((prev) => Math.min(maxStartIndex, prev + 1))}
            className="h-7 w-7 shrink-0 rounded-lg text-zinc-600 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none dark:text-zinc-400 dark:hover:bg-zinc-800"
            title="Next Categories"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={categoryStartIndex >= maxStartIndex}
            onClick={() => setCategoryStartIndex(maxStartIndex)}
            className="h-7 w-7 shrink-0 rounded-lg text-zinc-600 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none dark:text-zinc-400 dark:hover:bg-zinc-800"
            title="Last Categories"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 scrollbar-none overflow-y-auto px-4 pt-3 pb-4 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-2 gap-3">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              draggedId={draggedId}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
            />
          ))}
        </div>
        {filteredAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No assets found.</p>
          </div>
        )}
      </div>
      <Dialog
        open={uploadingFile !== null}
        onOpenChange={(open) => {
          if (!open) setUploadingFile(null);
        }}
      >
        <DialogContent className="max-w-md border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>Add Bedroom Asset</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Configure details for your uploaded bedroom model:{" "}
              <strong>{uploadingFile?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2.5">
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800/50 dark:bg-zinc-900/30">
              <div className="relative aspect-square w-24 overflow-hidden rounded-lg border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                {isGeneratingThumbnail ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-400">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      Rendering 3D...
                    </span>
                  </div>
                ) : uploadThumbnail ? (
                  <img src={uploadThumbnail} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-400">
                    <span className="text-[10px] font-medium">No Preview</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Asset Name
              </label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                onFocus={(e) => {
                  const input = e.currentTarget;
                  setTimeout(() => {
                    const val = input.value;
                    input.setSelectionRange(val.length, val.length);
                  }, 0);
                }}
                className="h-9 border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900/50"
                placeholder="Enter model name..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Category
              </label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="h-9 w-full border-zinc-200 bg-zinc-50/50 text-xs font-medium text-zinc-900 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="max-h-56 overflow-y-auto border-zinc-200 bg-white **:data-radix-select-viewport:h-auto! **:data-[slot=select-scroll-down-button]:hidden **:data-[slot=select-scroll-up-button]:hidden dark:border-zinc-800 dark:bg-zinc-950 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800/80 [&::-webkit-scrollbar-track]:bg-transparent"
                >
                  {CATEGORIES.filter((cat) => cat !== "All" && cat !== "Pets").map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-xs font-medium text-zinc-800 dark:text-zinc-200"
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                Note: Custom pets cannot be added due to simulation complexity.
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setUploadingFile(null)}
              className="border-zinc-200 dark:border-zinc-800"
            >
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              onClick={handleConfirmUpload}
            >
              Add to Library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { AssetPanel };
