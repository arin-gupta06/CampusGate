"""
Campus Gate - Model Evaluation & Validation Suite
Evaluates trained unified detector on held-out test set.
Measures:
  - mAP50 and mAP50-95
  - Precision and Recall for 'vehicle' and 'license_plate'
  - Inference latency (ms per frame)
"""

import os
import argparse
from pathlib import Path
import torch
os.environ.setdefault("YOLO_CONFIG_DIR", str(Path(__file__).resolve().parent / ".ultralytics_cfg"))
from ultralytics import YOLO

def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate Campus Gate trained detector.")
    parser.add_argument("--weights", type=str, default=None,
                        help="Path to trained model weights (defaults to weights/best.pt)")
    parser.add_argument("--data", type=str, default=None,
                        help="Path to dataset YAML configuration (defaults to configs/data.yaml)")
    parser.add_argument("--split", type=str, default="test",
                        help="Dataset split to evaluate on (test or val)")
    parser.add_argument("--imgsz", type=int, default=640,
                        help="Input image resolution")
    parser.add_argument("--device", type=str, default="cuda:0" if torch.cuda.is_available() else "cpu",
                        help="Device to run evaluation on")
    parser.add_argument("--project", type=str, default=None,
                        help="Directory to save evaluation charts (defaults to ml_training/runs/eval)")
    return parser.parse_args()

def main():
    args = parse_args()
    script_dir = Path(__file__).resolve().parent
    weights_path = Path(args.weights) if args.weights else (script_dir / "weights" / "best.pt")
    data_yaml = Path(args.data) if args.data else (script_dir / "configs" / "data.yaml")
    project_dir = Path(args.project).resolve() if args.project else (script_dir / "runs" / "eval")

    if not weights_path.exists():
        fallback = script_dir / "yolo11n.pt"
        if fallback.exists():
            print(f"[!] Warning: {weights_path} not found. Falling back to {fallback}")
            weights_path = fallback
        else:
            raise FileNotFoundError(f"Weights file not found at {weights_path}")

    print("=" * 65)
    print(" Campus Gate - Model Evaluation & Benchmarking")
    print("=" * 65)
    print(f"Weights       : {weights_path}")
    print(f"Dataset Config: {data_yaml}")
    print(f"Evaluation Set: {args.split}")
    print(f"Device        : {args.device}")
    print("=" * 65)

    model = YOLO(str(weights_path))

    metrics = model.val(
        data=str(data_yaml),
        split=args.split,
        imgsz=args.imgsz,
        device=args.device,
        project=str(project_dir),
        name=f"eval_{args.split}",
        plots=False,
        save_json=True
    )

    print("\n" + "=" * 65)
    print(" EVALUATION RESULTS SUMMARY")
    print("=" * 65)
    print(f"Mean Precision (P)    : {metrics.box.mp:.4f}")
    print(f"Mean Recall (R)       : {metrics.box.mr:.4f}")
    print(f"mAP@50 (Overall)      : {metrics.box.map50:.4f}")
    print(f"mAP@50-95 (Overall)   : {metrics.box.map:.4f}")
    
    # Class-wise breakdowns
    names = metrics.names
    print("\n--- Per-Class Performance ---")
    for idx, name in names.items():
        if idx < len(metrics.box.ap50):
            p = metrics.box.p[idx] if idx < len(metrics.box.p) else 0.0
            r = metrics.box.r[idx] if idx < len(metrics.box.r) else 0.0
            ap50 = metrics.box.ap50[idx]
            ap = metrics.box.ap[idx]
            print(f"Class [{name}]:")
            print(f"    Precision : {p:.4f} | Recall: {r:.4f} | mAP50: {ap50:.4f} | mAP50-95: {ap:.4f}")

    print("\nSpeed Metrics:")
    for k, v in metrics.speed.items():
        print(f"    {k}: {v:.2f} ms")
    print("=" * 65)

if __name__ == "__main__":
    main()
