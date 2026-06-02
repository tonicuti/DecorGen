import { Canvas } from "@react-three/fiber";
import { ArrowUp, Cuboid, Grid3X3, Home, Move, Rotate3D, ZoomIn, ZoomOut } from "lucide-react";
import { Plan2D } from "@/components/layout/viewport/2d/plan-2d";
import { CameraRig } from "@/components/layout/viewport/3d/camera";
import { ViewportAxisGizmo } from "@/components/layout/viewport/3d/viewport-axis-gizmo";
import { FloorGrid3D } from "@/components/layout/viewport/3d/floor-grid-3d";
import { Room3D } from "@/components/layout/viewport/3d/room-3d";
import { SceneEnvironment } from "@/components/layout/viewport/3d/scene-environment";
import { SceneLights } from "@/components/layout/viewport/3d/scene-lights";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSceneStore } from "@/store/use-scene-store";
import type { ViewportProps } from "@/types";

const viewportToolBtnClass =
  "h-8 w-8 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50";

function Viewport({ viewMode, setViewMode }: ViewportProps) {
  const dragNodeId = useSceneStore((state) => state.dragNodeId);
  const softShadows = useSceneStore((state) => state.sceneSettings.softShadows);
  const handleZoomIn = () => window.dispatchEvent(new CustomEvent("camera-zoom", { detail: 1 }));
  const handleZoomOut = () => window.dispatchEvent(new CustomEvent("camera-zoom", { detail: -1 }));
  const handleHome = () => window.dispatchEvent(new CustomEvent("camera-home"));

  return (
    <main
      className={`absolute top-14 right-0 bottom-0 left-0 z-10 flex items-center justify-center transition-all duration-500 ease-in-out ${
        viewMode === "2d"
          ? "bg-indigo-50/50 dark:bg-indigo-950/20"
          : "bg-zinc-50 dark:bg-zinc-900/50"
      }`}
    >
      <Tabs
        value={viewMode}
        onValueChange={(value) => setViewMode(value as "2d" | "3d")}
        className="absolute top-6 left-1/2 z-20 -translate-x-1/2 gap-0"
      >
        <TabsList className="h-auto gap-1 rounded-full border border-zinc-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
          <TabsTrigger
            value="3d"
            className="gap-2 rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900"
          >
            <Cuboid className="h-4 w-4" />
            <span>3D View</span>
          </TabsTrigger>
          <TabsTrigger
            value="2d"
            className="gap-2 rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-indigo-500"
          >
            <Grid3X3 className="h-4 w-4" />
            <span>2D Plan</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {!!dragNodeId && (
        <div
          role="status"
          className="animate-in fade-in slide-in-from-top-4 absolute top-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-indigo-500/40 bg-indigo-950/95 px-4 py-2 text-xs font-medium text-indigo-100 shadow-lg backdrop-blur-sm"
        >
          <ArrowUp className="h-3.5 w-3.5 shrink-0 text-indigo-300" />
          <span>
            Drag to place, press{" "}
            <kbd className="mx-0.5 rounded border border-indigo-400/60 bg-indigo-900 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-white">
              Esc
            </kbd>{" "}
            or <span className="font-semibold text-white">Right-Click</span> to cancel
          </span>
        </div>
      )}
      {viewMode === "3d" ? (
        <div className="absolute inset-0">
          <Canvas shadows={softShadows}>
            <CameraRig />
            <SceneLights />
            <SceneEnvironment />
            <FloorGrid3D />
            <Room3D />
          </Canvas>
        </div>
      ) : (
        <Plan2D />
      )}
      {viewMode === "3d" && <ViewportAxisGizmo />}
      <div className="animate-in fade-in slide-in-from-bottom-4 absolute right-6 bottom-6 z-20 flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/90 p-1.5 shadow-sm backdrop-blur-md duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={viewportToolBtnClass}
          title={viewMode === "2d" ? "Pan" : "Orbit"}
        >
          {viewMode === "2d" ? <Move className="h-4 w-4" /> : <Rotate3D className="h-4 w-4" />}
        </Button>
        <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={viewportToolBtnClass}
          title="Zoom Out"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={viewportToolBtnClass}
          title="Zoom In"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={viewportToolBtnClass}
          title="Home View"
          onClick={handleHome}
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}

export { Viewport };

