import { SlidersHorizontal } from "lucide-react";
import { CameraProperties } from "@/components/layout/sidebar/camera-properties";
import { LightProperties } from "@/components/layout/sidebar/light-properties";
import { ObjectProperties } from "@/components/layout/sidebar/object-properties";
import { RoomProperties } from "@/components/layout/sidebar/room-properties";

function InspectorPanel() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Inspector</h2>
        </div>
      </div>
      <div className="flex-1 scrollbar-none divide-y divide-zinc-100 overflow-y-auto [-ms-overflow-style:none] dark:divide-zinc-800/60 [&::-webkit-scrollbar]:hidden">
        <RoomProperties />
        <CameraProperties />
        <LightProperties />
        <ObjectProperties />
      </div>
    </div>
  );
}

export { InspectorPanel };
