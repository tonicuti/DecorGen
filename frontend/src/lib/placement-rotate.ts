export function rotateYaw(
  rotation: [number, number, number],
  deltaDeg: number
): [number, number, number] {
  const deltaRad = (deltaDeg * Math.PI) / 180;
  return [rotation[0], rotation[1] + deltaRad, rotation[2]];
}
