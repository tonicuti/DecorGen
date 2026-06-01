import { saveAs } from "file-saver";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useSceneStore } from "@/store/use-scene-store";
import type { SceneNode } from "@/types";

const flattenModels = (nodes: SceneNode[]): SceneNode[] => {
  const result: SceneNode[] = [];
  for (const node of nodes) {
    if (node.type === "model") result.push(node);
    if (node.children) result.push(...flattenModels(node.children));
  }
  return result;
};

function loadGlb(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (err) => reject(err)
    );
  });
}

function addPlaceholderMesh(group: THREE.Group, node: SceneNode) {
  const w = node.dimensions?.w ?? 1;
  const d = node.dimensions?.d ?? 1;
  const h = node.dimensions?.h ?? 1;
  const geometry = new THREE.BoxGeometry(w, h, d);
  const material = new THREE.MeshStandardMaterial({
    color: node.color ?? "#6366f1",
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, h / 2, 0);
  group.add(mesh);
}

async function buildExportScene(): Promise<THREE.Group> {
  const { tree, roomDimensions } = useSceneStore.getState();
  const root = new THREE.Group();
  root.name = "DecorGenExport";

  const { width, length, height, thickness } = roomDimensions;
  const tMeters = thickness / 100;
  const floorGeo = new THREE.BoxGeometry(width + tMeters * 2, tMeters, length + tMeters * 2);
  const wallGeo = new THREE.BoxGeometry(tMeters, height, length + tMeters * 2);
  const floorMat = new THREE.MeshStandardMaterial({ color: "#d97706" });
  const wallMat = new THREE.MeshStandardMaterial({ color: "#f8fafc" });

  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -tMeters / 2, 0);
  root.add(floor);

  const walls = [
    { pos: [-width / 2 - tMeters / 2, height / 2, 0] as [number, number, number] },
    { pos: [width / 2 + tMeters / 2, height / 2, 0] as [number, number, number] },
  ];
  for (const { pos } of walls) {
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(...pos);
    root.add(wall);
  }

  const models = flattenModels(tree);
  for (const node of models) {
    if (!node.visible) continue;
    const nodeGroup = new THREE.Group();
    nodeGroup.name = node.name;
    if (node.position) nodeGroup.position.set(...node.position);
    if (node.rotation) nodeGroup.rotation.set(...node.rotation);
    if (node.scale) nodeGroup.scale.set(...node.scale);

    if (node.glbUrl) {
      try {
        const model = await loadGlb(node.glbUrl);
        nodeGroup.add(model);
      } catch {
        addPlaceholderMesh(nodeGroup, node);
      }
    } else {
      addPlaceholderMesh(nodeGroup, node);
    }
    root.add(nodeGroup);
  }

  return root;
}

export async function exportSceneGLB(): Promise<void> {
  const root = await buildExportScene();
  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      root,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: "model/gltf-binary" });
          saveAs(blob, "scene.glb");
          resolve();
        } else {
          reject(new Error("Unexpected GLTF export format"));
        }
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();
            const mat = mesh.material;
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else mat?.dispose();
          }
        });
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}
