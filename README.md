# Web Rhythm Game (SSC-based)

Game rhythm chạy trên web, parse chart từ StepMania/ITG `.ssc`, render note theo audio clock, và expose API bằng Node.js + Express.

## Yêu cầu

- Node.js 18+ (khuyến nghị LTS mới nhất)
- npm

## Cài đặt

```bash
npm install
```

## Chạy local

```bash
npm start
```

Server sẽ:

- Serve toàn bộ static từ `public/` tại `http://localhost:<port>`
- Expose API:
  - `GET /api/songs`
  - `GET /api/songs/:songId`
  - `GET /api/charts/:chartId`
- Tự fallback port nếu `PORT` bị bận (mặc định từ `3000` và tăng dần tối đa +40 port)

## Cấu trúc chính

```text
project/
├─ src/
│  ├─ server/                        # Node.js Express server
│  │  ├─ index.js                    # Express server + port fallback
│  │  ├─ SongCatalogService.js       # Quét thư mục bài hát, build catalog
│  │  ├─ SscParser.js                # Parse raw .ssc
│  │  ├─ SscTimingResolver.js        # Beat → ms resolver
│  │  └─ SscChartExtractor.js        # Chuẩn hóa chart + note events
│  └─ client/                        # Web client (ES Modules API)
│     ├─ main.js                     # Entry point
│     ├─ control/                    # SceneController, PlayController, InputController
│     ├─ data/                       # Repository + Adapter + Validator
│     ├─ model/                      # GameEngine, GameClock, Judgement, Score, Chart…
│     ├─ shared/                     # EventBus
│     └─ view/                       # GameView, NoteView, LaneView, AssetLoader…
├─ public/                           # Static root (served by Express)
│  ├─ index.html
│  ├─ css/style.css
│  └─ assets/                        # Optional UI sprites (xem bên dưới)
│     ├─ backgrounds/                # playfield.png
│     ├─ notes/                      # note-0.png … note-3.png
│     ├─ receptors/                  # receptor-0.png … receptor-3.png
│     └─ ui/                         # btn-play.png, btn-pause.png…
├─ data/songs/                       # Simfiles (.ssc) + audio + images
└─ .agent/docs/                      # Architecture & build-phase docs
```

## Custom Assets (tuỳ chọn)

Tất cả assets đều optional. Nếu file PNG tồn tại, game dùng ảnh. Nếu không, CSS gradient/SVG fallback được dùng tự động.

| Folder | File | Mô tả |
|---|---|---|
| `assets/notes/` | `note-0.png` … `note-3.png` | Sprite per-lane note (khuyến nghị 48×48, transparent PNG) |
| `assets/receptors/` | `receptor-0.png` … `receptor-3.png` | Sprite per-lane receptor (khuyến nghị 80×80) |
| `assets/backgrounds/` | `playfield.png` | Background playfield (any resolution, auto cover) |
| `assets/ui/` | `btn-play.png`, `btn-pause.png`… | Button sprites |

Xem `public/assets/ASSETS.md` để biết chi tiết.

## Kiến trúc runtime (ngắn gọn)

1. `src/server/*` parse `.ssc` và trả payload chart qua API.
2. `src/client/data/*` validate + adapt payload sang model nội bộ.
3. `GameClock` lấy thời gian trực tiếp từ audio element (single source of truth).
4. `GameEngine` dùng thời gian đó để:
   - tick miss
   - handle input và judgement
   - xuất `RenderSnapshot`
5. `View` render snapshot + hiệu ứng visual (Anime.js chỉ dùng cho animation UI, không quyết định timing gameplay).
6. `AssetLoader` probe ảnh từ `assets/`, inject CSS overrides nếu có — không ảnh hưởng gameplay logic.

## Timing model

- `hitTimeMs` của note được tính theo beat/BPM/STOPS/DELAYS.
- Chart offset được apply ở runtime clock.
- Position note trên màn hình map theo:
  - `y = hitLineY - (note.hitTimeMs - currentTimeMs) * PX_PER_MS`

## Dữ liệu bài hát

Đặt bài hát vào `data/songs/<song-folder>/` với tối thiểu:

- file nhạc (`.ogg`/`.mp3`/...)
- file `.ssc`
- optional ảnh banner/background

Catalog sẽ được rebuild mỗi lần start server.

## Ghi chú phát triển

- Không move gameplay rules sang layer view.
- Input mapping tách khỏi judgement logic.
- Nếu chỉnh timing/judgement, ưu tiên thay ở `model` layer (`GameEngine`, `JudgementSystem`, `SscTimingResolver`).
