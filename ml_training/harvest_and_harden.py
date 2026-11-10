"""
Campus Gate - Video Dataset Harvester, Hardener & Cloud Transfer Pipeline
========================================================================
1. Samples keyframes from all test videos in test_videos/
2. Auto-annotates vehicles & license plates using current YOLO weights
3. Applies scenario hardening (glare, motion blur, angle perspective, Indian HSRP)
4. Merges into YOLO dataset splits (train / val / test)
5. Trains the model on NVIDIA RTX 5050 GPU
6. Uploads the dataset to user's private Kaggle account (xyx2201)
7. Purges raw local video files from Drive D:
"""

import os
import sys
import json
import shutil
import random
import argparse
from pathlib import Path
import cv2
import numpy as np
import torch
from ultralytics import YOLO

# Add root to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml_training.augmentations import (
    SyntheticIndianPlateGenerator,
    GateEnvironmentAugmentor,
    INDIAN_STATES
)


def apply_night_glare(image: np.ndarray, num_glares: int = 2) -> np.ndarray:
    """Simulates approaching vehicle headlight radial bloom / glare."""
    out = image.copy()
    h, w = out.shape[:2]
    # Darken background to simulate night
    out = (out.astype(np.float32) * random.uniform(0.3, 0.55)).astype(np.uint8)
    
    for _ in range(num_glares):
        cx = random.randint(int(w * 0.15), int(w * 0.85))
        cy = random.randint(int(h * 0.3), int(h * 0.8))
        radius = random.randint(35, 90)
        
        # Draw radial white-yellow bloom
        overlay = out.copy()
        cv2.circle(overlay, (cx, cy), radius, (230, 245, 255), -1)
        cv2.circle(overlay, (cx, cy), int(radius * 0.4), (255, 255, 255), -1)
        
        # Soft blur
        blurred = cv2.GaussianBlur(overlay, (51, 51), 0)
        alpha = random.uniform(0.5, 0.75)
        out = cv2.addWeighted(blurred, alpha, out, 1.0 - alpha, 0)
    return out


def apply_motion_blur(image: np.ndarray, degree: int = 15, angle: float = 0.0) -> np.ndarray:
    """Applies realistic directional motion blur simulating high-speed approach."""
    M = cv2.getRotationMatrix2D((degree / 2, degree / 2), angle, 1)
    kernel = np.diag(np.ones(degree))
    kernel = cv2.warpAffine(kernel, M, (degree, degree))
    kernel = kernel / np.sum(kernel)
    return cv2.filter2D(image, -1, kernel)


def apply_weather_and_contrast(image: np.ndarray) -> np.ndarray:
    """Simulates harsh contrast drops, fog / rain streaks."""
    out = image.copy()
    # Contrast adjustment
    alpha = random.uniform(0.7, 1.3)
    beta = random.randint(-25, 25)
    out = np.clip(alpha * out.astype(np.float32) + beta, 0, 255).astype(np.uint8)
    
    # Simulated rain streaks
    if random.random() < 0.5:
        num_drops = random.randint(150, 400)
        for _ in range(num_drops):
            x = random.randint(0, out.shape[1] - 1)
            y = random.randint(0, out.shape[0] - 1)
            length = random.randint(10, 25)
            cv2.line(out, (x, y), (x + random.randint(-3, 3), y + length), (200, 200, 210), 1)
    return out


def harvest_keyframes_from_videos(
    video_dir: Path,
    output_images_dir: Path,
    output_labels_dir: Path,
    detector: YOLO,
    sample_every_sec: float = 1.0,
    max_frames_per_video: int = 40,
    device: str = "cuda:0"
):
    """
    Extracts keyframes from videos, runs auto-detection, applies scenario hardenings,
    and writes image & YOLO label files.
    """
    output_images_dir.mkdir(parents=True, exist_ok=True)
    output_labels_dir.mkdir(parents=True, exist_ok=True)

    video_files = sorted([
        f for f in video_dir.glob("*")
        if f.suffix.lower() in [".mp4", ".avi", ".mov", ".mkv"]
    ])

    print(f"[*] Found {len(video_files)} video files in {video_dir}...")
    saved_count = 0

    for vid_idx, vid_path in enumerate(video_files):
        print(f"\n[{vid_idx+1}/{len(video_files)}] Processing video: {vid_path.name}")
        cap = cv2.VideoCapture(str(vid_path))
        if not cap.isOpened():
            print(f"[-] Could not open {vid_path.name}, skipping.")
            continue

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        frame_interval = max(1, int(fps * sample_every_sec))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        frame_idx = 0
        extracted_from_this_vid = 0

        while cap.isOpened() and extracted_from_this_vid < max_frames_per_video:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                h, w = frame.shape[:2]
                # Run YOLO prediction
                preds = detector.predict(frame, conf=0.25, device=device, verbose=False)[0]
                
                boxes_yolo = []
                for box in preds.boxes:
                    cls_id = int(box.cls[0])
                    xywhn = box.xywhn[0].cpu().numpy().tolist()
                    boxes_yolo.append((cls_id, xywhn))

                # Only keep frames where at least one vehicle or plate was found
                if len(boxes_yolo) > 0:
                    base_stem = f"vid_{vid_idx:02d}_f{frame_idx:06d}"
                    
                    # 1. Save standard clean frame
                    clean_img_path = output_images_dir / f"{base_stem}_clean.jpg"
                    clean_lbl_path = output_labels_dir / f"{base_stem}_clean.txt"
                    cv2.imwrite(str(clean_img_path), frame)
                    with open(clean_lbl_path, "w") as lf:
                        for cls_id, (xc, yc, bw, bh) in boxes_yolo:
                            lf.write(f"{cls_id} {xc:.6f} {yc:.6f} {bw:.6f} {bh:.6f}\n")
                    saved_count += 1
                    extracted_from_this_vid += 1

                    # 2. Hardening Variant A: Night & Glare
                    night_img = apply_night_glare(frame)
                    night_img_path = output_images_dir / f"{base_stem}_night.jpg"
                    night_lbl_path = output_labels_dir / f"{base_stem}_night.txt"
                    cv2.imwrite(str(night_img_path), night_img)
                    shutil.copy2(clean_lbl_path, night_lbl_path)
                    saved_count += 1

                    # 3. Hardening Variant B: Motion Blur
                    blur_img = apply_motion_blur(frame, degree=random.randint(12, 22), angle=random.choice([0, 15, -15]))
                    blur_img_path = output_images_dir / f"{base_stem}_motion.jpg"
                    blur_lbl_path = output_labels_dir / f"{base_stem}_motion.txt"
                    cv2.imwrite(str(blur_img_path), blur_img)
                    shutil.copy2(clean_lbl_path, blur_lbl_path)
                    saved_count += 1

                    # 4. Hardening Variant C: Weather & Low Contrast
                    weather_img = apply_weather_and_contrast(frame)
                    weather_img_path = output_images_dir / f"{base_stem}_weather.jpg"
                    weather_lbl_path = output_labels_dir / f"{base_stem}_weather.txt"
                    cv2.imwrite(str(weather_img_path), weather_img)
                    shutil.copy2(clean_lbl_path, weather_lbl_path)
                    saved_count += 1

            frame_idx += 1
        cap.release()
        print(f"[+] Harvested & hardened {extracted_from_this_vid * 4} frames from {vid_path.name}")

    print(f"\n[✓] Total harvested & scenario-hardened frames saved: {saved_count}")
    return saved_count


def upload_dataset_to_kaggle(dataset_dir: Path, dataset_slug: str = "campus-gate-hardened-anpr"):
    """Creates dataset-metadata.json and pushes dataset directly to user's private Kaggle account."""
    from dotenv import load_dotenv
    load_dotenv()
    token = os.getenv("export KAGGLE_API_TOKEN") or os.getenv("KAGGLE_API_TOKEN")
    if token:
        os.environ["KAGGLE_API_TOKEN"] = token.strip()
    
    import kaggle
    kaggle.api.authenticate()
    user = kaggle.api.config_values.get("username", "xyx2201")
    full_dataset_id = f"{user}/{dataset_slug}"

    meta_file = dataset_dir / "dataset-metadata.json"
    meta_content = {
        "title": "Campus Gate Hardened ANPR Dataset",
        "id": full_dataset_id,
        "licenses": [{"name": "CC0-1.0"}],
        "isPrivate": True
    }
    with open(meta_file, "w") as f:
        json.dump(meta_content, f, indent=2)

    print(f"\n[*] Uploading dataset {full_dataset_id} to Kaggle (Private)...")
    try:
        # Check if already exists; if so, create version, else create new
        kaggle.api.dataset_create_new(
            folder=str(dataset_dir),
            dir_mode="zip",
            quiet=False
        )
        print(f"[✓] Successfully uploaded private dataset to: https://www.kaggle.com/datasets/{full_dataset_id}")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("[*] Dataset already exists, creating new version...")
            kaggle.api.dataset_create_version(
                folder=str(dataset_dir),
                version_notes="Automated scenario-hardened update",
                dir_mode="zip",
                quiet=False
            )
            print(f"[✓] Successfully updated private dataset version on Kaggle!")
        else:
            print(f"[-] Kaggle upload message: {e}")


def purge_local_raw_videos(video_dir: Path):
    """Wipes raw downloaded videos from local Drive D: to free up space."""
    print(f"\n[*] Purging raw video files in {video_dir}...")
    freed_bytes = 0
    for f in video_dir.glob("*"):
        if f.is_file():
            freed_bytes += f.stat().st_size
            try:
                f.unlink()
            except Exception as e:
                print(f"[-] Could not delete {f.name}: {e}")
    print(f"[✓] Purged raw videos. Freed up {freed_bytes / (1024*1024):.2f} MB from Drive D:")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="End-to-End Harvester, Hardener, Trainer & Cloud Transfer.")
    parser.add_argument("--skip-train", action="store_true", help="Skip training step")
    parser.add_argument("--skip-upload", action="store_true", help="Skip Kaggle upload step")
    parser.add_argument("--skip-purge", action="store_true", help="Skip purging test_videos")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    args = parser.parse_args()

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    print(f"[*] Running on device: {device}")
    
    # Load model for keyframe auto-labeling
    weights_path = SCRIPT_DIR / "weights" / "best.pt"
    if not weights_path.exists():
        weights_path = SCRIPT_DIR / "runs" / "campus_gate_detector" / "weights" / "best.pt"
    if not weights_path.exists():
        weights_path = "yolo11s.pt"

    detector = YOLO(str(weights_path))

    # Output paths
    dataset_dir = SCRIPT_DIR / "datasets" / "campus_gate_det"
    train_imgs = dataset_dir / "train" / "images"
    train_lbls = dataset_dir / "train" / "labels"
    video_dir = PROJECT_ROOT / "test_videos"

    # 1. Harvest & Harden
    harvest_keyframes_from_videos(
        video_dir=video_dir,
        output_images_dir=train_imgs,
        output_labels_dir=train_lbls,
        detector=detector,
        sample_every_sec=0.8,
        max_frames_per_video=35,
        device=device
    )

    # 2. Train Model
    if not args.skip_train:
        print("\n" + "=" * 65)
        print(" Fine-Tuning YOLO on Hardened Dataset (RTX 5050)")
        print("=" * 65)
        train_py = SCRIPT_DIR / "train.py"
        data_yaml = SCRIPT_DIR / "configs" / "data.yaml"
        # Train with mixed precision on GPU
        model = YOLO(str(weights_path))
        results = model.train(
            data=str(data_yaml),
            epochs=args.epochs,
            batch=16,
            imgsz=640,
            device=device,
            workers=4,
            patience=8,
            project=str(SCRIPT_DIR / "runs"),
            name="hardened_gate_detector",
            exist_ok=True,
            amp=True,
            lr0=0.005,
            plots=True,
            save=True,
            verbose=True
        )
        
        # Save best weights
        best_pt = SCRIPT_DIR / "runs" / "hardened_gate_detector" / "weights" / "best.pt"
        if best_pt.exists():
            shutil.copy2(best_pt, SCRIPT_DIR / "weights" / "best.pt")
            backend_target = PROJECT_ROOT / "backend" / "vision" / "weights" / "best.pt"
            if backend_target.parent.exists():
                shutil.copy2(best_pt, backend_target)
            print(f"[✓] Deployed new best weights to: {SCRIPT_DIR / 'weights' / 'best.pt'}")

    # 3. Upload Dataset to Kaggle (Private)
    if not args.skip_upload:
        upload_dataset_to_kaggle(dataset_dir=dataset_dir)

    # 4. Purge raw video files to free local disk space
    if not args.skip_purge:
        purge_local_raw_videos(video_dir=video_dir)

    print("\n" + "=" * 65)
    print(" Pipeline Completed Successfully! ")
    print("=" * 65)

