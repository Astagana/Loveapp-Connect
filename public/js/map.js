let leafletMap = null;
let myMarker = null;
let partnerMarker = null;
let geoWatchId = null;

async function renderMapPage() {
  const app = document.getElementById('app');
  const tpl = document.getElementById('tpl-map');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  await refreshMe();
  const toggle = document.getElementById('shareLocationToggle');
  toggle.checked = !!AppState.user.share_location;

  toggle.addEventListener('change', async () => {
    try {
      await api('/location/consent', { method: 'POST', body: { enabled: toggle.checked } });
      showToast(toggle.checked ? 'Berbagi lokasi diaktifkan 📍' : 'Berbagi lokasi dimatikan');
      if (toggle.checked) startGeoWatch();
      else stopGeoWatch();
      await refreshMapStatus();
    } catch (err) {
      showToast(err.message);
      toggle.checked = !toggle.checked;
    }
  });

  initLeafletMap();
  if (toggle.checked) startGeoWatch();
  await refreshMapStatus();
}

function initLeafletMap() {
  const el = document.getElementById('mapEl');
  if (!el) return;
  leafletMap = L.map(el).setView([-6.2, 106.8], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(leafletMap);
}

function startGeoWatch() {
  if (!navigator.geolocation) {
    showToast('Perangkatmu tidak mendukung layanan lokasi.');
    return;
  }
  stopGeoWatch();
  geoWatchId = navigator.geolocation.watchPosition(
    async (pos) => {
      try {
        await api('/location/update', {
          method: 'POST',
          body: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        });
        await refreshMapStatus();
      } catch (err) { /* diam, akan retry saat posisi berubah lagi */ }
    },
    () => showToast('Tidak bisa mengakses lokasi. Periksa izin GPS/browser.'),
    { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
  );
}

function stopGeoWatch() {
  if (geoWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
}

async function refreshMapStatus() {
  const banner = document.getElementById('mapStatusBanner');
  const distanceBox = document.getElementById('distanceBox');
  if (!banner) return; // pengguna sudah pindah halaman

  try {
    const data = await api('/location/status');

    if (!data.paired) {
      banner.textContent = 'Hubungkan dulu dengan pasanganmu di halaman Beranda untuk memakai peta.';
      return;
    }

    if (!data.mutualConsent) {
      banner.textContent = data.myShareEnabled
        ? 'Menunggu pasanganmu menyalakan izin berbagi lokasi juga...'
        : 'Nyalakan sakelar di atas, dan minta pasanganmu melakukan hal yang sama.';
      distanceBox.classList.add('hidden');
    } else {
      banner.textContent = 'Berbagi lokasi aktif untuk kalian berdua 💞';
    }

    if (leafletMap) {
      const bounds = [];
      if (data.myLocation) {
        const p = [data.myLocation.lat, data.myLocation.lng];
        if (!myMarker) myMarker = L.marker(p, { title: 'Kamu' }).addTo(leafletMap).bindPopup('Kamu 💖');
        else myMarker.setLatLng(p);
        bounds.push(p);
      }
      if (data.mutualConsent && data.partnerLocation) {
        const p = [data.partnerLocation.lat, data.partnerLocation.lng];
        if (!partnerMarker) partnerMarker = L.marker(p, { title: 'Pasangan' }).addTo(leafletMap).bindPopup('Pasanganmu 💗');
        else partnerMarker.setLatLng(p);
        bounds.push(p);
      }
      if (bounds.length === 2) leafletMap.fitBounds(bounds, { padding: [40, 40] });
      else if (bounds.length === 1) leafletMap.setView(bounds[0], 13);
    }

    if (data.mutualConsent && data.distanceKm !== null && data.distanceKm !== undefined) {
      distanceBox.classList.remove('hidden');
      document.getElementById('distanceValue').textContent = data.distanceKm;
    }
  } catch (err) {
    banner.textContent = 'Gagal memuat status lokasi.';
  }
}
