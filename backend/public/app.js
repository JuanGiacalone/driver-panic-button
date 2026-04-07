document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginOverlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const navbar = document.querySelector('.navbar');
  const dashboard = document.querySelector('.dashboard-container');
  const adminName = document.getElementById('adminName');
  const logoutBtn = document.getElementById('logoutBtn');
  
  const eventsList = document.getElementById('eventsList');
  const statusFilter = document.getElementById('statusFilter');
  const eventPanel = document.getElementById('eventPanel');
  
  // Panel Elements
  const panelUser = document.getElementById('panelUser');
  const panelStatus = document.getElementById('panelStatus');
  const panelStart = document.getElementById('panelStart');
  const panelEnd = document.getElementById('panelEnd');
  const panelTicks = document.getElementById('panelTicks');
  const resolveEventBtn = document.getElementById('resolveEventBtn');

  let map;
  let currentPolyline = null;
  let markers = [];
  let pollInterval = null;
  let state = {
    events: [],
    selectedEventId: null
  };

  // Check auth on load
  const token = localStorage.getItem('adminToken');
  const username = localStorage.getItem('adminUsername');
  
  if (token && username) {
    showDashboard(username);
  }

  // --- Auth Handlers ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const secret = document.getElementById('adminSecret').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass, admin_secret: secret || undefined })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      if (data.user.role !== 'admin') throw new Error('Requires Admin permissions.');

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUsername', data.user.username);
      showDashboard(data.user.username);
    } catch (err) {
      loginError.textContent = err.message;
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    stopPolling();
    loginOverlay.classList.remove('hidden');
    navbar.classList.add('hidden');
    dashboard.classList.add('hidden');
    eventPanel.classList.add('hidden');
  });

  function showDashboard(name) {
    loginOverlay.classList.add('hidden');
    navbar.classList.remove('hidden');
    dashboard.classList.remove('hidden');
    adminName.textContent = `Admin: ${name}`;
    initMap();
    fetchEvents();
    startPolling();
  }

  // --- Map Initialization ---
  function initMap() {
    if (map) return;
    map = L.map('map').setView([0, 0], 2);
    // Dark matter CartoDB basemap for premium feel
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
  }

  // --- Data Fetching ---
  async function fetchEvents() {
    try {
      const filter = statusFilter.value;
      const url = filter ? `/api/admin/events?status=${filter}` : '/api/admin/events';
      const token = localStorage.getItem('adminToken');

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        logoutBtn.click();
        return;
      }

      state.events = await res.json();
      renderSidebar();
      
      // Update map if an event is currently selected
      if (state.selectedEventId) {
        const ev = state.events.find(e => e.id === state.selectedEventId);
        if (ev) renderEventDetails(ev, false); // false = don't recenter map forcefully if already looking
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
  }

  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(fetchEvents, 10000); // Poll every 10s
  }
  function stopPolling() {
    if (pollInterval) clearInterval(pollInterval);
  }

  statusFilter.addEventListener('change', () => {
    state.selectedEventId = null;
    eventPanel.classList.add('hidden');
    clearMap();
    fetchEvents();
  });

  // --- UI Rendering ---
  function renderSidebar() {
    eventsList.innerHTML = '';
    
    if (state.events.length === 0) {
      eventsList.innerHTML = '<li style="text-align:center;color:var(--text-muted);font-size:0.9rem;margin-top:2rem;">No hay eventos reportados.</li>';
      return;
    }

    state.events.forEach(ev => {
      const li = document.createElement('li');
      li.className = `event-card ${ev.status === 'active' ? 'active-alert' : 'resolved'}`;
      if (ev.id === state.selectedEventId) {
        li.style.background = 'rgba(255,255,255,0.1)';
      }
      
      const startedAt = new Date(ev.started_at).toLocaleString('es-ES');
      const latestCoord = ev.locations.length > 0 ? `${ev.locations.length} pings` : 'Sin ubícacion';

      li.innerHTML = `
        <h4>Conductor: ${ev.username}</h4>
        <p>Estado: ${ev.status === 'active' ? '🔴 En Curso' : '✅ Resuelta'}</p>
        <p>${latestCoord}</p>
        <div class="time">${startedAt}</div>
      `;
      
      li.addEventListener('click', () => {
        state.selectedEventId = ev.id;
        renderSidebar(); // update active state styling
        renderEventDetails(ev, true);
      });

      eventsList.appendChild(li);
    });
  }

  function clearMap() {
    if (currentPolyline) {
      map.removeLayer(currentPolyline);
      currentPolyline = null;
    }
    markers.forEach(m => map.removeLayer(m));
    markers = [];
  }

  function renderEventDetails(ev, recenterMap) {
    eventPanel.classList.remove('hidden');
    
    panelUser.textContent = `Pánico: ${ev.username}`;
    panelStatus.textContent = ev.status === 'active' ? 'Activo' : 'Resuelto';
    panelStatus.className = `badge ${ev.status}`;
    
    panelStart.textContent = new Date(ev.started_at).toLocaleString('es-ES');
    panelEnd.textContent = ev.ended_at ? new Date(ev.ended_at).toLocaleString('es-ES') : 'N/A';
    panelTicks.textContent = ev.locations.length;

    // Resolve button logic
    if (ev.status === 'active') {
      resolveEventBtn.classList.remove('hidden');
      resolveEventBtn.onclick = () => resolveEventReq(ev.id);
    } else {
      resolveEventBtn.classList.add('hidden');
    }

    // Map drawing
    clearMap();
    
    if (ev.locations.length > 0) {
      const latlngs = ev.locations.map(loc => [loc.latitude, loc.longitude]);
      
      // Polyline
      currentPolyline = L.polyline(latlngs, {
        color: ev.status === 'active' ? '#ef4444' : '#6366f1',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10'
      }).addTo(map);

      // Start Marker
      const startIco = L.divIcon({ className: 'custom-marker', html: '<div style="background:#10b981;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>' });
      markers.push(L.marker(latlngs[0], {icon: startIco}).bindPopup('Inicio').addTo(map));

      // End/Current Marker
      if (ev.locations.length > 1) {
        const lastIco = L.divIcon({ className: 'custom-marker', html: `<div style="background:${ev.status === 'active' ? '#ef4444' : '#6366f1'};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px ${ev.status==='active'? '#ef4444':'transparent'};"></div>` });
        markers.push(L.marker(latlngs[latlngs.length - 1], {icon: lastIco}).bindPopup('Última Posición').addTo(map));
      }

      if (recenterMap) {
        map.fitBounds(currentPolyline.getBounds(), { padding: [50, 50], maxZoom: 16 });
      }
    } else {
      // Zoom out if no locations
      if (recenterMap) map.setView([0,0], 2);
    }
  }

  async function resolveEventReq(id) {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch('/api/panic/resolve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ event_id: id })
      });
      fetchEvents(); // trigger refresh immediately
    } catch (err) {
      alert("Error resolviendo alerta");
    }
  }

});
