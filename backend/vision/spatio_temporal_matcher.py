"""
Campus Gate - Spatio-Temporal Merging & Matching Engine
======================================================
Solves the Multi-Object / Multi-Plate association problem in dense gate traffic
(e.g., bumper-to-bumper tailgating, multi-lane parallel traffic, angled turns).

Combines:
  1. Hungarian Optimal Assignment (scipy.optimize.linear_sum_assignment)
  2. Delta-Velocity Trajectory Correlation (rigid-body kinematic matching)
  3. Historical Relative Anchor Offsets (plate position relative to vehicle center)
  4. Zero-Velocity Stationary Gating (handles vehicles halted at the boom barrier)
  5. Geometric & Proportional Size Hard Constraints
"""

import math
from typing import List, Dict, Tuple, Optional, Any
import numpy as np
from scipy.optimize import linear_sum_assignment


class VehiclePlateMatch:
    def __init__(
        self,
        vehicle_track_id: int,
        vehicle_box: List[int],
        plate_box: List[int],
        plate_conf: float,
        cost: float,
        match_type: str = "SPATIO_TEMPORAL"
    ):
        self.vehicle_track_id = vehicle_track_id
        self.vehicle_box = vehicle_box
        self.plate_box = plate_box
        self.plate_conf = plate_conf
        self.cost = cost
        self.match_type = match_type

    def to_dict(self) -> Dict[str, Any]:
        return {
            "vehicle_track_id": self.vehicle_track_id,
            "vehicle_box": self.vehicle_box,
            "plate_box": self.plate_box,
            "plate_conf": round(self.plate_conf, 3),
            "match_cost": round(self.cost, 3),
            "match_type": self.match_type
        }


class SpatioTemporalPlateMatcher:
    """
    Associates multiple detected license plates with their host vehicles across video frames.
    """
    def __init__(
        self,
        alpha_containment: float = 0.50,
        beta_anchor: float = 0.30,
        gamma_velocity: float = 0.20,
        min_velocity_threshold: float = 2.5,   # Minimum px/frame movement to activate velocity term
        max_distance_factor: float = 1.3,      # Max Euclidean distance multiplier relative to vehicle radius
        min_width_ratio: float = 0.08,         # Plate width / Vehicle width minimum
        max_width_ratio: float = 0.60          # Plate width / Vehicle width maximum
    ):
        self.alpha = alpha_containment
        self.beta = beta_anchor
        self.gamma = gamma_velocity
        self.v_thresh = min_velocity_threshold
        self.max_dist_factor = max_distance_factor
        self.min_w_ratio = min_width_ratio
        self.max_w_ratio = max_width_ratio

        # Track history cache: {track_id: {"last_plate_offset": (dx, dy), "anchor_alpha": float}}
        self.track_anchors: Dict[int, Tuple[float, float]] = {}

    @staticmethod
    def _box_center(box: List[int]) -> Tuple[float, float]:
        return ((box[0] + box[2]) / 2.0, (box[1] + box[3]) / 2.0)

    @staticmethod
    def _box_dimensions(box: List[int]) -> Tuple[float, float]:
        return (float(max(1, box[2] - box[0])), float(max(1, box[3] - box[1])))

    def _compute_containment_score(self, v_box: List[int], p_box: List[int]) -> float:
        """
        Calculates how cleanly the plate sits within the lower front/rear of the vehicle box.
        Returns value between 0.0 (outside) and 1.0 (perfectly centered in lower half).
        """
        vx1, vy1, vx2, vy2 = v_box
        px1, py1, px2, py2 = p_box
        pcx, pcy = self._box_center(p_box)
        vw, vh = self._box_dimensions(v_box)

        # Check if plate center is inside vehicle bbox
        in_x = (vx1 <= pcx <= vx2)
        in_y = (vy1 <= pcy <= vy2)

        if not (in_x and in_y):
            # Partial penalty based on normalized distance outside
            dist_x = max(0.0, vx1 - pcx, pcx - vx2) / vw
            dist_y = max(0.0, vy1 - pcy, pcy - vy2) / vh
            return max(0.0, 1.0 - 2.5 * math.sqrt(dist_x**2 + dist_y**2))

        # Favor lower half (where real plates live on bumper/trunk)
        # vy1 + 0.35 * vh is the typical upper boundary for front/rear bumper
        vertical_ratio = (pcy - vy1) / vh
        if vertical_ratio >= 0.40:
            vertical_pref = 1.0
        else:
            vertical_pref = max(0.2, vertical_ratio / 0.40)

        # Horizontal centering (plate is usually near center of vehicle width)
        h_ratio = abs(pcx - (vx1 + vx2) / 2.0) / (vw / 2.0)
        h_pref = max(0.5, 1.0 - 0.5 * h_ratio)

        return float(vertical_pref * h_pref)

    def _compute_velocity_similarity(
        self,
        v_vel: Tuple[float, float],
        p_center: Tuple[float, float],
        predicted_p_center: Tuple[float, float]
    ) -> float:
        """
        Measures kinematic velocity alignment between vehicle motion vector and plate position.
        """
        vx, vy = v_vel
        speed = math.sqrt(vx**2 + vy**2)
        if speed < self.v_thresh:
            return 1.0  # Stationary at gate, neutral similarity

        # Difference between where plate was predicted to be and where it actually appeared
        pred_err = math.sqrt((p_center[0] - predicted_p_center[0])**2 + (p_center[1] - predicted_p_center[1])**2)
        # Normalize error by vehicle speed (scaled exponential decay)
        scale = max(15.0, speed * 2.5)
        return float(math.exp(- (pred_err**2) / (2.0 * (scale**2))))

    def match(
        self,
        vehicles: List[Dict[str, Any]],
        plates: List[Dict[str, Any]],
        track_velocities: Optional[Dict[int, Tuple[float, float]]] = None
    ) -> Tuple[List[VehiclePlateMatch], List[Dict[str, Any]]]:
        """
        Performs Hungarian matching using Spatio-Temporal cost matrix.
        
        Args:
            vehicles: List of dicts with {"track_id": int, "box": [x1, y1, x2, y2], "conf": float}
            plates: List of dicts with {"box": [x1, y1, x2, y2], "conf": float}
            track_velocities: Optional dict of {track_id: (dx, dy)} average velocity over recent frames
            
        Returns:
            matches: List of VehiclePlateMatch
            unassigned_plates: Plates not matched to any vehicle
        """
        if not vehicles or not plates:
            return [], plates

        track_velocities = track_velocities or {}
        num_v = len(vehicles)
        num_p = len(plates)

        cost_matrix = np.full((num_v, num_p), fill_value=1e5, dtype=np.float32)

        for i, veh in enumerate(vehicles):
            tid = veh["track_id"]
            v_box = veh["box"]
            vcx, vcy = self._box_center(v_box)
            vw, vh = self._box_dimensions(v_box)
            v_radius = math.sqrt((vw / 2.0)**2 + (vh / 2.0)**2)

            v_vel = track_velocities.get(tid, (0.0, 0.0))
            v_speed = math.sqrt(v_vel[0]**2 + v_vel[1]**2)
            has_velocity = (v_speed >= self.v_thresh)

            # Retrieve historical relative anchor offset if available
            anchor_offset = self.track_anchors.get(tid, None)

            for j, pl in enumerate(plates):
                p_box = pl["box"]
                pcx, pcy = self._box_center(p_box)
                pw, ph = self._box_dimensions(p_box)

                # --- 1. Hard Geometric Constraints ---
                # A. Maximum distance gate
                dist_centers = math.sqrt((pcx - vcx)**2 + (pcy - vcy)**2)
                if dist_centers > (v_radius * self.max_dist_factor):
                    continue  # Way too far, leave as 1e5

                # B. Proportional width check (plate must be proportional to vehicle)
                w_ratio = pw / max(1.0, vw)
                if not (self.min_w_ratio <= w_ratio <= self.max_w_ratio):
                    continue

                # C. Upper windshield reject: plate should not sit in top 25% of vehicle
                if (pcy - v_box[1]) < (0.20 * vh):
                    continue

                # --- 2. Soft Spatio-Temporal Costs ---
                # Component A: Spatial Containment (0 to 1)
                s_contain = self._compute_containment_score(v_box, p_box)

                # Component B: Historical Anchor Offset Consistency
                if anchor_offset is not None:
                    expected_px = vcx + anchor_offset[0]
                    expected_py = vcy + anchor_offset[1]
                    anchor_err = math.sqrt((pcx - expected_px)**2 + (pcy - expected_py)**2)
                    s_anchor = math.exp(- (anchor_err**2) / (2.0 * ((0.20 * vw)**2)))
                else:
                    s_anchor = s_contain  # Default to containment if first frame

                # Component C: Kinematic Velocity Vector Correlation
                if has_velocity and anchor_offset is not None:
                    # Predicted plate based on vehicle velocity:
                    pred_px = (vcx - v_vel[0]) + anchor_offset[0] + v_vel[0]
                    pred_py = (vcy - v_vel[1]) + anchor_offset[1] + v_vel[1]
                    s_vel = self._compute_velocity_similarity(v_vel, (pcx, pcy), (pred_px, pred_py))
                    cost = (
                        self.alpha * (1.0 - s_contain) +
                        self.beta * (1.0 - s_anchor) +
                        self.gamma * (1.0 - s_vel)
                    )
                else:
                    # Stationary vehicle at barrier or new track: rely on containment & anchor
                    norm_alpha = self.alpha / (self.alpha + self.beta)
                    norm_beta = self.beta / (self.alpha + self.beta)
                    cost = norm_alpha * (1.0 - s_contain) + norm_beta * (1.0 - s_anchor)

                cost_matrix[i, j] = cost

        # Solve optimal 1:1 matching via Hungarian algorithm
        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        matched_results: List[VehiclePlateMatch] = []
        matched_plate_indices = set()

        # Maximum acceptable cost threshold for a valid match
        COST_THRESHOLD = 0.82

        for r, c in zip(row_ind, col_ind):
            cost = cost_matrix[r, c]
            if cost < COST_THRESHOLD:
                veh = vehicles[r]
                pl = plates[c]
                tid = veh["track_id"]

                # Update running anchor offset using exponential moving average
                vcx, vcy = self._box_center(veh["box"])
                pcx, pcy = self._box_center(pl["box"])
                curr_offset = (pcx - vcx, pcy - vcy)

                if tid in self.track_anchors:
                    prev_ox, prev_oy = self.track_anchors[tid]
                    self.track_anchors[tid] = (
                        0.80 * prev_ox + 0.20 * curr_offset[0],
                        0.80 * prev_oy + 0.20 * curr_offset[1]
                    )
                else:
                    self.track_anchors[tid] = curr_offset

                matched_results.append(
                    VehiclePlateMatch(
                        vehicle_track_id=tid,
                        vehicle_box=veh["box"],
                        plate_box=pl["box"],
                        plate_conf=pl["conf"],
                        cost=float(cost),
                        match_type="SPATIO_TEMPORAL"
                    )
                )
                matched_plate_indices.add(c)

        unassigned_plates = [
            plates[idx] for idx in range(num_p) if idx not in matched_plate_indices
        ]

        return matched_results, unassigned_plates

    def prune_stale_anchors(self, active_track_ids: List[int]):
        """Cleans up memory for tracks that have departed."""
        active_set = set(active_track_ids)
        stale_ids = [tid for tid in self.track_anchors if tid not in active_set]
        for tid in stale_ids:
            del self.track_anchors[tid]
