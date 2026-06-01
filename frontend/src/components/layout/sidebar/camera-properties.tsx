import { Camera } from "lucide-react";
import { CollapsiblePanel } from "@/components/layout/sidebar/collapsible-panel";
import { Slider } from "@/components/ui/slider";
import { useSceneSliderHistory } from "@/hooks/use-scene-slider-history";
import { useSceneStore } from "@/store/use-scene-store";

function CameraProperties() {
  const sliderHistory = useSceneSliderHistory();
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const tree = useSceneStore((s) => s.tree);
  const sceneSettings = useSceneStore((s) => s.sceneSettings);
  const setSceneSettings = useSceneStore((s) => s.setSceneSettings);
  const updateNode = useSceneStore((s) => s.updateNode);

  const selectedId = selectedIds[0];
  const cameraNode = tree.find((n) => n.id === selectedId && n.type === "camera");

  if (!cameraNode) return null;

  const fov = sceneSettings.cameraFov;

  return (
    <CollapsiblePanel title="Camera" icon={<Camera className="h-4 w-4 text-amber-500" />} defaultOpen>
      <div className="flex flex-col gap-3 px-1 pb-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{cameraNode.name}</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Field of View</span>
            <span className="font-mono text-xs text-zinc-500">{fov}°</span>
          </div>
          <Slider
            value={[fov]}
            min={30}
            max={90}
            step={1}
            disabled={cameraNode.locked}
            onPointerDown={sliderHistory.onSlideStart}
            onValueChange={([value]) => {
              sliderHistory.onSlideStart();
              setSceneSettings({ cameraFov: value });
              updateNode(cameraNode.id, { fov: value });
            }}
            onValueCommit={sliderHistory.onSlideCommit}
            onPointerCancel={sliderHistory.onSlideCancel}
          />
        </div>
        {cameraNode.locked && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400">Camera is locked.</p>
        )}
      </div>
    </CollapsiblePanel>
  );
}

export { CameraProperties };
