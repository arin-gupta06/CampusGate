"""
Campus Gate - Dataset Preparation & Annotation Fusion Pipeline
Downloads license plate dataset, fuses with vehicle bounding boxes using pretrained YOLO,
and formats into standard YOLO train/val/test splits.
Classes:
  0: vehicle
  1: license_plate
"""

import os
import io
import json
import zipfile
import argparse
import urllib.request
from pathlib import Path
import cv2
import numpy as np
import torch
from ultralytics import YOLO

HF_BASE_URL = "https://huggingface.co/datasets/keremberke/license-plate-object-detection/resolve/main/data"
COCO_VEHICLE_CLASSES = {2: 'car', 3: 'motorcycle', 5: 'bus', 7: 'truck'}

def parse_args():
    parser = argparse.ArgumentParser(description="Prepare Campus Gate unified detection dataset.")
    parser.add_argument("--output_dir", type=str, default=None,
                        help="Root directory to save prepared dataset (defaults to datasets/campus_gate_det)")
    parser.add_argument("--max_train", type=int, default=1500,
                        help="Max training images to process (0 for all)")
    parser.add_argument("--max_val", type=int, default=300,
                        help="Max validation images to process (0 for all)")
    parser.add_argument("--max_test", type=int, default=200,
                        help="Max test images to process (0 for all)")
    parser.add_argument("--device", type=str, default="cuda:0" if torch.cuda.is_available() else "cpu",
                        help="Inference device for auto-labeling vehicles")
    return parser.parse_args()

def download_zip(split_name: str, cache_dir: Path) -> Path:
    cache_dir.mkdir(parents=True, exist_ok=True)
    zip_path = cache_dir / f"{split_name}.zip"
    if zip_path.exists() and zip_path.stat().st_size > 1024:
        print(f"[*] Found cached {zip_path.name} ({zip_path.stat().st_size / (1024*1024):.1f} MB)")
        return zip_path
    
    url = f"{HF_BASE_URL}/{split_name}.zip"
    print(f"[*] Downloading {split_name}.zip from {url}...")
    urllib.request.urlretrieve(url, zip_path)
    print(f"[+] Downloaded {zip_path.name} ({zip_path.stat().st_size / (1024*1024):.1f} MB)")
    return zip_path

def process_split(split_name: str, zip_path: Path, out_split_dir: Path, max_samples: int,
                  detector: YOLO, device: str):
    images_dir = out_split_dir / "images"
    labels_dir = out_split_dir / "labels"
    images_dir.mkdir(parents=True, exist_ok=True)
    labels_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n[+] Extracting & preparing split: {split_name} into {out_split_dir}...")
    with zipfile.ZipFile(zip_path, 'r') as zf:
        coco_data = json.loads(zf.read('_annotations.coco.json'))
        images_meta = coco_data.get('images', [])
        annotations = coco_data.get('annotations', [])

        # Group plate annotations by image_id
        plates_by_img_id = {}
        for ann in annotations:
            img_id = ann['image_id']
            if img_id not in plates_by_img_id:
                plates_by_img_id[img_id] = []
            plates_by_img_id[img_id].append(ann['bbox'])

        if max_samples > 0:
            images_meta = images_meta[:max_samples]

        total = len(images_meta)
        print(f"[*] Processing {total} images for {split_name}...")

        batch_size = 16
        for i in range(0, total, batch_size):
            batch_meta = images_meta[i:i + batch_size]
            batch_imgs = []
            valid_meta = []

            for meta in batch_meta:
                try:
                    raw_bytes = zf.read(meta['file_name'])
                    img = cv2.imdecode(np.frombuffer(raw_bytes, np.uint8), cv2.IMREAD_COLOR)
                    if img is not None:
                        batch_imgs.append(img)
                        valid_meta.append(meta)
                except Exception as e:
                    print(f"[!] Warning: error reading {meta['file_name']}: {e}")

            if not batch_imgs:
                continue

            # Run vehicle detection batch
            results = detector(batch_imgs, conf=0.30, device=device, verbose=False)

            for meta, img, res in zip(valid_meta, batch_imgs, results):
                orig_h, orig_w = img.shape[:2]
                stem = Path(meta['file_name']).stem
                out_img_path = images_dir / f"{stem}.jpg"
                out_lbl_path = labels_dir / f"{stem}.txt"

                # Save image
                cv2.imwrite(str(out_img_path), img)

                label_lines = []

                # 1. Add detected vehicles (Class 0: vehicle)
                for box in res.boxes:
                    cls_id = int(box.cls[0])
                    if cls_id in COCO_VEHICLE_CLASSES:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        cx = ((x1 + x2) / 2.0) / orig_w
                        cy = ((y1 + y2) / 2.0) / orig_h
                        bw = (x2 - x1) / orig_w
                        bh = (y2 - y1) / orig_h
                        label_lines.append(f"0 {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}")

                # 2. Add ground-truth license plates (Class 1: license_plate)
                img_plates = plates_by_img_id.get(meta['id'], [])
                for pb in img_plates:
                    px, py, pw, ph = pb  # [x_min, y_min, width, height]
                    cx = (px + pw / 2.0) / orig_w
                    cy = (py + ph / 2.0) / orig_h
                    bw = pw / orig_w
                    bh = ph / orig_h
                    # Clamp coordinates between 0 and 1
                    cx = max(0.0, min(1.0, cx))
                    cy = max(0.0, min(1.0, cy))
                    bw = max(0.0, min(1.0, bw))
                    bh = max(0.0, min(1.0, bh))
                    label_lines.append(f"1 {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}")

                with open(out_lbl_path, "w", encoding="utf-8") as lf:
                    lf.write("\n".join(label_lines) + "\n")

            if (i + len(batch_meta)) % 100 == 0 or (i + len(batch_meta)) >= total:
                print(f"    Progress: {min(i + len(batch_meta), total)}/{total} images processed")

    print(f"[✓] Finished split: {split_name} ({len(list(images_dir.glob('*.jpg')))} images saved)")

def main():
    args = parse_args()
    script_dir = Path(__file__).resolve().parent
    out_dir = Path(args.output_dir) if args.output_dir else (script_dir / "datasets" / "campus_gate_det")
    cache_dir = script_dir / "cache"

    print("=" * 60)
    print(" Campus Gate - Dataset Preparation & Annotation Fusion")
    print("=" * 60)
    print(f"Output directory : {out_dir}")
    print(f"Inference device : {args.device}")
    print(f"Max samples      : train={args.max_train}, val={args.max_val}, test={args.max_test}")

    # Load pretrained baseline for vehicle auto-annotation
    print("[*] Loading pretrained YOLO11n for vehicle detection auto-annotation...")
    base_model_path = script_dir / "yolo11n.pt"
    detector = YOLO(str(base_model_path) if base_model_path.exists() else "yolo11n.pt")

    # Download splits
    test_zip = download_zip("test", cache_dir)
    val_zip = download_zip("valid", cache_dir)
    train_zip = download_zip("train", cache_dir)

    # Process splits
    process_split("val", val_zip, out_dir / "val", args.max_val, detector, args.device)
    process_split("test", test_zip, out_dir / "test", args.max_test, detector, args.device)
    process_split("train", train_zip, out_dir / "train", args.max_train, detector, args.device)

    # Generate data.yaml
    yaml_path = out_dir / "data.yaml"
    config_yaml_dir = script_dir / "configs"
    config_yaml_dir.mkdir(parents=True, exist_ok=True)
    target_config = config_yaml_dir / "data.yaml"

    yaml_content = f"""# Campus Gate Unified Vehicle & License Plate Detection Dataset
path: {out_dir.as_posix()}
train: train/images
val: val/images
test: test/images

names:
  0: vehicle
  1: license_plate
"""
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write(yaml_content)
    with open(target_config, "w", encoding="utf-8") as f:
        f.write(yaml_content)

    print(f"\n[✓] Generated data configuration at:")
    print(f"    - {yaml_path}")
    print(f"    - {target_config}")
    print("\nDataset preparation completed successfully!")

if __name__ == "__main__":
    main()
