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
import cv2
import numpy as np

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

def parse_args():
    parser = argparse.ArgumentParser(description="Campus Gate - Laptop Webcam Testing Utility")
    parser.add_argument("--cam", type=int, default=0, help="Camera device index (0 for built-in laptop camera)")
    parser.add_argument("--weights", type=str, default=None, help="Path to YOLO weights (.pt)")
    parser.add_argument("--conf", type=float, default=0.35, help="Detection confidence threshold")
    parser.add_argument("--ocr", action="store_true", default=True, help="Enable live OCR reading on plates (default: True)")
    parser.add_argument("--no-ocr", dest="ocr", action="store_false", help="Disable OCR for faster FPS")
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
    print(f" Confidence Threshold : {args.conf}")
    print(f" OCR Plate Reading    : {'ENABLED (EasyOCR)' if args.ocr else 'DISABLED'}")
    print(f" FastAPI Sync Target  : {args.api_url}")
    print("-" * 70)
    print(" CONTROLS:")
    print("   Hold up a license plate (on phone screen or paper) to the camera")
    print("   Press 'q' or 'ESC' to exit")
    print("   Press 's' to save snapshot")
    print("   Press 'c' to trigger line crossing")
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

    # 2. Load EasyOCR if requested
    ocr_reader = None
    if args.ocr:
        try:
            import easyocr
            print("[*] Initializing EasyOCR engine (English)...")
            ocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            print("[✓] EasyOCR engine ready!")
        except Exception as e:
            print(f"[!] EasyOCR initialization failed ({e}), continuing with visual detection only.")

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
    last_ocr_time = 0
    current_plate_text = None
    plate_status = "SCANNING"

    # Save directory
    snapshots_dir = PROJECT_ROOT / "webcam_snapshots"
    snapshots_dir.mkdir(exist_ok=True)

    window_name = "Campus Gate - Laptop Camera Live ANPR Test"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 1020, 600)

    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                print("[!] Warning: Empty frame received from webcam.")
                time.sleep(0.05)
                continue

            h, w = frame.shape[:2]
            fps_count += 1
            if time.time() - fps_start >= 1.0:
                fps_display = f"{fps_count / (time.time() - fps_start):.1f}"
                fps_count = 0
                fps_start = time.time()

            # Virtual Entry Line (Horizontally across center)
            line_y = int(h * 0.55)
            cv2.line(frame, (0, line_y), (w, line_y), (0, 255, 128), 2)
            cv2.putText(frame, "VIRTUAL ENTRY LINE (GATE 1)", (20, line_y - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 128), 2, cv2.LINE_AA)

            # Run YOLO Detection
            results = model.predict(frame, conf=args.conf, verbose=False)[0]

            detected_plates = []
            detected_vehicles = []

            if results.boxes is not None and len(results.boxes) > 0:
                for box in results.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    cls_name = model.names.get(cls_id, str(cls_id))
                    x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]

                    # Bounding Box Colors
                    if cls_id == 1 or "plate" in cls_name.lower():
                        # License Plate Box (Green)
                        color = (0, 255, 0)
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        detected_plates.append((x1, y1, x2, y2, conf))
                    else:
                        # Vehicle Box (Cyan)
                        color = (255, 191, 0)
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        detected_vehicles.append((x1, y1, x2, y2, conf))

                    label = f"{cls_name}: {conf:.2f}"
                    cv2.putText(frame, label, (x1, max(18, y1 - 6)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2, cv2.LINE_AA)

            # Run OCR on the best plate crop every 0.6 seconds
            now = time.time()
            if detected_plates and ocr_reader and (now - last_ocr_time > 0.6):
                last_ocr_time = now
                px1, py1, px2, py2, pconf = detected_plates[0]
                crop = frame[max(0, py1):min(h, py2), max(0, px1):min(w, px2)]

                if crop.size > 0:
                    try:
                        ocr_res = ocr_reader.readtext(crop)
                        if ocr_res:
                            raw_text = "".join([r[1] for r in ocr_res]).upper().replace(" ", "").replace("-", "")
                            # Filter alphanumeric
                            clean_text = "".join([c for c in raw_text if c.isalnum()])
                            if len(clean_text) >= 4:
                                current_plate_text = clean_text
                                print(f"[*] Detected Plate OCR: {current_plate_text}")
                    except Exception as err:
                        pass

            # Authorization Check for Detected Plate
            if current_plate_text:
                if current_plate_text in MOCK_AUTHORIZED:
                    owner, note = MOCK_AUTHORIZED[current_plate_text]
                    plate_status = f"AUTHORIZED: {current_plate_text} ({owner})"
                    banner_color = (16, 185, 129)  # Green
                elif current_plate_text in MOCK_BLACKLISTED:
                    owner, note = MOCK_BLACKLISTED[current_plate_text]
                    plate_status = f"BLACKLISTED: {current_plate_text} ({owner})"
                    banner_color = (0, 0, 255)  # Red
                else:
                    plate_status = f"UNKNOWN / GUEST: {current_plate_text} (Review Required)"
                    banner_color = (0, 165, 255)  # Amber
            else:
                plate_status = "HOLD UP NUMBER PLATE OR TOY CAR TO CAMERA"
                banner_color = (40, 40, 40)

            # Top HUD Header Bar
            cv2.rectangle(frame, (0, 0), (w, 54), (10, 14, 23), -1)
            cv2.putText(frame, f"CAMPUS GATE AI LIVE FEED | FPS: {fps_display}", (18, 22),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
            cv2.putText(frame, "CAMERA: Built-in Laptop Webcam (Node Gate-01)", (18, 42),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (148, 163, 184), 1, cv2.LINE_AA)

            # Live Status Pill
            cv2.circle(frame, (w - 110, 26), 5, (0, 255, 0), -1)
            cv2.putText(frame, "LIVE ANPR", (w - 95, 31),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2, cv2.LINE_AA)

            # Bottom Plate Status Banner
            cv2.rectangle(frame, (0, h - 45), (w, h), banner_color, -1)
            cv2.putText(frame, plate_status, (20, h - 16),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)

            # Show image
            cv2.imshow(window_name, frame)

            # Handle Key Presses
            key = cv2.waitKey(1) & 0xFF
            if key in [ord('q'), ord('Q'), 27]:  # 'q' or ESC
                print("[*] Quitting live webcam test...")
                break
            elif key in [ord('s'), ord('S')]:  # Save snapshot
                snap_path = snapshots_dir / f"webcam_snap_{int(time.time())}.jpg"
                cv2.imwrite(str(snap_path), frame)
                print(f"[✓] Saved snapshot: {snap_path}")
            elif key in [ord('c'), ord('C')]:  # Trigger crossing
                print(f"[!] Gate entry crossing simulated for plate: {current_plate_text or 'MP07AB1234'}")

    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("[✓] Camera released. Testing closed.")

if __name__ == "__main__":
    main()
