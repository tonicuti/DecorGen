import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PlanGrid2D } from "@/components/layout/viewport/2d/plan-grid-2d";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Room2D } from "@/components/layout/viewport/2d/room-2d";
import { SceneNode2D } from "@/components/layout/viewport/2d/scene-node-2d";
import { buildLegendItems, buildLegendMap } from "@/lib/plan-legend";
import { useSceneStore } from "@/store/use-scene-store";

export const PIXELS_PER_METER = 100;

function Plan2D() {
  const tree = useSceneStore((state) => state.tree);
  const roomDimensions = useSceneStore((state) => state.roomDimensions);
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const setSelectedIds = useSceneStore((state) => state.setSelectedIds);
  const gridOverlay = useSceneStore((state) => state.sceneSettings.gridOverlay);

  const legendItems = useMemo(() => buildLegendItems(tree), [tree]);
  const legendMap = useMemo(() => buildLegendMap(tree), [tree]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setTransform({
        x: clientWidth / 2,
        y: clientHeight / 2,
        scale: 1,
      });
    }
  }, []);

  useEffect(() => {
    const handleZoom = (e: Event) => {
      const customEvent = e as CustomEvent;
      const direction = customEvent.detail;
      setTransform((prev) => ({
        ...prev,
        scale: Math.max(0.1, Math.min(5, prev.scale + direction * 0.2)),
      }));
    };

    const handleHome = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setTransform({
          x: clientWidth / 2,
          y: clientHeight / 2,
          scale: 1,
        });
      }
    };

    window.addEventListener("camera-zoom", handleZoom);
    window.addEventListener("camera-home", handleHome);

    return () => {
      window.removeEventListener("camera-zoom", handleZoom);
      window.removeEventListener("camera-home", handleHome);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    setTransform((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));

    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const dx = Math.abs(e.clientX - lastPos.current.x);
    const dy = Math.abs(e.clientY - lastPos.current.y);

    if (dx < 5 && dy < 5) {
      const target = e.target as Element;

      if (
        target === containerRef.current ||
        target.tagName === "svg" ||
        (target.tagName === "rect" && target.parentElement?.tagName === "svg")
      ) {
        setSelectedIds([]);
      }
    }
  };

  const handlePointerLeave = (_: React.PointerEvent) => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.05;
    const direction = e.deltaY < 0 ? 1 : -1;

    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale + direction * zoomFactor)),
    }));
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-grab overflow-hidden bg-zinc-100 active:cursor-grabbing dark:bg-zinc-950"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onWheel={handleWheel}
    >
      <svg className="h-full w-full" style={{ touchAction: "none" }}>
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          <Room2D dimensions={roomDimensions} />
          {gridOverlay && <PlanGrid2D dimensions={roomDimensions} />}
          {tree.map((node) => (
            <SceneNode2D key={node.id} node={node} legendMap={legendMap} />
          ))}
        </g>
      </svg>
      <Card className="pointer-events-auto absolute top-6 right-6 z-20 max-h-[80vh] w-64 gap-3 border-zinc-200/80 bg-white/90 py-4 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Legend</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <ScrollArea className="max-h-[calc(80vh-4rem)] pr-2">
            <div className="flex flex-col gap-3">
          {legendItems.map((item, index) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`group -mx-2 flex cursor-pointer items-start gap-3 rounded-lg p-2 text-xs transition-colors ${
                  isSelected
                    ? "bg-indigo-50/80 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:ring-indigo-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                }`}
                onClick={() => setSelectedIds([item.id])}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-medium ${
                    isSelected
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span
                    className={`leading-tight font-medium ${
                      isSelected
                        ? "text-indigo-900 dark:text-indigo-100"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {item.name}
                  </span>
                  <span
                    className={`font-mono ${
                      isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500"
                    }`}
                  >
                    {item.dimensions?.w.toFixed(2)}W &times; {item.dimensions?.d.toFixed(2)}D
                    &times; {item.dimensions?.h.toFixed(2)}H
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className={`shrink-0 transition-opacity ${
                    isSelected
                      ? "text-indigo-600 opacity-100 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-800/50"
                      : "text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIds([item.id]);
                    window.dispatchEvent(new CustomEvent("open-inspector"));
                  }}
                  title="View in Inspector"
                >
                  <MoreHorizontal size={14} />
                </Button>
              </div>
            );
          })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export { Plan2D };
