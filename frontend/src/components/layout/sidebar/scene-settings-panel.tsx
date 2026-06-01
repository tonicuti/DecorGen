import { Camera, Eye, Grid, Settings, Sun } from "lucide-react";
import { ENVIRONMENT_PRESETS } from "@/api/mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useSceneSliderHistory } from "@/hooks/use-scene-slider-history";
import { useSceneStore } from "@/store/use-scene-store";

function SceneSettingsPanel() {
  const sliderHistory = useSceneSliderHistory();
  const environmentId = useSceneStore((s) => s.sceneSettings.environmentId);
  const gridOverlay = useSceneStore((s) => s.sceneSettings.gridOverlay);
  const realisticLighting = useSceneStore((s) => s.sceneSettings.realisticLighting);
  const softShadows = useSceneStore((s) => s.sceneSettings.softShadows);
  const cameraFov = useSceneStore((s) => s.sceneSettings.cameraFov);
  const setSceneSettings = useSceneStore((s) => s.setSceneSettings);
  const updateNode = useSceneStore((s) => s.updateNode);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Scene Settings</h2>
        </div>
      </div>
      <div className="flex scrollbar-none flex-col gap-4 overflow-y-auto p-4 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
            Environment Lighting
          </label>
          <Select
            value={environmentId}
            onValueChange={(value) => setSceneSettings({ environmentId: value })}
          >
            <SelectTrigger className="h-8 w-full border-zinc-200 bg-zinc-50/50 text-xs font-medium text-zinc-900 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={4}
              className="max-h-56 overflow-y-auto border-zinc-200 bg-white **:data-radix-select-viewport:h-auto! **:data-[slot=select-scroll-down-button]:hidden **:data-[slot=select-scroll-up-button]:hidden dark:border-zinc-800 dark:bg-zinc-950 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800/80 [&::-webkit-scrollbar-track]:bg-transparent"
            >
              {ENVIRONMENT_PRESETS.map((env) => (
                <SelectItem
                  key={env.id}
                  value={env.id}
                  className="text-xs font-medium text-zinc-800 dark:text-zinc-200"
                >
                  {env.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Grid Overlay
              </span>
            </div>
            <Switch
              checked={gridOverlay}
              onCheckedChange={(checked) => setSceneSettings({ gridOverlay: checked })}
              aria-label="Toggle grid overlay on 2D plan"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Realistic Lighting
              </span>
            </div>
            <Switch
              checked={realisticLighting}
              onCheckedChange={(checked) => setSceneSettings({ realisticLighting: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Soft Shadows
              </span>
            </div>
            <Switch
              checked={softShadows}
              onCheckedChange={(checked) => setSceneSettings({ softShadows: checked })}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Camera FOV
              </span>
            </div>
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{cameraFov}°</span>
          </div>
          <Slider
            value={[cameraFov]}
            min={30}
            max={90}
            step={1}
            onPointerDown={sliderHistory.onSlideStart}
            onValueChange={([value]) => {
              sliderHistory.onSlideStart();
              setSceneSettings({ cameraFov: value });
              updateNode("cam-1", { fov: value });
            }}
            onValueCommit={sliderHistory.onSlideCommit}
            onPointerCancel={sliderHistory.onSlideCancel}
          />
        </div>
      </div>
    </div>
  );
}

export { SceneSettingsPanel };
