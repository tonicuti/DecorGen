import {
  ArrowRightLeft,
  Box,
  Component,
  Droplet,
  Layers,
  Move,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Scaling,
  Search,
  Sliders,
  Sparkles,
  Tag,
} from "lucide-react";
import * as React from "react";
import * as THREE from "three";
import { COLOR_SWATCHES, MATERIAL_PRESETS, OBJECT_PARTS, SCENE_OBJECTS } from "@/api/mock-data";
import { CollapsiblePanel } from "@/components/layout/sidebar/collapsible-panel";
import { CustomNumberInput } from "@/components/layout/sidebar/number-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { validatePlacement } from "@/lib/collision";
import { useSceneStore } from "@/store/use-scene-store";
import type { SceneNode, TransformValues } from "@/types";

function ObjectProperties() {
  const {
    selectedIds,
    tree,
    updateNode,
    reparentNode,
    removeNode,
    roomDimensions,
    setDragState,
    collidingWithIds,
  } = useSceneStore();
  const selectedNodeId = selectedIds[0];

  const findNode = React.useCallback((nodes: SceneNode[], id: string): SceneNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;

      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }

    return null;
  }, []);

  const getParentNode = React.useCallback(
    (
      nodes: SceneNode[],
      targetId: string,
      currentParent: SceneNode | null = null
    ): SceneNode | null => {
      for (const node of nodes) {
        if (node.id === targetId) return currentParent;

        if (node.children) {
          const found = getParentNode(node.children, targetId, node);
          if (found) return found;
        }
      }

      return null;
    },
    []
  );

  const getWorldMatrix = React.useCallback(
    (nodes: SceneNode[], targetId: string, currentMatrix: THREE.Matrix4): THREE.Matrix4 | null => {
      for (const node of nodes) {
        const localMatrix = new THREE.Matrix4();

        if (node.id !== "group-1") {
          const euler = new THREE.Euler(...(node.rotation || [0, 0, 0]));
          const quat = new THREE.Quaternion().setFromEuler(euler);

          localMatrix.compose(
            new THREE.Vector3(...(node.position || [0, 0, 0])),
            quat,
            new THREE.Vector3(...(node.scale || [1, 1, 1]))
          );
        }
        const worldMatrix = currentMatrix.clone().multiply(localMatrix);

        if (node.id === targetId) return worldMatrix;

        if (node.children) {
          const found = getWorldMatrix(node.children, targetId, worldMatrix);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  const selectedNode = React.useMemo(() => {
    return selectedNodeId ? findNode(tree, selectedNodeId) : null;
  }, [tree, selectedNodeId, findNode]);

  const [objectName, setObjectName] = React.useState(SCENE_OBJECTS[0].name);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [position, setPosition] = React.useState<TransformValues>({ x: 0.0, y: 0.0, z: 0.0 });
  const [yaw, setYaw] = React.useState(0);
  const [dimensions, setDimensions] = React.useState({ w: 180, d: 80, h: 85 });
  const [selectedPart, setSelectedPart] = React.useState(OBJECT_PARTS[0].id);
  const [selectedMaterial, setSelectedMaterial] = React.useState(MATERIAL_PRESETS[0].id);
  const [colorHex, setColorHex] = React.useState(COLOR_SWATCHES[0].value);
  const [roughness, setRoughness] = React.useState(30);
  const [metalness, setMetalness] = React.useState(10);
  const timeoutRef = React.useRef<number | null>(null);
  const initialNodeRef = React.useRef<SceneNode | null>(null);
  const prevSelectedIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (selectedNodeId !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedNodeId || null;

      if (selectedNodeId) {
        const node = findNode(tree, selectedNodeId);

        if (node) {
          initialNodeRef.current = JSON.parse(JSON.stringify(node));
        }
      } else {
        initialNodeRef.current = null;
      }
    }
  }, [selectedNodeId, tree, findNode]);

  React.useEffect(() => {
    if (selectedNode) {
      setObjectName(selectedNode.name);

      if (selectedNode.position) {
        setPosition({
          x: selectedNode.position[0],
          y: selectedNode.position[1],
          z: selectedNode.position[2],
        });
      }

      if (selectedNode.rotation) {
        setYaw(Math.round(THREE.MathUtils.radToDeg(selectedNode.rotation[1])));
      }

      if (selectedNode.dimensions) {
        setDimensions(selectedNode.dimensions);
      }

      if (selectedNode.color) {
        setColorHex(selectedNode.color);
      }
      if (selectedNode.roughness !== undefined) {
        setRoughness(selectedNode.roughness);
      } else {
        setRoughness(50);
      }
      if (selectedNode.metalness !== undefined) {
        setMetalness(selectedNode.metalness);
      } else {
        setMetalness(50);
      }
      if (selectedNode.materials && selectedNode.materials[selectedPart]) {
        setSelectedMaterial(selectedNode.materials[selectedPart]);
      }
    } else {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setDragState(null, null, null, false, []);
    }
  }, [selectedNode, selectedPart, setDragState]);

  const handleUpdate = (updates: Partial<SceneNode>) => {
    if (!selectedNode) return;

    const isSpatialUpdate = updates.position || updates.rotation || updates.dimensions;
    if (!isSpatialUpdate) {
      updateNode(selectedNode.id, updates);
      return;
    }

    const testNode = { ...selectedNode, ...updates };
    const matrix = new THREE.Matrix4();
    const euler = new THREE.Euler(...(testNode.rotation || [0, 0, 0]));
    const quaternion = new THREE.Quaternion().setFromEuler(euler);
    matrix.compose(
      new THREE.Vector3(...(testNode.position || [0, 0, 0])),
      quaternion,
      new THREE.Vector3(...(testNode.scale || [1, 1, 1]))
    );

    const parentNode = getParentNode(tree, selectedNode.id);
    const parentWorldMatrix = parentNode
      ? getWorldMatrix(tree, parentNode.id, new THREE.Matrix4()) || new THREE.Matrix4()
      : new THREE.Matrix4();

    const targetWorldMatrix = new THREE.Matrix4();
    targetWorldMatrix.multiplyMatrices(parentWorldMatrix, matrix);

    let activeWorldMatrix = targetWorldMatrix.clone();
    let willReparentToGroup1 = false;
    let newGroup1LocalPos = new THREE.Vector3();

    if (testNode.placementType === "tabletop" && parentNode && parentNode.id !== "group-1") {
      const pw = parentNode.dimensions?.w || 1;
      const pd = parentNode.dimensions?.d || 1;
      const localCenter = new THREE.Vector3(
        testNode.position?.[0] || 0,
        0,
        testNode.position?.[2] || 0
      );
      const tw = testNode.dimensions?.w || 1;
      const td = testNode.dimensions?.d || 1;

      const right = localCenter.x + tw / 2;
      const left = localCenter.x - tw / 2;
      const front = localCenter.z + td / 2;
      const back = localCenter.z - td / 2;

      const pRight = pw / 2;
      const pLeft = -pw / 2;
      const pFront = pd / 2;
      const pBack = -pd / 2;

      const isOutsideX = right < pLeft || left > pRight;
      const isOutsideZ = front < pBack || back > pFront;

      if (isOutsideX || isOutsideZ) {
        willReparentToGroup1 = true;
        const worldPos = new THREE.Vector3();
        activeWorldMatrix.decompose(worldPos, new THREE.Quaternion(), new THREE.Vector3());
        const th = testNode.dimensions?.h || 1;
        worldPos.y = th / 2;
        newGroup1LocalPos = worldPos.clone();

        activeWorldMatrix.setPosition(worldPos);
      }
    }

    if (testNode.placementType === "tabletop" && parentNode?.id === "group-1") {
      const targetAABB = new THREE.Box3();
      const tw = testNode.dimensions?.w || 1;
      const td = testNode.dimensions?.d || 1;
      const th = testNode.dimensions?.h || 1;
      targetAABB.min.set(-tw / 2, -th / 2, -td / 2);
      targetAABB.max.set(tw / 2, th / 2, td / 2);
      targetAABB.applyMatrix4(activeWorldMatrix);

      let climbTarget: SceneNode | null = null;

      const traverse = (nodes: SceneNode[]) => {
        for (const node of nodes) {
          if (node.id !== selectedNode.id && node.placementType === "floor") {
            const wm = getWorldMatrix(tree, node.id, new THREE.Matrix4());

            if (wm) {
              const nw = node.dimensions?.w || 1;
              const nd = node.dimensions?.d || 1;
              const nh = node.dimensions?.h || 1;
              const nAABB = new THREE.Box3();
              nAABB.min.set(-nw / 2, -nh / 2, -nd / 2);
              nAABB.max.set(nw / 2, nh / 2, nd / 2);
              nAABB.applyMatrix4(wm);

              if (targetAABB.intersectsBox(nAABB)) {
                climbTarget = node;
                return;
              }
            }
          }

          if (node.children && !climbTarget) traverse(node.children);
        }
      };
      traverse(tree);

      if (climbTarget) {
        const tfWorldMatrix =
          getWorldMatrix(tree, (climbTarget as SceneNode).id, new THREE.Matrix4()) ||
          new THREE.Matrix4();
        const worldPos = new THREE.Vector3();
        activeWorldMatrix.decompose(worldPos, new THREE.Quaternion(), new THREE.Vector3());

        const tfh = (climbTarget as SceneNode).dimensions?.h || 1;
        worldPos.y = tfh + th / 2;

        const tfInverse = tfWorldMatrix.clone().invert();
        const localPos = worldPos.clone().applyMatrix4(tfInverse);

        reparentNode(selectedNode.id, (climbTarget as SceneNode).id, [
          localPos.x,
          localPos.y,
          localPos.z,
        ]);

        const { position: _pos, ...otherUpdates } = updates;
        if (Object.keys(otherUpdates).length > 0) {
          updateNode(selectedNode.id, otherUpdates);
        }

        return;
      }
    }

    const result = validatePlacement(testNode, activeWorldMatrix, tree, roomDimensions);

    const revertUI = () => {
      if (updates.position && selectedNode.position) {
        setPosition({
          x: selectedNode.position[0],
          y: selectedNode.position[1],
          z: selectedNode.position[2],
        });
      }

      if (updates.dimensions && selectedNode.dimensions) {
        setDimensions(selectedNode.dimensions);
      }

      if (updates.rotation && selectedNode.rotation) {
        setYaw(Math.round(THREE.MathUtils.radToDeg(selectedNode.rotation[1])));
      }
    };

    const isInvalidPlacement =
      result.isOutOfBounds || result.isColliding || result.violatesClearance;
    if (isInvalidPlacement) {
      revertUI();
      const collidingIds = [selectedNode.id];
      if (result.collidingWith) collidingIds.push(...result.collidingWith);

      setDragState(null, null, null, false, collidingIds);

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setDragState(null, null, null, false, []);
      }, 1500);

      return;
    }

    if (willReparentToGroup1) {
      reparentNode(selectedNode.id, "group-1", [
        newGroup1LocalPos.x,
        newGroup1LocalPos.y,
        newGroup1LocalPos.z,
      ]);

      const { position: _pos, ...otherUpdates } = updates;
      if (Object.keys(otherUpdates).length > 0) {
        updateNode(selectedNode.id, otherUpdates);
      }

      return;
    }

    updateNode(selectedNode.id, updates);
  };

  const handlePositionChange = (axis: "x" | "y" | "z", val: number) => {
    const newPos = { ...position, [axis]: val };
    setPosition(newPos);

    if (selectedNode) {
      handleUpdate({ position: [newPos.x, newPos.y, newPos.z] });
    }
  };

  const handleRotationChange = React.useCallback(
    (newYaw: number) => {
      setYaw(newYaw);

      if (selectedNode) {
        const rad = THREE.MathUtils.degToRad(newYaw);
        const currentRot = selectedNode.rotation || [0, 0, 0];
        handleUpdate({ rotation: [currentRot[0], rad, currentRot[2]] });
      }
    },
    [selectedNode, handleUpdate]
  );

  React.useEffect(() => {
    const handleRequestRotation = (e: Event) => {
      const customEvent = e as CustomEvent;
      const angle = customEvent.detail.angle;
      handleRotationChange((yaw + angle + 360) % 360);
    };

    const handleRequestDelete = (e: Event) => {
      const customEvent = e as CustomEvent;
      const id = customEvent.detail.id;
      removeNode(id);
    };

    const handleRequestFlip = (_: Event) => {
      const currentScaleX = selectedNode?.scale?.[0] ?? 1;
      handleUpdate({ scale: [currentScaleX === 1 ? -1 : 1, 1, 1] });
    };

    window.addEventListener("request-rotation", handleRequestRotation);
    window.addEventListener("request-delete", handleRequestDelete);
    window.addEventListener("request-flip", handleRequestFlip);

    return () => {
      window.removeEventListener("request-rotation", handleRequestRotation);
      window.removeEventListener("request-delete", handleRequestDelete);
      window.removeEventListener("request-flip", handleRequestFlip);
    };
  }, [yaw, handleRotationChange, removeNode, selectedNode, handleUpdate]);

  const handleDimensionChange = (axis: "w" | "d" | "h", val: number) => {
    const newDim = { ...dimensions, [axis]: val };
    setDimensions(newDim);

    if (selectedNode) {
      let newX = selectedNode.position?.[0] || 0;
      let newY = selectedNode.position?.[1] || 0;
      let newZ = selectedNode.position?.[2] || 0;
      let isPosChanged = false;

      if (axis === "h") {
        const diffH = val - dimensions.h;
        const currentY = selectedNode.position ? selectedNode.position[1] : 0;
        newY = currentY + diffH / 2;
        isPosChanged = true;
      } else if (axis === "d" && selectedNode.placementType === "wall") {
        const diffD = val - dimensions.d;
        const yaw = selectedNode.rotation?.[1] || 0;

        const localZ = new THREE.Vector3(0, 0, 1);
        localZ.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

        newX += localZ.x * (diffD / 2);
        newZ += localZ.z * (diffD / 2);
        isPosChanged = true;
      }

      if (isPosChanged) {
        setPosition((prev) => ({ ...prev, x: newX, y: newY, z: newZ }));
        handleUpdate({
          dimensions: newDim,
          position: [newX, newY, newZ],
        });
      } else {
        handleUpdate({ dimensions: newDim });
      }
    }
  };

  const handleDisplayDimensionChange = (axis: "w" | "d", val: number) => {
    if (isRotated90) {
      if (axis === "w") handleDimensionChange("d", val);
      if (axis === "d") handleDimensionChange("w", val);
    } else {
      handleDimensionChange(axis, val);
    }
  };

  const handleColorChange = (hex: string) => {
    setColorHex(hex);
    if (selectedNode) {
      handleUpdate({ color: hex });
    }
  };

  const handleMaterialChange = (matId: string) => {
    setSelectedMaterial(matId);
    if (selectedNode) {
      const newMaterials = { ...(selectedNode.materials || {}), [selectedPart]: matId };
      handleUpdate({ materials: newMaterials });
    }
  };

  const handleRoughnessChange = (val: number) => {
    setRoughness(val);
    if (selectedNode) {
      handleUpdate({ roughness: val });
    }
  };

  const handleMetalnessChange = (val: number) => {
    setMetalness(val);
    if (selectedNode) {
      handleUpdate({ metalness: val });
    }
  };

  const handleReset = () => {
    const initialNode = initialNodeRef.current;
    if (!initialNode || !selectedNode) return;

    setObjectName(initialNode.name);
    if (initialNode.position) {
      setPosition({
        x: initialNode.position[0],
        y: initialNode.position[1],
        z: initialNode.position[2],
      });
    }
    if (initialNode.rotation) {
      setYaw(Math.round(THREE.MathUtils.radToDeg(initialNode.rotation[1])));
    }
    if (initialNode.dimensions) {
      setDimensions(initialNode.dimensions);
    }
    if (initialNode.color) {
      setColorHex(initialNode.color);
    }
    setRoughness(initialNode.roughness !== undefined ? initialNode.roughness : 50);
    setMetalness(initialNode.metalness !== undefined ? initialNode.metalness : 50);

    const matId =
      initialNode.materials && initialNode.materials[selectedPart]
        ? initialNode.materials[selectedPart]
        : MATERIAL_PRESETS[0].id;
    setSelectedMaterial(matId);

    handleUpdate({
      name: initialNode.name,
      position: initialNode.position,
      rotation: initialNode.rotation,
      dimensions: initialNode.dimensions,
      color: initialNode.color,
      roughness: initialNode.roughness,
      metalness: initialNode.metalness,
      materials: initialNode.materials,
    });
  };

  const filteredObjects = SCENE_OBJECTS.filter((obj) =>
    obj.name.toLowerCase().includes(objectName.toLowerCase())
  );

  const isOpening = selectedNode?.placementType === "opening";
  const isWall = selectedNode?.placementType === "wall";
  const isDoor =
    isOpening &&
    (selectedNode?.assetId?.includes("door") || selectedNode?.name.toLowerCase().includes("door"));
  const isFloor = selectedNode?.placementType === "floor";
  const isTabletop = selectedNode?.placementType === "tabletop";

  const isRotated90 = React.useMemo(() => {
    const yawDeg = Math.round(THREE.MathUtils.radToDeg(selectedNode?.rotation?.[1] || 0));
    const normalized = Math.abs(yawDeg % 180);
    return normalized === 90;
  }, [selectedNode?.rotation]);

  const displayW = isRotated90 ? dimensions.d : dimensions.w;
  const displayD = isRotated90 ? dimensions.w : dimensions.d;

  let isXFixed = false;
  let isZFixed = false;

  if (isOpening || isWall) {
    const deg = Math.round(THREE.MathUtils.radToDeg(selectedNode?.rotation?.[1] || 0));
    if (deg === 0 || deg === 180 || deg === -180 || deg === 360) {
      isZFixed = true;
    } else if (deg === 90 || deg === -90 || deg === 270 || deg === -270) {
      isXFixed = true;
    } else {
      isXFixed = true;
      isZFixed = true;
    }
  }

  const isPanelColliding = selectedNode && collidingWithIds.includes(selectedNode.id);

  const cardClass = `flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
    isPanelColliding
      ? "border-red-500/80 bg-red-50/30 dark:border-red-500/50 dark:bg-red-950/20"
      : "border-zinc-200/60 bg-zinc-50/30 dark:border-zinc-800/60 dark:bg-zinc-900/30"
  }`;

  if (!selectedNode) {
    return (
      <CollapsiblePanel
        key="no-node"
        title="Object Properties"
        icon={<Box className="h-4 w-4 text-violet-500" />}
        titleColor="text-violet-600 dark:text-violet-400"
        defaultOpen={false}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-3 rounded-full bg-zinc-100 p-3 dark:bg-zinc-800/50">
            <Box className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">No Object Selected</p>
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            Select an object in the scene to view and edit its properties.
          </p>
        </div>
      </CollapsiblePanel>
    );
  }

  return (
    <CollapsiblePanel
      key={selectedNode.id}
      title="Object Properties"
      icon={<Box className="h-4 w-4 text-violet-500" />}
      titleColor="text-violet-600 dark:text-violet-400"
      defaultOpen={true}
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-6 gap-1 rounded-md px-2 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reset</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className={cardClass}>
          <div className="flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-400">
            <Tag className="h-3.5 w-3.5 text-violet-500" />
            <span>Object Name</span>
          </div>
          <div className="relative pt-1">
            <Input
              value={objectName}
              onChange={(e) => {
                setObjectName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="h-8 border-zinc-200 bg-white pr-7 text-xs font-medium text-zinc-900 focus-visible:ring-violet-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="Enter object name..."
            />
            <Search className="absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          </div>
          {showSuggestions && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-36 scrollbar-none overflow-y-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg transition-all [-ms-overflow-style:none] dark:border-zinc-800 dark:bg-zinc-950 [&::-webkit-scrollbar]:hidden">
              <div className="px-2 py-1 text-[9px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                Scene Objects
              </div>
              {filteredObjects.length > 0 ? (
                filteredObjects.map((obj) => (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => {
                      setObjectName(obj.name);
                      setShowSuggestions(false);
                      handleUpdate({ name: obj.name });
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                  >
                    <span className="font-medium">{obj.name}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {obj.category}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-2 py-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  No matching objects
                </div>
              )}
            </div>
          )}
        </div>
        <div className={cardClass}>
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
            <Move className="h-3.5 w-3.5 text-rose-500" />
            <span>Position (m)</span>
          </div>
          <div className="mx-auto flex max-w-50 flex-col gap-2 pt-1">
            <CustomNumberInput
              label="X"
              value={position.x}
              min={-999}
              disabled={isXFixed}
              onChange={(val) => handlePositionChange("x", val)}
              badgeColor="bg-rose-500 text-white dark:bg-rose-600"
            />
            <CustomNumberInput
              label="Y"
              value={position.y}
              min={-999}
              disabled={isFloor || isDoor || isTabletop}
              onChange={(val) => handlePositionChange("y", val)}
              badgeColor="bg-rose-500 text-white dark:bg-rose-600"
            />
            <CustomNumberInput
              label="Z"
              value={position.z}
              min={-999}
              disabled={isZFixed}
              onChange={(val) => handlePositionChange("z", val)}
              badgeColor="bg-rose-500 text-white dark:bg-rose-600"
            />
          </div>
        </div>
        {!isOpening && !isWall && (
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-fuchsia-700 dark:text-fuchsia-400">
                <RotateCw className="h-3.5 w-3.5 text-fuchsia-500" />
                <span>Rotation</span>
              </div>
              <span className="font-mono text-[10px] text-zinc-500">{yaw}°</span>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => handleRotationChange((yaw - 90 + 360) % 360)}
                className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                title="Rotate Left (90°)"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Left</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRotationChange((yaw + 90) % 360)}
                className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                title="Rotate Right (90°)"
              >
                <span>Right</span>
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
        {(isDoor || isWall) && (
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-fuchsia-700 dark:text-fuchsia-400">
                <RotateCw className="h-3.5 w-3.5 text-fuchsia-500" />
                <span>{isWall ? "Flip Object" : "Door Swing"}</span>
              </div>
            </div>
            <div className="flex items-center justify-center pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  const currentScaleX = selectedNode?.scale?.[0] ?? 1;
                  handleUpdate({ scale: [currentScaleX === 1 ? -1 : 1, 1, 1] });
                }}
                className="flex h-7 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                title={isWall ? "Flip Object Left / Right" : "Flip Door Swing"}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>Flip Left / Right</span>
              </Button>
            </div>
          </div>
        )}
        <div className={cardClass}>
          <div className="flex items-center gap-1.5 text-xs font-medium text-pink-700 dark:text-pink-400">
            <Scaling className="h-3.5 w-3.5 text-pink-500" />
            <span>Dimensions (m)</span>
          </div>
          <div className="mx-auto flex max-w-50 flex-col gap-2 pt-1">
            <CustomNumberInput
              label="W"
              value={displayW}
              step={0.1}
              min={0.1}
              onChange={(val) => handleDisplayDimensionChange("w", val)}
              badgeColor="bg-pink-500 text-white dark:bg-pink-600"
            />
            <CustomNumberInput
              label="D"
              value={displayD}
              step={0.1}
              min={0.1}
              disabled={isOpening}
              onChange={(val) => handleDisplayDimensionChange("d", val)}
              badgeColor="bg-pink-500 text-white dark:bg-pink-600"
            />
            <CustomNumberInput
              label="H"
              value={dimensions.h}
              step={0.1}
              min={0.1}
              onChange={(val) => handleDimensionChange("h", val)}
              badgeColor="bg-pink-500 text-white dark:bg-pink-600"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/30">
          <div className="flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-400">
            <Layers className="h-3.5 w-3.5 text-violet-500" />
            <span>Object Parts</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {OBJECT_PARTS.map((part) => (
              <button
                key={part.id}
                onClick={() => setSelectedPart(part.id)}
                className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-colors ${
                  selectedPart === part.id
                    ? "bg-violet-500 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {part.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/30">
          <div className="flex items-center gap-1.5 text-xs font-medium text-fuchsia-700 dark:text-fuchsia-400">
            <Component className="h-3.5 w-3.5 text-fuchsia-500" />
            <span>Material Preset</span>
          </div>
          <div className="pt-1">
            <Select value={selectedMaterial} onValueChange={handleMaterialChange}>
              <SelectTrigger className="h-8 w-full border-zinc-200 bg-white text-xs font-medium text-zinc-900 focus:ring-fuchsia-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                <SelectValue placeholder="Select material preset" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={4}
                className="max-h-56 overflow-y-auto border-zinc-200 bg-white **:data-radix-select-viewport:h-auto! **:data-[slot=select-scroll-down-button]:hidden **:data-[slot=select-scroll-up-button]:hidden dark:border-zinc-800 dark:bg-zinc-950 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800/80 [&::-webkit-scrollbar-track]:bg-transparent"
              >
                {MATERIAL_PRESETS.map((mat) => (
                  <SelectItem
                    key={mat.id}
                    value={mat.id}
                    className="text-xs font-medium text-zinc-800 dark:text-zinc-200"
                  >
                    {mat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-pink-700 dark:text-pink-400">
              <Droplet className="h-3.5 w-3.5 text-pink-500" />
              <span>Base Color</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-zinc-400 uppercase dark:text-zinc-500">
                Hex
              </span>
              <Input
                value={colorHex}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-6 w-20 border-zinc-200 bg-white px-2 py-0 font-mono text-[10px] text-zinc-900 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 pt-1">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.name}
                onClick={() => handleColorChange(swatch.value)}
                className={`group relative h-7 w-full overflow-hidden rounded-lg border shadow-xs transition-transform active:scale-95 ${
                  colorHex.toLowerCase() === swatch.value.toLowerCase()
                    ? "border-pink-500 ring-2 ring-pink-500/30 dark:ring-pink-500/40"
                    : "border-black/10 hover:scale-105 dark:border-white/10"
                }`}
                title={swatch.name}
              >
                <div
                  className="absolute inset-0 h-full w-full"
                  style={{ backgroundColor: swatch.value }}
                />
                {colorHex.toLowerCase() === swatch.value.toLowerCase() && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/30">
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
            <Sliders className="h-3.5 w-3.5 text-rose-500" />
            <span>Surface Properties</span>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400">Roughness</span>
              <span className="font-mono text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {roughness}%
              </span>
            </div>
            <Slider
              value={[roughness]}
              onValueChange={(val) => handleRoughnessChange(val[0])}
              max={100}
              step={1}
              className="py-1"
            />
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400">Metalness</span>
              <span className="font-mono text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {metalness}%
              </span>
            </div>
            <Slider
              value={[metalness]}
              onValueChange={(val) => handleMetalnessChange(val[0])}
              max={100}
              step={1}
              className="py-1"
            />
          </div>
        </div>
      </div>
    </CollapsiblePanel>
  );
}

export { ObjectProperties };
