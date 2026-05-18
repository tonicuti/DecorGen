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
import type { ViewportProps } from "@/types";

function Viewport({ viewMode, setViewMode }: ViewportProps) {
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
      {viewMode === "3d" ? (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-500/10 text-zinc-500 dark:bg-zinc-500/20">
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
              className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
            3D Canvas Viewport
          </h1>
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
          className="flex items-center justify-center rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          className="flex items-center justify-center rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
        <button
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
