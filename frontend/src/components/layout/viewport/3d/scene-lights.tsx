import { useSceneStore } from "@/store/use-scene-store";
import type { SceneNode } from "@/types";

const DEFAULT_AMBIENT_INTENSITY = 0.65;
const DEFAULT_DIRECTIONAL_INTENSITY = 1.35;
/** With HDRI on, direct lights are scaled down to avoid blow-out (esp. studio). */
const REALISTIC_DIRECT_LIGHT_SCALE = 0.5;

function findLights(nodes: SceneNode[]): SceneNode[] {
  const lights: SceneNode[] = [];
  for (const node of nodes) {
    if (node.type === "light") lights.push(node);
    if (node.children) lights.push(...findLights(node.children));
  }
  return lights;
}

function SceneLights() {
  const tree = useSceneStore((s) => s.tree);
  const realisticLighting = useSceneStore((s) => s.sceneSettings.realisticLighting);
  const softShadows = useSceneStore((s) => s.sceneSettings.softShadows);
  const lightNodes = findLights(tree);

  if (!realisticLighting) {
    const ambient = lightNodes.find((n) => n.lightKind === "ambient");
    const directional = lightNodes.find((n) => n.lightKind === "directional");
    return (
      <>
        {(!ambient || ambient.visible) && (
          <ambientLight intensity={ambient?.intensity ?? DEFAULT_AMBIENT_INTENSITY} />
        )}
        {(!directional || directional.visible) && (
          <directionalLight
            position={directional?.position ?? [5, 12, 5]}
            intensity={directional?.intensity ?? DEFAULT_DIRECTIONAL_INTENSITY}
            castShadow={softShadows && (directional?.castShadow ?? true)}
            shadow-mapSize={softShadows ? [2048, 2048] : [512, 512]}
          />
        )}
      </>
    );
  }

  const scaleIntensity = (value: number) =>
    realisticLighting ? value * REALISTIC_DIRECT_LIGHT_SCALE : value;

  return (
    <>
      {lightNodes.map((node) => {
        if (!node.visible) return null;
        const intensity = scaleIntensity(node.intensity ?? 1);
        if (node.lightKind === "ambient") {
          return <ambientLight key={node.id} intensity={intensity} />;
        }
        if (node.lightKind === "hemisphere") {
          return (
            <hemisphereLight
              key={node.id}
              intensity={intensity}
              color="#ffffff"
              groundColor="#eeddbb"
            />
          );
        }
        return (
          <directionalLight
            key={node.id}
            position={node.position ?? [5, 12, 5]}
            intensity={intensity}
            castShadow={softShadows && (node.castShadow ?? false)}
            shadow-mapSize={softShadows ? [2048, 2048] : [512, 512]}
          />
        );
      })}
      {realisticLighting && lightNodes.length === 0 && (
        <>
          <ambientLight intensity={scaleIntensity(DEFAULT_AMBIENT_INTENSITY)} />
          <directionalLight
            position={[5, 12, 5]}
            intensity={scaleIntensity(DEFAULT_DIRECTIONAL_INTENSITY)}
            castShadow={softShadows}
          />
        </>
      )}
    </>
  );
}

export { SceneLights };
