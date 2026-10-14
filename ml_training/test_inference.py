"""
Campus Gate - Visual Test Inference Script
Runs unified detector on test images/videos and saves visual bounding box output with plate crops.
"""

import os
import argparse
from pathlib import Path
import cv2
import torch
from ultralytics import YOLO

def parse_args():
    parser = argparse.ArgumentParser(description="Run test inference with Campus Gate detector.")
    parser.add_argument("--source", type=str, default=None,
                        help="Path to image, directory of images, or video file (defaults to test dataset)")
    parser.add_argument("--weights", type=str, default=None,
                        help="Path to model weights (defaults to weights/best.pt)")
    parser.add_argument("--conf", type=float, default=0.35,
                        help="Confidence threshold")
    parser.add_argument("--device", type=str, default="cuda:0" if torch.cuda.is_available() else "cpu",
                        help="Inference device")
    parser.add_argument("--output", type=str, default=None,
                        help="Directory to save annotated results (defaults to ml_training/inference_outputs)")
    parser.add_argument("--max_items", type=int, default=10,
                        help="Max images to infer when source is a directory")
    return parser.parse_args()

def main():
    args = parse_args()
    script_dir = Path(__file__).resolve().parent
    source_path = Path(args.source) if args.source else (script_dir / "datasets" / "campus_gate_det" / "test" / "images")
    weights_path = Path(args.weights) if args.weights else (script_dir / "weights" / "best.pt")
    out_dir = Path(args.output) if args.output else (script_dir / "inference_outputs")
    crops_dir = out_dir / "plate_crops"
    out_dir.mkdir(parents=True, exist_ok=True)
    crops_dir.mkdir(parents=True, exist_ok=True)

    if not weights_path.exists():
        fallback = script_dir / "yolo11n.pt"
        if fallback.exists():
            print(f"[!] Warning: {weights_path} not found. Falling back to {fallback}")
            weights_path = fallback
        else:
            raise FileNotFoundError(f"Weights file not found at {weights_path}")

    print("=" * 65)
    print(" Campus Gate - Visual Inference Testing")
    print("=" * 65)
    print(f"Weights: {weights_path}")
    print(f"Source : {source_path}")
    print(f"Output : {out_dir}")
    print("=" * 65)

    model = YOLO(str(weights_path))

    # Identify image list
    if source_path.is_dir():
        image_files = list(source_path.glob("*.jpg")) + list(source_path.glob("*.png"))
        image_files = image_files[:args.max_items]
    elif source_path.is_file():
        image_files = [source_path]
    else:
        print(f"[!] Source path does not exist: {source_path}")
        return

    CLASS_COLORS = {
        0: (255, 180, 0),    # Cyan/Blue for Vehicle
        1: (0, 255, 128),    # Vibrant Green/Yellow for License Plate
    }

    print(f"[*] Processing {len(image_files)} image(s)...")

    for idx, img_path in enumerate(image_files):
        img = cv2.imread(str(img_path))
        if img is None:
            continue

        results = model.predict(img, conf=args.conf, device=args.device, verbose=False)[0]
        h, w = img.shape[:2]

        plate_count = 0
        veh_count = 0

        for box in results.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            cls_name = model.names.get(cls_id, str(cls_id))
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]

            color = CLASS_COLORS.get(cls_id, (0, 255, 0))
            thickness = 2 if cls_id == 1 else 3

            # Draw box
            cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)

            # Draw label banner
            label = f"{cls_name}: {conf:.2f}"
            t_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
            cv2.rectangle(img, (x1, y1 - 20), (x1 + t_size[0] + 6, y1), color, -1)
            cv2.putText(img, label, (x1 + 3, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)

            if cls_id == 1:
                plate_count += 1
                # Save plate crop
                crop = img[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
                if crop.size > 0:
                    crop_filename = crops_dir / f"{img_path.stem}_plate_{plate_count}.jpg"
                    cv2.imwrite(str(crop_filename), crop)
            elif cls_id == 0:
                veh_count += 1

        save_path = out_dir / f"annotated_{img_path.name}"
        cv2.imwrite(str(save_path), img)
        print(f"  [{idx+1}/{len(image_files)}] {img_path.name} -> {veh_count} vehicles, {plate_count} plates -> Saved: {save_path.name}")

    print(f"\n[✓] Inference complete! Results saved in {out_dir}")

if __name__ == "__main__":
    main()
