"""
Campus Gate - Model Export & Production Packager
Finds the latest trained checkpoint, versions it, copies it to production weights directory,
and optionally exports to ONNX for accelerated deployment.
"""

import os
import shutil
import argparse
from pathlib import Path
from ultralytics import YOLO

def parse_args():
    parser = argparse.ArgumentParser(description="Export trained Campus Gate model.")
    parser.add_argument("--weights", type=str, default=None,
                        help="Explicit path to best.pt (auto-detected if None)")
    parser.add_argument("--export_onnx", action="store_true",
                        help="Export model to ONNX format")
    parser.add_argument("--output_dir", type=str, default=None,
                        help="Directory to store finalized production weights (defaults to ml_training/weights)")
    return parser.parse_args()

def find_latest_best_pt(search_root: Path) -> Path:
    candidates = list(search_root.glob("**/weights/best.pt"))
    if not candidates:
        # Fallback to any best.pt
        candidates = list(search_root.glob("**/best.pt"))
    if not candidates:
        raise FileNotFoundError("Could not locate any 'best.pt' checkpoint in the workspace.")
    # Return the most recently modified best.pt
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0]

def main():
    args = parse_args()
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    out_dir = Path(args.output_dir) if args.output_dir else (script_dir / "weights")
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.weights:
        src_pt = Path(args.weights)
    else:
        src_pt = find_latest_best_pt(project_root)

    dest_pt = out_dir / "best.pt"
    print(f"[*] Found trained model checkpoint: {src_pt}")
    if src_pt.resolve() != dest_pt.resolve():
        shutil.copy2(src_pt, dest_pt)
    print(f"[✓] Copied to production weights path: {dest_pt}")

    # Copy to backend directory as well if backend exists
    backend_weights = project_root / "backend" / "vision" / "weights"
    backend_weights.mkdir(parents=True, exist_ok=True)
    if src_pt.resolve() != (backend_weights / "best.pt").resolve():
        shutil.copy2(src_pt, backend_weights / "best.pt")
    print(f"[✓] Synced to backend vision weights: {backend_weights / 'best.pt'}")

    if args.export_onnx:
        print("[*] Exporting model to ONNX format (opset 17, dynamic=False, imgsz=640)...")
        model = YOLO(str(dest_pt))
        onnx_file = model.export(format="onnx", imgsz=640, dynamic=False)
        print(f"[✓] ONNX model exported: {onnx_file}")

    print("\n[✓] Export completed successfully!")

if __name__ == "__main__":
    main()
