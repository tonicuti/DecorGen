import { saveAs } from "file-saver";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useSceneStore } from "@/store/use-scene-store";
import type { GLBProjectMetadata, ProjectObjectMetadata, SceneNode } from "@/types";

const flattenModels = (nodes: SceneNode[]): SceneNode[] => {
  const result: SceneNode[] = [];
  for (const node of nodes) {
    if (node.type === "model") result.push(node);
    if (node.children) result.push(...flattenModels(node.children));
  }
  return result;
};

const flattenProjectNodes = (nodes: SceneNode[], parentId?: string): ProjectObjectMetadata[] => {
  const result: ProjectObjectMetadata[] = [];

  for (const node of nodes) {
    result.push({
      id: node.id,
      name: node.name,
      type: node.type,
      assetId: node.assetId,
      placementType: node.placementType,
      parentId: node.parentId ?? parentId,
      position: node.position,
      rotation: node.rotation,
      scale: node.scale,
      glbUrl: node.glbUrl,
      dimensions: node.dimensions,
    });

    if (node.children) {
      result.push(...flattenProjectNodes(node.children, node.id));
    }
  }

  return result;
};

const buildProjectMetadata = (): GLBProjectMetadata => {
  const {
    tree,
    roomDimensions,
    roomMaterials,
    cameraState,
    sceneSettings,
  } = useSceneStore.getState();

  return {
    version: 1,
    projectName: "DecorGen Project",
    savedAt: new Date().toISOString(),
    roomDimensions: { ...roomDimensions },
    roomMaterials: { ...roomMaterials },
    cameraState: {
      position: [...cameraState.position],
      target: [...cameraState.target],
    },
    sceneSettings: { ...sceneSettings },
    tree: structuredClone(tree),
    objects: flattenProjectNodes(tree),
  };
};

const isProjectMetadata = (value: unknown): value is GLBProjectMetadata => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<GLBProjectMetadata>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.tree) &&
    Array.isArray(candidate.objects) &&
    Boolean(candidate.roomDimensions) &&
    Boolean(candidate.roomMaterials) &&
    Boolean(candidate.cameraState) &&
    Boolean(candidate.sceneSettings)
  );
};

const findProjectMetadata = (scene: THREE.Object3D): GLBProjectMetadata | null => {
  const sceneMetadata = scene.userData.decorGenProject;
  if (isProjectMetadata(sceneMetadata)) return sceneMetadata;

  let metadata: GLBProjectMetadata | null = null;
  scene.traverse((object) => {
    if (metadata) return;

    const objectMetadata = object.userData.decorGenProject;
    if (isProjectMetadata(objectMetadata)) {
      metadata = objectMetadata;
    }
  });

  return metadata;
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

function fitGlbToNodeDimensions(model: THREE.Object3D, node: SceneNode) {
  const w = node.dimensions?.w ?? 1;
  const d = node.dimensions?.d ?? 1;
  const h = node.dimensions?.h ?? 1;

  model.updateWorldMatrix(true, true);

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const fitted = new THREE.Group();
  fitted.add(model);
  model.scale.set(
    w / (size.x > 0 ? size.x : 1),
    h / (size.y > 0 ? size.y : 1),
    d / (size.z > 0 ? size.z : 1)
  );
  model.position.set(
    -center.x * model.scale.x,
    -center.y * model.scale.y,
    -center.z * model.scale.z
  );

  return fitted;
}

async function buildExportScene(): Promise<THREE.Group> {
  const { tree, roomDimensions } = useSceneStore.getState();
  const root = new THREE.Group();
  root.name = "DecorGenExport";
  root.userData.decorGenProject = buildProjectMetadata();

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
    nodeGroup.userData.decorGenObject = {
      id: node.id,
      name: node.name,
      type: node.type,
      assetId: node.assetId,
      placementType: node.placementType,
      parentId: node.parentId,
      position: node.position,
      rotation: node.rotation,
      scale: node.scale,
      glbUrl: node.glbUrl,
      dimensions: node.dimensions,
    } satisfies ProjectObjectMetadata;
    if (node.position) nodeGroup.position.set(...node.position);
    if (node.rotation) nodeGroup.rotation.set(...node.rotation);
    if (node.scale) nodeGroup.scale.set(...node.scale);

    if (node.glbUrl) {
      try {
        const model = await loadGlb(node.glbUrl);
        nodeGroup.add(fitGlbToNodeDimensions(model, node));
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
      { binary: true, includeCustomExtensions: true }
    );
  });
}

export async function exportProjectGLB(): Promise<void> {
  const root = await buildExportScene();
  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      root,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: "model/gltf-binary" });
          saveAs(blob, "decor-gen-project.glb");
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
      { binary: true, includeCustomExtensions: true }
    );
  });
}

function importProjectFromUrl(url: string, cleanupUrl?: () => void): Promise<GLBProjectMetadata> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        cleanupUrl?.();

        const metadata = findProjectMetadata(gltf.scene);
        if (!metadata) {
          reject(new Error("This GLB does not contain DecorGen project metadata."));
          return;
        }

        const {
          setTree,
          setRoomDimensions,
          setRoomMaterials,
          setCameraState,
          setSceneSettings,
          setSelectedIds,
        } = useSceneStore.getState();

        setRoomDimensions(metadata.roomDimensions);
        setRoomMaterials(metadata.roomMaterials);
        setCameraState(metadata.cameraState.position, metadata.cameraState.target);
        setSceneSettings(metadata.sceneSettings);
        setTree(structuredClone(metadata.tree));
        setSelectedIds([]);

        resolve(metadata);
      },
      undefined,
      (error) => {
        cleanupUrl?.();
        reject(error);
      }
    );
  });
}

export function importProjectGLB(file: File): Promise<GLBProjectMetadata> {
  const url = URL.createObjectURL(file);
  return importProjectFromUrl(url, () => URL.revokeObjectURL(url));
}

export function importProjectGLBFromUrl(url: string): Promise<GLBProjectMetadata> {
  return importProjectFromUrl(url);
}
