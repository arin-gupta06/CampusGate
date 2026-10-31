"""
Campus Gate - Live Laptop Webcam AI Testing Utility
===================================================
Run this script to test the ANPR (Automatic Number Plate Recognition) & Vehicle Detection
pipeline in real-time using your laptop's built-in webcam.

SNAPSHOT-FIRST CONTRACT (core rule): every live frame is frozen into an
immutable snapshot via capture_frame_snapshot(), and ALL detection / OCR
post-processing runs ONLY against that snapshot copy. The live/display frame
is never passed to the detector and overlays are drawn on a separate display
copy after post-processing returns.

Usage:
  python test_webcam.py
  python test_webcam.py --cam 0 --conf 0.35 --ocr
  python test_webcam.py --weights backend/vision/weights/best.pt

Keyboard Controls:
  [q] or [ESC] : Exit live testing
  [s]         : Save current snapshot & plate crops
  [c]         : Manually trigger crossing simulation
  [m]         : Toggle mirror preview (selfie flip)
  [l]         : Toggle virtual entry line on/off
"""

import sys
import time
import argparse
from pathlib import Path
from typing import Dict, Any, List
import cv2
import numpy as np

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.vision.frame_snapshot import capture_frame_snapshot, writable_snapshot_view
from backend.vision.tracker import CameraVisionTracker, VirtualEntryLine


def parse_args():
    parser = argparse.ArgumentParser(description="Campus Gate - Laptop Webcam Testing Utility")
    parser.add_argument("--cam", type=int, default=0, help="Camera device index (0 for built-in laptop camera)")
    parser.add_argument("--weights", type=str, default=None, help="Path to YOLO weights (.pt)")
    parser.add_argument("--engine", type=str, choices=["yolo", "easyocr"], default="yolo",
                        help="Character reader engine: 'yolo' (YOLO Character Detector, default) or 'easyocr'")
    parser.add_argument("--conf", type=float, default=0.20, help="Detection confidence threshold (lowered for distant plates)")
    parser.add_argument("--imgsz", type=int, default=1280, help="Inference resolution (1280 preserves small distant plates)")
    parser.add_argument("--ocr", action="store_true", default=True, help="Enable live character reading on plates (default: True)")
    parser.add_argument("--no-ocr", dest="ocr", action="store_false", help="Disable OCR for faster FPS")
    parser.add_argument("--mirror", action="store_true", default=False, help="Enable mirror / selfie mode preview")
    parser.add_argument("--api-url", type=str, default="http://localhost:8000/api/vision/ingest_observation",
                        help="FastAPI ingestion endpoint to send detections to")
    return parser.parse_args()


def main():
    args = parse_args()

    # Determine best weights path
    best_weights = PROJECT_ROOT / "backend" / "vision" / "weights" / "best.pt"
    yolo_fallback = PROJECT_ROOT / "ml_training" / "yolo11n.pt"

    if args.weights:
        weights_path = Path(args.weights)
    elif best_weights.exists():
        weights_path = best_weights
    elif yolo_fallback.exists():
        weights_path = yolo_fallback
    else:
        print("[!] Error: No weights found. Place weights in backend/vision/weights/best.pt")
        sys.exit(1)

    print("=" * 70)
    print(" Campus Gate - Real-Time Laptop Webcam Testing Console (Snapshot Mode)")
    print("=" * 70)
    print(f" Camera Device Index : {args.cam} (Laptop Webcam)")
    print(f" YOLO Model Weights   : {weights_path}")
    print(f" Character Engine    : {args.engine.upper()} ({'YOLO Character Detector (36 classes)' if args.engine == 'yolo' else 'EasyOCR Text'})" if args.ocr else "DISABLED")
    print(" Capture Contract    : live frame -> immutable snapshot -> post-process ONLY the snapshot")
    print(" Plate Lock Policy   : 2-3 consistent snapshot frames -> [LOCKED]")
    print(f" FastAPI Sync Target  : {args.api_url}")
    print("-" * 70)
    print(" CONTROLS:")
    print("   Hold up a license plate (on phone screen or paper) to the camera")
    print("   Press 'q' or 'ESC' : Exit")
    print("   Press 'm'         : Toggle mirror preview (selfie flip)")
    print("   Press 'l'         : Toggle virtual entry line on/off")
    print("   Press 's'         : Save snapshot")
    print("   Press 'c'         : Trigger entry crossing simulation")
    print("=" * 70)

    # 1. Snapshot-first post-processing engine (detection + OCR run ONLY on snapshots)
    try:
        print(f"[*] Loading snapshot post-processor (detector: {weights_path.name})...")
        tracker = CameraVisionTracker(
            camera_id="LAPTOP-WEBCAM",
            weights_path=weights_path,
            conf_threshold=args.conf,
            device="cpu",
            enable_ocr=args.ocr,
            engine_type=args.engine,
            imgsz=args.imgsz,
            ocr_min_interval=0.12,
            enable_central_zoom=True,
        )
        print("[✓] Post-processor loaded successfully!")
        if args.ocr:
            if tracker.yolo_engine is not None:
                print("[✓] YOLO Character Engine active as Primary ANPR reader!")
            elif tracker.easyocr_engine is not None:
                print("[*] EasyOCR standby active; YOLO primary will auto-recover in background.")
    except Exception as e:
        print(f"[!] Failed to load post-processor: {e}")
        sys.exit(1)

    # 2. Known authorized plates database (for instant offline check)
    MOCK_AUTHORIZED = {
        "MP07AB1234": ("Arin Gupta", "Student - Computer Science"),
        "MP07CD5678": ("Priya Sharma", "Student - Electronics"),
        "MP07EF9012": ("Dr. Amit Verma", "Faculty - Mechanical"),
        "MP07IJ7890": ("Vikram Mehta", "Staff - Administration"),
    }
    MOCK_BLACKLISTED = {"MP07KL3210": ("Ramesh Chander", "Suspended Member")}

    # 3. Open Laptop Camera with DirectShow on Windows for fast opening
    print(f"[*] Opening laptop webcam (device {args.cam})...")
    cap = cv2.VideoCapture(args.cam, cv2.CAP_DSHOW if sys.platform.startswith("win") else cv2.CAP_ANY)
    if not cap.isOpened():
        # Fallback to standard capture
        cap = cv2.VideoCapture(args.cam)

    if not cap.isOpened():
        print(f"[!] Could not access webcam at index {args.cam}.")
        print("    Tips: Check if another application (Teams, Zoom, Camera app) is using it.")
        sys.exit(1)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    print("[✓] Webcam connected! Starting video stream window...")

    fps_count = 0
    fps_start = time.time()
    fps_display = "0.0"
    frame_idx = 0
    last_results: Dict[str, Any] = {"vehicles": [], "plates": [], "observations": [], "events": []}
    last_snapshot = None

    # Save directory
    snapshots_dir = PROJECT_ROOT / "webcam_snapshots"
    snapshots_dir.mkdir(exist_ok=True)

    window_name = "Campus Gate - Laptop Camera Live ANPR Test"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 1020, 600)

    show_virtual_line = True
    mirror_mode = args.mirror

    try:
        while True:
            ret, live_frame = cap.read()
            if not ret or live_frame is None:
                print("[!] Warning: Empty frame received from webcam.")
                time.sleep(0.05)
                continue

            frame_idx += 1
            h, w = live_frame.shape[:2]
            now = time.time()
            fps_count += 1
            if now - fps_start >= 1.0:
                fps_display = f"{fps_count / (now - fps_start):.1f}"
                fps_count = 0
                fps_start = now

            # Keep the virtual entry line aligned with the current frame size.
            line_y = int(h * 0.82)
            tracker.entry_line = VirtualEntryLine((0, line_y), (w, line_y), "INBOUND")

            # CORE RULE: freeze live frame -> immutable snapshot -> post-process
            # ONLY the snapshot. Detection never sees the live/display frame.
            try:
                snapshot = capture_frame_snapshot(
                    live_frame, "LAPTOP-WEBCAM", frame_idx, source="live"
                )
            except ValueError:
                continue
            last_snapshot = snapshot
            try:
                last_results = tracker.process_snapshot(snapshot)
            except Exception as e:
                print(f"[!] Post-processing note: {e}")
                last_results = {"vehicles": [], "plates": [], "observations": [], "events": []}

            # Display overlays go on a SEPARATE display copy, never the snapshot.
            frame = live_frame.copy()

            # Virtual Entry Line
            if show_virtual_line:
                cv2.line(frame, (0, line_y), (w, line_y), (0, 255, 128), 2)
                cv2.putText(frame, "VIRTUAL ENTRY SENSOR LINE (GATE 1) [Press 'l' to toggle]", (20, line_y - 8),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 128), 1, cv2.LINE_AA)

            vehicles = last_results.get("vehicles", [])
            plates = last_results.get("plates", [])

            # Vehicle -> plate links for connector lines.
            vehicle_plate_link: Dict[int, Dict[str, Any]] = {}
            for pl in plates:
                vid = pl.get("vehicle_track_id")
                if vid is not None:
                    vehicle_plate_link[vid] = pl

            # Render Vehicles (Cyan) with connector to their matched plate.
            for veh in vehicles:
                vx1, vy1, vx2, vy2 = veh["box"]
                vid = veh["track_id"]
                v_bottom_center = (int((vx1 + vx2) / 2.0), int(vy2))

                if vid in vehicle_plate_link:
                    p_text = vehicle_plate_link[vid].get("resolved") or "READING..."
                    v_label = f"{vid} -> {p_text}"
                    pl_box = vehicle_plate_link[vid]["box"]
                    pcx, pcy = int((pl_box[0] + pl_box[2]) / 2.0), int((pl_box[1] + pl_box[3]) / 2.0)
                    cv2.line(frame, v_bottom_center, (pcx, pcy), (0, 255, 255), 2)
                    cv2.circle(frame, (pcx, pcy), 4, (0, 255, 255), -1)
                else:
                    v_label = f"Vehicle #{vid}: {veh['conf']:.2f}"

                cv2.rectangle(frame, (vx1, vy1), (vx2, vy2), (255, 191, 0), 2)
                cv2.putText(frame, v_label, (vx1, max(18, vy1 - 6)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 191, 0), 2, cv2.LINE_AA)

            # Render License Plates INDIVIDUALLY with their OWN recognized text.
            active_plates_list: List[tuple] = []
            for pl in plates:
                px1, py1, px2, py2 = pl["box"]
                resolved = pl.get("resolved")
                is_latched = pl.get("is_latched", False)
                n_reads = pl.get("readings_count", 0)

                if resolved:
                    latch_tag = " [LOCKED]" if is_latched else f" [{min(n_reads, 2)}/2]"
                    plate_label = f"PLATE {pl['id']}: {resolved}{latch_tag}"
                    active_plates_list.append((pl["id"], resolved))
                else:
                    plate_label = f"PLATE {pl['id']}: {pl['conf']:.2f} (READING...)"
                    active_plates_list.append((pl["id"], "READING..."))

                box_color = (0, 255, 0) if is_latched else (0, 200, 255)
                cv2.rectangle(frame, (px1, py1), (px2, py2), box_color, 2)
                cv2.putText(frame, plate_label, (px1, max(18, py1 - 6)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.58, box_color, 2, cv2.LINE_AA)

            # Bottom Status Banner: summarize all detected plates independently.
            if active_plates_list:
                banner_items = []
                has_auth = False
                has_black = False

                for pid, ptext in active_plates_list:
                    if ptext in MOCK_AUTHORIZED:
                        owner, _ = MOCK_AUTHORIZED[ptext]
                        banner_items.append(f"{pid} {ptext} (AUTH: {owner})")
                        has_auth = True
                    elif ptext in MOCK_BLACKLISTED:
                        owner, _ = MOCK_BLACKLISTED[ptext]
                        banner_items.append(f"{pid} {ptext} (BLACKLISTED!)")
                        has_black = True
                    else:
                        banner_items.append(f"{pid} {ptext}")

                plate_status = f"DETECTED ({len(active_plates_list)}): " + "  |  ".join(banner_items)
                if has_black:
                    banner_color = (0, 0, 255)  # Red
                elif has_auth:
                    banner_color = (16, 185, 129)  # Green
                else:
                    banner_color = (0, 165, 255)  # Amber
            else:
                plate_status = "HOLD UP NUMBER PLATES OR VEHICLES TO CAMERA"
                banner_color = (40, 40, 40)

            # Top HUD Header Bar
            cv2.rectangle(frame, (0, 0), (w, 54), (10, 14, 23), -1)
            cv2.putText(frame, f"CAMPUS GATE AI LIVE FEED | FPS: {fps_display}", (18, 22),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
            if tracker.yolo_engine is not None:
                engine_str = "ANPR: YOLO CHARACTER DETECTOR [PRIORITY #1]"
                engine_col = (0, 255, 200)
            else:
                engine_str = "ANPR: EASYOCR [STANDBY - RETRYING YOLO]"
                engine_col = (0, 200, 255)
            cv2.putText(frame, f"CAMERA: Laptop Webcam | {engine_str} | SNAPSHOT MODE", (18, 42),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.43, engine_col, 1, cv2.LINE_AA)

            # Live Status Pill
            cv2.circle(frame, (w - 110, 26), 5, (0, 255, 0), -1)
            cv2.putText(frame, "LIVE ANPR", (w - 95, 31),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2, cv2.LINE_AA)

            # Bottom Plate Status Banner
            cv2.rectangle(frame, (0, h - 45), (w, h), banner_color, -1)
            cv2.putText(frame, plate_status, (20, h - 16),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)

            # Show image (apply mirror flip if enabled)
            display_frame = cv2.flip(frame, 1) if mirror_mode else frame
            cv2.imshow(window_name, display_frame)

            # Handle Key Presses
            key = cv2.waitKey(1) & 0xFF
            if key in [ord('q'), ord('Q'), 27]:  # 'q' or ESC
                print("[*] Quitting live webcam test...")
                break
            elif key in [ord('m'), ord('M')]:  # Toggle mirror
                mirror_mode = not mirror_mode
                print(f"[*] Mirror Mode: {'ON (Selfie Flip)' if mirror_mode else 'OFF (Standard Sensor View)'}")
            elif key in [ord('s'), ord('S')]:  # Save snapshot + plate crops
                snap_view = writable_snapshot_view(last_snapshot) if last_snapshot is not None else frame
                snap_path = snapshots_dir / f"webcam_snap_{int(time.time())}.jpg"
                cv2.imwrite(str(snap_path), snap_view)
                print(f"[✓] Saved snapshot: {snap_path}")
                for pl in plates:
                    px1, py1, px2, py2 = pl["box"]
                    crop = snap_view[max(0, py1):min(snap_view.shape[0], py2),
                                     max(0, px1):min(snap_view.shape[1], px2)]
                    if crop.size > 0:
                        crop_path = snapshots_dir / f"webcam_snap_{int(time.time())}_{pl['id']}.jpg"
                        cv2.imwrite(str(crop_path), crop)
                        print(f"[✓] Saved plate crop {pl['id']}: {crop_path}")
            elif key in [ord('c'), ord('C')]:  # Trigger crossing
                sim_plate = next((pl.get("resolved") for pl in plates if pl.get("resolved")), "MP07AB1234")
                print(f"[!] Gate entry crossing simulated for plate: {sim_plate}")
            elif key in [ord('l'), ord('L')]:  # Toggle line
                show_virtual_line = not show_virtual_line
                print(f"[*] Virtual Entry Line: {'ON' if show_virtual_line else 'OFF'}")

    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("[✓] Camera released. Testing closed.")


if __name__ == "__main__":
    main()
