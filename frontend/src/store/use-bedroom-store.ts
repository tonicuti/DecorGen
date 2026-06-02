import { create } from "zustand";
import { DEFAULT_BEDROOM_SVG, SAMPLE_BEDROOMS } from "@/api/mock-data";
import type { Bedroom, BedroomAssetMetadata, BedroomLayout, SceneNode } from "@/types";

function collectAssetMetadata(nodes: SceneNode[]): BedroomAssetMetadata[] {
  const assets: BedroomAssetMetadata[] = [];

  const walk = (items: SceneNode[]) => {
    for (const node of items) {
      if (node.type === "model") {
        assets.push({
          id: node.id,
          name: node.name,
          position: node.position ?? [0, 0, 0],
          rotation: node.rotation ?? [0, 0, 0],
          glbUrl: node.glbUrl,
        });
      }

      if (node.children?.length) walk(node.children);
    }
  };

  walk(nodes);
  return assets;
}

function cloneLayout(layout: BedroomLayout): BedroomLayout {
  return {
    assets: structuredClone(layout.assets),
    tree: structuredClone(layout.tree),
    roomDimensions: { ...layout.roomDimensions },
    roomMaterials: { ...layout.roomMaterials },
  };
}

interface BedroomState {
  bedrooms: Bedroom[];
  activeBedroomId: string | null;
  createBedroom: (name: string, layout: BedroomLayout) => Bedroom;
  openBedroom: (id: string) => BedroomLayout | null;
  saveActiveBedroom: (layout: Omit<BedroomLayout, "assets">) => Bedroom | null;
  renameBedroom: (id: string, name: string) => void;
  deleteBedroom: (id: string) => void;
}

export const useBedroomStore = create<BedroomState>((set, get) => {
  const bedrooms = SAMPLE_BEDROOMS;
  const activeBedroom = bedrooms.find((bedroom) => bedroom.active);

  return {
    bedrooms,
    activeBedroomId: activeBedroom?.id ?? null,

    createBedroom: (name, layout) => {
      const newBedroom: Bedroom = {
        id: `proj-${Date.now()}`,
        name,
        updatedAt: "Just now",
        thumbnail: DEFAULT_BEDROOM_SVG,
        active: true,
        layout: cloneLayout(layout),
      };

      set((state) => {
        const bedrooms = [
          newBedroom,
          ...state.bedrooms.map((bedroom) => ({ ...bedroom, active: false })),
        ];
        return { bedrooms, activeBedroomId: newBedroom.id };
      });

      return newBedroom;
    },

    openBedroom: (id) => {
      const bedroom = get().bedrooms.find((item) => item.id === id);
      if (!bedroom?.layout) return null;

      set((state) => {
        const bedrooms = state.bedrooms.map((item) => ({ ...item, active: item.id === id }));
        return { bedrooms, activeBedroomId: id };
      });

      return cloneLayout(bedroom.layout);
    },

    saveActiveBedroom: (layout) => {
      const activeBedroomId = get().activeBedroomId;
      if (!activeBedroomId) return null;

      let savedBedroom: Bedroom | null = null;
      set((state) => {
        const bedrooms = state.bedrooms.map((bedroom) => {
          if (bedroom.id !== activeBedroomId) return bedroom;

          savedBedroom = {
            ...bedroom,
            updatedAt: "Just now",
            layout: {
              ...layout,
              assets: collectAssetMetadata(layout.tree),
              tree: structuredClone(layout.tree),
              roomDimensions: { ...layout.roomDimensions },
              roomMaterials: { ...layout.roomMaterials },
            },
          };
          return savedBedroom;
        });

        return { bedrooms };
      });

      return savedBedroom;
    },

    renameBedroom: (id, name) => {
      set((state) => {
        const bedrooms = state.bedrooms.map((bedroom) =>
          bedroom.id === id ? { ...bedroom, name, updatedAt: "Just now" } : bedroom
        );
        return { bedrooms };
      });
    },

    deleteBedroom: (id) => {
      set((state) => {
        const bedrooms = state.bedrooms.filter((bedroom) => bedroom.id !== id);
        return {
          bedrooms,
          activeBedroomId: state.activeBedroomId === id ? null : state.activeBedroomId,
        };
      });
    },
  };
});
