import type {
  Asset,
  Bedroom,
  ColorSwatch,
  DetectedObject,
  EnvironmentPreset,
  MaterialPreset,
  ObjectPart,
  SceneNode,
  SceneObject,
} from "@/types";

// ============================================================================
// Image Previews
// ============================================================================

// --- Bedroom Preview Images ---
// const BEDROOM_1_IMG = "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600";
// const BEDROOM_2_IMG = "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600";
// const BEDROOM_3_IMG = "https://images.unsplash.com/photo-1616593969747-4797dc75033e?w=600";
// const BEDROOM_4_IMG = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600";

// --- Generic Fallback Previews ---
export const DEFAULT_ASSET_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23818cf8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect width='24' height='24' rx='4' fill='%23f4f4f5'/><path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/><polyline points='3.27 6.96 12 12.01 20.73 6.96'/><line x1='12' y1='22.08' x2='12' y2='12'/></svg>`;
export const DEFAULT_BEDROOM_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%2318181b"/><g transform="translate(150, 100)" stroke="%236366f1" stroke-width="2" fill="none"><path d="M-40,-20 L0,-40 L40,-20 L40,20 L0,40 L-40,20 Z" /><path d="M-40,-20 L0,0 L40,-20" /><path d="M0,0 L0,40" /><circle cx="0" cy="-40" r="4" fill="%23a855f7" stroke="none"/><circle cx="-40" cy="-20" r="4" fill="%23ec4899" stroke="none"/><circle cx="40" cy="-20" r="4" fill="%23ec4899" stroke="none"/></g></svg>`;

// --- Images of Assets ---
export const BOOKS_1 = "https://cdn.polyhaven.com/asset_img/primary/book_encyclopedia_set_01.png?height=760&quality=95"
export const ARMCHAIR_01 = "https://cdn.polyhaven.com/asset_img/primary/ArmChair_01.png?height=760&quality=95"
export const CHESS_SET = "https://cdn.polyhaven.com/asset_img/primary/chess_set.png?height=760&quality=95"
export const COFFEE_TABLE_ROUND_01 = "https://cdn.polyhaven.com/asset_img/primary/coffee_table_round_01.png?height=760&quality=95"
export const DARTBOARD = "https://cdn.polyhaven.com/asset_img/primary/dartboard.png?height=760&quality=95"
export const DRAWER_CABINET = "https://cdn.polyhaven.com/asset_img/primary/drawer_cabinet.png?height=760&quality=95"
export const FANCY_PICTURE_FRAME = "https://cdn.polyhaven.com/asset_img/primary/fancy_picture_frame_01.png?height=760&quality=95"
export const GOTHICBED_01 = "https://cdn.polyhaven.com/asset_img/primary/GothicBed_01.png?height=760&quality=95"
export const GREENCHAIR_01 = "https://cdn.polyhaven.com/asset_img/primary/GreenChair_01.png?height=760&quality=95"
export const METAL_OFFICE_DESK = "https://cdn.polyhaven.com/asset_img/primary/metal_office_desk.png?height=760&quality=95"
export const MID_CENTURY_LOUNGE_CHAIR = "https://cdn.polyhaven.com/asset_img/primary/mid_century_lounge_chair.png?height=760&quality=95"
export const MODERN_ARM_CHAIR_01 = "https://cdn.polyhaven.com/asset_img/primary/modern_arm_chair_01.png?height=760&quality=95"
export const MODERN_COFFEE_TABLE_01 = "https://cdn.polyhaven.com/asset_img/primary/modern_coffee_table_01.png?height=760&quality=95"
export const ORNATE_MIRROR = "https://cdn.polyhaven.com/asset_img/primary/ornate_mirror_01.png?height=760&quality=95"
export const OTTOMAN_01 = "https://cdn.polyhaven.com/asset_img/primary/Ottoman_01.png?height=760&quality=95"
export const PAINTED_WOODEN_CHAIR_01 = "https://cdn.polyhaven.com/asset_img/primary/painted_wooden_chair_01.png?height=760&quality=95"
export const POTTED_PLANT_04 = "https://cdn.polyhaven.com/asset_img/primary/potted_plant_04.png?height=760&quality=95"
export const ROCKINGCHAIR_01 = "https://cdn.polyhaven.com/asset_img/primary/Rockingchair_01.png?height=760&quality=95"
export const SMALL_WOODEN_TABLE_01 = "https://cdn.polyhaven.com/asset_img/primary/small_wooden_table_01.png?height=760&quality=95"
export const SOFA_01 = "https://cdn.polyhaven.com/asset_img/primary/Sofa_01.png?height=760&quality=95"
export const SOFA_02 = "https://cdn.polyhaven.com/asset_img/primary/sofa_02.png?height=760&quality=95"
export const SOFA_03 = "https://cdn.polyhaven.com/asset_img/primary/sofa_03.png?height=760&quality=95"
export const STEEL_FRAME_SHELVES_01 = "https://cdn.polyhaven.com/asset_img/primary/steel_frame_shelves_01.png?height=760&quality=95"
export const STEEL_FRAME_SHELVES_02 = "https://cdn.polyhaven.com/asset_img/primary/steel_frame_shelves_02.png?height=760&quality=95"
export const STEEL_FRAME_SHELVES_03 = "https://cdn.polyhaven.com/asset_img/primary/steel_frame_shelves_03.png?height=760&quality=95"
export const TREASURE_CHEST = "https://cdn.polyhaven.com/asset_img/primary/treasure_chest.png?height=760&quality=95"
export const VINTAGE_SUITCASE = "https://cdn.polyhaven.com/asset_img/primary/vintage_suitcase.png?height=760&quality=95"
export const VINTAGE_WOODEN_DRAWER_01 = "https://cdn.polyhaven.com/asset_img/primary/vintage_wooden_drawer_01.png?height=760&quality=95"
export const WOODEN_DISPLAY_SHELVES_01 = "https://cdn.polyhaven.com/asset_img/primary/wooden_display_shelves_01.png?height=760&quality=95"
export const WOODEN_TABLE_02 = "https://cdn.polyhaven.com/asset_img/primary/wooden_table_02.png?height=760&quality=95"
export const PARAMETRICWINDOW = "https://blendswap.com/blend_previews/17550/0/500"
export const BACK_ROOM_DOOR = "https://blendswap.com/blend_previews/16948/0/500"
export const WINDOW_BLINDS = "https://blendswap.com/blend_previews/19794/0/500"

// ============================================================================
// Layout and Scene Tree Catalog
// ============================================================================

// --- Saved Projects / Bedroom Layouts ---
export const SAMPLE_BEDROOMS: Bedroom[] = [
  // {
  //   id: "proj-1",
  //   name: "Minimalist Master Bedroom",
  //   updatedAt: "2 hours ago",
  //   thumbnail: BEDROOM_1_IMG,
  //   active: true,
  // },
  // {
  //   id: "proj-2",
  //   name: "Cozy Scandinavian Bedroom",
  //   updatedAt: "2 days ago",
  //   thumbnail: BEDROOM_2_IMG,
  // },
  // {
  //   id: "proj-3",
  //   name: "Modern Japandi Bedroom",
  //   updatedAt: "1 week ago",
  //   thumbnail: BEDROOM_3_IMG,
  // },
  // {
  //   id: "proj-4",
  //   name: "Rustic Loft Bedroom",
  //   updatedAt: "2 weeks ago",
  //   thumbnail: BEDROOM_4_IMG,
  // },
];

// --- Available 3D Catalog Assets ---
export const SAMPLE_ASSETS: Asset[] = [
  {
    id: "armchair_01",
    name: "Arm Chair",
    category: "Furniture",
    image: ARMCHAIR_01,
    placementType: "floor",
    dimensions: { w: 0.848, d: 0.766, h: 1.065 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/armchair_01.glb",
    metadataCategory: "chair",
    description:
      "A compact armchair model with a modern design, suitable for living rooms, reading nooks, and cozy seating areas.",
    aliases: ["armchair", "recliner", "lounge chair", "ghế ngồi", "ghế thư giãn", "ghế sofa đơn"],
    tags: ["furniture", "seating", "chair"],
    materials: ["wood", "leather", "cushion"],
    placements: ["floor", "against_wall", "corner"],
  },
  {
    id: "books_1",
    name: "Books 1",
    category: "Storage",
    image: BOOKS_1,
    placementType: "tabletop",
    dimensions: { w: 0.5513, d: 0.1631, h: 0.2374 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/books_1.glb",
    metadataCategory: "shelving",
    description:
      "A compact bookshelf/display shelf model suitable for bedrooms, home offices, and small storage corners.",
    aliases: ["bookshelf", "bookcase", "display shelf", "kệ sách", "kệ trưng bày"],
    tags: ["furniture", "storage", "shelf", "bookshelf", "indoor"],
    materials: ["wood", "metal"],
    placements: ["floor", "against_wall", "corner"],
  },
  {
    id: "chess_set",
    name: "Chess Set",
    category: "Decor",
    image: CHESS_SET,
    placementType: "tabletop",
    dimensions: { w: 0.553, d: 0.553, h: 0.112 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/chess_set.glb",
    metadataCategory: "decor",
    description:
      "A compact chess set model suitable for bedroom desks, coffee tables, and game rooms. The set includes a chessboard with alternating wood textures and intricately designed chess pieces in classic black and white.",
    aliases: ["chess set", "chess board", "kệ cờ vua", "bảng cờ vua", "vật trang trí nhỏ gọn trên bàn"],
    tags: ["furniture", "decor", "board game", "tabletop"],
    materials: ["wood", "plastic"],
    placements: ["floor", "against_wall", "corner"],
  },
  {
    id: "coffee_table_round_01",
    name: "Coffee Table Round",
    category: "Furniture",
    image: COFFEE_TABLE_ROUND_01,
    placementType: "floor",
    dimensions: { w: 1.301, d: 1.301, h: 0.491 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/coffee_table_round_01.glb",
    metadataCategory: "table",
    description:
      "A round coffee table model with a modern design, suitable for living rooms, seating areas, and as a centerpiece for bedroom lounges.",
    aliases: ["coffee table", "round table", "table"],
    tags: ["furniture", "table", "coffee table", "coffee tea table"],
    materials: ["wood", "metal"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "dartboard",
    name: "Dartboard",
    category: "Decor",
    image: DARTBOARD,
    placementType: "wall",
    dimensions: { w: 0.4507, d: 0.0398, h: 0.4507 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/dartboard.glb",
    metadataCategory: "decor",
    description:
      "A classic, worn-out dartboard wall decoration featuring realistic scratches and grunge textures. Ideal for game rooms, bars, entertainment spaces, or vintage casual interiors.",
    aliases: ["dartboard", "dart board", "bảng ném phi tiêu", "bia phi tiêu", "bảng phi tiêu"],
    tags: ["game", "sport", "wall", "decor", "vintage", "grunge", "old", "realistic", "pub"],
    materials: ["wood", "metal", "cork"],
    placements: ["wall", "left_wall", "right_wall", "back_wall"],
  },
  {
    id: "drawer_cabinet",
    name: "Drawer Cabinet",
    category: "Storage",
    image: DRAWER_CABINET,
    placementType: "floor",
    dimensions: { w: 1.141, d: 0.488, h: 1.881},
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/drawer_cabinet.glb",
    metadataCategory: "shelving",
    description:
      "A modern-style tall drawer cabinet featuring a sleek design with multiple spacious drawers, ideal for bedroom storage. The cabinet has a minimalist aesthetic with clean lines and a neutral color palette.",
    aliases: ["drawer cabinet", "tall dresser", "storage cabinet", "tủ ngăn kéo", "tủ cao", "tủ gỗ"],
    tags: ["furniture", "storage", "cabinet", "dresser", "tall storage"],
    materials: ["wood", "metal"],
    placements: ["floor", "against_wall", "corner"],
  },
  {
    id: "fancy_picture_frame",
    name: "Fancy Picture Frame",
    category: "Decor",
    image: FANCY_PICTURE_FRAME,
    placementType: "wall",
    dimensions: { w: 0.603, d: 0.02, h: 0.4641 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/fancy_picture_frame.glb",
    metadataCategory: "decor",
    description:
      "An antique oil painting depicting a classic European landscape, enclosed in an elegantly carved wooden frame with ornate beaded detailing. Ideal for vintage living rooms, classic studies, museums, or luxury traditional interiors.",
    aliases: ["picture frame", "oil painting", "framed art", "khung tranh", "tranh treo tường", "tranh sơn dầu", "tranh cổ điển"],
    tags: ["wall", "decor", "art", "interior", "vintage painting", "antique", "classic", "oil painting", "landscape painting"],
    materials: ["wood", "canvas"],
    placements: ["wall", "left_wall", "right_wall", "back_wall"],
  },
  {
    id: "gothicbed_01",
    name: "Gothic Bed",
    category: "Furniture",
    image: GOTHICBED_01,
    placementType: "floor",
    dimensions: { w: 1.494, d: 2.040, h: 1.534 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/gothicbed_01.glb",
    metadataCategory: "furniture",
    description:
      "A majestic gothic-style bed featuring intricate wooden carvings and a sturdy frame, perfect for creating a dramatic focal point in any bedroom.",
    aliases: ["gothic bed", "medieval bed", "vintage bed", "giường cổ điển", "giường cỡ lớn"],
    tags: ["furniture", "bed", "vintage", "antique", "medieval", "luxury", "classic"],
    materials: ["wood", "metal", "cushion"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "greenchair_01",
    name: "Green Chair",
    category: "Furniture",
    image: GREENCHAIR_01,
    placementType: "floor",
    dimensions: { w: 0.673, d: 0.664, h: 1.059 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/greenchair_01.glb",
    metadataCategory: "chair",
    description:
      "A comfortable green chair with a modern design, perfect for adding a pop of color to any living space.",
    aliases: ["green chair", "modern chair", "living room chair", "ghế xanh", "ghế hiện đại"],
    tags: ["furniture", "chair", "modern", "living_room", "colorful"],
    materials: ["fabric", "wood"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "metal_office_desk",
    name: "Metal Office Desk",
    category: "Furniture",
    image: METAL_OFFICE_DESK,
    placementType: "floor",
    dimensions: { w: 2, d: 0.947, h: 0.788 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/metal_office_desk.glb",
    metadataCategory: "desk",
    description:
      "A sleek metal office desk with a modern design, perfect for a professional workspace.",
    aliases: ["office desk", "metal desk", "modern desk", "văn phòng", "bàn làm việc"],
    tags: ["furniture", "desk", "office", "modern", "professional"],
    materials: ["metal", "wood"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "mid_century_lounge_chair",
    name: "Mid Century Lounge Chair",
    category: "Furniture",
    image: MID_CENTURY_LOUNGE_CHAIR,
    placementType: "floor",
    dimensions: { w: 1.009, d: 1.190, h: 1.169 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/mid_century_lounge_chair.glb",
    metadataCategory: "chair",
    description:
      "A stylish mid-century lounge chair with a distinctive design, perfect for adding a touch of retro flair to any living space.",
    aliases: ["lounge chair", "mid-century chair", "vintage chair", "ghế thư giãn", "ghế cổ điển"],
    tags: ["furniture", "chair", "mid_century", "vintage", "retro"],
    materials: ["wood", "leather"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "modern_arm_chair_01",
    name: "Modern Arm Chair",
    category: "Furniture",
    image: MODERN_ARM_CHAIR_01,
    placementType: "floor",
    dimensions: { w: 0.820, d: 0.987, h: 1.023 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/modern_arm_chair_01.glb",
    metadataCategory: "chair",
    description:
      "A sleek modern arm chair with a contemporary design, perfect for a stylish living space.",
    aliases: ["modern chair", "arm chair", "living room chair", "ghế hiện đại", "ghế tay"],
    tags: ["furniture", "chair", "modern", "living_room", "contemporary"],
    materials: ["leather", "metal", "cushion"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "modern_coffee_table_01",
    name: "Modern Coffee Table",
    category: "Furniture",
    image: MODERN_COFFEE_TABLE_01,
    placementType: "floor",
    dimensions: { w: 1.202, d: 0.6, h: 0.39 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/modern_coffee_table_01.glb",
    metadataCategory: "table",  
    description:
      "A rough modern coffee table with a minimalist design, perfect for a contemporary living space.",
    aliases: ["modern coffee table", "coffee table", "stone table", "bàn cà phê hiện đại", "bàn thấp"],
    tags: ["furniture", "table", "modern", "minimalist"],
    materials: ["stone", "wood"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "ornate_mirror",
    name: "Ornate Mirror",
    category: "Decor",
    image: ORNATE_MIRROR,
    placementType: "wall",
    dimensions: { w: 0.4865, d: 0.026, h: 0.7442 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/ornate_mirror.glb",
    metadataCategory: "mirror",
    description:
      "An elegant arched wall mirror featuring a classic ornate golden frame with sophisticated crown carvings. The glass includes realistic aged textures and subtle smudges, perfect for vintage dressing rooms, luxury bathrooms, or classic hallways.",
    aliases: ["ornate mirror", "arched mirror", "wall mirror", "gương", "gương treo tường", "gương vòm", "gương cổ điển"],
    tags: ["wall", "decor", "reflective", "interior", "vintage", "antique", "classic", "luxury", "arched"],
    materials: ["glass", "metal"],
    placements: ["wall", "left_wall", "right_wall", "back_wall"],
  },
  {
    id: "ottoman_01",
    name: "Ottoman Chair",
    category: "Furniture",
    image: OTTOMAN_01,
    placementType: "floor",
    dimensions: { w: 0.885, d: 0.621, h: 0.624 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/ottoman_01.glb",
    metadataCategory: "chair",
    description: "A black versatile ottoman chair with a modern design, perfect for additional seating or as a footrest in any living space.",
    aliases: ["ottoman", "ottoman chair", "footstool", "ghế đôn", "ghế bành nhỏ"],
    tags: ["furniture", "chair", "ottoman", "footrest"],
    materials: ["wood", "leather"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "painted_wooden_chair_01",
    name: "Painted Wooden Chair",
    category: "Furniture",
    image: PAINTED_WOODEN_CHAIR_01,
    placementType: "floor",
    dimensions: { w: 0.432, d: 0.540, h: 0.957 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/painted_wooden_chair_01.glb",
    metadataCategory: "chair",
    description: "A white painted wooden chair with a minimal design",
    aliases: ["painted chair", "wooden chair", "ghế sơn màu", "ghế gỗ màu"],
    tags: ["furniture", "chair", "painting"],
    materials: ["wood", "paint"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "potted_plant_04",
    name: "Potted Plant 04",
    category: "Plants",
    image: POTTED_PLANT_04,
    placementType: "tabletop",
    dimensions: { w: 0.1703, d: 0.1859, h: 0.2676 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/potted_plant_04.glb",
    metadataCategory: "plant",
    description:
      "A realistic potted zebra succulent (Haworthia) plant featuring distinctive white-striped leaves, set in a white ceramic pot with decorative small pebbles on the soil surface. Ideal for modern desks, windowsills, offices, or interior staging.",
    aliases: [
      "zebra plant",
      "haworthia",
      "succulent",
      "potted plant",
      "cây móng rồng",
      "sen đá móng rồng",
      "chậu cây cảnh",
      "cây để bàn",
    ],
    tags: ["nature", "indoor", "decor", "tabletop", "realistic", "modern", "greenery", "office"],
    materials: ["ceramic", "organic", "stone"],
    placements: ["tabletop", "countertop", "desk", "shelf", "windowsill"],
  },
  {
    id: "rockingchair_01",
    name: "Rocking Chair",
    category: "Furniture",
    image: ROCKINGCHAIR_01,
    placementType: "floor",
    dimensions: { w: 0.708, d: 0.834, h: 0.995 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/rockingchair_01.glb",
    metadataCategory: "chair",
    description: "A classic wooden rocking chair with a vintage design, perfect for a cozy corner in any living space.",
    aliases: ["rocking chair", "wooden rocking chair", "ghế bập bênh", "ghế gỗ bập bênh"],
    tags: ["furniture", "chair", "rocking chair", "vintage"],
    materials: ["wood"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "small_wooden_table_01",
    name: "Small Wooden Table",
    category: "Furniture",
    image: SMALL_WOODEN_TABLE_01,
    placementType: "floor",
    dimensions: { w: 0.916, d: 0.44, h: 0.533 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/small_wooden_table_01.glb",
    metadataCategory: "table",
    description: "A small wooden table with a rustic design, perfect for a cozy corner in any living space.",
    aliases: ["small table", "wooden table", "bàn gỗ nhỏ", "bàn phụ"],
    tags: ["furniture", "table", "wooden", "rustic"],
    materials: ["wood"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "sofa_02",
    name: "Black Modern Sofa",
    category: "Furniture",
    image: SOFA_02,
    placementType: "floor",
    dimensions: { w: 1.807, d: 0.818, h: 0.71 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/Sofa_02.glb",
    metadataCategory: "sofa",
    description:
      "A black sleek modern sofa with a retro design, featuring a low-profile silhouette, clean lines, and plush cushions upholstered in a neutral gray fabric.",
    aliases: [
      "sofa", "couch", "modern sofa", "ghế sofa", "ghế sofa hiện đại", "ghế băng dài", "ghế phòng khách",
    ],
    tags: ["seating", "sofa", "retro"],
    materials: ["wood", "leather", "cushion"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "sofa_01",
    name: "White Sofa",
    category: "Seating",
    image: SOFA_01,
    placementType: "floor",
    dimensions: { w: 1.5715, d: 0.658, h: 0.7965 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/Sofa_01.glb",
    metadataCategory: "sofa",
    description:
      "An antique-style 2-seater sofa featuring a light, gracefully curved wooden frame and cabriole legs, upholstered in premium light gray fabric. ",
    aliases: [
      "sofa", "couch", "classic sofa", "vintage couch", "ghế sofa", "ghế sofa cổ điển", "ghế băng dài", "ghế phòng khách",
    ],
    tags: [
      "seating", "classic", "vintage", "antique", "luxury", "french_style",
    ],
    materials: ["wood", "fabric"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "sofa_03",
    name: "Brown retro Sofa",
    category: "Furniture",
    image: SOFA_03,
    placementType: "floor",
    dimensions: { w: 2.731, d: 0.925, h: 1.118 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/Sofa_03.glb",
    metadataCategory: "sofa",
    description:
      "A brown retro sofa with a mid-century modern design, featuring a low-profile silhouette, clean lines, and plush cushions upholstered in a warm brown fabric.",
    aliases: [
      "sofa", "couch", "retro sofa", "ghế sofa", "ghế sofa retro", "ghế băng dài", "ghế phòng khách",
    ],
    tags: ["seating", "sofa", "retro"],
    materials: ["wood", "leather", "cushion"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "steel_frame_shelves_01",
    name: "5-tier Large Steel Frame Shelves",
    category: "Storage",
    image: STEEL_FRAME_SHELVES_01,
    placementType: "floor",
    dimensions: { w: 1.097, d: 0.502, h: 2.142 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/steel_frame_shelves_01.glb",
    metadataCategory: "shelving",
    description:
      "A minimalist-style shelving with 5 tiers, ideal for displaying books, decor, and storage baskets in bedrooms, living rooms, or home offices.",
    aliases: [
      "bookshelf", "storage unit", "display shelf", "bookcase", "kệ sách", "kệ trưng bày", "tủ kệ công nghiệp", "kệ khung sắt",
    ],
    tags: ["furniture", "storage", "modern", "industrial"],
    materials: ["wood", "metal"],
    placements: ["floor", "against_wall", "corner"],
  },
  {
    id: "steel_frame_shelves_02",
    name: "5-tier Small Steel Frame Shelves",
    category: "Storage",
    image: STEEL_FRAME_SHELVES_02,
    placementType: "floor",
    dimensions: { w: 0.7212, d: 0.502, h: 1.8118 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/steel_frame_shelves_02.glb",
    metadataCategory: "shelving",
    description:
      "A compact minimalist-style shelving with 5 tiers, ideal for displaying books, decor, and storage baskets in bedrooms, living rooms, or home offices.",
    aliases: [
      "bookshelf", "storage unit", "display shelf", "bookcase", "kệ sách", "kệ trưng bày", "tủ kệ công nghiệp", "kệ khung sắt",
    ],
    tags: ["furniture", "storage", "modern", "industrial"],
    materials: ["wood", "metal"],
    placements: ["floor", "against_wall", "corner"],
  },
  {
    id: "steel_frame_shelves_03",
    name: "Staggered Steel Frame Shelves",
    category: "Storage",
    image: STEEL_FRAME_SHELVES_03,
    placementType: "floor",
    dimensions: { w: 2.3511, d: 0.7212, h: 2.3118 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/steel_frame_shelves_03.glb",
    metadataCategory: "shelving",
    description:
      "A large industrial-style shelving unit featuring staggered wooden display shelves and a bottom 3-drawer storage cabinet, supported by a black powder-coated metal frame. Perfect for modern living rooms, home offices, or studio apartments.",
    aliases: [
      "bookshelf", "storage unit", "display shelf", "bookcase", "kệ sách", "kệ trưng bày", "tủ kệ công nghiệp", "kệ khung sắt",
    ],
    tags: [
      "furniture", "storage", "industrial", "modern", "loft",
    ],
    materials: ["wood", "metal"],
    placements: ["floor", "against_wall", "corner"],
  },
  {
    id: "treasure_chest",
    name: "Treasure Chest",
    category: "Storage",
    image: TREASURE_CHEST,
    placementType: "floor",
    dimensions: { w: 0.959, d: 0.523, h: 0.619 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/treasure_chest.glb",
    metadataCategory: "chest",
    description:
      "A vintage-style treasure chest with a rustic design, perfect for storing keepsakes or as a decorative piece in any living space.",
    aliases: ["treasure chest", "storage chest", "vintage chest", "rương kho báu", "hòm đựng đồ"],
    tags: ["furniture", "storage", "vintage"],
    materials: ["wood", "metal"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "vintage_suitcase",
    name: "Vintage Suitcase",
    category: "Storage",
    image: VINTAGE_SUITCASE,
    placementType: "tabletop",
    dimensions: { w: 1.608, d: 0.239, h: 0.568 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/vintage_suitcase.glb",
    metadataCategory: "storage",
    description:
      "A vintage-style suitcase with a classic design, perfect for storing clothes or as a decorative piece in any living space.",
    aliases: ["vintage suitcase", "storage suitcase", "classic suitcase", "rương vali", "hòm hành lý"],
    tags: ["furniture", "storage", "vintage"],
    materials: ["wood", "metal"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "vintage_wooden_drawer_01",
    name: "Vintage Wooden Drawer",
    category: "Storage",
    image: VINTAGE_WOODEN_DRAWER_01,
    placementType: "floor",
    dimensions: { w: 0.858, d: 0.457, h: 0.545 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/vintage_wooden_drawer_01.glb",
    metadataCategory: "drawer",
    description:
      "A vintage-style wooden drawer with a rustic design, perfect for storing clothes or as a decorative piece in any living space.",
    aliases: ["vintage drawer", "wooden drawer", "storage drawer", "ngăn kéo gỗ", "tủ ngăn kéo"],
    tags: ["furniture", "storage", "vintage"],
    materials: ["wood", "metal"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "wooden_display_shelves_01",
    name: "Wooden Display Shelves",
    category: "Storage",
    image: WOODEN_DISPLAY_SHELVES_01,
    placementType: "floor",
    dimensions: { w: 1.08, d: 0.372, h: 1.556 },
    wallClearance: 0.02,
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/wooden_display_shelves_01.glb",
    metadataCategory: "shelving",
    description:
      "A rustic-style wooden display shelf with a simple design, perfect for displaying books or decorative items in any living space.",
    aliases: ["display shelves", "wooden shelves", "kệ trưng bày gỗ", "kệ gỗ"],
    tags: ["furniture", "storage", "wooden"],
    materials: ["wood"],
    placements: ["floor", "against_wall", "corner"],
  },
  {
    id: "wooden_table_02",
    name: "Square Wooden Table",
    category: "Furniture",
    image: WOODEN_TABLE_02,
    placementType: "floor",
    dimensions: { w: 1.134, d: 0.706, h: 0.799 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/wooden_table_02.glb",
    metadataCategory: "table",
    description: "A square wooden table with a rustic design, perfect for a cozy corner in any living space.",
    aliases: ["square table", "wooden table", "bàn gỗ vuông", "bàn phụ"],
    tags: ["furniture", "table", "wooden", "rustic"],
    materials: ["wood"],
    placements: ["floor", "center", "against_wall"],
  },
  {
    id: "parametric_window",
    name: "Parametric Window",
    category: "Architectural",
    image: PARAMETRICWINDOW,
    placementType: "opening",
    dimensions: { w: 1.5, d: 0.1, h: 1.5 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/ParametricWindow.glb",
    metadataCategory: "window",
    description: "A parametric window with a modern design, perfect for any living space.",
    aliases: ["parametric window", "modern window", "cửa sổ hiện đại"],
    tags: ["architectural", "window", "modern"],
    materials: ["glass", "metal"],
    placements: ["wall"],
  },
  {
    id: "back_room_door",
    name: "Back Room Door",
    category: "Architectural",
    image: BACK_ROOM_DOOR,
    placementType: "opening",
    dimensions: { w: 0.9, d: 0.1, h: 2.0 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/BackRoomDoor.glb",
    metadataCategory: "door",
    description: "A modern back room door with a sleek design, perfect for any living space.",
    aliases: ["back room door", "modern door", "cửa phòng"],
    tags: ["architectural", "door", "modern"],
    materials: ["wood", "metal"],
    placements: ["wall"],
  },
  {
    id: "window_blinds",
    name: "Window Blinds",
    category: "Architectural",
    image: WINDOW_BLINDS,
    placementType: "opening",
    dimensions: { w: 1.5, d: 0.1, h: 1.5 },
    defaultScale: [1, 1, 1],
    glbUrl: "http://127.0.0.1:8000/inputs/WindowBlinds.glb",
    metadataCategory: "blinds",
    description: "A modern window blinds with a sleek design, perfect for any living space.",
    aliases: ["window blinds", "modern blinds", "rèm cửa sổ"],
    tags: ["architectural", "blinds", "modern"],
    materials: ["fabric", "metal"],
    placements: ["wall"],
  }
];

// --- Workspace & scene settings defaults ---
export const RENDER_QUALITY_OPTIONS = [
  { id: "low" as const, label: "Low" },
  { id: "medium" as const, label: "Medium" },
  { id: "high" as const, label: "High" },
];

export const DEFAULT_WORKSPACE_SETTINGS = {
  renderQuality: "high" as const,
  gridSnapping: true,
};

export const DEFAULT_SCENE_SETTINGS = {
  environmentId: "hdri-studio",
  gridOverlay: true,
  realisticLighting: true,
  softShadows: true,
  cameraFov: 50,
};

export const WORKSPACE_SHORTCUTS = [
  { section: "General", keys: "Ctrl+K", description: "Open command palette" },
  { keys: "Ctrl+B", description: "Toggle sidebar" },
  { keys: "Ctrl+Z", description: "Undo" },
  { keys: "Ctrl+Y", description: "Redo" },
  { keys: "Ctrl+S", description: "Save bedroom layout (coming soon)" },
  { keys: "Ctrl+Shift+E", description: "Export 2D blueprint" },
  { section: "View", keys: "G", description: "Toggle 3D floor grid" },
  { keys: "S", description: "Toggle grid snapping" },
  { keys: "Scroll", description: "Zoom in / out (3D view)" },
  {
    section: "Selection",
    keys: "Q or [",
    description: "Rotate selected object left 90°",
  },
  { keys: "E or ]", description: "Rotate selected object right 90°" },
  { keys: "F", description: "Flip selected object 180°" },
  { keys: "Esc", description: "Clear selection (or cancel placement while dragging)" },
];

export const ABOUT_DECORGEN = {
  tagline: "AI-powered bedroom layout designer",
  description:
    "DecorGen helps you plan and visualize bedroom layouts in 2D and 3D before committing to furniture purchases.",
};

// --- Initial Scene Node Tree (R3F Hierarchy) ---
export const INITIAL_TREE: SceneNode[] = [
  {
    id: "cam-1",
    name: "Main Camera",
    type: "camera",
    visible: true,
    locked: true,
    fov: 50,
  },
  {
    id: "light-1",
    name: "Directional Sun Light",
    type: "light",
    visible: true,
    locked: false,
    lightKind: "directional",
    intensity: 1.35,
    castShadow: true,
    position: [5, 12, 5],
  },
  {
    id: "light-2",
    name: "Ambient Light",
    type: "light",
    visible: true,
    locked: false,
    lightKind: "ambient",
    intensity: 0.65,
  },
  {
    id: "group-1",
    name: "Bedroom Furniture",
    type: "group",
    visible: true,
    locked: false,
    expanded: true,
    children: [
      {
        id: "model-1",
        name: "King Size Velvet Bed",
        type: "model",
        visible: true,
        locked: false,
        position: [-0.5, 0.5, -0.4],
        rotation: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        color: "#6366f1",
        assetId: "bed-1",
        placementType: "floor",
        dimensions: { w: 2.0, d: 2.2, h: 1.0 },
        glbUrl: "/models/furniture/king_bed.glb",
        defaultElevation: 0,
        materials: {
          body: "wood-walnut",
          cushion: "fabric-velvet",
          legs: "metal-gold",
        },
      },
      {
        id: "model-2",
        name: "Oak Wood Nightstand",
        type: "model",
        visible: true,
        locked: false,
        expanded: true,
        position: [0.9, 0.275, -1.0],
        rotation: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        color: "#f59e0b",
        assetId: "storage-1",
        placementType: "floor",
        dimensions: { w: 0.5, d: 0.45, h: 0.55 },
        glbUrl: "/models/furniture/nightstand.glb",
        defaultElevation: 0,
        materials: {
          body: "wood-oak",
        },
        children: [
          {
            id: "model-3",
            name: "Bedside Brass Lamp",
            type: "model",
            visible: true,
            locked: false,
            position: [0, 0.565, 0],
            rotation: [0, 0, 0],
            scale: [1.0, 1.0, 1.0],
            color: "#10b981",
            assetId: "lamp-1",
            placementType: "tabletop",
            dimensions: { w: 0.28, d: 0.28, h: 0.58 },
            glbUrl: "/models/furniture/brass_lamp.glb",
            defaultElevation: 0.55,
            materials: {
              shade: "fabric-linen",
              base: "metal-gold",
            },
          },
        ],
      },
      {
        id: "model-4",
        name: "Modern Entrance Door",
        type: "model",
        visible: true,
        locked: false,
        position: [-1.2, 1.0, 1.7],
        rotation: [0, Math.PI, 0],
        scale: [-1.0, 1.0, 1.0],
        color: "#d97706",
        assetId: "door-1",
        placementType: "opening",
        dimensions: { w: 0.9, d: 0.1, h: 2.0 },
        swingDirection: "left",
        glbUrl: "/models/openings/door.glb",
        defaultElevation: 0,
      },
      {
        id: "model-5",
        name: "Panoramic Glass Window",
        type: "model",
        visible: true,
        locked: false,
        position: [0, 0.9 + 0.6, -1.7],
        rotation: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        color: "#60a5fa",
        assetId: "window-1",
        placementType: "opening",
        dimensions: { w: 1.4, d: 0.15, h: 1.2 },
        swingDirection: "none",
        glbUrl: "/models/openings/window.glb",
        defaultElevation: 0.9,
      },
      {
        id: "model-6",
        name: "Wall-Mounted Smart TV",
        type: "model",
        visible: true,
        locked: false,
        position: [1.95, 1.2, 0],
        rotation: [0, -Math.PI / 2, 0],
        scale: [1.0, 1.0, 1.0],
        color: "#475569",
        assetId: "electronics-1",
        placementType: "wall",
        dimensions: { w: 1.2, d: 0.05, h: 0.7 },
        glbUrl: "/models/electronics/smart_tv.glb",
        defaultElevation: 1.2,
        materials: {
          screen: "glass-frosted",
          frame: "metal-brushed",
        },
      },
    ],
  },
];

// ============================================================================
// Design Presets and Customization Options
// ============================================================================

// --- Material Texture Presets ---
export const MATERIAL_PRESETS: MaterialPreset[] = [
  { id: "fabric-velvet", name: "Premium Velvet Fabric", category: "Fabric" },
  { id: "fabric-linen", name: "Natural Linen", category: "Fabric" },
  { id: "wood-walnut", name: "Polished Walnut Wood", category: "Wood" },
  { id: "wood-oak", name: "Light Oak Wood", category: "Wood" },
  { id: "metal-brushed", name: "Brushed Steel", category: "Metal" },
  { id: "metal-gold", name: "Polished Gold", category: "Metal" },
  { id: "leather-vintage", name: "Vintage Brown Leather", category: "Leather" },
  { id: "glass-frosted", name: "Frosted Glass", category: "Glass" },
  { id: "ceramic-marble", name: "White Calacatta Marble", category: "Ceramic" },
];

// --- Theme Color Swatches ---
export const COLOR_SWATCHES: ColorSwatch[] = [
  { name: "Emerald", value: "#10b981" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Slate", value: "#64748b" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Crimson", value: "#be123c" },
  { name: "Navy", value: "#1e3a8a" },
  { name: "Charcoal", value: "#18181b" },
];

export const WALL_COLORS = [
  { name: "Pure White", value: "#f8fafc" },
  { name: "Off-White", value: "#fafaf9" },
  { name: "Sage Green", value: "#dcfce7" },
  { name: "Sky Blue", value: "#e0f2fe" },
  { name: "Cool Gray", value: "#e2e8f0" },
];

export const FLOOR_COLORS = [
  { name: "Oak Wood", value: "#d97706" },
  { name: "Walnut Wood", value: "#b45309" },
  { name: "Slate Tile", value: "#475569" },
  { name: "Light Marble", value: "#f1f5f9" },
  { name: "Ash Gray", value: "#94a3b8" },
];

// --- Configurable Object Sub-parts ---
export const OBJECT_PARTS: ObjectPart[] = [
  { id: "body", name: "Main Frame" },
  { id: "cushion", name: "Cushions/Mattress" },
  { id: "legs", name: "Legs/Base" },
];

// --- Search / Filters Category Listing ---
export const CATEGORIES = [
  "All",
  "Beds",
  "Storage",
  "Seating",
  "Lighting",
  "Decor",
  "Kitchenware",
  "Tables",
  "Plants",
  "Pets",
  "Openings",
];

// --- Search Suggestion Objects ---
export const SCENE_OBJECTS: SceneObject[] = [
  { id: "1", name: "King Size Velvet Bed", category: "Beds" },
  { id: "2", name: "Japandi Platform Bed", category: "Beds" },
  { id: "3", name: "Oak Wood Nightstand", category: "Storage" },
  { id: "4", name: "Modern 3-Door Wardrobe", category: "Storage" },
  { id: "5", name: "Bouclé Accent Chair", category: "Seating" },
  { id: "6", name: "Bedside Brass Lamp", category: "Lighting" },
  { id: "7", name: "Monochrome Wool Rug", category: "Decor" },
  { id: "8", name: "Full-Length Standing Mirror", category: "Decor" },
  { id: "9", name: "Modern Wooden Door", category: "Openings" },
  { id: "10", name: "Panoramic Glass Window", category: "Openings" },
];

/** HDRI crossfade duration when switching environment presets (seconds). */
export const ENV_TRANSITION_SEC = 0.45;

/** Default scene.environmentIntensity when a preset omits `intensity`. */
export const ENVIRONMENT_INTENSITY = 0.45;

// --- 3D Environment Map Lighting Presets ---
export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  {
    id: "hdri-studio",
    name: "Studio Light (Neutral)",
    dreiPreset: "studio",
    intensity: 0.22,
  },
  { id: "hdri-sunset", name: "Warm Sunset", dreiPreset: "sunset", intensity: 0.5 },
  { id: "hdri-daylight", name: "Bright Daylight", dreiPreset: "city", intensity: 0.48 },
  { id: "hdri-interior", name: "Cozy Interior", dreiPreset: "apartment", intensity: 0.58 },
  { id: "hdri-forest", name: "Moody Forest", dreiPreset: "forest", intensity: 0.42 },
];

export const SYSTEM_NODE_IDS = ["cam-1", "light-1", "light-2"] as const;

// ============================================================================
// AI Detection Blueprint Mock Data
// ============================================================================

// --- List of OCR Detected Layout Items ---
export const SAMPLE_DETECTED_OBJECTS: DetectedObject[] = [
  {
    id: "obj-1",
    name: "Room",
    selected: true,
    details: "Size: 4.0m × 3.5m",
    category: "room",
  },
  {
    id: "obj-2",
    name: "Bed",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-3",
    name: "Window",
    selected: true,
    details: "Width: 1.2m",
    category: "opening",
  },
  {
    id: "obj-4",
    name: "Chair",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-5",
    name: "Nightstand",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-6",
    name: "Wardrobe",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-7",
    name: "Lamp",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-8",
    name: "Window",
    selected: true,
    details: "Width: 1.2m",
    category: "opening",
  },
  {
    id: "obj-9",
    name: "Window",
    selected: true,
    details: "Width: 1.5m",
    category: "opening",
  },
  {
    id: "obj-10",
    name: "Chair",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-11",
    name: "Nightstand",
    selected: true,
    category: "furniture",
  },
  {
    id: "obj-12",
    name: "Lamp",
    selected: true,
    category: "furniture",
  },
];

// --- Raw JSON layout output from AI model ---
export const DETECTED_RAW_JSON = {
  room: {
    width: 4000,
    length: 3500,
    height: 2800,
  },
  openings: [
    {
      type: "window",
      x: 4000,
      y: 1750,
      width: 1200,
      rotation: 90,
    },
    {
      type: "window",
      x: 0,
      y: 1750,
      width: 1200,
      rotation: -90,
    },
    {
      type: "window",
      x: 2000,
      y: 3500,
      width: 1500,
      rotation: 0,
    },
  ],
  furniture: [
    {
      label: "bed",
      x: 900,
      y: 1000,
      rotation: -90,
    },
    {
      label: "chair",
      x: 3000,
      y: 2500,
      rotation: 180,
    },
    {
      label: "chair",
      x: 3000,
      y: 2000,
      rotation: 180,
    },
    {
      label: "nightstand",
      x: 900,
      y: 2000,
      rotation: 0,
    },
    {
      label: "nightstand",
      x: 900,
      y: 2500,
      rotation: 0,
    },
    {
      label: "wardrobe",
      x: 2000,
      y: 500,
      rotation: 90,
    },
    {
      label: "lamp",
      x: 900,
      y: 2200,
      rotation: 0,
    },
    {
      label: "lamp",
      x: 900,
      y: 2700,
      rotation: 0,
    },
  ],
};
