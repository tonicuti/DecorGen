import { CheckCircle2, Layers, Save, Sparkles, Upload, Wand2 } from "lucide-react";
import * as React from "react";
import { DETECTED_RAW_JSON, SAMPLE_DETECTED_OBJECTS } from "@/api/mock-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DetectedObject } from "@/types";

function BlueprintPanel() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [detectedObjects, setDetectedObjects] = React.useState<DetectedObject[]>([]);
  const [_, setIsGenerated] = React.useState(false);
  const [showRawJson, setShowRawJson] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setDetectedObjects([]);
        setIsGenerated(false);
        setShowRawJson(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessAI = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setDetectedObjects(SAMPLE_DETECTED_OBJECTS);
    }, 1800);
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

  const handleGenerate3D = () => {
    setIsGenerated(true);
    setShowSuccessModal(true);
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
                      onClick={() => setUploadedImage(null)}
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
                    {JSON.stringify(DETECTED_RAW_JSON, null, 2)}
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
                className="mt-1 h-9 w-full rounded-lg bg-indigo-600 font-semibold text-white shadow-md transition-all hover:bg-indigo-700 active:scale-95"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                <span>Generate 3D Bedroom Layout</span>
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
