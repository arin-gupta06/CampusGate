"""
Campus Gate - Motion Augmentation for Real Dataset Splits
=========================================================
Appends geometry-preserving moving-vehicle variants (motion blur tiers,
glare, shadow, night exposure) to a prepared YOLO split, reusing the
original labels. Run on the TRAIN split only (never val/test).

Usage:
  .venv\\Scripts\\python.exe ml_training/motion_augment_split.py --split train
"""

import argparse
import random
import sys
from pathlib import Path

import cv2

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml_training.augmentations import GateEnvironmentAugmentor


def parse_args():
    ap = argparse.ArgumentParser(description="Append motion variants to a dataset split.")
    ap.add_argument("--dataset", type=str, default=None,
                    help="Dataset root (defaults to datasets/campus_gate_det)")
    ap.add_argument("--split", type=str, default="train")
    ap.add_argument("--copies", type=int, default=1,
                    help="Motion-blurred copies per source image")
    ap.add_argument("--seed", type=int, default=77)
    return ap.parse_args()


def main():
    args = parse_args()
    root = Path(args.dataset) if args.dataset else (SCRIPT_DIR / "datasets" / "campus_gate_det")
    img_dir = root / args.split / "images"
    lbl_dir = root / args.split / "labels"
    assert img_dir.is_dir(), f"Missing split images: {img_dir}"
    rng = random.Random(args.seed)
    sources = sorted(img_dir.glob("*.jpg")) + sorted(img_dir.glob("*.png"))
    added = 0
    for src in sources:
        lbl = lbl_dir / f"{src.stem}.txt"
        if not lbl.exists():
            continue
        img = cv2.imread(str(src))
        if img is None:
            continue
        for c in range(args.copies):
            aug = img.copy()
            tier = rng.choices(["light", "medium", "heavy"], weights=[0.5, 0.35, 0.15])[0]
            k = {"light": rng.choice([3, 5]), "medium": rng.choice([7, 9]),
                 "heavy": rng.choice([11, 13, 15])}[tier]
            aug = GateEnvironmentAugmentor.apply_directional_motion_blur(
                aug, kernel_size=k, angle=rng.uniform(-12, 12))
            if rng.random() < 0.30:
                aug = GateEnvironmentAugmentor.inject_headlight_glare(
                    aug, intensity=rng.uniform(0.35, 0.7))
            if rng.random() < 0.30:
                aug = GateEnvironmentAugmentor.apply_canopy_shadow(aug)
            if rng.random() < 0.25:
                import numpy as np
                aug = np.clip(aug.astype("float32") * rng.uniform(0.35, 0.6), 0, 255).astype("uint8")
            stem = f"{src.stem}_motion{c}"
            cv2.imwrite(str(img_dir / f"{stem}.jpg"), aug)
            (lbl_dir / f"{stem}.txt").write_text(lbl.read_text(), encoding="utf-8")
            added += 1
    print(f"[OK] appended {added} motion variants to {args.split} ({len(sources)} sources)")


if __name__ == "__main__":
    main()
