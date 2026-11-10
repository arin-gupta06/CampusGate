"""
Campus Gate - Hugging Face Multi-Batch Harvester, Hardener & Cloud Vault Pipeline
================================================================================
Fetches 50 curated real-world traffic surveillance videos (2 batches of 25)
from Hugging Face (EYEDOL/brb-traffic-videos_ORIGINAL1 and ORIGINAL2):
  - Batch 2 (25 vids): normanniles1 (Dawn, Noon, Sunset, Dusk)
  - Batch 3 (25 vids): normanniles2 (Night, Low-Light, Angle variation)
Extracts keyframes, applies scenario hardenings, fine-tunes on RTX 5050,
syncs to private Kaggle dataset, and wipes raw videos from local Drive D:.
"""

import os
import sys
import json
import shutil
import random
from pathlib import Path
from huggingface_hub import HfApi, hf_hub_download
import cv2
import numpy as np
import torch
from ultralytics import YOLO

# Add root to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml_training.harvest_and_harden import (
    apply_night_glare,
    apply_motion_blur,
    apply_weather_and_contrast,
    harvest_keyframes_from_videos,
    upload_dataset_to_kaggle,
    purge_local_raw_videos
)


def select_videos_by_time(files_list, target_count=25):
    """Picks videos evenly distributed across different hours of the day."""
    # Filter for .mp4
    mp4_files = sorted([f for f in files_list if f.endswith(".mp4")])
    if len(mp4_files) <= target_count:
        return mp4_files
    
    # Step evenly across the sorted chronological files
    step = len(mp4_files) // target_count
    selected = [mp4_files[i * step] for i in range(target_count)]
    return selected


def download_hf_video_batches(target_dir: Path):
    target_dir.mkdir(parents=True, exist_ok=True)
    api = HfApi()

    # 1. Batch 2: Camera 1 (normanniles1)
    print("\n[*] Querying Camera 1 (normanniles1) from Hugging Face...")
    files1 = api.list_repo_files("EYEDOL/brb-traffic-videos_ORIGINAL1", repo_type="dataset")
    batch2_files = select_videos_by_time(files1, target_count=25)
    print(f"[+] Selected 25 videos from Camera 1 across 24h timestamps.")

    # 2. Batch 3: Camera 2 (normanniles2)
    print("\n[*] Querying Camera 2 (normanniles2) from Hugging Face...")
    files2 = api.list_repo_files("EYEDOL/brb-traffic-videos_ORIGINAL2", repo_type="dataset")
    batch3_files = select_videos_by_time(files2, target_count=25)
    print(f"[+] Selected 25 videos from Camera 2 across 24h timestamps.")

    downloaded = []

    # Download Batch 2
    print("\n[*] Downloading Batch 2 (Camera 1 - 25 videos)...")
    for idx, fname in enumerate(batch2_files, 1):
        try:
            print(f"  [{idx}/25] Downloading {Path(fname).name}...")
            local_path = hf_hub_download(
                repo_id="EYEDOL/brb-traffic-videos_ORIGINAL1",
                filename=fname,
                repo_type="dataset",
                local_dir=str(target_dir)
            )
            downloaded.append(Path(local_path))
        except Exception as e:
            print(f"  [-] Error downloading {fname}: {e}")

    # Download Batch 3
    print("\n[*] Downloading Batch 3 (Camera 2 - 25 videos)...")
    for idx, fname in enumerate(batch3_files, 1):
        try:
            print(f"  [{idx}/25] Downloading {Path(fname).name}...")
            local_path = hf_hub_download(
                repo_id="EYEDOL/brb-traffic-videos_ORIGINAL2",
                filename=fname,
                repo_type="dataset",
                local_dir=str(target_dir)
            )
            downloaded.append(Path(local_path))
        except Exception as e:
            print(f"  [-] Error downloading {fname}: {e}")

    print(f"\n[✓] Successfully downloaded {len(downloaded)} authentic surveillance videos into {target_dir}")
    return downloaded


def flatten_downloaded_videos(target_dir: Path):
    """Moves nested downloaded videos into target_dir root for processing."""
    for sub in target_dir.glob("*/*"):
        if sub.is_file() and sub.suffix.lower() in [".mp4", ".avi"]:
            dest = target_dir / sub.name
            if not dest.exists():
                shutil.move(str(sub), str(dest))
    # Remove empty subdirs
    for d in target_dir.iterdir():
        if d.is_dir() and not any(d.iterdir()):
            d.rmdir()


def main():
    video_dir = PROJECT_ROOT / "test_videos"
    dataset_dir = SCRIPT_DIR / "datasets" / "campus_gate_det"
    train_imgs = dataset_dir / "train" / "images"
    train_lbls = dataset_dir / "train" / "labels"
    data_yaml = SCRIPT_DIR / "configs" / "data.yaml"
    device = "cuda:0" if torch.cuda.is_available() else "cpu"

    print("=" * 65)
    print(" Campus Gate - 50-Video Hugging Face Ingestion Pipeline")
    print("=" * 65)

    # 1. Download the 50 videos
    download_hf_video_batches(video_dir)
    flatten_downloaded_videos(video_dir)

    # 2. Keyframe Extraction & Hardening
    weights_path = SCRIPT_DIR / "weights" / "best.pt"
    if not weights_path.exists():
        weights_path = "yolo11s.pt"

    detector = YOLO(str(weights_path))

    print("\n[*] Harvesting and synthesizing scenario-hardened frames...")
    harvest_keyframes_from_videos(
        video_dir=video_dir,
        output_images_dir=train_imgs,
        output_labels_dir=train_lbls,
        detector=detector,
        sample_every_sec=1.5,
        max_frames_per_video=25,
        device=device
    )

    # Clear old label cache to ensure clean rescan
    for cache_f in dataset_dir.rglob("*.cache"):
        cache_f.unlink()

    # 3. Model Fine-Tuning on RTX 5050
    print("\n" + "=" * 65)
    print(" Fine-Tuning Unified Detector with 50-Video Augmented Dataset")
    print("=" * 65)
    model = YOLO(str(weights_path))
    results = model.train(
        data=str(data_yaml),
        epochs=15,
        batch=16,
        imgsz=640,
        device=device,
        workers=4,
        patience=8,
        project=str(SCRIPT_DIR / "runs"),
        name="campus_gate_hardened_50vids",
        exist_ok=True,
        amp=True,
        lr0=0.003,
        plots=True,
        save=True,
        verbose=True
    )

    # Save & Deploy best weights
    best_pt = SCRIPT_DIR / "runs" / "campus_gate_hardened_50vids" / "weights" / "best.pt"
    if best_pt.exists():
        shutil.copy2(best_pt, SCRIPT_DIR / "weights" / "best.pt")
        backend_target = PROJECT_ROOT / "backend" / "vision" / "weights" / "best.pt"
        if backend_target.parent.exists():
            shutil.copy2(best_pt, backend_target)
        print(f"[✓] Deployed new best weights to: {backend_target}")

    # 4. Upload updated dataset version to Kaggle (Private)
    upload_dataset_to_kaggle(dataset_dir=dataset_dir, dataset_slug="campus-gate-hardened-anpr")

    # 5. Purge raw video files from local Drive D:
    purge_local_raw_videos(video_dir=video_dir)

    print("\n" + "=" * 65)
    print(" 50-Video Ingestion, Training & Cloud Push Complete! ")
    print("=" * 65)


if __name__ == "__main__":
    main()

