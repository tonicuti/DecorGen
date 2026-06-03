import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function renderModelThumbnail(url: string, cleanupUrl?: () => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        try {
          const width = 256;
          const height = 256;
          const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
          });
          renderer.setSize(width, height);
          renderer.setPixelRatio(1);

          const scene = new THREE.Scene();
          scene.background = new THREE.Color("#f4f4f5");

          const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
          scene.add(ambientLight);

          const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
          dirLight.position.set(5, 10, 7);
          scene.add(dirLight);

          const model = gltf.scene;
          scene.add(model);

          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          model.position.x -= center.x;
          model.position.y -= center.y;
          model.position.z -= center.z;

          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const fov = 40;
          const camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 1000);

          const distance = (maxDim / (2 * Math.tan((fov * Math.PI) / 360))) * 1.4;

          camera.position.set(distance * 0.8, distance * 0.7, distance * 0.8);
          camera.lookAt(0, 0, 0);

          scene.updateMatrixWorld(true);
          renderer.render(scene, camera);

          const dataUrl = renderer.domElement.toDataURL("image/png");

          cleanupUrl?.();
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.geometry.dispose();
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          });
          renderer.dispose();

          resolve(dataUrl);
        } catch (err) {
          cleanupUrl?.();
          reject(err);
        }
      },
      undefined,
      (error) => {
        cleanupUrl?.();
        reject(error);
      }
    );
  });
}

export function generateModelThumbnail(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  return renderModelThumbnail(url, () => URL.revokeObjectURL(url));
}

export function generateModelThumbnailFromUrl(url: string): Promise<string> {
  return renderModelThumbnail(url);
}
