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

- Serve frontend static tại `http://localhost:<port>`
- Expose API:
  - `GET /api/songs`
  - `GET /api/songs/:songId`
  - `GET /api/charts/:chartId`
- Tự fallback port nếu `PORT` bị bận (mặc định từ `3000` và tăng dần tối đa +40 port)

## Cấu trúc chính

```text
project/
├─ server.js                         # Express server + port fallback
├─ server/
│  ├─ SongCatalogService.js          # Quét thư mục bài hát, build catalog
│  ├─ SscParser.js                   # Parse raw .ssc
│  ├─ SscTimingResolver.js           # Beat -> ms resolver
│  └─ SscChartExtractor.js           # Chuẩn hóa chart + note events
├─ public/
│  ├─ index.html
│  ├─ css/style.css
│  └─ js/
│     ├─ main.js
│     ├─ control/                    # SceneController, PlayController, InputController
│     ├─ data/                       # Repository + Adapter + Validator
│     ├─ model/                      # GameEngine, GameClock, Judgement, Score, Chart...
│     ├─ shared/                     # EventBus
│     └─ view/                       # GameView, LaneView, NoteView, HUDView, EffectView...
└─ data/songs/                       # Asset + simfile (.ssc)
```

## Kiến trúc runtime (ngắn gọn)

1. `server/*` parse `.ssc` và trả payload chart qua API.
2. `public/js/data/*` validate + adapt payload sang model nội bộ.
3. `GameClock` lấy thời gian trực tiếp từ audio element (single source of truth).
4. `GameEngine` dùng thời gian đó để:
   - tick miss
   - handle input và judgement
   - xuất `RenderSnapshot`
5. `View` render snapshot + hiệu ứng visual (Anime.js chỉ dùng cho animation UI, không quyết định timing gameplay).

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
