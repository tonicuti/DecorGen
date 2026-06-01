import { Home, LayoutGrid, Paintbrush, RefreshCw, Ruler, Sparkles } from "lucide-react";
import { FLOOR_COLORS, WALL_COLORS } from "@/api/mock-data";
import { CollapsiblePanel } from "@/components/layout/sidebar/collapsible-panel";
import { CustomNumberInput } from "@/components/layout/sidebar/number-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSceneStore } from "@/store/use-scene-store";

function RoomProperties() {
  const { width, length, height, thickness } = useSceneStore((state) => state.roomDimensions);
  const { wallColor, floorColor } = useSceneStore((state) => state.roomMaterials);
  const setRoomDimensions = useSceneStore((state) => state.setRoomDimensions);
  const setRoomMaterials = useSceneStore((state) => state.setRoomMaterials);

  const handleReset = () => {
    setRoomDimensions({ width: 4.0, length: 3.5, height: 2.8, thickness: 15 });
    setRoomMaterials({ wallColor: WALL_COLORS[0].value, floorColor: FLOOR_COLORS[0].value });
  };

  return (
    <CollapsiblePanel
      title="Room Properties"
      icon={<Home className="h-4 w-4 text-emerald-500" />}
      titleColor="text-emerald-600 dark:text-emerald-500"
      defaultOpen={false}
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-6 gap-1 rounded-md px-2 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reset</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/30">
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-400">
            <Ruler className="h-3.5 w-3.5 text-indigo-500" />
            <span>Room Dimensions (m)</span>
          </div>
          <div className="mx-auto flex max-w-50 flex-col gap-2 pt-1">
            <CustomNumberInput
              label="W"
              value={width}
              step={0.1}
              min={1}
              max={20}
              onChange={(val) => setRoomDimensions({ width: val })}
              badgeColor="bg-indigo-500 text-white dark:bg-indigo-600"
            />
            <CustomNumberInput
              label="L"
              value={length}
              step={0.1}
              min={1}
              max={20}
              onChange={(val) => setRoomDimensions({ length: val })}
              badgeColor="bg-indigo-500 text-white dark:bg-indigo-600"
            />
            <CustomNumberInput
              label="H"
              value={height}
              step={0.1}
              min={1}
              max={10}
              onChange={(val) => setRoomDimensions({ height: val })}
              badgeColor="bg-indigo-500 text-white dark:bg-indigo-600"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/30">
          <div className="flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400">
            <Paintbrush className="h-3.5 w-3.5 text-teal-500" />
            <span>Wall Settings</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              Wall Thickness (cm)
            </span>
            <div className="mx-auto w-full max-w-50">
              <CustomNumberInput
                label="T"
                value={thickness}
                step={1}
                min={5}
                max={50}
                onChange={(val) => setRoomDimensions({ thickness: val })}
                badgeColor="bg-teal-500 text-white dark:bg-teal-600"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-zinc-200/40 pt-2 dark:border-zinc-800/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                Wall Color
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] text-zinc-400 uppercase dark:text-zinc-500">
                  Hex
                </span>
                <Input
                  value={wallColor}
                  onChange={(e) => setRoomMaterials({ wallColor: e.target.value })}
                  className="h-6 w-20 border-zinc-200 bg-white px-2 py-0 font-mono text-[10px] text-zinc-900 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {WALL_COLORS.map((swatch) => (
                <Button
                  key={swatch.name}
                  type="button"
                  variant="outline"
                  onClick={() => setRoomMaterials({ wallColor: swatch.value })}
                  className={`relative h-7 w-full overflow-hidden p-0 shadow-2xs transition-all active:scale-95 ${
                    wallColor.toLowerCase() === swatch.value.toLowerCase()
                      ? "border-teal-500 ring-2 ring-teal-500/30 dark:ring-teal-500/40"
                      : "border-black/10 hover:scale-105 dark:border-white/10"
                  }`}
                  title={swatch.name}
                >
                  <div
                    className="absolute inset-0 h-full w-full"
                    style={{ backgroundColor: swatch.value }}
                  />
                  {wallColor.toLowerCase() === swatch.value.toLowerCase() && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/30">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-500">
            <LayoutGrid className="h-3.5 w-3.5 text-amber-600" />
            <span>Floor Settings</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                Floor Color
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] text-zinc-400 uppercase dark:text-zinc-500">
                  Hex
                </span>
                <Input
                  value={floorColor}
                  onChange={(e) => setRoomMaterials({ floorColor: e.target.value })}
                  className="h-6 w-20 border-zinc-200 bg-white px-2 py-0 font-mono text-[10px] text-zinc-900 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {FLOOR_COLORS.map((swatch) => (
                <Button
                  key={swatch.name}
                  type="button"
                  variant="outline"
                  onClick={() => setRoomMaterials({ floorColor: swatch.value })}
                  className={`relative h-7 w-full overflow-hidden p-0 shadow-2xs transition-all active:scale-95 ${
                    floorColor.toLowerCase() === swatch.value.toLowerCase()
                      ? "border-amber-600 ring-2 ring-amber-600/30 dark:ring-amber-600/40"
                      : "border-black/10 hover:scale-105 dark:border-white/10"
                  }`}
                  title={swatch.name}
                >
                  <div
                    className="absolute inset-0 h-full w-full"
                    style={{ backgroundColor: swatch.value }}
                  />
                  {floorColor.toLowerCase() === swatch.value.toLowerCase() && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CollapsiblePanel>
  );
}

export { RoomProperties };
