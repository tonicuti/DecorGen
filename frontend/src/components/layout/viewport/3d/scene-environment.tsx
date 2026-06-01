import { useEnvironment } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Texture } from "three";
import {
  ENVIRONMENT_INTENSITY,
  ENVIRONMENT_PRESETS,
  ENV_TRANSITION_SEC,
} from "@/api/mock-data";
import { useSceneStore } from "@/store/use-scene-store";

type DreiEnvPreset =
  | "apartment"
  | "city"
  | "dawn"
  | "forest"
  | "lobby"
  | "night"
  | "park"
  | "studio"
  | "sunset"
  | "warehouse";

function getPresetIntensity(environmentId: string): number {
  const config = ENVIRONMENT_PRESETS.find((p) => p.id === environmentId);
  return config?.intensity ?? ENVIRONMENT_INTENSITY;
}

function SceneEnvironment() {
  const environmentId = useSceneStore((s) => s.sceneSettings.environmentId);
  const config = ENVIRONMENT_PRESETS.find((p) => p.id === environmentId);
  const targetPreset = (config?.dreiPreset ?? "studio") as DreiEnvPreset;
  const targetIntensity = getPresetIntensity(environmentId);

  const scene = useThree((state) => state.scene);
  const [activePreset, setActivePreset] = useState<DreiEnvPreset>(targetPreset);
  const targetRef = useRef(targetPreset);
  const targetIntensityRef = useRef(targetIntensity);
  const intensityRef = useRef(targetIntensity);
  const phaseRef = useRef<"idle" | "fadeOut" | "fadeIn">("idle");
  const prevTextureRef = useRef<Texture | null>(null);

  const texture = useEnvironment({ preset: activePreset });

  useEffect(() => {
    for (const preset of ENVIRONMENT_PRESETS) {
      if (preset.dreiPreset) {
        useEnvironment.preload({ preset: preset.dreiPreset as DreiEnvPreset });
      }
    }
  }, []);

  useEffect(() => {
    targetRef.current = targetPreset;
    targetIntensityRef.current = targetIntensity;

    if (targetPreset === activePreset && phaseRef.current === "idle") {
      intensityRef.current = targetIntensity;
      scene.environmentIntensity = targetIntensity;
      return;
    }

    phaseRef.current = "fadeOut";
  }, [targetPreset, targetIntensity, activePreset, scene]);

  useLayoutEffect(() => {
    if (!texture) return;

    if (prevTextureRef.current && prevTextureRef.current !== texture) {
      prevTextureRef.current.dispose();
    }
    prevTextureRef.current = texture;

    scene.environment = texture;
    scene.environmentIntensity = intensityRef.current;
  }, [texture, scene]);

  useFrame((_, delta) => {
    const half = ENV_TRANSITION_SEC / 2;
    const goal = targetIntensityRef.current;

    if (phaseRef.current === "fadeOut") {
      intensityRef.current = Math.max(0, intensityRef.current - delta / half);
      scene.environmentIntensity = intensityRef.current;

      if (intensityRef.current <= 0.001) {
        intensityRef.current = 0;
        scene.environmentIntensity = 0;
        setActivePreset(targetRef.current);
        phaseRef.current = "fadeIn";
      }
      return;
    }

    if (phaseRef.current === "fadeIn") {
      intensityRef.current = Math.min(
        goal,
        intensityRef.current + (delta / half) * goal
      );
      scene.environmentIntensity = intensityRef.current;

      if (intensityRef.current >= goal - 0.001) {
        intensityRef.current = goal;
        scene.environmentIntensity = goal;
        phaseRef.current = "idle";
      }
    }
  });

  useEffect(() => {
    return () => {
      prevTextureRef.current?.dispose();
      prevTextureRef.current = null;
    };
  }, []);

  return null;
}

export { SceneEnvironment };
