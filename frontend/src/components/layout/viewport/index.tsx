import { Canvas } from "@react-three/fiber";
import {
  Cuboid,
  DoorOpen,
  Grid3X3,
  Home,
  Move,
  PenTool,
  Rotate3D,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { CameraRig } from "@/components/layout/viewport/3d/camera";
import { Room3D } from "@/components/layout/viewport/3d/room-3d";
import { useSceneStore } from "@/store/use-scene-store";
import type { ViewportProps } from "@/types";

function Viewport({ viewMode, setViewMode }: ViewportProps) {
  const dragNodeId = useSceneStore((state) => state.dragNodeId);
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
      <div className="absolute top-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-zinc-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <button
          onClick={() => setViewMode("3d")}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            viewMode === "3d"
              ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <Cuboid className="h-4 w-4" />
          <span>3D View</span>
        </button>
        <button
          onClick={() => setViewMode("2d")}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            viewMode === "2d"
              ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500 dark:text-white"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <Grid3X3 className="h-4 w-4" />
          <span>2D Plan</span>
        </button>
      </div>
      {!!dragNodeId && (
        <div className="animate-in fade-in slide-in-from-top-4 absolute top-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50/90 px-4 py-2 text-xs font-medium text-indigo-700 shadow-md backdrop-blur-md dark:border-indigo-500/30 dark:bg-indigo-950/90 dark:text-indigo-300">
          <svg
            className="h-4 w-4 animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
          </svg>
          <span>
            Drag to place, press{" "}
            <kbd className="mx-1 rounded border border-indigo-200 bg-white/50 px-1.5 py-0.5 font-sans font-bold dark:border-indigo-700 dark:bg-black/20">
              Esc
            </kbd>{" "}
            or <span className="font-bold">Right-Click</span> to cancel
          </span>
        </div>
      )}
      {viewMode === "3d" ? (
        <div className="absolute inset-0">
          <Canvas shadows>
            <CameraRig />
            <ambientLight intensity={1.2} />
            <hemisphereLight intensity={0.8} color="#ffffff" groundColor="#eeddbb" />
            <directionalLight
              position={[5, 12, 5]}
              intensity={2.0}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <directionalLight position={[-5, 8, -5]} intensity={1.0} />
            <Room3D />
          </Canvas>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
            2D Blueprint Mode
          </h1>
        </div>
      )}
      {viewMode === "2d" && (
        <>
          <div className="animate-in fade-in slide-in-from-top-4 absolute top-6 right-6 z-20 flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm duration-300 dark:border-zinc-800 dark:bg-zinc-950">
            <button
              className="flex items-center justify-center rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-colors dark:bg-indigo-500/20 dark:text-indigo-400"
              title="Draw Wall"
            >
              <PenTool className="h-4 w-4" />
            </button>
            <button
              className="flex items-center justify-center rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              title="Add Door"
            >
              <DoorOpen className="h-4 w-4" />
            </button>
            <div className="my-1 h-px w-full bg-zinc-200 dark:bg-zinc-800"></div>
            <button
              className="flex items-center justify-center rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
      <div className="animate-in fade-in slide-in-from-bottom-4 absolute right-6 bottom-6 z-20 flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/90 p-1.5 shadow-sm backdrop-blur-md duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <button
          className="flex items-center justify-center rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          title={viewMode === "2d" ? "Pan" : "Orbit"}
        >
          {viewMode === "2d" ? <Move className="h-4 w-4" /> : <Rotate3D className="h-4 w-4" />}
        </button>
        <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
        <button
          onClick={handleZoomOut}
          className="flex items-center justify-center rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomIn}
          className="flex items-center justify-center rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
        <button
          onClick={handleHome}
          className="flex items-center justify-center rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          title="Home View"
        >
          <Home className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}

export { Viewport };
