import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PlanGrid2D } from "@/components/layout/viewport/2d/plan-grid-2d";
import { Room2D } from "@/components/layout/viewport/2d/room-2d";
import { SceneNode2D } from "@/components/layout/viewport/2d/scene-node-2d";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildLegendItems, buildLegendMap } from "@/lib/plan-legend";
import { useSceneStore } from "@/store/use-scene-store";
import type { SceneNode } from "@/types";

export const PIXELS_PER_METER = 100;

function formatLegendDimensions(item: SceneNode): string {
  const w = item.dimensions?.w ?? 0;
  const d = item.dimensions?.d ?? 0;
  const h = item.dimensions?.h ?? 0;
  return `${w.toFixed(2)}W x ${d.toFixed(2)}D x ${h.toFixed(2)}H`;
}

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
      <aside className="pointer-events-auto absolute top-6 right-6 z-20 flex w-[min(100vw-3rem,17.5rem)] max-h-[80vh] flex-col rounded-2xl border border-zinc-800/90 bg-zinc-950/95 shadow-2xl shadow-black/40 backdrop-blur-md">
        <h2 className="shrink-0 px-4 pt-4 pb-2 text-sm font-semibold tracking-tight text-white">
          Legend
        </h2>
        <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
          <ul className="flex flex-col gap-1.5 px-1">
            {legendItems.map((item, index) => {
              const isSelected = selectedIds.includes(item.id);
              const number = index + 1;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([item.id])}
                    className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "border border-indigo-500/55 bg-indigo-500/[0.12]"
                        : "border border-transparent hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isSelected
                          ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                          : "bg-indigo-950 text-indigo-300 ring-1 ring-indigo-900/80"
                      }`}
                    >
                      {number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs leading-snug font-semibold text-white">
                        {item.name}
                      </span>
                      <span
                        className={`mt-0.5 block font-mono text-[11px] leading-tight ${
                          isSelected ? "text-indigo-400" : "text-zinc-500"
                        }`}
                      >
                        {formatLegendDimensions(item)}
                      </span>
                    </span>
                    {isSelected && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-indigo-300 hover:bg-indigo-500/20 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIds([item.id]);
                          window.dispatchEvent(new CustomEvent("open-inspector"));
                        }}
                        title="View in Inspector"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </aside>
    </div>
  );
}

export { Plan2D };
