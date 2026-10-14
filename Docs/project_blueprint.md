# Multi-Camera Vehicle Identification and Entry Auditing System
## Final Project Blueprint — Practical Implementation Plan

**Project type:** Computer vision, vehicle identification, and campus entry auditing  
**Target environment:** College/campus entry gates, intersections, and connected CCTV coverage  
**Primary approach:** Existing CCTV infrastructure + centralized YOLO/OCR processing + cross-camera event reconciliation  
**Initial deployment:** Small pilot using a limited number of cameras  
**Core principle:** Identify what the system can verify, preserve what it cannot, and send uncertain cases for human review.

---

# 1. Project Objective

Build a system that uses existing campus CCTV cameras to detect vehicles, read their registration plates, associate confirmed identities with college records, and maintain a reliable entry audit trail across connected camera locations.

The system should still be useful when a camera fails to capture a readable plate. It should retain the vehicle observation and attempt to associate it with a later observation from another camera.

### Main capabilities

1. Detect vehicles and license plates from existing CCTV footage.
2. Read Indian vehicle registration plates using OCR.
3. Track vehicles within an individual camera's view.
4. Detect when a vehicle crosses a configured entry line or zone.
5. Associate observations across cameras when sufficient evidence exists.
6. Check confirmed registration numbers against the college's authorized vehicle records.
7. Maintain entry records, unresolved cases, and an administrative audit trail.
8. Display alerts and review cases through a control-room dashboard, with a mobile interface for guards.

**Operational boundary:** The system only assists with identification, auditing, and alerts. It does not automatically remove, block, or penalize a vehicle. College personnel make those decisions.

---

# 2. Core Design Principles

The following principles govern the entire implementation.

- **Independent camera capture:** Each camera continues observing its own coverage area regardless of what other cameras are doing.
- **Centralized intelligence:** The application server runs detection, OCR, and cross-camera reconciliation.
- **Evidence-based matching:** Camera order and timestamps narrow down candidates but never prove identity on their own.
- **Separate observation from identity:** A vehicle can be observed even when its plate is unreadable.
- **Separate identity from authorization:** Reading a plate does not automatically mean the vehicle is authorized or unauthorized.
- **Uncertainty is an acceptable result:** The system must be allowed to return `REVIEW_REQUIRED` rather than inventing a match.
- **Incremental implementation:** Establish reliable single-camera detection before adding complex cross-camera features.
- **No additional sensors initially:** Use the existing CCTV infrastructure. Add hardware only if pilot testing demonstrates a specific need.

---

# 3. Final System Architecture

```text
             EXISTING CAMPUS CCTV CAMERAS
             ┌──────────┬──────────┐
             │ Camera 1 │ Camera 2 │ ... Camera N
             └────┬─────┴────┬─────┘
                  │           │
                  ▼           ▼
          Lightweight Capture / Ingestion
          RTSP • Sampling • Timestamps
                  │
                  ▼
           CENTRAL APPLICATION SERVER
          ┌─────────────────────────────┐
          │ 1. Frame Ingestion          │
          │ 2. YOLO Vehicle/Plate       │
          │ 3. Per-Camera Tracking      │
          │ 4. Plate Crop Quality Gate  │
          │ 5. OCR and Read Validation  │
          └──────────────┬──────────────┘
                         │
                         ▼
              Observation & Event Store
                         │
                         ▼
             Cross-Camera Reconciliation
          ┌─────────────────────────────┐
          │ Camera Topology             │
          │ Travel-Time Constraints     │
          │ Direction and Lane          │
          │ Plate / Visual Evidence     │
          │ Ambiguity and Expiry Rules  │
          └──────────────┬──────────────┘
                         │
                         ▼
               Identity & Authorization
                         │
                         ▼
               Entry Audit / Review
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       Control-Room Web       Guard Mobile App
       Dashboard and Logs     Alerts and Review
```

## Tier 1 — Existing CCTV network

Each camera is registered with a stable logical identifier, such as `CAM-GATE-01`.

Store the following for every camera:

- Stable `camera_id`.
- Camera name and IP/RTSP connection reference.
- Physical location and coverage description.
- Reference image showing the camera's field of view.
- Camera role: entry gate, downstream checkpoint, intersection, or exit.
- Configured lane and travel direction.
- Operational status and last successful frame timestamp.

An IP address is a connection detail, not the camera's permanent identity. If the address changes, the logical camera ID should remain unchanged.

## Tier 2 — Lightweight frame ingestion

The initial ingestion service connects to the existing camera streams and sends sampled frames to the server.

Responsibilities:

- Read RTSP streams or use the available NVR interface.
- Attach the camera ID and original capture timestamp to each frame.
- Sample frames at a configurable rate.
- Resize or compress frames where this does not destroy useful plate detail.
- Detect disconnections and reconnect when possible.
- Apply bounded queues and controlled frame dropping when overloaded.
- Buffer a limited amount of data during temporary server/network interruptions, where local resources permit it.

### Important implementation decision

Do not make motion filtering a mandatory dependency from day one.

Start with configurable frame sampling. Test the baseline on real CCTV footage, then introduce lightweight OpenCV motion filtering if it reduces bandwidth without causing missed vehicles.

The gateway performs capture and lightweight filtering only. **YOLO, OCR, identity reconciliation, and authorization remain server-side.**

The capture/ingestion component can initially run on the application server if that is simpler. Move it closer to the cameras when the network layout or measured bandwidth makes that worthwhile.

---

# 4. Server-Side Computer Vision Pipeline

## 4.1 Vehicle and plate detection

Use a pretrained YOLO model as the baseline and fine-tune it for the target CCTV conditions.

The detector should identify:

- Vehicle bounding boxes.
- License plate bounding boxes.

A vehicle detection must remain useful even when no plate is detected. Do not discard the vehicle observation simply because the plate detector fails.

### Model training

1. Find an Indian license plate dataset with appropriate bounding-box annotations.
2. Inspect the annotations and confirm that the plate class is correctly labeled.
3. Add representative campus CCTV samples when permitted.
4. Include variation in distance, angle, lighting, blur, and vehicle orientation.
5. Fine-tune a suitable pretrained YOLO model using Kaggle GPU resources.
6. Evaluate on held-out images and video sequences.
7. Export and version the best-performing weights, for example `best.pt`.
8. Test the exported model in the actual application pipeline.

Keep the validation and test footage separate from training footage. Frames from the same video sequence should not be randomly distributed across all splits, as that can make results look better than real-world performance.

## 4.2 Per-camera vehicle tracking

Use a local tracking algorithm such as ByteTrack or BoT-SORT after establishing a reliable detector.

The tracker associates detections across successive frames within the same camera.

Every track should contain:

- `camera_id`
- `local_track_id`
- First and last observation timestamps
- Vehicle bounding boxes or crop references
- Direction of movement, where measurable
- Relevant detection confidence
- Entry-line crossing status

A local tracking ID is not a global vehicle identity. Track IDs can be reused, lost, or fragmented, so the system must identify a track using a camera ID and a unique track-session identifier rather than the numeric track ID alone.

## 4.3 Plate OCR

Start with one OCR engine, such as EasyOCR, and compare it with PaddleOCR if the baseline is insufficient.

The pipeline should:

1. Extract the detected plate crop.
2. Check crop quality.
3. Run OCR when the crop is suitable.
4. Normalize the output for comparison.
5. Validate its format against the applicable Indian registration format.
6. Retain the raw OCR output, normalized candidate, and confidence.
7. Compare readings from multiple frames of the same track.

### Replace the fixed-width rule with a quality gate

The original 120-pixel width and 150-pixel early-exit thresholds can be starting points for experiments, not permanent rules.

The quality gate should consider:

- Plate crop width and height.
- Blur and character visibility.
- Perspective distortion.
- Contrast and illumination.
- Plate detector confidence.
- OCR confidence and consistency across frames.

Do not discard a potentially useful crop solely because it falls below one width threshold. It may be worth retaining for later review or attempting OCR when conditions improve.

### Avoid excessive OCR calls

Do not run OCR on every consecutive frame.

Instead, select useful frames from a vehicle track, prioritize better plate crops, and aggregate readings. Repeated consistent readings are stronger evidence than a single low-confidence result.

---

# 5. The Central Distinction: Observation, Identity, and Entry

These are separate concepts and must not be represented by one status field.

## A. Vehicle observation

A camera has detected a vehicle at a particular time and location.

This can happen with or without a readable plate.

## B. Vehicle identity

The system has a registration number supported by sufficient evidence, or it is still trying to establish that identity.

Identity can be established at the entry gate or at a downstream camera.

## C. Entry crossing

The vehicle has crossed a configured virtual line or zone that represents the campus entry boundary.

A vehicle appearing in the camera frame is not automatically a confirmed entry. For example, it might stop before the line, reverse, or pass through a different lane.

## D. Authorization

The confirmed registration number is checked against the college's authorized vehicle records.

The system should distinguish:

- `AUTHORIZED`
- `NOT_MATCHED`
- `REVIEW_REQUIRED`

An unreadable plate is not evidence that the vehicle is unauthorized.

---

# 6. Cross-Camera Reconciliation — The Most Important Component

This is the component that allows the system to recover useful information when the entry camera cannot read a plate.

## 6.1 How the handoff works

Consider this example:

1. Camera 1 detects a vehicle approaching the entry boundary.
2. The vehicle crosses the configured line.
3. Camera 1 cannot read the registration plate.
4. The server stores the observation, vehicle crop, timestamp, direction, and local track session.
5. The server creates a pending handoff associated with plausible downstream cameras.
6. Camera 2 continues normal capture and detection. It does not stop observing other vehicles to focus only on this handoff.
7. Camera 2 detects a vehicle and obtains a readable plate.
8. The reconciliation service checks whether this observation plausibly corresponds to the pending Camera 1 event.
9. If the evidence is strong enough, the observations are linked and the entry record is updated.
10. If the evidence is ambiguous, both observations remain available for review rather than being forcibly merged.

A camera that misses a vehicle completely cannot generate a vehicle-specific handoff. A downstream camera must independently detect the vehicle before it can contribute new evidence.

## 6.2 Candidate matching rules

Use the following evidence, in roughly this order of importance:

| Evidence | Role |
|---|---|
| Matching, reliable plate readings | Strong identity evidence |
| Valid camera route and direction | Eliminates impossible transitions |
| Capture timestamps and expected travel-time interval | Establishes temporal plausibility |
| Lane and movement compatibility | Helps distinguish overlapping vehicles |
| Visual appearance and vehicle type/color | Supporting evidence only |
| FIFO arrival order | Weak tie-breaker only; never proof |

Vehicle make, model, type, and color can help narrow candidates. They are not unique identifiers.

A dedicated vehicle re-identification model is not required for the first version. Add one only if real pilot results show that basic evidence is insufficient.

## 6.3 Replace automatic FIFO assignment with evidence-based matching

**Do not assign a downstream plate to the oldest pending vehicle merely because it entered first.**

Example:

- Vehicle A crosses the gate at 10:00:00.
- Vehicle B crosses at 10:00:02.
- Both plates are unreadable.
- B reaches Camera 2 first because of lane movement or speed.

A FIFO-only implementation can attach B's plate to A, corrupting the audit record.

Instead, score each plausible candidate using route, travel time, direction, visual evidence, and any existing plate information.

The score should be calibrated against labeled examples. Do not invent arbitrary weights and assume they establish reliable identity.

Use three practical outcomes:

- **High-confidence match:** Associate the observations automatically when the evidence satisfies calibrated rules and there is no conflicting evidence.
- **Ambiguous match:** Keep the candidate associations and send the case for review.
- **No plausible match:** Record a standalone downstream observation and retain the unresolved upstream event until its expiry policy applies.

If multiple assignments are possible, evaluate the candidate set together rather than greedily attaching each new plate to the oldest event. Where a reliable assignment cannot be established, do not force one.

## 6.4 Camera topology and travel-time windows

Store directed relationships between cameras:

- Source camera.
- Destination camera.
- Valid movement direction or route.
- Expected minimum travel time.
- Expected maximum travel time.

These intervals must be measured or estimated from the physical layout and pilot footage.

A candidate should not match a camera that is unreachable from the original camera within the permitted route and time window.

A pending event should also not remain active forever. Once the applicable window expires, mark it unresolved or reviewable. Expiry must not silently convert it into a confirmed identity.

---

# 7. Time Handling and Asynchronous Processing

The original blueprint uses a fixed three-second safety buffer. Retain the idea of buffering, but do not assume that three seconds guarantees every relevant inference job has completed.

## Correct event-time policy

Each frame and observation should preserve:

- Original capture timestamp.
- Camera ID.
- Frame or message sequence identifier.
- Server ingestion timestamp.
- Inference completion timestamp.

Use synchronized clocks where possible, and store timestamps consistently in UTC.

The reconciliation service should:

1. Order observations by capture time, not inference completion time.
2. Track outstanding inference jobs for relevant events.
3. Allow a configurable lateness window based on measured processing delays.
4. Reconcile when the relevant jobs have completed or the event reaches its defined deadline.
5. Permit a controlled late update when additional evidence arrives, where policy allows.
6. Prevent duplicate or conflicting updates.

A late OCR result should not create a second entry record or silently overwrite a better-confirmed identity.

The safety window is a configurable operational parameter. It should be selected through testing, not treated as a guarantee.

---

# 8. Event and Data Model

Use a relational database such as PostgreSQL for durable configuration, observations, audit records, and review decisions.

Store image crops separately in file or object storage where practical; retain their references in the database.

## 8.1 Camera registry

`cameras`

- `id`
- `name`
- `ip_address` or stream reference
- `physical_role`
- `location_description`
- `reference_image_path`
- `operational_status`

## 8.2 Camera topology

`camera_topology`

- `source_camera_id`
- `destination_camera_id`
- `expected_travel_time_min`
- `expected_travel_time_max`
- `route_or_lane_metadata`

## 8.3 Vehicle observations

`vehicle_observations`

- `id`
- `camera_id`
- `track_session_id`
- `local_track_id`
- `captured_at`
- `vehicle_crop_path`
- `plate_crop_path`
- `vehicle_detection_confidence`
- `plate_detection_confidence`
- `direction`
- `crossing_status`

## 8.4 Plate readings

`plate_readings`

- `id`
- `observation_id`
- `raw_ocr_text`
- `normalized_plate_text`
- `ocr_confidence`
- `crop_quality_metadata`
- `model_version`
- `created_at`

Multiple readings can belong to the same vehicle observation or track. Preserve the evidence rather than storing only the last OCR result.

## 8.5 Vehicle sessions and handoffs

`vehicle_sessions` and `handoff_events`

These represent the higher-level event being reconciled across cameras.

Include:

- Unique session or event ID.
- First confirmed entry-boundary crossing time.
- Source observation.
- Candidate downstream cameras.
- Expected travel-time window.
- Current reconciliation status.
- Linked observations.
- Expiry time.
- Resolution reason and confidence metadata.

## 8.6 Entry audit records

`vehicle_entry_events`

- `id`
- `registration_number`, nullable until confirmed
- `first_observed_at`
- `entry_confirmed_at`
- `identity_status`
- `authorization_state`
- `resolution_method`
- `linked_observation_ids` or equivalent relations
- `review_status`
- `created_at` and `updated_at`

Keep observation history separate from the consolidated audit event. That way, an identity can be resolved later without losing the original evidence or entry timestamp.

## 8.7 Authorized vehicle registry

Maintain a separate registry for college-authorized vehicles with the necessary registration and association fields.

Authorization checks must use a confirmed or sufficiently verified registration number. Record the time and result of the lookup so an audit can explain why an alert was generated.

---

# 9. Event Lifecycle and Statuses

Use explicit, manageable states rather than a large collection of overlapping flags.

| Stage | Suggested status | Meaning |
|---|---|---|
| Vehicle detected | `OBSERVED` | A camera has detected a vehicle |
| Entry boundary crossed | `ENTRY_CROSSED` | The configured entry crossing is confirmed |
| Plate readable | `IDENTIFIED` | A registration number is sufficiently supported |
| Plate not readable | `HANDOFF_PENDING` | Downstream evidence may help |
| Candidate found | `MATCH_PENDING` | A possible cross-camera association exists |
| Evidence sufficient | `ASSOCIATED` | Observations have been linked |
| Evidence insufficient | `REVIEW_REQUIRED` | Human review is needed |
| No downstream match | `UNRESOLVED` | The event expired without reliable identification |
| Identity verified, authorized | `AUTHORIZED` | Registry check succeeded |
| Identity verified, not listed | `NOT_MATCHED` | Registry lookup found no authorized record |

These statuses should not all be forced into a single linear sequence. For example, a downstream camera can identify a vehicle independently without any upstream handoff.

An entry event can also be identified but still require authorization review. Keep those concepts separate.

### Manual review

The control-room dashboard should display:

- Entry timestamp and camera location.
- Vehicle and plate crops.
- OCR candidates and confidence.
- Relevant upstream and downstream observations.
- Why the system selected or rejected candidate matches.
- Authorization lookup result.
- Options for an authorized reviewer to confirm, reject, or leave the association unresolved.

Store reviewer decisions with timestamps and an audit trail.

---

# 10. Reliability, Concurrency, and Recovery

The global in-memory lists in the prototype are acceptable for demonstrating the algorithm, but they are not suitable as the only source of truth in a multi-worker or restart-prone deployment.

For the first durable implementation:

- Store important observations, handoff events, and audit state in PostgreSQL.
- Use a lightweight database-backed work queue initially, or add a queue broker if measured workload requires it.
- Give every observation and event a stable unique ID.
- Make inference-result handling and event updates idempotent.
- Prevent the same crossing or plate result from creating duplicate audit records.
- Make expired and completed handoffs safe to clean up.
- Recover pending work after a process restart.
- Bound frame queues and expose queue depth, processing delay, and frame-drop metrics.

Redis, dedicated worker pools, a distributed cache, or more elaborate message infrastructure can be added when the pilot identifies a real bottleneck. They are not prerequisites for proving the concept.

### Failure handling

- **Camera offline:** Record the outage and continue processing other cameras.
- **Unreadable plate:** Preserve the observation and try the permitted handoff process.
- **Server temporarily offline:** Buffer within the available local capacity and recover in timestamp order.
- **OCR late:** Accept the result through an idempotent update path.
- **No downstream observation:** Expire the handoff into an unresolved state.
- **Ambiguous candidates:** Request review.
- **Database or worker failure:** Do not mark an event confirmed until its durable update succeeds.

---

# 11. User Interfaces

## Control-room web dashboard

The first dashboard should focus on operational visibility, not visual complexity.

Include:

- Camera registry and online/offline status.
- Recent entry events.
- Confirmed registration number and authorization result.
- Unreadable and unresolved entries.
- Review-required cases.
- Linked camera observations and timestamps.
- Searchable audit history.
- Basic processing health and queue status.

## Guard mobile application

Keep the mobile app focused on action-oriented information:

- New alerts.
- Vehicle registration and authorization status.
- Entry location and time.
- Relevant image evidence, subject to access permissions.
- Review outcome or acknowledgement.

Alerts are informational. The guard or authorized college staff member decides what action to take.

---

# 12. Testing and Evaluation

Evaluate the full pipeline, not just YOLO's detection score.

## Detection

Measure precision, recall, mAP50, and mAP50–95 on held-out footage.

## OCR

Measure exact registration-string accuracy, character error rate, and the percentage of observations for which no usable text is obtained.

## Cross-camera reconciliation

Measure:

- Recovery rate for plates unreadable at the entry camera.
- False association rate.
- Unresolved case rate.
- Duplicate entry rate.
- Percentage of automatically associated events later rejected by reviewers.

## System reliability

Measure:

- Capture-to-result latency.
- Inference queue depth and waiting time.
- Frames received and dropped.
- OCR processing time.
- Camera uptime and reconnection time.
- Recovery after worker or server restart.

Report performance separately for daylight, low light, different distances, motion blur, congestion, and other conditions represented in the test footage.

### Targets versus demonstrated results

The original blueprint proposes targets such as mAP50 above 0.92, OCR exact-string accuracy above 90% on suitable crops, recovery above 75%, false association below 1%, and end-to-end processing under 800 ms.

Keep these as **aspirational evaluation targets**, not guaranteed capabilities. Establish a baseline first, then decide which targets are realistic for the actual cameras and available compute.

Define latency precisely: frame capture to initial detection is different from capture to final cross-camera reconciliation.

For an audit system, false associations deserve particular attention because a confidently incorrect identity can be more harmful than an unresolved record.

---

# 13. Final Development Roadmap

## Phase 1 — Camera setup and data collection

- Inventory available CCTV cameras and NVR access.
- Register stable camera IDs and reference images.
- Map physical camera relationships and entry boundaries.
- Verify timestamps and connection stability.
- Collect representative, permitted test footage.

**Deliverable:** A working camera ingestion pipeline and a reliable test dataset.

## Phase 2 — Single-camera detection

- Train or fine-tune YOLO on Kaggle.
- Detect vehicles and plates.
- Evaluate detection on held-out footage.
- Save and version the deployment weights.

**Deliverable:** A detector that works on representative campus footage.

## Phase 3 — OCR and local tracking

- Integrate one OCR engine.
- Add the crop-quality gate.
- Aggregate plate readings across useful frames.
- Add ByteTrack or BoT-SORT.
- Implement virtual entry lines and crossing events.

**Deliverable:** Reliable per-camera vehicle observations and entry events, including unreadable cases.

## Phase 4 — Audit database and basic dashboard

- Implement the camera registry, observations, plate readings, and entry-event records.
- Add the authorized vehicle registry and lookup.
- Display identified, authorized, not-matched, and review-required events.
- Make processing and database updates recoverable.

**Deliverable:** A usable single-camera auditing prototype.

## Phase 5 — Cross-camera handoff

- Configure camera topology and travel-time intervals.
- Create pending handoff events.
- Implement evidence-based candidate matching.
- Add bounded lateness, expiry, and ambiguity handling.
- Test against overlapping vehicles and incorrect-match scenarios.

**Deliverable:** A multi-camera prototype that can recover some unreadable entry plates without forcing uncertain identities.

## Phase 6 — Pilot and measured optimization

- Run the system against representative campus footage.
- Compare its results with manually verified observations.
- Measure false associations, recovery, latency, and load.
- Tune sampling, quality gates, and matching thresholds.
- Introduce motion filtering, specialized re-identification, or additional infrastructure only where results justify them.
- Add the guard mobile interface and refine control-room workflows.

**Deliverable:** A measured pilot report and a justified deployment decision.

---

# 14. Scope Boundaries

### Included in the initial system

- Existing CCTV integration.
- Central server-side YOLO and OCR.
- Per-camera tracking.
- Entry-line crossing detection.
- Cross-camera handoff and reconciliation.
- College vehicle-registry lookup.
- Audit records, alerts, and human review.
- Basic monitoring and recovery.

### Deliberately deferred

- New IoT sensors or physical barriers.
- AI inference on edge gateways.
- A dedicated vehicle re-identification model before baseline evaluation.
- Distributed Redis clusters and complex worker orchestration before they are needed.
- Guaranteed recovery of every unreadable plate.
- Automatic enforcement or vehicle removal.

This keeps the first implementation focused on proving that the camera network and reconciliation logic work reliably.

---

# 15. Final Design Decision

The recommended final design is a **centralized, event-driven multi-camera auditing system with lightweight capture, server-side vision, and evidence-based reconciliation**.

The essential innovation is not simply detecting a license plate. It is preserving an entry event when the first camera fails, finding relevant downstream evidence, and updating the audit record only when the association is sufficiently supported.

The implementation priority is therefore:

1. Reliable capture and timestamps.
2. Accurate vehicle/plate detection and OCR.
3. Correct entry-crossing events.
4. Durable observation and audit records.
5. Evidence-based cross-camera association.
6. Human review and measured optimization.

Do these in order. A good single-camera baseline and a conservative reconciliation engine are more valuable than a complicated multi-camera architecture that produces confident but incorrect matches.

**Success means producing trustworthy audit records—not forcing every observation into a vehicle identity.**