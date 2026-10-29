"""
Campus Gate - Live Laptop Webcam AI Testing Utility
===================================================
Run this script to test the ANPR (Automatic Number Plate Recognition) & Vehicle Detection
pipeline in real-time using your laptop's built-in webcam.

Usage:
  python test_webcam.py
  python test_webcam.py --cam 0 --conf 0.35 --ocr
  python test_webcam.py --weights backend/vision/weights/best.pt

Keyboard Controls:
  [q] or [ESC] : Exit live testing
  [s]         : Save current frame & plate crop
  [c]         : Manually trigger crossing simulation
"""

import sys
import os
import time
import argparse
from pathlib import Path
import math
from typing import Dict, Any, List, Optional, Tuple
import cv2
import numpy as np

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.vision.ocr_reader import IndianPlateNormalizer, PlateReadingAggregator
from backend.vision.yolo_char_reader import YOLOCharacterEngine
from backend.vision.quality_gate import PlateQualityGate
from backend.vision.spatio_temporal_matcher import SpatioTemporalPlateMatcher

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
    print(" Campus Gate - Real-Time Laptop Webcam Testing Console")
    print("=" * 70)
    print(f" Camera Device Index : {args.cam} (Laptop Webcam)")
    print(f" YOLO Model Weights   : {weights_path}")
    print(f" Character Engine    : {args.engine.upper()} ({'YOLO Character Detector (36 classes)' if args.engine == 'yolo' else 'EasyOCR Text'})" if args.ocr else "DISABLED")
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

    # 1. Load YOLO Model
    try:
        from ultralytics import YOLO
        print(f"[*] Loading YOLO detector from: {weights_path.name}...")
        model = YOLO(str(weights_path))
        print("[✓] Model loaded successfully!")
    except Exception as e:
        print(f"[!] Failed to load YOLO: {e}")
        sys.exit(1)

    # 2. Load Character Recognition Engine (YOLO or EasyOCR)
    # 2. Load Character Recognition Engine (Dual-Tier: YOLO Primary + EasyOCR Standby Fallback)
    char_engine = None
    ocr_reader = None
    yolo_wanted = (args.engine == "yolo")
    last_yolo_retry_time = 0.0

    if args.ocr:
        # Pre-initialize EasyOCR as standby fallback
        try:
            import easyocr
            print("[*] Initializing EasyOCR engine (English) as standby fallback...")
            ocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            print("[✓] EasyOCR fallback engine ready!")
        except Exception as e:
            print(f"[!] EasyOCR standby initialization note ({e}).")

        # Initialize YOLO Character Engine as Primary
        if yolo_wanted:
            try:
                char_weights = PROJECT_ROOT / "backend" / "vision" / "weights" / "char_detector.pt"
                char_engine = YOLOCharacterEngine(str(char_weights))
                print("[✓] YOLO Character Engine active as Primary ANPR reader!")
            except Exception as e:
                print(f"[!] YOLO Character Engine not ready ({e}). Falling back to EasyOCR temporarily, but will retry YOLO in the background.")
                last_yolo_retry_time = time.time()

    # Quality Gate & Spatio-Temporal Matcher
    quality_gate = PlateQualityGate()
    spatio_matcher = SpatioTemporalPlateMatcher()

    # 3. Known authorized plates database (for instant offline check)
    MOCK_AUTHORIZED = {
        "MP07AB1234": ("Arin Gupta", "Student - Computer Science"),
        "MP07CD5678": ("Priya Sharma", "Student - Electronics"),
        "MP07EF9012": ("Dr. Amit Verma", "Faculty - Mechanical"),
        "MP07IJ7890": ("Vikram Mehta", "Staff - Administration"),
    }
    MOCK_BLACKLISTED = {"MP07KL3210": ("Ramesh Chander", "Suspended Member")}

    # 4. Open Laptop Camera with DirectShow on Windows for fast opening
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
    # Multi-Plate Spatial State Tracker
    tracked_plates: Dict[int, Dict[str, Any]] = {}
    next_plate_id = 1

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
            ret, frame = cap.read()
            if not ret or frame is None:
                print("[!] Warning: Empty frame received from webcam.")
                time.sleep(0.05)
                continue

            h, w = frame.shape[:2]
            now = time.time()
            fps_count += 1
            if now - fps_start >= 1.0:
                fps_display = f"{fps_count / (now - fps_start):.1f}"
                fps_count = 0
                fps_start = now

            # Automatic YOLO Recovery: If YOLO was requested but was unready at launch, keep trying to load it
            if args.ocr and yolo_wanted and char_engine is None and (now - last_yolo_retry_time > 6.0):
                last_yolo_retry_time = now
                try:
                    char_weights = PROJECT_ROOT / "backend" / "vision" / "weights" / "char_detector.pt"
                    if char_weights.exists():
                        print("[*] Automatically retrying connection to YOLO Character Engine...")
                        char_engine = YOLOCharacterEngine(str(char_weights))
                        print("[✓] YOLO Character Engine connected! Re-promoted to Primary ANPR Engine.")
                except Exception:
                    pass

            # Virtual Entry Line
            if show_virtual_line:
                line_y = int(h * 0.82)
                cv2.line(frame, (0, line_y), (w, line_y), (0, 255, 128), 2)
                cv2.putText(frame, "VIRTUAL ENTRY SENSOR LINE (GATE 1) [Press 'l' to toggle]", (20, line_y - 8),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 128), 1, cv2.LINE_AA)

            # 1. Run YOLO Detection at native high resolution
            results = model.predict(frame, conf=args.conf, imgsz=args.imgsz, verbose=False)[0]

            raw_detected_plates = []
            raw_detected_vehicles = []

            if results.boxes is not None and len(results.boxes) > 0:
                for box in results.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    cls_name = model.names.get(cls_id, str(cls_id))
                    x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]

                    if cls_id == 1 or "plate" in cls_name.lower():
                        raw_detected_plates.append({"box": [x1, y1, x2, y2], "conf": conf})
                    else:
                        raw_detected_vehicles.append({
                            "track_id": len(raw_detected_vehicles) + 1,
                            "box": [x1, y1, x2, y2],
                            "conf": conf,
                            "name": cls_name
                        })

            # 2. Central Digital Zoom Pass if no plates found (for distant plates)
            if not raw_detected_plates:
                zy1, zy2 = int(h * 0.12), int(h * 0.88)
                zx1, zx2 = int(w * 0.12), int(w * 0.88)
                center_roi = frame[zy1:zy2, zx1:zx2]
                zoom_results = model.predict(center_roi, conf=max(0.14, args.conf - 0.05), imgsz=args.imgsz, verbose=False)[0]
                if zoom_results.boxes is not None and len(zoom_results.boxes) > 0:
                    for zbox in zoom_results.boxes:
                        zcls = int(zbox.cls[0])
                        zconf = float(zbox.conf[0])
                        zname = model.names.get(zcls, str(zcls))
                        if zcls == 1 or "plate" in zname.lower():
                            bx1, by1, bx2, by2 = [int(v) for v in zbox.xyxy[0].tolist()]
                            gx1, gy1, gx2, gy2 = zx1 + bx1, zy1 + by1, zx1 + bx2, zy1 + by2
                            raw_detected_plates.append({"box": [gx1, gy1, gx2, gy2], "conf": zconf, "source": "ZOOM"})

            # 3. Associate detected plates with persistent Plate Tracks (Distance-based Tracking)
            visible_plate_ids = set()
            for rpl in raw_detected_plates:
                pbx = rpl["box"]
                pcx = (pbx[0] + pbx[2]) / 2.0
                pcy = (pbx[1] + pbx[3]) / 2.0

                # Match to closest active plate track
                best_pid = None
                best_dist = 110.0  # Max pixel jump between frames
                for pid, t in tracked_plates.items():
                    dist = math.hypot(pcx - t["center"][0], pcy - t["center"][1])
                    if dist < best_dist:
                        best_dist = dist
                        best_pid = pid

                if best_pid is not None:
                    # Update existing track
                    tracked_plates[best_pid]["box"] = pbx
                    tracked_plates[best_pid]["center"] = (pcx, pcy)
                    tracked_plates[best_pid]["conf"] = rpl["conf"]
                    tracked_plates[best_pid]["last_seen"] = now
                    visible_plate_ids.add(best_pid)
                else:
                    # Register new plate track
                    pid = next_plate_id
                    next_plate_id += 1
                    tracked_plates[pid] = {
                        "id": pid,
                        "box": pbx,
                        "center": (pcx, pcy),
                        "conf": rpl["conf"],
                        "aggregator": PlateReadingAggregator(str(pid), quorum_threshold=3, dominance_ratio=1.8),
                        "reads": [],
                        "resolved_plate": None,
                        "is_valid": False,
                        "is_latched": False,
                        "last_ocr_time": 0.0,
                        "last_seen": now
                    }
                    visible_plate_ids.add(pid)

            # Purge dead plate tracks older than 1.5 seconds
            stale_pids = [pid for pid, t in tracked_plates.items() if now - t["last_seen"] > 1.5]
            for pid in stale_pids:
                del tracked_plates[pid]

            # 4. Run Character Recognition INDEPENDENTLY on EACH visible plate
            for pid in visible_plate_ids:
                p_info = tracked_plates[pid]
                if (char_engine or ocr_reader) and (now - p_info["last_ocr_time"] > 0.18):
                    p_info["last_ocr_time"] = now
                    px1, py1, px2, py2 = p_info["box"]
                    crop = frame[max(0, py1):min(h, py2), max(0, px1):min(w, px2)]

                    if crop.size > 0:
                        # Super-resolution upscaling for small/distant crops
                        ch, cw = crop.shape[:2]
                        if ch < 80 or cw < 160:
                            scale = max(2.2, 90.0 / max(ch, 1))
                            crop = cv2.resize(crop, (int(cw * scale), int(ch * scale)), interpolation=cv2.INTER_CUBIC)
                            g = cv2.GaussianBlur(crop, (0, 0), 2.0)
                            crop = cv2.addWeighted(crop, 1.45, g, -0.45, 0)

                        try:
                            combined_raw = ""
                            norm_plate = None
                            is_valid = False
                            ptype = "UNKNOWN"
                            yolo_success = False

                            # 1. ALWAYS TRY YOLO CHARACTER ENGINE FIRST (PRIORITY #1)
                            if char_engine:
                                try:
                                    raw_cand, norm_res, avg_c, valid_res, _ = char_engine.read_plate(crop)
                                    if raw_cand and len(raw_cand) >= 4:
                                        combined_raw = raw_cand
                                        norm_plate = norm_res
                                        is_valid = valid_res
                                        ptype = "YOLO_CHARACTERS [PRIORITY #1]"
                                        yolo_success = True
                                except Exception:
                                    # Temporary failure on this crop - do NOT quit trying YOLO!
                                    yolo_success = False

                            # 2. STANDBY FALLBACK TO EASYOCR: ONLY IF YOLO DETECTED NOTHING OR ERRORED
                            # If YOLO succeeded in detecting characters, EasyOCR will NEVER override it!
                            if not yolo_success and ocr_reader:
                                try:
                                    ocr_res = ocr_reader.readtext(crop, allowlist="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ ", paragraph=False)
                                    if ocr_res:
                                        ocr_raw = "".join([c for c in "".join([r[1].upper() for r in ocr_res]) if c.isalnum()])
                                        if ocr_raw and len(ocr_raw) >= 4:
                                            ocr_norm, ocr_valid, ocr_ptype = IndianPlateNormalizer.validate_and_normalize(ocr_raw)
                                            combined_raw = ocr_raw
                                            norm_plate = ocr_norm
                                            is_valid = ocr_valid
                                            ptype = "EASYOCR [STANDBY FALLBACK]"
                                except Exception:
                                    pass

                            if combined_raw and len(combined_raw) >= 4:
                                engine_tag = "YOLO" if yolo_success else "EASYOCR"
                                conf_val = avg_c if yolo_success else 0.80
                                # Add reading into the Bayesian multi-frame positional aggregator
                                p_info["aggregator"].add_reading(
                                    raw_text=combined_raw,
                                    confidence=conf_val,
                                    quality_score=0.90,
                                    engine_source=engine_tag
                                )

                                # Get consensus (or locked latch if quorum is satisfied)
                                top_res, c_conf, c_valid = p_info["aggregator"].get_consensus()
                                p_info["is_latched"] = p_info["aggregator"].is_latched

                                if top_res and (c_valid or len(p_info["aggregator"].readings) >= 2):
                                    if top_res != p_info["resolved_plate"]:
                                        latch_str = " [LOCKED LATCH]" if p_info["is_latched"] else ""
                                        print(f"[✓] Plate #{pid} Resolved: {top_res}{latch_str} (Source: {ptype})")
                                    p_info["resolved_plate"] = top_res
                                    p_info["is_valid"] = c_valid
                        except Exception as e:
                            pass

            # 5. Spatio-Temporal Association between Multiple Vehicles and Multiple Plates
            vehicle_plate_links = {}
            if raw_detected_vehicles and tracked_plates:
                active_plate_list = [
                    {"box": tracked_plates[pid]["box"], "conf": tracked_plates[pid]["conf"], "pid": pid}
                    for pid in visible_plate_ids
                ]
                v_inputs = [{"track_id": v["track_id"], "box": v["box"], "conf": v["conf"]} for v in raw_detected_vehicles]
                matches, _ = spatio_matcher.match(v_inputs, active_plate_list)
                for m in matches:
                    matched_pid = None
                    for pl in active_plate_list:
                        if pl["box"] == m.plate_box:
                            matched_pid = pl["pid"]
                            break
                    if matched_pid:
                        vehicle_plate_links[m.vehicle_track_id] = matched_pid

            # 6. Render Vehicles (Cyan) and draw connecting line to their matched plate
            for veh in raw_detected_vehicles:
                vx1, vy1, vx2, vy2 = veh["box"]
                vid = veh["track_id"]
                v_bottom_center = (int((vx1 + vx2) / 2.0), int(vy2))

                if vid in vehicle_plate_links:
                    matched_pid = vehicle_plate_links[vid]
                    p_text = tracked_plates[matched_pid]["resolved_plate"] or f"PLATE #{matched_pid}"
                    v_label = f"{veh['name']} #{vid} -> {p_text}"
                    # Draw connecting line between vehicle and its specific plate
                    pcx, pcy = tracked_plates[matched_pid]["center"]
                    cv2.line(frame, v_bottom_center, (int(pcx), int(pcy)), (0, 255, 255), 2)
                    cv2.circle(frame, (int(pcx), int(pcy)), 4, (0, 255, 255), -1)
                else:
                    v_label = f"{veh['name']} #{vid}: {veh['conf']:.2f}"

                cv2.rectangle(frame, (vx1, vy1), (vx2, vy2), (255, 191, 0), 2)
                cv2.putText(frame, v_label, (vx1, max(18, vy1 - 6)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 191, 0), 2, cv2.LINE_AA)

            # 7. Render License Plates INDIVIDUALLY (Green) with their OWN unique recognized text
            active_plates_list = []
            for pid in visible_plate_ids:
                p_info = tracked_plates[pid]
                px1, py1, px2, py2 = p_info["box"]
                resolved = p_info["resolved_plate"]

                if resolved:
                    latch_tag = " [LOCKED]" if p_info.get("is_latched") else f" [{len(p_info['aggregator'].readings)}/3]"
                    plate_label = f"PLATE #{pid}: {resolved}{latch_tag}"
                    active_plates_list.append((pid, resolved))
                else:
                    plate_label = f"PLATE #{pid}: {p_info['conf']:.2f} (READING...)"
                    active_plates_list.append((pid, "READING..."))

                box_color = (0, 255, 0) if p_info.get("is_latched") else (0, 200, 255)
                cv2.rectangle(frame, (px1, py1), (px2, py2), box_color, 2)
                cv2.putText(frame, plate_label, (px1, max(18, py1 - 6)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.58, box_color, 2, cv2.LINE_AA)

            # 8. Bottom Status Banner: Summarize all detected plates independently
            if active_plates_list:
                banner_items = []
                has_auth = False
                has_black = False

                for pid, ptext in active_plates_list:
                    if ptext in MOCK_AUTHORIZED:
                        owner, _ = MOCK_AUTHORIZED[ptext]
                        banner_items.append(f"#{pid} {ptext} (AUTH: {owner})")
                        has_auth = True
                    elif ptext in MOCK_BLACKLISTED:
                        owner, _ = MOCK_BLACKLISTED[ptext]
                        banner_items.append(f"#{pid} {ptext} (BLACKLISTED!)")
                        has_black = True
                    else:
                        banner_items.append(f"#{pid} {ptext}")

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
            engine_str = "ANPR: YOLO CHARACTER DETECTOR [PRIORITY #1]" if char_engine is not None else "ANPR: EASYOCR [STANDBY - RETRYING YOLO]"
            engine_col = (0, 255, 200) if char_engine is not None else (0, 200, 255)
            cv2.putText(frame, f"CAMERA: Laptop Webcam | {engine_str}", (18, 42),
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
            elif key in [ord('s'), ord('S')]:  # Save snapshot
                snap_path = snapshots_dir / f"webcam_snap_{int(time.time())}.jpg"
                cv2.imwrite(str(snap_path), frame)
                print(f"[✓] Saved snapshot: {snap_path}")
            elif key in [ord('c'), ord('C')]:  # Trigger crossing
                sim_plate = next((t["resolved_plate"] for t in tracked_plates.values() if t.get("resolved_plate")), "MP07AB1234")
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
