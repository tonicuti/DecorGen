import * as THREE from "three";

/** Main viewport camera state mirrored for the corner axis gizmo. */
export const viewportCameraSync = {
  position: new THREE.Vector3(0, 4, 6),
  target: new THREE.Vector3(0, 1.4, 0),
  quaternion: new THREE.Quaternion(),
};
