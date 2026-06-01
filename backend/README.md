# Prompt to GLB API

Backend nhan prompt, chon asset `.glb` phu hop trong `inputs/`, va tra ve file `.glb` de frontend hoac Swagger UI test truc tiep.

## Chay server

```powershell
py -3 -m src.pipeline.server
```

Server mac dinh:

```text
http://127.0.0.1:8000
```

Mo Swagger UI:

```text
http://127.0.0.1:8000/docs
```

## Endpoint chinh

### POST /api/glb

Nhap prompt va tai ve file `.glb` phu hop.

Request:

```json
{
  "prompt": "Mot chiec sofa mau xanh dat canh cua so"
}
```

Response:

- `Content-Type: model/gltf-binary`
- Body la binary `.glb`
- Header `X-Scene-Metadata` co thong tin asset/transform/color

### POST /api/scene

Nhap prompt va nhan JSON metadata, huu ich cho frontend can biet `asset_url`, transform, color.

```json
{
  "prompt": "Mot ban picnic go dat giua phong"
}
```

Response mau:

```json
{
  "asset_id": "wooden_picnic_table",
  "asset_url": "/inputs/wooden_picnic_table.glb",
  "file_name": "wooden_picnic_table.glb",
  "format": "glb",
  "transform": {
    "position": [0.0, 0.0, 0.0],
    "rotation": [0.0, 0.0, 0.0],
    "scale": [1.0, 1.0, 1.0]
  },
  "color_overlay": [1.0, 1.0, 1.0]
}
```

### GET /api/assets

Liet ke tat ca asset `.glb` trong `inputs/`.

### POST /api/floor-plan/analyze

Upload anh mat bang 2D va nhan JSON cac object hinh chu nhat duoc detect kem toa do xOy, goc xoay va OCR label.

Request `multipart/form-data`:

```text
file=<floor_plan.png>
```

Vi du PowerShell:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/floor-plan/analyze -F "file=@inputs/floor_plan.png"
```

OCR can them phan mem Tesseract-OCR ben ngoai package Python `pytesseract`.
Neu Tesseract khong nam trong `PATH`, set bien moi truong truoc khi chay server:

```powershell
$env:TESSERACT_CMD = "C:\Program Files\Tesseract-OCR\tesseract.exe"
python -m src.pipeline.server
```

Response mau:

```json
{
  "image": { "width": 1024, "height": 768 },
  "room": {
    "axes": { "Ox": 350, "Oy": 300 }
  },
  "items": [
    {
      "label": "table",
      "coordinates": { "x": 210.5, "y": 120.0 },
      "rotate": 0.0,
      "ocr_confidence": 82.4
    }
  ],
  "warnings": [],
  "source": "floor_plan.png"
}
```

### GET /inputs/<file>.glb

Lay truc tiep mot file `.glb`.

## Asset hien co

- `Sofa_01.glb`: prompt co `sofa`, `ghe sofa`, `couch`
- `bench.glb`: prompt co `bench`, `bang ghe`, `ghe dai`
- `wooden_picnic_table.glb`: prompt co `table`, `ban`, `picnic`
- `steel_frame_shelves.glb`: prompt co `shelf`, `shelves`, `ke`

Neu prompt khong match asset nao, API tra `404` kem danh sach asset dang co.
