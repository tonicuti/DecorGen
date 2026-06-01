import { Sun } from "lucide-react";
import { CollapsiblePanel } from "@/components/layout/sidebar/collapsible-panel";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useSceneSliderHistory } from "@/hooks/use-scene-slider-history";
import { useSceneStore } from "@/store/use-scene-store";
import type { SceneNode } from "@/types";

function findNode(nodes: SceneNode[], id: string): SceneNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function LightProperties() {
  const sliderHistory = useSceneSliderHistory();
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const tree = useSceneStore((s) => s.tree);
  const updateNode = useSceneStore((s) => s.updateNode);

  const selectedId = selectedIds[0];
  const lightNode = selectedId ? findNode(tree, selectedId) : null;

  if (!lightNode || lightNode.type !== "light") return null;

  const intensity = lightNode.intensity ?? 1;
  const isDirectional = lightNode.lightKind === "directional";

  return (
    <CollapsiblePanel title="Light" icon={<Sun className="h-4 w-4 text-yellow-500" />} defaultOpen>
      <div className="flex flex-col gap-3 px-1 pb-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{lightNode.name}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Visible</span>
          <Switch
            checked={lightNode.visible}
            disabled={lightNode.locked}
            onCheckedChange={(checked) => updateNode(lightNode.id, { visible: checked })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Intensity</span>
            <span className="font-mono text-xs text-zinc-500">{intensity.toFixed(1)}</span>
          </div>
          <Slider
            value={[intensity]}
            min={0}
            max={5}
            step={0.1}
            disabled={lightNode.locked}
            onPointerDown={sliderHistory.onSlideStart}
            onValueChange={([value]) => {
              sliderHistory.onSlideStart();
              updateNode(lightNode.id, { intensity: value });
            }}
            onValueCommit={sliderHistory.onSlideCommit}
            onPointerCancel={sliderHistory.onSlideCancel}
          />
        </div>
        {isDirectional && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Cast Shadow</span>
            <Switch
              checked={lightNode.castShadow ?? true}
              disabled={lightNode.locked}
              onCheckedChange={(checked) => updateNode(lightNode.id, { castShadow: checked })}
            />
          </div>
        )}
        {lightNode.locked && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400">Light is locked.</p>
        )}
      </div>
    </CollapsiblePanel>
  );
}

export { LightProperties };
