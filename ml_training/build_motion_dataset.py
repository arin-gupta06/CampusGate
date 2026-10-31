"""
Campus Gate - Offline Motion-Focused Detection Dataset Builder
=============================================================
Generates a fully offline synthetic dataset that stresses the exact
conditions where moving-vehicle plates are missed:
  - directional motion blur (light / medium / heavy)
  - distance scale (near / mid / far small plates)
  - tilt & perspective (gate camera angles)
  - night / glare / shadow lighting
  - single-row, two-row, and commercial strip layouts

Plates are rendered by SyntheticIndianPlateGenerator with exact
pixel boxes, pasted onto procedural gate scenes with exact vehicle
boxes, so every label is ground truth. No network required.

Output: ml_training/datasets/motion_det/{train,val,test}/{images,labels}
        + data.yaml, split 400/80/80 by default.

Usage:
  .venv\\Scripts\\python.exe ml_training/build_motion_dataset.py
  .venv\\Scripts\\python.exe ml_training/build_motion_dataset.py --train 600 --val 100 --test 100
"""

import argparse
import random
import sys
from pathlib import Path

import cv2
import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml_training.augmentations import (
    SyntheticIndianPlateGenerator,
    GateEnvironmentAugmentor,
    INDIAN_STATES,
)

IMG_W, IMG_H = 640, 480
VEHICLE_COLORS = [
    (30, 60, 140), (140, 60, 30), (60, 60, 60), (180, 180, 180),
    (30, 120, 120), (120, 30, 90), (50, 50, 50),
]


def render_two_row_plate(gen: SyntheticIndianPlateGenerator, rng: random.Random):
    """Square two-row bike/auto style plate (top: state+district, bottom: rest)."""
    state = rng.choice(INDIAN_STATES)
    district = f"{rng.randint(1, 45):02d}"
    series = "".join(rng.choice("ABCDEFGHJKLMNPRSTUVWXYZ") for _ in range(rng.choice([1, 2])))
    num = f"{rng.randint(1000, 9999)}"
    w, h = 150, 150
    plate = np.full((h, w, 3), (248, 248, 248), dtype=np.uint8)
    cv2.rectangle(plate, (2, 2), (w - 3, h - 3), (25, 25, 25), 3)
    for i, line in enumerate((f"{state}{district}", f"{series}{num}")):
        (tw, th), _ = cv2.getTextSize(line, gen.font, 1.3, 3)
        tx = (w - tw) // 2
        ty = int(h * (0.36 if i == 0 else 0.82))
        cv2.putText(plate, line, (tx, ty), gen.font, 1.3, (15, 15, 15), 3, cv2.LINE_AA)
    return plate


def procedural_scene(rng: random.Random):
    """Gate-lane backdrop: wall, road with lane markings, sky noise."""
    img = np.full((IMG_H, IMG_W, 3), (52, 52, 58), dtype=np.uint8)
    cv2.rectangle(img, (0, 0), (IMG_W, 200), (38, 44, 60), -1)  # wall/sky
    cv2.rectangle(img, (0, 200), (IMG_W, IMG_H), (70, 70, 72), -1)  # road
    for x in range(20, IMG_W, 90):  # dashed lane line
        cv2.rectangle(img, (x, 330), (x + 45, 338), (200, 200, 200), -1)
    noise = rng_randint_noise(img.shape, rng)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return img


def rng_randint_noise(shape, rng: random.Random):
    return np.random.RandomState(rng.randint(0, 10 ** 9)).randint(-8, 8, size=shape).astype(np.int16)


def paste_vehicle_and_plate(rng: random.Random, gen: SyntheticIndianPlateGenerator):
    """Returns (scene, vehicle_box_xyxy, plate_box_xyxy) with exact boxes."""
    img = procedural_scene(rng)

    # Vehicle placement & scale band: near / mid / far.
    band = rng.choices(["near", "mid", "far"], weights=[0.35, 0.40, 0.25])[0]
    if band == "near":
        vw = rng.randint(380, 520)
    elif band == "mid":
        vw = rng.randint(240, 379)
    else:
        vw = rng.randint(130, 239)
    vh = int(vw * rng.uniform(0.55, 0.75))
    vx1 = rng.randint(0, max(1, IMG_W - vw))
    vy2 = rng.randint(min(IMG_H, 300 + vh // 2), IMG_H)
    vy1 = max(120, vy2 - vh)
    vx2 = min(IMG_W, vx1 + vw)
    color = rng.choice(VEHICLE_COLORS)
    cv2.rectangle(img, (vx1, vy1), (vx2, vy2), color, -1)
    # Windshield + wheels + headlights for vehicle texture.
    cv2.rectangle(img, (vx1 + vw // 6, vy1 + vh // 8),
                  (vx2 - vw // 6, vy1 + vh // 3), (180, 210, 230), -1)
    for wx in (vx1 + vw // 6, vx2 - vw // 6):
        cv2.circle(img, (wx, vy2 - 8), max(8, vh // 12), (15, 15, 15), -1)
    for hx in (vx1 + vw // 10, vx2 - vw // 10):
        cv2.circle(img, (hx, vy2 - vh // 4), max(4, vh // 28), (220, 220, 180), -1)

    # Plate layout & render.
    layout = rng.choices(["single", "tworow", "strip"],
                         weights=[0.55, 0.25, 0.20])[0]
    if layout == "tworow":
        plate = render_two_row_plate(gen, rng)
        target_w = int(vw * rng.uniform(0.16, 0.24))
        scale = target_w / plate.shape[1]
        plate = cv2.resize(plate, (target_w, max(20, int(plate.shape[0] * scale))),
                           interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC)
    else:
        plate, _, _ = gen.render_plate()
        span = rng.uniform(0.30, 0.45) if layout == "strip" else rng.uniform(0.24, 0.36)
        target_w = max(28, int(vw * span))
        scale = target_w / plate.shape[1]
        plate = cv2.resize(plate, (target_w, max(12, int(plate.shape[0] * scale))),
                           interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC)

    # Tilt BEFORE paste so the label stays exact (unbound rotate + paste extent).
    if rng.random() < 0.45:
        ang = rng.uniform(-28, 28)
        ph, pw = plate.shape[:2]
        m = cv2.getRotationMatrix2D((pw / 2, ph / 2), ang, 1.0)
        cos_a, sin_a = abs(m[0, 0]), abs(m[0, 1])
        nw, nh = int(ph * sin_a + pw * cos_a), int(ph * cos_a + pw * sin_a)
        m[0, 2] += nw / 2 - pw / 2
        m[1, 2] += nh / 2 - ph / 2
        plate = cv2.warpAffine(plate, m, (nw, nh), borderValue=tuple(int(c) for c in color))

    ph, pw = plate.shape[:2]
    # Paste on bumper band with jitter; clamp inside frame.
    px1 = int(vx1 + vw / 2 - pw / 2 + rng.randint(-vw // 12, vw // 12))
    py1 = int(vy2 - vh * 0.28 - ph / 2 + rng.randint(-8, 8))
    px1 = max(0, min(IMG_W - pw, px1))
    py1 = max(0, min(IMG_H - ph, py1))
    img[py1:py1 + ph, px1:px1 + pw] = plate
    return img, [vx1, vy1, vx2, vy2], [px1, py1, px1 + pw, py1 + ph]


def apply_motion_conditions(img, rng: random.Random):
    """Scene-level moving-vehicle conditions (geometry-preserving)."""
    roll = rng.random()
    if roll < 0.45:
        # Motion blur tiers: light / medium / heavy.
        tier = rng.choices(["light", "medium", "heavy"], weights=[0.5, 0.35, 0.15])[0]
        k = {"light": rng.choice([3, 5]), "medium": rng.choice([7, 9]),
             "heavy": rng.choice([11, 13, 15])}[tier]
        ang = rng.uniform(-12, 12)  # near-horizontal vehicle motion
        img = GateEnvironmentAugmentor.apply_directional_motion_blur(img, kernel_size=k, angle=ang)
    if rng.random() < 0.30:
        img = GateEnvironmentAugmentor.inject_headlight_glare(
            img, intensity=rng.uniform(0.35, 0.7))
    if rng.random() < 0.30:
        img = GateEnvironmentAugmentor.apply_canopy_shadow(img)
    if rng.random() < 0.25:
        # Night / low-light exposure.
        img = np.clip(img.astype(np.float32) * rng.uniform(0.35, 0.6), 0, 255).astype(np.uint8)
    return img


def to_yolo_line(cls_id, box, img_w=IMG_W, img_h=IMG_H):
    x1, y1, x2, y2 = box
    cx = ((x1 + x2) / 2) / img_w
    cy = ((y1 + y2) / 2) / img_h
    bw = (x2 - x1) / img_w
    bh = (y2 - y1) / img_h
    return f"{cls_id} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}"


def build_split(root: Path, name: str, count: int, seed: int):
    rng = random.Random(seed)
    gen = SyntheticIndianPlateGenerator()
    img_dir = root / name / "images"
    lbl_dir = root / name / "labels"
    img_dir.mkdir(parents=True, exist_ok=True)
    lbl_dir.mkdir(parents=True, exist_ok=True)
    for i in range(count):
        img, vbox, pbox = paste_vehicle_and_plate(rng, gen)
        img = apply_motion_conditions(img, rng)
        stem = f"motion_{name}_{i:04d}"
        cv2.imwrite(str(img_dir / f"{stem}.jpg"), img)
        with open(lbl_dir / f"{stem}.txt", "w", encoding="utf-8") as f:
            f.write(to_yolo_line(0, vbox) + "\n")
            f.write(to_yolo_line(1, pbox) + "\n")
    print(f"[OK] {name}: {count} images -> {img_dir}")


def parse_args():
    ap = argparse.ArgumentParser(description="Build offline motion-focused detection dataset.")
    ap.add_argument("--train", type=int, default=400)
    ap.add_argument("--val", type=int, default=80)
    ap.add_argument("--test", type=int, default=80)
    ap.add_argument("--output_dir", type=str, default=None)
    ap.add_argument("--seed", type=int, default=20261030)
    return ap.parse_args()


def main():
    args = parse_args()
    out = Path(args.output_dir) if args.output_dir else (SCRIPT_DIR / "datasets" / "motion_det")
    print("=" * 60)
    print(" Campus Gate - Offline Motion Dataset Builder")
    print("=" * 60)
    build_split(out, "train", args.train, args.seed)
    build_split(out, "val", args.val, args.seed + 1)
    build_split(out, "test", args.test, args.seed + 2)
    yaml_text = (
        "# Campus Gate Motion-Focused Detection Dataset (offline synthetic)\n"
        f"path: {out.as_posix()}\n"
        "train: train/images\n"
        "val: val/images\n"
        "test: test/images\n"
        "\n"
        "names:\n"
        "  0: vehicle\n"
        "  1: license_plate\n"
    )
    with open(out / "data.yaml", "w", encoding="utf-8") as f:
        f.write(yaml_text)
    cfg = SCRIPT_DIR / "configs" / "motion_data.yaml"
    with open(cfg, "w", encoding="utf-8") as f:
        f.write(yaml_text)
    print(f"[OK] data.yaml -> {out / 'data.yaml'} and {cfg}")


if __name__ == "__main__":
    main()
