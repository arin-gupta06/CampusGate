let activeReviewEntryId = null;
let ws = null;

// Switch View (Control Room vs Guard Post)
function switchView(viewName) {
  const control = document.getElementById('controlRoomView');
  const guard = document.getElementById('guardPostView');
  const btnControl = document.getElementById('btnControlView');
  const btnGuard = document.getElementById('btnGuardView');

  if (viewName === 'guard') {
    control.style.display = 'none';
    guard.style.display = 'flex';
    btnControl.classList.remove('active');
    btnGuard.classList.add('active');
  } else {
    control.style.display = 'flex';
    guard.style.display = 'none';
    btnControl.classList.add('active');
    btnGuard.classList.remove('active');
  }
}

// Fetch and render Stats
async function loadStats() {
  try {
    const res = await fetch('/api/entries/summary');
    if (!res.ok) return;
    const data = await res.json();
    document.getElementById('statTotalEntries').innerText = data.total_entries;
    document.getElementById('statAuthorized').innerText = data.authorized_count;
    document.getElementById('statUnauthorized').innerText = data.unauthorized_count;
    document.getElementById('statReviewRequired').innerText = data.review_required_count;
    document.getElementById('statHandoffs').innerText = data.handoff_pending_count;
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

// Format Date
function formatDate(isoStr) {
  if (!isoStr) return '--';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Render Status Badge
function renderStatusBadge(status) {
  if (status === 'AUTHORIZED') {
    return `<span class="status-tag auth">Authorized</span>`;
  } else if (status === 'NOT_MATCHED') {
    return `<span class="status-tag unauth">Alert: Unlisted</span>`;
  } else if (status === 'REVIEW_REQUIRED') {
    return `<span class="status-tag review">Review Needed</span>`;
  } else if (status === 'HANDOFF_PENDING') {
    return `<span class="status-tag handoff">Handoff Pending</span>`;
  } else if (status === 'ASSOCIATED') {
    return `<span class="status-tag auth" style="background: rgba(6,182,212,0.15); color: #22d3ee; border-color: rgba(6,182,212,0.35);">Associated</span>`;
  } else {
    return `<span class="status-tag">${status}</span>`;
  }
}

// Fetch and render Entries table
async function loadEntries() {
  try {
    const res = await fetch('/api/entries?limit=25');
    if (!res.ok) return;
    const entries = await res.json();
    const tbody = document.getElementById('entriesTableBody');

    if (!entries.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-dim); padding:2rem;">No entries recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = entries.map(entry => {
      const plateHtml = entry.registration_number
        ? `<span class="plate-badge">${entry.registration_number}</span>`
        : `<span style="color:var(--text-dim); font-size:0.8rem; font-style:italic;">[Unreadable]</span>`;

      const actionBtn = entry.identity_status === 'REVIEW_REQUIRED'
        ? `<button class="btn" style="padding:0.25rem 0.6rem; font-size:0.72rem; background:var(--amber); color:#000;" onclick="openReviewModal('${entry.id}')">Review</button>`
        : `<span style="color:var(--text-dim); font-size:0.75rem;">--</span>`;

      return `
        <tr>
          <td>${plateHtml}</td>
          <td><span style="font-weight:600; font-size:0.8rem;">${entry.primary_camera_id}</span></td>
          <td><span style="font-size:0.75rem; color:var(--text-muted);">${entry.identity_status}</span></td>
          <td>${renderStatusBadge(entry.authorization_state)}</td>
          <td><span style="font-size:0.75rem; color:var(--text-dim);">${entry.resolution_method || '--'}</span></td>
          <td><span style="font-size:0.75rem; font-family:'JetBrains Mono';">${formatDate(entry.first_observed_at)}</span></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');

    // Update Guard View with latest entry
    if (entries.length > 0) {
      updateGuardView(entries[0]);
    }
  } catch (err) {
    console.error('Error loading entries:', err);
  }
}

// Update Guard View
function updateGuardView(latest) {
  const banner = document.getElementById('guardActionBanner');
  const plate = document.getElementById('guardPlateDisplay');
  const details = document.getElementById('guardDetails');

  plate.innerText = latest.registration_number || 'UNREADABLE';

  if (latest.authorization_state === 'AUTHORIZED') {
    banner.className = 'guard-banner open-gate';
    banner.innerText = 'AUTHORIZED - OPEN BARRIER';
    details.innerText = `Vehicle confirmed authorized for entry at ${formatDate(latest.first_observed_at)}.`;
  } else if (latest.authorization_state === 'NOT_MATCHED') {
    banner.className = 'guard-banner stop-vehicle';
    banner.innerText = 'ALERT - STOP VEHICLE';
    details.innerText = `Vehicle is not registered in college records. Request visitor ID.`;
  } else {
    banner.className = 'guard-banner verify-id';
    banner.innerText = 'REVIEW - VERIFY IDENTITY';
    details.innerText = `License plate could not be verified automatically. Check registration manually.`;
  }
}

// Fetch and render Cameras & Topology
async function loadCamerasAndTopology() {
  try {
    const [camRes, topoRes] = await Promise.all([
      fetch('/api/cameras'),
      fetch('/api/cameras/topology')
    ]);

    if (camRes.ok) {
      const cams = await camRes.json();
      const camContainer = document.getElementById('cameraListContainer');
      camContainer.innerHTML = cams.map(c => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0; border-bottom:1px solid var(--border-subtle); font-size:0.8rem;">
          <div>
            <span style="font-weight:700; color:#fff;">${c.id}</span>
            <span style="color:var(--text-dim); font-size:0.72rem; display:block;">${c.location_description || c.name}</span>
          </div>
          <span style="font-size:0.68rem; font-weight:700; color:var(--emerald); background:var(--emerald-bg); padding:0.15rem 0.45rem; border-radius:9999px;">${c.physical_role}</span>
        </div>
      `).join('');
    }

    if (topoRes.ok) {
      const routes = await topoRes.json();
      const topoContainer = document.getElementById('topologyListContainer');
      topoContainer.innerHTML = routes.map(r => `
        <div style="padding:0.4rem 0; border-bottom:1px solid var(--border-subtle); font-size:0.8rem;">
          <div style="display:flex; justify-content:space-between; font-weight:600; color:var(--accent-cyan);">
            <span>${r.source_camera_id} &rarr; ${r.destination_camera_id}</span>
            <span style="font-family:'JetBrains Mono'; font-size:0.75rem;">${r.expected_travel_time_min}s - ${r.expected_travel_time_max}s</span>
          </div>
          <span style="color:var(--text-dim); font-size:0.7rem;">${r.route_metadata || 'Configured Transit Corridor'}</span>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading cameras and topology:', err);
  }
}

// Review Modal Handlers
function openReviewModal(entryId) {
  activeReviewEntryId = entryId;
  document.getElementById('modalPlateInput').value = '';
  document.getElementById('modalNotesInput').value = '';
  document.getElementById('reviewModal').style.display = 'flex';
}

function closeReviewModal() {
  document.getElementById('reviewModal').style.display = 'none';
  activeReviewEntryId = null;
}

async function submitReviewDecision(decision) {
  if (!activeReviewEntryId) return;

  const plate = document.getElementById('modalPlateInput').value.trim();
  const notes = document.getElementById('modalNotesInput').value.trim();

  try {
    const res = await fetch(`/api/entries/reviews/${activeReviewEntryId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_number: plate || null,
        review_decision: decision,
        notes: notes || null
      })
    });

    if (res.ok) {
      closeReviewModal();
      refreshDashboard();
    } else {
      alert('Failed to resolve review case.');
    }
  } catch (err) {
    console.error('Error submitting review:', err);
  }
}

// WebSocket Connection
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/live-feed`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    document.getElementById('wsStatusText').innerText = 'LIVE LINK';
    console.log('WebSocket connected to Campus Gate');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Real-time event received:', data);
      refreshDashboard();
    } catch (e) {
      console.error('Error parsing WS message:', e);
    }
  };

  ws.onclose = () => {
    document.getElementById('wsStatusText').innerText = 'RECONNECTING';
    setTimeout(connectWebSocket, 3000);
  };
}

function refreshDashboard() {
  loadStats();
  loadEntries();
  loadCamerasAndTopology();
}

// Initial Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  refreshDashboard();
  connectWebSocket();
});
