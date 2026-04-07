document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('event');
  
  const banner = document.getElementById('status-banner');
  const titleEl = document.getElementById('status-title');
  const messageEl = document.getElementById('status-message');
  
  let map, marker;

  if (!eventId) {
    showBanner('Error', 'No se ha proporcionado un ID de evento.', 'expired');
    return;
  }

  function showBanner(title, message, stateClass) {
    banner.className = `banner ${stateClass}`;
    titleEl.textContent = title;
    messageEl.textContent = message;
  }

  function initMap(lat, lng) {
    map = L.map('map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Custom red marker icon
    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    marker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
  }

  function updateMap(lat, lng) {
    if (!map) {
      initMap(lat, lng);
    } else {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng]);
    }
  }

  async function pollLocation() {
    try {
      const response = await fetch(`/api/panic/track/${eventId}`);
      if (!response.ok) {
        if (response.status === 404) {
          showBanner('Evento no encontrado', 'El evento de pánico no existe o es inválido.', 'expired');
          return;
        }
        throw new Error('Network error');
      }
      
      const data = await response.json();
      
      if (data.status === 'expired') {
        showBanner('Enlace Expirado', 'Este enlace temporal de rastreo ha expirado.', 'expired');
        return;
      }
      
      if (data.status === 'resolved') {
        showBanner('Emergencia Resuelta', 'El evento de pánico ha sido marcado como resuelto por el usuario.', 'resolved');
        return;
      }
      
      if (data.status === 'active') {
        showBanner(`🚨 EMERGENCIA: ${data.username}`, data.custom_message, 'active');
        if (data.location) {
          updateMap(data.location.latitude, data.location.longitude);
        }
        
        // Poll every minute (60000 ms) instead of 5s
        setTimeout(pollLocation, 60000);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      // Retry in 1 minute
      setTimeout(pollLocation, 60000);
    }
  }

  // Start polling
  pollLocation();
});
