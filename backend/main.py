import sys
from pathlib import Path

# Ensure project root is always in sys.path regardless of current working directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.core.config import settings
from backend.core.database import init_db, engine
from backend.core.ws_manager import ws_manager
from backend.api import cameras, authorized, entries, vision, auth, gate
from backend.reconciliation.sweeper import handoff_sweeper

app = FastAPI(
    title="Campus Gate - Central Vehicle Auditing Server",
    description="Multi-Camera Vehicle Identification and Entry Auditing API based on Final Project Blueprint.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static crops and frontend distribution directories
static_dir = settings.BASE_DIR / "backend" / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

frontend_dist = settings.BASE_DIR / "frontend" / "dist"
if (frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="frontend_assets")

# Include Routers
app.include_router(auth.router)
app.include_router(cameras.router)
app.include_router(authorized.router)
app.include_router(entries.router)
app.include_router(vision.router)
app.include_router(gate.router)

@app.websocket("/ws/live-feed")
async def websocket_live_feed(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open and await any client heartbeat
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

@app.on_event("startup")
def on_startup():
    init_db()
    handoff_sweeper.start()

@app.on_event("shutdown")
def on_shutdown():
    handoff_sweeper.stop()

from fastapi.responses import FileResponse

@app.get("/health", tags=["System"])
def health_check():
    db_status = "healthy"
    try:
        with engine.connect() as conn:
            pass
    except Exception as e:
        db_status = f"degraded ({e})"

    return {
        "status": "online",
        "service": "Campus Gate Central Server",
        "database": db_status,
        "weights_present": settings.WEIGHTS_PATH.exists()
    }

@app.get("/", response_class=FileResponse, tags=["Dashboard"])
def get_dashboard():
    dist_index = frontend_dist / "index.html"
    if dist_index.exists():
        return FileResponse(str(dist_index))
    return FileResponse(str(static_dir / "index.html"))

@app.get("/dashboard", response_class=FileResponse, tags=["Dashboard"])
def get_dashboard_alias():
    dist_index = frontend_dist / "index.html"
    if dist_index.exists():
        return FileResponse(str(dist_index))
    return FileResponse(str(static_dir / "index.html"))

@app.get("/api", tags=["System"])
def api_info():
    return {
        "message": "Welcome to Campus Gate API Server",
        "docs_url": "/docs",
        "health_url": "/health",
        "dashboard_url": "/"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
