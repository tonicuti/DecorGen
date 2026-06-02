import { CheckCircle2, Layers, Save, Sparkles, Upload, Wand2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { searchBedroomAssets } from "@/api/assets";
import { analyzeFloorPlan, type FloorPlanAnalysisResponse } from "@/api/floor-plan";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { commitSceneHistory, useSceneStore } from "@/store/use-scene-store";
import type { Asset, DetectedObject, SceneDimensions, SceneNode } from "@/types";

type GeneratedNodeSpec = {
  dimensions: NonNullable<SceneNode["dimensions"]>;
  placementType: NonNullable<SceneNode["placementType"]>;
  color: string;
  glbUrl?: string;
  assetId: string;
  defaultScale?: [number, number, number];
  wallClearance?: number;
};

function parseAxisValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function cleanSearchLabel(object: DetectedObject) {
  return (object.floorPlan?.label || object.name).replace(/[_\s-]+\d+$/i, "").trim();
}

function getFallbackSpec(name: string): GeneratedNodeSpec {
  const normalized = name.toLowerCase();

  if (normalized.includes("door")) {
    return {
      assetId: "generated-door",
      placementType: "opening",
      dimensions: { w: 0.9, d: 0.08, h: 2.0 },
      color: "#d97706",
    };
  }

  if (normalized.includes("window")) {
    return {
      assetId: "generated-window",
      placementType: "opening",
      dimensions: { w: 1.2, d: 0.06, h: 1.1 },
      color: "#38bdf8",
    };
  }

  if (normalized.includes("bed")) {
    return {
      assetId: "generated-bed",
      placementType: "floor",
      dimensions: { w: 1.6, d: 2.0, h: 0.8 },
      color: "#818cf8",
    };
  }

  if (normalized.includes("chair")) {
    return {
      assetId: "generated-chair",
      placementType: "floor",
      dimensions: { w: 0.5, d: 0.5, h: 0.9 },
      color: "#f59e0b",
    };
  }

  if (normalized.includes("table") || normalized.includes("desk")) {
    return {
      assetId: "generated-table",
      placementType: "floor",
      dimensions: { w: 1.1, d: 0.7, h: 0.75 },
      color: "#a16207",
    };
  }

  return {
    assetId: "generated-object",
    placementType: "floor",
    dimensions: { w: 0.7, d: 0.7, h: 0.7 },
    color: "#e2e8f0",
  };
}

function getAssetSpec(asset: Asset | undefined, fallback: GeneratedNodeSpec): GeneratedNodeSpec {
  if (!asset) return fallback;

  return {
    assetId: asset.id,
    glbUrl: asset.glbUrl,
    placementType: fallback.placementType,
    dimensions: asset.dimensions || fallback.dimensions,
    defaultScale: asset.defaultScale,
    wallClearance: asset.wallClearance,
    color: fallback.color,
  };
}

function clamp(value: number, min: number, max: number) {
  if (min > max) return (min + max) / 2;
  return Math.max(min, Math.min(max, value));
}

function axisValueToMeters(value: number | null, fallback: number) {
  if (!value || value <= 0) return fallback;
  if (value >= 1000) return value / 1000;
  if (value > 20) return value / 100;
  return value;
}

function getRoomDimensionsFromAnalysis(
  analysis: FloorPlanAnalysisResponse | null,
  current: SceneDimensions
): SceneDimensions {
  const axisX = parseAxisValue(analysis?.room?.axes?.Ox);
  const axisY = parseAxisValue(analysis?.room?.axes?.Oy);

  return {
    ...current,
    width: clamp(axisValueToMeters(axisX, current.width), 1, 30),
    length: clamp(axisValueToMeters(axisY, current.length), 1, 30),
  };
}

function getCoordinateSourceSize(
  objects: DetectedObject[],
  analysis: FloorPlanAnalysisResponse | null,
  roomDimensions: SceneDimensions
) {
  const axisX = parseAxisValue(analysis?.room?.axes?.Ox);
  const axisY = parseAxisValue(analysis?.room?.axes?.Oy);
  const maxAbsX = Math.max(
    0,
    ...objects.map((object) => Math.abs(object.floorPlan?.coordinates?.x || 0))
  );
  const maxAbsY = Math.max(
    0,
    ...objects.map((object) => Math.abs(object.floorPlan?.coordinates?.y || 0))
  );

  return {
    width: axisX || maxAbsX * 2 || roomDimensions.width,
    length: axisY || maxAbsY * 2 || roomDimensions.length,
  };
}

function toScenePosition(
  object: DetectedObject,
  spec: GeneratedNodeSpec,
  sourceSize: { width: number; length: number },
  roomDimensions: SceneDimensions,
  fallbackIndex: number
): [number, number, number] {
  const coordinates = object.floorPlan?.coordinates;
  const fallbackX = -roomDimensions.width / 2 + 0.7 + (fallbackIndex % 4) * 0.8;
  const fallbackZ = -roomDimensions.length / 2 + 0.7 + Math.floor(fallbackIndex / 4) * 0.8;
  const x = coordinates
    ? (coordinates.x / sourceSize.width) * roomDimensions.width
    : fallbackX;
  const z = coordinates
    ? -(coordinates.y / sourceSize.length) * roomDimensions.length
    : fallbackZ;
  const halfW = spec.dimensions.w / 2;
  const halfD = spec.dimensions.d / 2;

  if (spec.placementType === "opening") {
    const halfRoomW = roomDimensions.width / 2;
    const halfRoomL = roomDimensions.length / 2;
    const nearLeftRight = Math.abs(x) / halfRoomW > Math.abs(z) / halfRoomL;
    const y = object.name.toLowerCase().includes("window")
      ? Math.min(roomDimensions.height - spec.dimensions.h / 2, 1.4)
      : spec.dimensions.h / 2;

    return nearLeftRight
      ? [
          x >= 0 ? halfRoomW : -halfRoomW,
          y,
          clamp(z, -halfRoomL + halfW, halfRoomL - halfW),
        ]
      : [
          clamp(x, -halfRoomW + halfW, halfRoomW - halfW),
          y,
          z >= 0 ? halfRoomL : -halfRoomL,
        ];
  }

  return [
    clamp(x, -roomDimensions.width / 2 + halfW, roomDimensions.width / 2 - halfW),
    spec.dimensions.h / 2,
    clamp(z, -roomDimensions.length / 2 + halfD, roomDimensions.length / 2 - halfD),
  ];
}

function fitSpecDimensionsToRoom(
  spec: GeneratedNodeSpec,
  roomDimensions: SceneDimensions
): GeneratedNodeSpec {
  if (spec.placementType !== "floor") return spec;

  const maxW = roomDimensions.width * 0.85;
  const maxD = roomDimensions.length * 0.85;
  const scale = Math.min(
    1,
    maxW / spec.dimensions.w,
    maxD / spec.dimensions.d
  );

  if (scale >= 1) return spec;

  return {
    ...spec,
    dimensions: {
      w: spec.dimensions.w * scale,
      d: spec.dimensions.d * scale,
      h: spec.dimensions.h * scale,
    },
  };
}

function toSceneRotation(object: DetectedObject, position: [number, number, number]): [number, number, number] {
  if (object.category === "opening") {
    const isLeftOrRightWall = Math.abs(position[0]) > Math.abs(position[2]);
    const yaw = isLeftOrRightWall
      ? position[0] >= 0
        ? -Math.PI / 2
        : Math.PI / 2
      : position[2] >= 0
        ? Math.PI
        : 0;
    return [0, yaw, 0];
  }

  const degrees = object.floorPlan?.rotate || 0;
  return [0, (-degrees * Math.PI) / 180, 0];
}

function BlueprintPanel() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const roomDimensions = useSceneStore((state) => state.roomDimensions);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isGenerating3D, setIsGenerating3D] = React.useState(false);
  const [detectedObjects, setDetectedObjects] = React.useState<DetectedObject[]>([]);
  const [analysisResult, setAnalysisResult] = React.useState<FloorPlanAnalysisResponse | null>(
    null
  );
  const [_, setIsGenerated] = React.useState(false);
  const [showRawJson, setShowRawJson] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setDetectedObjects([]);
        setAnalysisResult(null);
        setIsGenerated(false);
        setShowRawJson(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedFile(null);
    setUploadedImage(null);
    setDetectedObjects([]);
    setAnalysisResult(null);
    setShowRawJson(false);
    setIsGenerated(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProcessAI = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    try {
      const result = await analyzeFloorPlan(uploadedFile);
      setDetectedObjects(result.objects);
      setAnalysisResult(result.raw);
      setShowRawJson(false);

      if (result.objects.length === 0) {
        toast.warning("No layout elements detected in this blueprint.");
      } else {
        toast.success("Blueprint analysis completed.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to analyze blueprint.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave2D = () => {
    if (!uploadedImage) return;
    const link = document.createElement("a");
    link.href = uploadedImage;
    link.download = "2d_blueprint.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const groupedCategories = React.useMemo(() => {
    const categoriesMap: Record<
      string,
      {
        categoryName: string;
        items: {
          key: string;
          name: string;
          details?: string;
          count: number;
          selected: boolean;
          itemIds: string[];
        }[];
      }
    > = {
      room: { categoryName: "Room Structure", items: [] },
      opening: { categoryName: "Openings (Doors & Windows)", items: [] },
      furniture: { categoryName: "Furniture & Decor", items: [] },
    };

    detectedObjects.forEach((obj) => {
      const catKey = obj.category || "furniture";
      if (!categoriesMap[catKey]) {
        categoriesMap[catKey] = {
          categoryName: catKey.charAt(0).toUpperCase() + catKey.slice(1),
          items: [],
        };
      }

      const key = `${obj.name}-${obj.details || ""}`;
      let group = categoriesMap[catKey].items.find((g) => g.key === key);

      if (!group) {
        group = {
          key,
          name: obj.name,
          details: obj.details,
          count: 0,
          selected: true,
          itemIds: [],
        };
        categoriesMap[catKey].items.push(group);
      }

      group.count += 1;
      group.itemIds.push(obj.id);
    });

    Object.values(categoriesMap).forEach((cat) => {
      cat.items.forEach((g) => {
        g.selected = g.itemIds.every((id) => {
          const item = detectedObjects.find((obj) => obj.id === id);
          return item ? item.selected : false;
        });
      });
    });

    return Object.entries(categoriesMap)
      .filter(([_, cat]) => cat.items.length > 0)
      .map(([key, cat]) => ({
        key,
        ...cat,
      }));
  }, [detectedObjects]);

  const toggleSelectGroup = (itemIds: string[], currentSelected: boolean) => {
    setDetectedObjects((prev) =>
      prev.map((obj) => (itemIds.includes(obj.id) ? { ...obj, selected: !currentSelected } : obj))
    );
  };

  const handleGenerate3D = async () => {
    const selectedObjects = detectedObjects.filter(
      (object) => object.selected && object.category !== "room"
    );

    if (selectedObjects.length === 0) {
      toast.warning("Select at least one detected object before generating the 3D layout.");
      return;
    }

    setIsGenerating3D(true);

    try {
      const nextRoomDimensions = getRoomDimensionsFromAnalysis(analysisResult, roomDimensions);
      const sourceSize = getCoordinateSourceSize(
        selectedObjects,
        analysisResult,
        nextRoomDimensions
      );
      const assetResults = await Promise.all(
        selectedObjects.map(async (object) => {
          if (object.category === "opening") return undefined;

          try {
            const matches = await searchBedroomAssets(cleanSearchLabel(object), 1);
            return matches[0];
          } catch {
            return undefined;
          }
        })
      );

      const nodes: SceneNode[] = selectedObjects.map((object, index) => {
        const fallback = getFallbackSpec(object.name);
        const spec = fitSpecDimensionsToRoom(
          getAssetSpec(assetResults[index], fallback),
          nextRoomDimensions
        );
        const position = toScenePosition(object, spec, sourceSize, nextRoomDimensions, index);
        const rotation = toSceneRotation(object, position);

        return {
          id: `blueprint-${Date.now()}-${index}`,
          name: object.name,
          type: "model",
          assetId: spec.assetId,
          glbUrl: spec.glbUrl,
          placementType: spec.placementType,
          position,
          rotation,
          scale: spec.defaultScale || [1, 1, 1],
          dimensions: spec.dimensions,
          wallClearance: spec.wallClearance,
          color: spec.color,
          visible: true,
          locked: false,
        };
      });

      const groupNode: SceneNode = {
        id: `blueprint-layout-${Date.now()}`,
        name: "Generated Blueprint Layout",
        type: "group",
        visible: true,
        locked: false,
        expanded: true,
      };

      commitSceneHistory(() => {
        const store = useSceneStore.getState();
        store.setRoomDimensions(nextRoomDimensions);
        store.clearUserContent();
        store.addNode(groupNode, null);
        nodes.forEach((node) => store.addNode(node, groupNode.id));
        store.setSelectedIds(nodes.map((node) => node.id));
      });

      const unmatchedCount = assetResults.filter((asset, index) => {
        return selectedObjects[index].category !== "opening" && !asset;
      }).length;

      if (unmatchedCount > 0) {
        toast.info(`${unmatchedCount} objects used fallback boxes because no matching GLB was found.`);
      }

      setIsGenerated(true);
      setShowSuccessModal(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate the 3D blueprint layout.";
      toast.error(message);
    } finally {
      setIsGenerating3D(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            AI Blueprint Import
          </h2>
        </div>
      </div>
      <div className="flex flex-1 scrollbar-none flex-col overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/30">
            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-400">
              <Upload className="h-3.5 w-3.5 text-indigo-500" />
              <span>2D Technical Drawing</span>
            </div>
            <div className="pt-1">
              {!uploadedImage ? (
                <div
                  onClick={handleUploadClick}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white p-6 py-8 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-indigo-950/20"
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 transition-transform group-hover:scale-110">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Upload 2D Blueprint
                  </p>
                  <p className="mt-1 text-[9px] text-zinc-400 dark:text-zinc-500">
                    Supports PNG, JPG (Max 10MB)
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                    <img
                      src={uploadedImage}
                      alt="2D Blueprint Preview"
                      className="h-full w-full object-contain"
                    />
                    <Button
                      type="button"
                      size="icon-xs"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 h-5 w-5 rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
                      title="Remove Image"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSave2D}
                      className="flex h-8 items-center gap-1 rounded-lg border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save 2D Draw</span>
                    </Button>
                    <Button
                      onClick={handleProcessAI}
                      disabled={isProcessing}
                      className="flex h-8 items-center gap-1 rounded-lg bg-indigo-600 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      <span>{isProcessing ? "Processing..." : "Process AI"}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {detectedObjects.length > 0 && (
            <div className="animate-in fade-in flex flex-col gap-3 rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-3 duration-300 dark:border-zinc-800/60 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-400">
                  <Layers className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Detected Layout Elements</span>
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="h-auto rounded-md px-2 py-0.5 text-[9px] font-semibold"
                >
                  {showRawJson ? "Hide JSON" : "Raw JSON"}
                </Button>
              </div>
              {showRawJson && (
                <div className="animate-in fade-in slide-in-from-top-2 max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2.5 font-mono text-[9px] text-zinc-600 duration-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800/80 [&::-webkit-scrollbar-track]:bg-transparent">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(analysisResult, null, 2)}
                  </pre>
                </div>
              )}
              <div className="flex flex-col gap-4 pt-1">
                {groupedCategories.map((category) => (
                  <div key={category.key} className="flex flex-col gap-1.5">
                    <h3 className="px-1 text-[9px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                      {category.categoryName}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {category.items.map((group) => (
                        <div
                          key={group.key}
                          onClick={() => toggleSelectGroup(group.itemIds, group.selected)}
                          className={`flex cursor-pointer items-start justify-between rounded-lg border p-2 transition-all active:scale-[0.99] ${
                            group.selected
                              ? "border-indigo-500 bg-indigo-500/5 shadow-xs dark:bg-indigo-500/10"
                              : "border-black/5 bg-white hover:border-black/10 dark:border-white/5 dark:bg-zinc-950 dark:hover:border-white/10"
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-2">
                            <div
                              className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded transition-colors ${
                                group.selected
                                  ? "bg-indigo-500 text-white"
                                  : "border border-zinc-300 dark:border-zinc-700"
                              }`}
                            >
                              {group.selected && <span className="text-[9px] font-bold">✓</span>}
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span
                                className={`truncate text-[11px] font-semibold transition-colors ${
                                  group.selected
                                    ? "text-zinc-950 dark:text-zinc-50"
                                    : "text-zinc-600 dark:text-zinc-400"
                                }`}
                              >
                                {group.name}
                              </span>
                              {group.details && (
                                <span className="mt-0.5 truncate font-mono text-[9px] leading-none text-zinc-400 dark:text-zinc-500">
                                  {group.details}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-2 flex shrink-0 items-center">
                            <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                              {group.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleGenerate3D}
                disabled={isGenerating3D}
                className="mt-1 h-9 w-full rounded-lg bg-indigo-600 font-semibold text-white shadow-md transition-all hover:bg-indigo-700 active:scale-95"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                <span>{isGenerating3D ? "Generating..." : "Generate 3D Bedroom Layout"}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="border-zinc-200/80 bg-white/95 backdrop-blur-md sm:max-w-md dark:border-zinc-800/80 dark:bg-zinc-950/95">
          <DialogHeader className="flex flex-col items-center gap-2.5 text-center">
            <div className="flex h-12 w-12 animate-bounce items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Import Successful!
            </DialogTitle>
            <DialogDescription className="max-w-70 text-[10px] text-zinc-500 dark:text-zinc-400">
              Your 3D bedroom layout is ready.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 border-t border-zinc-100 dark:border-zinc-900" />
          <DialogFooter className="flex w-full items-center justify-center sm:justify-center">
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="h-8 rounded-lg bg-emerald-600 px-6 text-xs font-semibold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-95"
            >
              Start Customizing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { BlueprintPanel };
