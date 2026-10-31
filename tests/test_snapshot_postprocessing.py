"""Campus Gate - Snapshot capture & 2-3 frame lock regression tests.

Covers the core capture rule and the multi-plate capture fixes:
  1. Live frames are frozen into immutable snapshots (deep copy); detection
     never runs on the live feed buffer.
  2. Plate identity locks within 2-3 consistent snapshot readings.
  3. Quality gate + class mapping accept ALL plate geometries (single-row,
     square two-row, long strip, small/distant) instead of blocking them.

Run with the project venv (needs opencv + numpy):
    .venv\\Scripts\\python.exe -m unittest discover -s tests -v
"""

import unittest

import numpy as np

from backend.vision.frame_snapshot import (
    capture_frame_snapshot,
    writable_snapshot_view,
    is_plate_class,
    is_vehicle_class,
    padded_plate_crop,
    upscale_small_crop,
)
from backend.vision.ocr_reader import IndianPlateNormalizer, PlateReadingAggregator
from backend.vision.quality_gate import PlateQualityGate


def make_text_like_crop(w, h, seed=7):
    """Synthetic high-contrast plate-like crop (white bg, dark glyph bars)."""
    rng = np.random.RandomState(seed)
    crop = np.full((h, w, 3), 235, dtype=np.uint8)
    # Dark vertical glyph bars + slight noise for blur/contrast response.
    x = 4
    while x < w - 6:
        bw = int(rng.randint(3, 7))
        cv2_bar(crop, x, bw)
        x += bw + int(rng.randint(3, 6))
    noise = rng.randint(-12, 12, size=crop.shape).astype(np.int16)
    crop = np.clip(crop.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return crop


def cv2_bar(crop, x, bw):
    h = crop.shape[0]
    crop[2:h - 2, x:x + bw] = 25


class SnapshotContractTests(unittest.TestCase):
    def test_capture_freezes_deep_copy(self):
        live = np.zeros((100, 120, 3), dtype=np.uint8)
        snap = capture_frame_snapshot(live, "CAM-TEST", 1)
        live[:, :] = 255  # mutate live feed after capture
        self.assertTrue(np.all(snap.image == 0))
        self.assertEqual((snap.width, snap.height), (120, 100))
        self.assertEqual(snap.frame_idx, 1)

    def test_snapshot_buffer_is_read_only(self):
        live = np.zeros((40, 50, 3), dtype=np.uint8)
        snap = capture_frame_snapshot(live, "CAM-TEST", 2)
        self.assertFalse(snap.image.flags.writeable)

    def test_writable_view_is_independent_copy(self):
        live = np.zeros((40, 50, 3), dtype=np.uint8)
        snap = capture_frame_snapshot(live, "CAM-TEST", 3)
        view = writable_snapshot_view(snap)
        self.assertTrue(view.flags.writeable)
        view[:, :] = 128  # drawing on the processing copy...
        self.assertTrue(np.all(snap.image == 0))  # ...never leaks into snapshot

    def test_empty_frame_rejected(self):
        with self.assertRaises(ValueError):
            capture_frame_snapshot(np.zeros((0, 0, 3), dtype=np.uint8), "CAM-TEST", 4)
        with self.assertRaises(ValueError):
            capture_frame_snapshot(None, "CAM-TEST", 5)

    def test_padded_crop_clamps_to_bounds(self):
        view = np.zeros((60, 80, 3), dtype=np.uint8)
        crop = padded_plate_crop(view, [-50, -40, 500, 400])
        self.assertEqual(crop.shape[:2], (60, 80))

    def test_upscale_enlarges_small_crops(self):
        small = np.zeros((20, 40, 3), dtype=np.uint8)
        big = upscale_small_crop(small)
        self.assertGreaterEqual(big.shape[0], 80)
        self.assertGreaterEqual(big.shape[1], 160)


class ClassMappingTests(unittest.TestCase):
    def test_two_class_head(self):
        self.assertTrue(is_plate_class(1, "license_plate"))
        self.assertTrue(is_plate_class(1, "plate"))
        self.assertFalse(is_plate_class(0, "car"))
        self.assertTrue(is_vehicle_class(0, "car"))
        self.assertFalse(is_vehicle_class(1, "plate"))

    def test_name_based_vehicle_hints(self):
        for name in ("car", "truck", "bus", "motorcycle", "bike", "auto", "vehicle"):
            self.assertTrue(is_vehicle_class(3, name), name)

    def test_plate_never_classified_as_vehicle(self):
        self.assertFalse(is_vehicle_class(1, "number_plate"))
        self.assertFalse(is_vehicle_class(0, "license_plate"))


class TwoFrameLockTests(unittest.TestCase):
    def test_two_identical_valid_reads_latch(self):
        agg = PlateReadingAggregator("t1")
        agg.add_reading("MP07AB1234", 0.9, 0.9, engine_source="YOLO")
        self.assertFalse(agg.is_latched)
        agg.add_reading("MP07AB1234", 0.9, 0.9, engine_source="YOLO")
        self.assertTrue(agg.is_latched)
        plate, conf, valid = agg.get_consensus()
        self.assertEqual(plate, "MP07AB1234")
        self.assertTrue(valid)

    def test_latched_identity_rejects_later_noise(self):
        agg = PlateReadingAggregator("t2")
        agg.add_reading("MP07AB1234", 0.9, 0.9, engine_source="YOLO")
        agg.add_reading("MP07AB1234", 0.9, 0.9, engine_source="YOLO")
        agg.add_reading("MP07XX9999", 0.9, 0.9, engine_source="YOLO")
        plate, _, _ = agg.get_consensus()
        self.assertEqual(plate, "MP07AB1234")

    def test_three_noisy_frames_lock_onto_dominant(self):
        agg = PlateReadingAggregator("t3")
        agg.add_reading("MP07AB1234", 0.85, 0.8, engine_source="YOLO")
        agg.add_reading("MP07AB1235", 0.60, 0.5, engine_source="EASYOCR")
        agg.add_reading("MP07AB1234", 0.85, 0.8, engine_source="YOLO")
        self.assertTrue(agg.is_latched)
        plate, _, valid = agg.get_consensus()
        self.assertEqual(plate, "MP07AB1234")
        self.assertTrue(valid)

    def test_conflicting_reads_do_not_latch(self):
        # Regression for the `or is_valid` matching-count bug: three mutually
        # different valid plates must NOT latch (no dominant candidate).
        agg = PlateReadingAggregator("t4")
        agg.add_reading("MP07AB1234", 0.8, 0.8, engine_source="YOLO")
        agg.add_reading("DL01CD5678", 0.8, 0.8, engine_source="YOLO")
        agg.add_reading("HR55EF9012", 0.8, 0.8, engine_source="YOLO")
        self.assertFalse(agg.is_latched)

    def test_single_read_never_latches(self):
        agg = PlateReadingAggregator("t5")
        agg.add_reading("MP07AB1234", 0.99, 0.99, engine_source="YOLO")
        self.assertFalse(agg.is_latched)


class AllPlateTypesTests(unittest.TestCase):
    def setUp(self):
        self.gate = PlateQualityGate()

    def assert_attempted(self, w, h, detector_conf=0.6, seed=7):
        crop = make_text_like_crop(w, h, seed=seed)
        passed, _, metrics = self.gate.evaluate_crop(crop, detector_conf)
        self.assertTrue(
            metrics["should_attempt_ocr"],
            f"{w}x{h} plate was blocked from OCR: {metrics}",
        )
        return metrics

    def test_single_row_car_plate(self):
        m = self.assert_attempted(220, 44)
        self.assertEqual(m["focal_zone"], "ZONE_FOCAL_SWEETSPOT")

    def test_square_two_row_bike_plate(self):
        self.assert_attempted(64, 64, seed=11)

    def test_long_strip_commercial_plate(self):
        self.assert_attempted(300, 42, seed=13)

    def test_close_up_gate_plate(self):
        m = self.assert_attempted(560, 110, seed=17)
        self.assertEqual(m["focal_zone"], "ZONE_CLOSE_UP")

    def test_small_distant_plate_gets_attempt(self):
        # FAR-zone plates are upscaled + enhanced, never silently dropped.
        m = self.assert_attempted(26, 11, detector_conf=0.55, seed=19)
        self.assertEqual(m["focal_zone"], "ZONE_FAR")

    def test_tiny_invalid_crop_rejected(self):
        crop = make_text_like_crop(10, 5)
        passed, _, metrics = self.gate.evaluate_crop(crop, 0.9)
        self.assertFalse(passed)
        self.assertFalse(metrics["should_attempt_ocr"])


class NormalizerTests(unittest.TestCase):
    def test_standard_plate(self):
        norm, valid, ptype = IndianPlateNormalizer.validate_and_normalize("MP07AB1234")
        self.assertEqual((norm, valid), ("MP07AB1234", True))
        self.assertEqual(ptype, "STANDARD")

    def test_hsrp_prefix_stripped(self):
        norm, valid, _ = IndianPlateNormalizer.validate_and_normalize("INDMP07AB1234")
        self.assertEqual(norm, "MP07AB1234")
        self.assertTrue(valid)

    def test_bharat_series(self):
        norm, valid, ptype = IndianPlateNormalizer.validate_and_normalize("22BH1234AA")
        self.assertEqual((norm, valid), ("22BH1234AA", True))
        self.assertEqual(ptype, "BHARAT")

    def test_lookalike_digit_correction(self):
        norm, valid, _ = IndianPlateNormalizer.validate_and_normalize("MP07AB123O")
        self.assertEqual(norm, "MP07AB1230")
        self.assertTrue(valid)


class PlateFragmentFusionTests(unittest.TestCase):
    """Overlapping same-plate boxes fuse into one full-span box (no clipped text)."""

    @staticmethod
    def _fuse(boxes):
        from backend.vision.tracker import CameraVisionTracker
        dets = [{"box": b, "conf": c, "source": "FULL_FRAME"} for b, c in boxes]
        return CameraVisionTracker._fuse_plate_detections(dets)

    def test_long_strip_fragments_union(self):
        fused = self._fuse([([167, 333, 374, 374], 0.30), ([245, 334, 475, 373], 0.24)])
        self.assertEqual(len(fused), 1)
        self.assertEqual(fused[0]["box"], [167, 333, 475, 374])
        self.assertAlmostEqual(fused[0]["conf"], 0.30)

    def test_nested_duplicates_fuse_to_outer(self):
        fused = self._fuse([([197, 326, 446, 370], 0.57), ([262, 326, 431, 371], 0.30)])
        self.assertEqual(len(fused), 1)
        self.assertEqual(fused[0]["box"], [197, 326, 446, 371])

    def test_adjacent_vehicles_plates_stay_separate(self):
        fused = self._fuse([([50, 300, 150, 340], 0.8), ([400, 300, 500, 340], 0.7)])
        self.assertEqual(len(fused), 2)

    def test_single_detection_unchanged(self):
        fused = self._fuse([([10, 10, 60, 30], 0.9)])
        self.assertEqual(fused[0]["box"], [10, 10, 60, 30])


class DeskewSignTests(unittest.TestCase):
    """Hough deskew must level tilted lines, not double the slant."""

    def test_rectify_levels_tilted_lines(self):
        import cv2
        from backend.vision.yolo_char_reader import YOLOCharacterEngine
        base = np.full((120, 300, 3), 235, dtype=np.uint8)
        for y in (30, 60, 90):
            cv2.line(base, (20, y), (280, y), (10, 10, 10), 3)
        m = cv2.getRotationMatrix2D((150, 60), 20, 1.0)
        tilted = cv2.warpAffine(base, m, (300, 120), borderValue=(235, 235, 235))
        before = abs(YOLOCharacterEngine.compute_tilt_angle_hough(tilted))
        self.assertGreater(before, 10.0)
        fixed = YOLOCharacterEngine.rectify_perspective_and_deskew(tilted)
        after = abs(YOLOCharacterEngine.compute_tilt_angle_hough(fixed))
        self.assertLess(after, before)


class LatchedSkipTests(unittest.TestCase):
    """Latched tracks skip OCR entirely (efficiency) and reuse consensus."""

    def test_latched_track_performs_no_ocr(self):
        import os
        weights = os.path.join("backend", "vision", "weights", "best.pt")
        if not os.path.exists(weights):
            self.skipTest("detector weights missing")
        from backend.vision.tracker import CameraVisionTracker
        tracker = CameraVisionTracker(
            camera_id="TEST", weights_path=weights, enable_ocr=False)
        agg = PlateReadingAggregator("skiptest")
        agg.add_reading("MP07AB1234", 0.9, 0.9, engine_source="YOLO")
        agg.add_reading("MP07AB1234", 0.9, 0.9, engine_source="YOLO")
        self.assertTrue(agg.is_latched)
        track_info = {"aggregator": agg, "last_known_plate": None,
                      "last_ocr_time": 0.0}
        calls = []
        tracker._read_plate_crop = lambda crop: calls.append(crop) or (None, None, 0.0, False, "NONE")
        view = np.zeros((480, 640, 3), dtype=np.uint8)
        info = tracker._process_plate_for_track(
            view, [200, 300, 400, 350], 0.8, track_info,
            vehicle_speed=0.0, now_wall=1000.0)
        self.assertEqual(calls, [])
        self.assertTrue(info["is_latched"])
        self.assertEqual(info["normalized_plate"], "MP07AB1234")

    def test_deblur_keeps_shape_and_enhances(self):
        from backend.vision.frame_snapshot import deblur_motion_crop
        crop = make_text_like_crop(200, 50)
        out = deblur_motion_crop(crop)
        self.assertEqual(out.shape, crop.shape)
        self.assertFalse(np.array_equal(out, crop))


if __name__ == "__main__":
    unittest.main()
