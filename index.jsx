<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Directorio de Negocios Nacionales (CR)</title>
  <!-- Bootstrap 5.3.x (usa 5.3.3; podés cambiar a cualquier 5.3.x) -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
  <!-- Leaflet -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <style>
    html, body { height: 100%; }
    #map { height: 70vh; border-radius: 1rem; }
    .category-dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; margin-right: .4rem; }
    .leaflet-popup-content-wrapper { border-radius: .75rem; }
    .marker-hotel { background: #1d4ed8; }
    .marker-rest { background: #059669; }
    .marker-trans { background: #eab308; }
    .marker-tour { background: #dc2626; }
    .sticky-card { position: sticky; top: 1rem; }
  </style>
</head>
<body class="bg-light">

  <nav class="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
    <div class="container">
      <a class="navbar-brand fw-semibold" href="#">Directorio CR 🇨🇷</a>
      <div class="ms-auto d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#settingsModal">Conectar Supabase</button>
        <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#suggestModal">Sugerir negocio</button>
      </div>
    </div>
  </nav>

  <main class="container my-4">
    <div id="modeAlert" class="alert alert-warning d-none" role="alert">
      Modo demo sin conexión a base de datos. Pegá tus credenciales en <strong>Conectar Supabase</strong> para usar datos reales.
    </div>

    <div class="row g-4">
      <div class="col-lg-4">
        <div class="card sticky-card shadow-sm">
          <div class="card-body">
            <h1 class="h4 mb-3">Negocios nacionales</h1>
            <p class="text-secondary mb-3">Hotelería, restaurantes, transporte privado y tour operadores. Solo negocios costarricenses verificados.</p>

            <div class="mb-3">
              <label class="form-label">Buscar</label>
              <input id="searchInput" type="text" class="form-control" placeholder="Nombre, cantón o provincia…">
            </div>

            <div class="mb-2"><small class="text-secondary">Categorías</small></div>
            <div class="d-flex flex-wrap gap-2 mb-3" id="catBtns"></div>
            <div class="d-flex gap-2 mb-3">
              <button id="allBtn" class="btn btn-outline-secondary btn-sm">Todas</button>
              <button id="noneBtn" class="btn btn-outline-secondary btn-sm">Ninguna</button>
            </div>

            <div class="d-flex align-items-center justify-content-between mb-2">
              <div><small class="text-secondary">Resultados</small></div>
              <div class="text-secondary"><small id="countSpan">0</small></div>
            </div>
            <div id="list" class="vstack gap-2"></div>
          </div>
        </div>
      </div>
      <div class="col-lg-8">
        <div id="map" class="shadow"></div>
      </div>
    </div>
  </main>

  <!-- Modal: Conectar Supabase -->
  <div class="modal fade" id="settingsModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Conectar Supabase</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-info">Pegá tus credenciales públicas. Se guardan en <code>localStorage</code> del navegador.</div>
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label">NEXT_PUBLIC_SUPABASE_URL</label>
              <input id="sbUrl" type="text" class="form-control" placeholder="https://xxxx.supabase.co" />
            </div>
            <div class="col-12">
              <label class="form-label">NEXT_PUBLIC_SUPABASE_ANON_KEY</label>
              <textarea id="sbKey" class="form-control" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
          <button id="saveSettingsBtn" class="btn btn-primary">Guardar y recargar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal: Sugerir negocio -->
  <div class="modal fade" id="suggestModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Sugerir negocio (pendiente de verificación)</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning mb-3">Usá el mapa para elegir latitud/longitud haciendo click; o pegá las coordenadas manualmente.</div>
          <form id="suggestForm" class="row g-3">
            <div class="col-md-8">
              <label class="form-label">Nombre</label>
              <input name="name" type="text" class="form-control" required>
            </div>
            <div class="col-md-4">
              <label class="form-label">Categoría</label>
              <select name="category" class="form-select" required>
                <option value="hoteleria">Hotelería</option>
                <option value="restaurante">Restaurante</option>
                <option value="transporte">Transporte privado</option>
                <option value="tour">Tour operador</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Cantón</label>
              <input name="canton" type="text" class="form-control" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Provincia</label>
              <input name="province" type="text" class="form-control" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Teléfono</label>
              <input name="phone" type="tel" class="form-control" placeholder="+506 8888 0000">
            </div>
            <div class="col-md-6">
              <label class="form-label">WhatsApp</label>
              <input name="whatsapp" type="tel" class="form-control" placeholder="88880000">
            </div>
            <div class="col-12">
              <label class="form-label">Sitio web</label>
              <input name="website" type="url" class="form-control" placeholder="https://…">
            </div>
            <div class="col-md-6">
              <label class="form-label">Latitud</label>
              <input id="latInput" name="lat" type="number" step="any" class="form-control" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Longitud</label>
              <input id="lngInput" name="lng" type="number" step="any" class="form-control" required>
            </div>
            <div class="col-12">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" name="is_national" id="isNational" checked>
                <label class="form-check-label" for="isNational">Declaro que este negocio es costarricense (nacional)</label>
              </div>
            </div>
            <div class="col-12">
              <button class="btn btn-primary" type="submit">Enviar sugerencia</button>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>

  <!-- App: Vanilla JS + Supabase (ESM) -->
  <script type="module">
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

    // ---- Categorías ----
    const CATS = [
      { id: 'hoteleria', name: 'Hotelería', color: '#1d4ed8', dot: 'marker-hotel' },
      { id: 'restaurante', name: 'Restaurante', color: '#059669', dot: 'marker-rest' },
      { id: 'transporte', name: 'Transporte privado', color: '#eab308', dot: 'marker-trans' },
      { id: 'tour', name: 'Tour operador', color: '#dc2626', dot: 'marker-tour' },
    ];

    // ---- Fallback demo data ----
    const DEMO = [
      { id: 1, name: 'Hotel Bahía Azul', category: 'hoteleria', lat: 9.1546, lng: -83.7393, canton: 'Osa', province: 'Puntarenas', phone: '+506 8888 1111', whatsapp: '88881111', website: 'https://example.com', verified: true, is_national: true },
      { id: 2, name: 'Soda Tica Doña Mary', category: 'restaurante', lat: 9.1632, lng: -83.7412, canton: 'Osa', province: 'Puntarenas', phone: '+506 8888 2222', whatsapp: '88882222', website: '', verified: true, is_national: true },
      { id: 3, name: 'Uvita Private Rides', category: 'transporte', lat: 9.154, lng: -83.736, canton: 'Osa', province: 'Puntarenas', phone: '+506 8888 3333', whatsapp: '88883333', website: 'https://wa.me/50688883333', verified: true, is_national: true },
      { id: 4, name: 'Ballena Tours CR', category: 'tour', lat: 9.1599, lng: -83.742, canton: 'Osa', province: 'Puntarenas', phone: '+506 8888 4444', whatsapp: '88884444', website: 'https://example.com', verified: true, is_national: true },
    ];

    // ---- State ----
    let items = [...DEMO];
    let activeCats = new Set(CATS.map(c => c.id));
    let markers = [];

    // ---- Elements ----
    const modeAlert = document.getElementById('modeAlert');
    const listEl = document.getElementById('list');
    const countSpan = document.getElementById('countSpan');
    const searchInput = document.getElementById('searchInput');

    // ---- Map ----
    const map = L.map('map');
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' });
    osm.addTo(map);
    map.setView([9.1546, -83.7393], 11);

    // click-to-fill coords for suggestion modal
    map.on('click', (e) => {
      document.getElementById('latInput').value = e.latlng.lat.toFixed(6);
      document.getElementById('lngInput').value = e.latlng.lng.toFixed(6);
    });

    // ---- Category buttons ----
    const catBtns = document.getElementById('catBtns');
    CATS.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-primary';
      btn.innerHTML = `<span class="category-dot" style="background:${c.color}"></span>${c.name}`;
      btn.dataset.id = c.id;
      btn.onclick = () => {
        if (activeCats.has(c.id)) activeCats.delete(c.id); else activeCats.add(c.id);
        btn.classList.toggle('btn-outline-primary');
        btn.classList.toggle('btn-primary');
        render();
      };
      // start active
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-outline-primary');
      catBtns.appendChild(btn);
    });
    document.getElementById('allBtn').onclick = () => { activeCats = new Set(CATS.map(c => c.id)); [...catBtns.children].forEach(b=>{b.classList.add('btn-primary'); b.classList.remove('btn-outline-primary');}); render(); };
    document.getElementById('noneBtn').onclick = () => { activeCats = new Set(); [...catBtns.children].forEach(b=>{b.classList.add('btn-outline-primary'); b.classList.remove('btn-primary');}); render(); };

    searchInput.addEventListener('input', () => render());

    // ---- Supabase connection ----
    function getCreds(){
      return {
        url: localStorage.getItem('SUPABASE_URL') || '',
        key: localStorage.getItem('SUPABASE_ANON_KEY') || ''
      };
    }
    let sb = null;
    async function tryConnect(){
      const { url, key } = getCreds();
      if (!url || !key) { modeAlert.classList.remove('d-none'); return; }
      sb = createClient(url, key);
      modeAlert.classList.add('d-none');
      await loadBusinesses();
    }

    async function loadBusinesses(){
      try {
        const { data, error } = await sb
          .from('business')
          .select('id, name, category, lat, lng, canton, province, phone, whatsapp, website, verified, is_national')
          .eq('verified', true)
          .eq('is_national', true)
          .limit(2000);
        if (error) throw error;
        items = data && data.length ? data : DEMO;
        render();
      } catch (e) {
        console.warn('Fallo al cargar negocios, usando demo', e);
        items = [...DEMO];
        modeAlert.classList.remove('d-none');
        render();
      }
    }

    // ---- Render list + markers ----
    function makeWaLink(raw, msg='Hola, vi tu contacto en el directorio 🇨🇷'){
      const digits = (raw||'').replace(/\D/g,'');
      if (!digits) return '#';
      const cr = digits.startsWith('506') ? digits : `506${digits}`;
      return `https://wa.me/${cr}?text=${encodeURIComponent(msg)}`;
    }

    function render(){
      // filter
      const q = searchInput.value.trim().toLowerCase();
      const filtered = items.filter(b => {
        const inCat = activeCats.has(b.category);
        const inQuery = !q || b.name.toLowerCase().includes(q) || (b.canton||'').toLowerCase().includes(q) || (b.province||'').toLowerCase().includes(q);
        return inCat && inQuery;
      });
      countSpan.textContent = String(filtered.length);

      // list
      listEl.innerHTML = '';
      filtered.forEach(b => {
        const cat = CATS.find(c=>c.id===b.category);
        const card = document.createElement('div');
        card.className = 'card border-0 shadow-sm';
        card.innerHTML = `
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h6 class="card-title mb-1">${b.name}</h6>
              <span class="badge" style="background:${cat.color}">${cat.name}</span>
            </div>
            <div class="text-secondary small mb-2">${b.canton || ''}${b.canton?', ':''}${b.province || ''}</div>
            <div class="d-flex flex-wrap gap-3 small">
              ${b.phone ? `<a href="tel:${b.phone.replace(/\s/g,'')}">Llamar</a>` : ''}
              ${b.whatsapp ? `<a target="_blank" rel="noreferrer" href="${makeWaLink(b.whatsapp)}">WhatsApp</a>` : ''}
              <a target="_blank" rel="noreferrer" href="https://maps.google.com/?q=${b.lat},${b.lng}">Cómo llegar</a>
              ${b.website ? `<a target="_blank" rel="noreferrer" href="${b.website}">Sitio web</a>` : ''}
              ${b.verified ? `<span class="badge text-bg-light border">Verificado 🇨🇷</span>` : ''}
            </div>
          </div>`;
        // focus on click
        card.onclick = () => { map.setView([b.lat, b.lng], 14); };
        listEl.appendChild(card);
      });

      // markers
      markers.forEach(m => map.removeLayer(m));
      markers = [];
      const group = L.featureGroup();
      filtered.forEach(b => {
        const cat = CATS.find(c=>c.id===b.category);
        const marker = L.circleMarker([b.lat, b.lng], {
          radius: 8,
          color: cat.color,
          fillColor: cat.color,
          fillOpacity: .85,
          weight: 1
        }).bindPopup(`
          <div class='fw-semibold mb-1'>${b.name}</div>
          <div class='text-secondary small mb-2'>${b.canton || ''}${b.canton?', ':''}${b.province || ''}</div>
          <div class='d-flex flex-wrap gap-2 small'>
            ${b.phone ? `<a href=\"tel:${b.phone.replace(/\s/g,'')}\">Llamar</a>` : ''}
            ${b.whatsapp ? `<a target=\"_blank\" rel=\"noreferrer\" href=\"${makeWaLink(b.whatsapp)}\">WhatsApp</a>` : ''}
            <a target=\"_blank\" rel=\"noreferrer\" href=\"https://maps.google.com/?q=${b.lat},${b.lng}\">Cómo llegar</a>
          </div>
        `);
        marker.addTo(map);
        group.addLayer(marker);
        markers.push(marker);
      });
      if (filtered.length) map.fitBounds(group.getBounds(), { padding: [40, 40] });
    }

    // initial render
    render();

    // ---- Settings modal ----
    const sbUrl = document.getElementById('sbUrl');
    const sbKey = document.getElementById('sbKey');
    sbUrl.value = localStorage.getItem('SUPABASE_URL') || '';
    sbKey.value = localStorage.getItem('SUPABASE_ANON_KEY') || '';
    document.getElementById('saveSettingsBtn').onclick = () => {
      localStorage.setItem('SUPABASE_URL', sbUrl.value.trim());
      localStorage.setItem('SUPABASE_ANON_KEY', sbKey.value.trim());
      location.reload();
    };

    // try connect to Supabase
    await tryConnect();

    // ---- Suggestion form → insert into business_suggestions ----
    const suggestForm = document.getElementById('suggestForm');
    suggestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(suggestForm);
      const payload = {
        name: form.get('name'),
        category: form.get('category'),
        canton: form.get('canton'),
        province: form.get('province'),
        phone: form.get('phone') || null,
        whatsapp: form.get('whatsapp') || null,
        website: form.get('website') || null,
        lat: parseFloat(form.get('lat')),
        lng: parseFloat(form.get('lng')),
        is_national: form.get('is_national') === 'on',
      };
      if (!sb) { alert('Conectá Supabase primero.'); return; }
      try {
        const { data, error } = await sb
          .from('business_suggestions')
          .insert(payload)
          .select('id');
        if (error) throw error;
        alert('¡Gracias! Sugerencia enviada para verificación.');
        const modal = bootstrap.Modal.getInstance(document.getElementById('suggestModal'));
        modal?.hide();
        suggestForm.reset();
      } catch (err) {
        console.error(err);
        alert('No se pudo enviar la sugerencia. Verificá la conexión/credenciales.');
      }
    });

    // ---- Helpful SQL (comentado) ----
    /*
    -- Tabla principal
    create table if not exists public.business (
      id bigserial primary key,
      name text not null,
      category text check (category in ('hoteleria','restaurante','transporte','tour')) not null,
      phone text,
      whatsapp text,
      website text,
      canton text,
      province text,
      lat double precision not null,
      lng double precision not null,
      verified boolean default false,
      is_national boolean default true,
      created_at timestamp with time zone default now()
    );

    -- Sugerencias (pendientes de verificación)
    create table if not exists public.business_suggestions (
      id bigserial primary key,
      name text not null,
      category text not null,
      phone text,
      whatsapp text,
      website text,
      canton text,
      province text,
      lat double precision not null,
      lng double precision not null,
      is_national boolean default true,
      created_at timestamp with time zone default now()
    );

    -- Políticas RLS (opcional): permitir inserts anónimos solo en suggestions
    alter table public.business enable row level security;
    alter table public.business_suggestions enable row level security;

    create policy anon_read_business on public.business
      for select using ( true );

    create policy anon_insert_suggestions on public.business_suggestions
      for insert with check ( true );
    create policy anon_read_suggestions on public.business_suggestions
      for select using ( false ); -- que no puedan leer lo que otros mandaron
    */
  </script>
</body>
</html>