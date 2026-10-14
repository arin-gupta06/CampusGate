"""
Campus Gate - YOLO Model Fine-Tuning Runner
Trains unified vehicle and license plate detector on NVIDIA RTX 5050 GPU.
Classes:
  0: vehicle
  1: license_plate
"""

import os
import shutil
import argparse
from pathlib import Path
import torch
from ultralytics import YOLO

def parse_args():
    parser = argparse.ArgumentParser(description="Fine-tune YOLO model for Campus Gate.")
    parser.add_argument("--model", type=str, default="yolo11s.pt",
                        help="Base pretrained YOLO model (e.g., yolo11s.pt, yolo11n.pt, yolov8s.pt)")
    parser.add_argument("--data", type=str, default=None,
                        help="Path to dataset YAML configuration (defaults to configs/data.yaml)")
    parser.add_argument("--epochs", type=int, default=30,
                        help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16,
                        help="Batch size (calibrated for RTX 5050 VRAM)")
    parser.add_argument("--imgsz", type=int, default=640,
                        help="Input image resolution")
    parser.add_argument("--device", type=str, default="cuda:0" if torch.cuda.is_available() else "cpu",
                        help="Device to train on (cuda:0 or cpu)")
    parser.add_argument("--workers", type=int, default=4,
                        help="DataLoader worker threads")
    parser.add_argument("--patience", type=int, default=10,
                        help="Early stopping patience (epochs)")
    parser.add_argument("--project", type=str, default=None,
                        help="Directory to save training run logs & metrics (defaults to ml_training/runs)")
    parser.add_argument("--name", type=str, default="campus_gate_detector",
                        help="Experiment run name")
    return parser.parse_args()

def main():
    args = parse_args()
    script_dir = Path(__file__).resolve().parent
    data_yaml = Path(args.data) if args.data else (script_dir / "configs" / "data.yaml")
    project_dir = Path(args.project).resolve() if args.project else (script_dir / "runs")
    weights_dir = script_dir / "weights"
    weights_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print(" Campus Gate - YOLO Model Training (Unified Detector)")
    print("=" * 65)
    print(f"Base Model    : {args.model}")
    print(f"Dataset Config: {data_yaml}")
    print(f"Target Device : {args.device}")
    if torch.cuda.is_available():
        print(f"GPU Name      : {torch.cuda.get_device_name(0)}")
    print(f"Epochs        : {args.epochs} (Patience: {args.patience})")
    print(f"Batch Size    : {args.batch} @ {args.imgsz}x{args.imgsz}")
    print("=" * 65)

    if not data_yaml.exists():
        raise FileNotFoundError(f"Dataset config not found at: {data_yaml}. Run prepare_dataset.py first!")

    # Initialize model
    model = YOLO(args.model)

    # Launch training
    print("\n[*] Starting training loop with mixed precision (AMP)...")
    results = model.train(
        data=str(data_yaml),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        workers=args.workers,
        patience=args.patience,
        project=str(project_dir),
        name=args.name,
        exist_ok=True,
        amp=True,
        plots=True,
        save=True,
        verbose=True
    )

    # Save best weights to ml_training/weights/best.pt
    run_dir = project_dir / args.name
    best_pt = run_dir / "weights" / "best.pt"
    target_best_pt = weights_dir / "best.pt"

    if best_pt.exists():
        shutil.copy2(best_pt, target_best_pt)
        print("\n" + "=" * 65)
        print(f"[✓] Training successfully completed!")
        print(f"[✓] Saved best weights to: {target_best_pt}")
        print(f"[✓] Full run artifacts: {run_dir}")
        print("=" * 65)
    else:
        print("[!] Training completed, but best.pt was not found in the run directory.")

if __name__ == "__main__":
    main()
