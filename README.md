# Campus Gate — Multi-Camera Vehicle Identification & Entry Auditing

Campus Gate is a campus vehicle-entry auditing system built on existing CCTV
infrastructure. A central server runs vehicle/plate detection (YOLO + OCR),
tracks vehicles per camera, reconciles observations across cameras, checks
plates against an authorized-vehicle registry, and serves a control-room
dashboard plus a guard interface. Uncertain cases are preserved for human
review rather than guessed.

Core principle: *identify what the system can verify, preserve what it
cannot, and send uncertain cases for human review.* See
[Docs/project_blueprint.md](Docs/project_blueprint.md) for the full design.

## Architecture

```text
CCTV cameras (RTSP) ──► Ingestion ──► YOLO detection + OCR ──► Reconciliation ──► Dashboard / Guards
                                         (FastAPI server)        (topology +          (React app +
                                          + Postgres)             travel windows)      static fallback)
```

| Component | Stack | Location |
|---|---|---|
| API + vision server | FastAPI, SQLAlchemy, OpenCV, Ultralytics YOLO, EasyOCR | `backend/` |
| Dashboard frontend | React 19, Vite, Recharts | `frontend/` |
| Database | PostgreSQL 16 (Docker); SQLite fallback | `docker-compose.yml` |
| Model training | Ultralytics YOLO fine-tuning | `ml_training/` |
| Live webcam tester | OpenCV + ANPR pipeline | `test_webcam.py` |

## Quickstart

### 1. Prerequisites

- Python 3.11+ with `pip`
- Node.js 18+ with `npm`
- Docker (for PostgreSQL), or use the SQLite fallback

### 2. Database

```powershell
Copy-Item .env.example .env
docker compose up -d
```

This starts PostgreSQL on `localhost:5433`. Without Docker, the server falls
back to SQLite (`campusgate.db`) via `FALLBACK_SQLITE_URL`.

### 3. Backend

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m backend.seed_data   # cameras, topology, authorized vehicles
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health
- Bundled static dashboard: http://localhost:8000/ (also `/dashboard`)

### 4. Frontend (React dashboard)

```powershell
cd frontend
npm install
npm run dev
```

Serves on http://localhost:3000. Note: `vite.config.js` proxies `/api`,
`/ws`, and `/static` to `localhost:8080`, so run the backend with
`API_PORT=8080` (in `.env`) or adjust the proxy targets.

```powershell
npm run build    # production build into frontend/dist
npm run preview  # preview the production build
```

### 5. End-to-end demo (no cameras needed)

```powershell
.venv\Scripts\python.exe backend/run_demo.py
```

Simulates two scenarios against the real database and reconciliation engine:
direct authorized entry via gate OCR, and an unreadable gate plate resolved
through a cross-camera handoff at a downstream camera.

### 6. Live webcam ANPR test

```powershell
.venv\Scripts\python.exe test_webcam.py --cam 0 --conf 0.35 --ocr
```

Uses your laptop webcam to exercise the snapshot-first detection/OCR
pipeline. Keys: `q` quit, `s` save snapshot, `c` simulate crossing,
`m` mirror, `l` toggle entry line. Inference snapshots land in
`webcam_snapshots/`.

## API reference

| Method & path | Description |
|---|---|
| `GET /api/cameras`, `POST /api/cameras` | List / register cameras |
| `GET /api/cameras/topology`, `POST /api/cameras/topology` | Route graph + travel-time windows |
| `GET /api/authorized`, `POST /api/authorized` | Authorized-vehicle registry |
| `GET /api/authorized/check/{plate}` | Authorization lookup for one plate |
| `GET /api/entries` | Entry events (filters: status, camera, plate, date range) |
| `GET /api/entries/summary` | Audit counts (authorized / unauthorized / review / associated) |
| `GET /api/entries/reviews` | Pending operator-review cases |
| `POST /api/entries/reviews/{id}/resolve` | Resolve a review case |
| `POST /api/entries/handoffs/expire` | Expire stale handoffs to review |
| `POST /api/vision/ingest_observation` | Ingest one camera observation (detection + OCR result) |
| `WS /ws/live-feed` | Live feed push channel |
| `GET /health`, `GET /api`, `GET /` | Health, API info, static dashboard |

Full request/response schemas are in `backend/schemas/` and the Swagger UI
at `/docs`.

## How the pipeline works

1. **Capture** — `backend/ingestion/stream_worker.py` samples RTSP streams;
   every frame is frozen into an immutable snapshot
   (`backend/vision/frame_snapshot.py`) before any processing.
2. **Detect & read** — YOLO detects vehicles/plates
   (`backend/vision/weights/best.pt`); plates are read via EasyOCR with a
   YOLO character-reader fallback, gated by a crop-quality scorer.
3. **Track & cross** — per-camera tracker + virtual entry-line crossing
   detection produce `VehicleObservation` + `PlateReading` rows.
4. **Reconcile** — `backend/reconciliation/engine.py` checks readable plates
   against the registry directly. Unreadable gate entries open a `HandoffEvent`
   over downstream cameras bounded by configured travel-time windows; a later
   clear reading within the window associates the identity
   (`ASSOCIATED`), otherwise the case becomes `REVIEW_REQUIRED`.

Key identity states: `IDENTIFIED`, `ASSOCIATED`, `HANDOFF_PENDING`,
`REVIEW_REQUIRED`. Authorization states: `AUTHORIZED`, `NOT_MATCHED`,
`REVIEW_REQUIRED`.

## ML training

`ml_training/` fine-tunes a unified YOLO detector (classes: `vehicle`,
`license_plate`; default base `yolo11s.pt`).

```powershell
cd ml_training
python prepare_dataset.py      # build YOLO dataset layout
python augmentations.py        # augmentation checks
python train.py --epochs 30 --batch 16 --imgsz 640
python evaluate.py             # metrics on held-out split
python export_model.py         # export + copy best.pt to backend/vision/weights/
python test_inference.py       # smoke-test the exported weights
```

Configs live in `ml_training/configs/` (`data.yaml`, `motion_data.yaml`).
Datasets, caches, and run artifacts are git-ignored; only the deployed
`backend/vision/weights/best.pt` is tracked.

## Tests

```powershell
.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Covers the snapshot-first capture contract, 2–3 frame plate-identity lock,
and quality-gate acceptance across plate geometries.

## Configuration

All settings via environment (see `.env.example`); key ones:

| Variable | Default | Meaning |
|---|---|---|
| `DATABASE_URL` | `postgresql://campusgate:…@localhost:5433/campusgate_db` | Primary Postgres DSN |
| `FALLBACK_SQLITE_URL` | `sqlite:///./campusgate.db` | Fallback when Postgres is unreachable |
| `POSTGRES_PORT` | `5433` | Host port for the Docker Postgres |
| `API_HOST` / `API_PORT` | `0.0.0.0` / `8000` | Uvicorn bind |
| `VISION_WEIGHTS_PATH` | `backend/vision/weights/best.pt` | Detector weights |
| `DETECTION_CONF_THRESHOLD` | `0.35` | Min YOLO confidence |
| `PLATE_QUALITY_MIN_SCORE` | `0.40` | Min plate-crop quality for OCR |

## Repository layout

```text
├── backend/
│   ├── main.py               # FastAPI app, routers, /ws/live-feed, /health
│   ├── api/                  # cameras, authorized, entries, vision routers
│   ├── core/                 # config, database (Postgres + SQLite fallback), ws_manager
│   ├── models/               # camera, authorized, entry, observation tables
│   ├── schemas/              # Pydantic request/response models
│   ├── vision/               # YOLO/OCR pipeline, tracker, quality gate, matcher
│   ├── ingestion/            # RTSP stream worker
│   ├── reconciliation/       # cross-camera handoff engine
│   ├── static/               # bundled fallback dashboard
│   ├── seed_data.py          # cameras, topology, authorized registry
│   └── run_demo.py           # end-to-end pipeline demo
├── frontend/src/
│   ├── components/           # Dashboard, LiveMonitoring, TrackingMap, GuardStation, …
│   └── services/api.js       # backend API client
├── ml_training/              # dataset prep, training, eval, export scripts + configs
├── tests/                    # snapshot/OCR regression tests
├── Docs/
│   ├── project_blueprint.md
│   └── system_performance_report.md
├── docker-compose.yml        # PostgreSQL 16 service
├── requirements.txt
├── test_webcam.py            # live webcam ANPR tester
└── webcam_snapshots/         # tester output
```

## License

MIT — see [LICENSE](LICENSE).
