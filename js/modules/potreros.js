// ======================
  // Potreros: puntos GPS y área
  // ======================
  let puntos = [];
  const canvas = document.getElementById('canvasPotrero');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const listaPuntosEl = document.getElementById('listaPuntos');
  const areaM2El = document.getElementById('areaM2');

  function limpiarPuntos() {
    puntos = [];
    renderPuntos();
  }
  window.limpiarPuntos = limpiarPuntos;

  function geoGetPoint() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocalización no soportada'));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            acc: pos.coords.accuracy
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  function areaPoligonoM2(latlon) {
    if (latlon.length < 3) return 0;
    // equirectangular projection around centroid
    const R = 6371000;
    const lat0 = latlon.reduce((s,p)=>s+p.lat,0)/latlon.length * Math.PI/180;
    const lon0 = latlon.reduce((s,p)=>s+p.lon,0)/latlon.length * Math.PI/180;

    const pts = latlon.map(p => {
      const lat = p.lat * Math.PI/180;
      const lon = p.lon * Math.PI/180;
      const x = (lon - lon0) * Math.cos(lat0) * R;
      const y = (lat - lat0) * R;
      return {x,y};
    });

    let sum = 0;
    for (let i=0;i<pts.length;i++) {
      const j = (i+1) % pts.length;
      sum += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return Math.abs(sum) / 2;
  }

  function drawPolygon(latlon) {
    if (!ctx || !canvas) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if (latlon.length < 2) {
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '14px system-ui';
      ctx.fillText('Agrega 3+ puntos GPS para dibujar el potrero.', 16, 28);
      return;
    }

    // normalize to canvas
    const lats = latlon.map(p=>p.lat);
    const lons = latlon.map(p=>p.lon);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);

    const pad = 26;
    const w = canvas.width - pad*2;
    const h = canvas.height - pad*2;

    function mapX(lon) {
      if (maxLon === minLon) return pad + w/2;
      return pad + (lon - minLon) / (maxLon - minLon) * w;
    }
    function mapY(lat) {
      if (maxLat === minLat) return pad + h/2;
      // invert y (north up)
      return pad + (maxLat - lat) / (maxLat - minLat) * h;
    }

    // path
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#8b4513';
    ctx.fillStyle = 'rgba(240,224,192,0.35)';

    ctx.beginPath();
    ctx.moveTo(mapX(latlon[0].lon), mapY(latlon[0].lat));
    for (let i=1;i<latlon.length;i++) {
      ctx.lineTo(mapX(latlon[i].lon), mapY(latlon[i].lat));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // points
    ctx.fillStyle = '#4b3b2d';
    latlon.forEach((p, idx) => {
      const x = mapX(p.lon), y = mapY(p.lat);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI*2);
      ctx.fill();
      ctx.fillText(String(idx+1), x+8, y-8);
    });
  }

  function renderPuntos() {
    if (listaPuntosEl) {
      if (!puntos.length) {
        listaPuntosEl.textContent = 'Sin puntos aún.';
      } else {
        listaPuntosEl.innerHTML = puntos.map((p,i)=>`<div>#${i+1}: ${p.lat.toFixed(6)}, ${p.lon.toFixed(6)} (±${Math.round(p.acc||0)}m)</div>`).join('');
      }
    }
    drawPolygon(puntos);

    const area = areaPoligonoM2(puntos);
    if (areaM2El) areaM2El.value = area ? Math.round(area).toString() : '';
  }

  const btnPuntoGPS = document.getElementById('btnPuntoGPS');
  if (btnPuntoGPS) {
    btnPuntoGPS.addEventListener('click', async ()=> {
      try {
        const p = await geoGetPoint();
        puntos.push(p);
        renderPuntos();
      } catch(e) {
        alert('No se pudo tomar GPS. Revisa permisos de ubicación del navegador.');
      }
    });
  }
  const btnLimpiarGPS = document.getElementById('btnLimpiarGPS');
  if (btnLimpiarGPS) btnLimpiarGPS.addEventListener('click', ()=> limpiarPuntos());

  function formatPotreroLinea(p) {
    const letra = p.letra || p.nombre || '-';
    const area = parseFloat(p.areaM2 || '0') || 0;
    const pts = (p.puntos && p.puntos.length) ? p.puntos.length : 0;
    const corrales = getData('pecuario_corrales').filter(c => (c.potrero || '') === letra && !(c.salida || '').trim());
    const cabezas = corrales.reduce((s, c) => s + (parseFloat(c.cabezas || '0') || 0), 0);
    const dens = (area > 0 && cabezas > 0) ? (cabezas * 10000 / area).toFixed(0) : '';
    const densTxt = dens ? ` | Densidad est.: ${dens} cab/ha` : '';
    return `Potrero ${letra} | Área: ${area ? area + ' m²' : '—'} | Puntos GPS: ${pts}${densTxt} | ${p.nombre ? 'Nombre: ' + p.nombre : ''}`;
  }

  function formatCorralLinea(c) {
    const area = c.areaM2 || c.area || '';
    const cab = c.cabezas || '';
    const dens = c.cabezasHa || c.densidadAuto || c.densidad || '';
    const supl = c.suplemento ? ` | Suplemento: ${c.suplemento}` : '';
    return `Corral ${c.corralId || '-'} | Potrero ${c.potrero || '-'} | Área: ${area ? area + ' m²' : '-'} | Cabezas: ${cab || '-'} | Cab/ha: ${dens || '-'} | Grupo: ${c.grupo || '-'}${supl} | Entrada: ${c.entrada || '-'} | Salida: ${c.salida || ''}`;
  }

  // Potreros storage
  manejarFormulario(
    'form-potreros',
    'pecuario_potreros',
    'lista-potreros',
    formatPotreroLinea,
    (obj, lista) => {
      // anexar puntos y área al último registro guardado (obj)
      obj.puntos = puntos.slice();
      // Guardar área calculada desde los puntos (no desde el input, porque el form se resetea antes del callback)
      const areaCalc = (obj.puntos && obj.puntos.length >= 3) ? areaPoligonoM2(obj.puntos) : 0;
      obj.areaM2 = (obj.areaM2 && String(obj.areaM2).trim()) ? String(obj.areaM2).trim() : (areaCalc ? String(Math.round(areaCalc)) : '');
try { obj.img = (canvas && canvas.toDataURL) ? canvas.toDataURL('image/png') : ''; } catch(e){ obj.img=''; }
      // re-guardar corrigiendo el último elemento
      lista[lista.length - 1] = obj;
      setData('pecuario_potreros', lista);
      pintarLista('pecuario_potreros', 'lista-potreros', formatPotreroLinea);
      if (typeof refrescarPotrerosEnUI === 'function') refrescarPotrerosEnUI();
      renderDesglosePotrerosCorrales();
      limpiarPuntos();
    }
  );

  // ======================
  // Corrales
  // ======================
  manejarFormulario(
    'form-corrales',
    'pecuario_corrales',
    'lista-corrales',
    formatCorralLinea,
    (obj, lista) => {
      // anexar puntos/área/imagen del polígono del corral
      obj.puntos = (window.puntosCorral || []).slice();
      // Guardar área calculada desde los puntos (no desde el input, porque el form se resetea antes del callback)
      const areaCalc = (obj.puntos && obj.puntos.length >= 3) ? areaPoligonoM2(obj.puntos) : 0;
      obj.areaM2 = (obj.areaM2 && String(obj.areaM2).trim()) ? String(obj.areaM2).trim() : (areaCalc ? String(Math.round(areaCalc)) : (obj.areaM2 || obj.area || ''));
// cálculos
      const areaN = parseFloat(obj.areaM2 || '0') || 0;
      const cabN = parseFloat(obj.cabezas || '0') || 0;
      if (areaN > 0 && cabN > 0) {
        obj.m2PorCabeza = (areaN / cabN).toFixed(1);
        obj.cabezasHa = (cabN * 10000 / areaN).toFixed(0);
        obj.densidadAuto = obj.cabezasHa;
      } else {
        obj.m2PorCabeza = obj.m2PorCabeza || '';
        obj.cabezasHa = obj.cabezasHa || '';
        obj.densidadAuto = obj.densidadAuto || '';
      }
      try {
        const cv = document.getElementById('canvasCorral');
        obj.img = (cv && cv.toDataURL) ? cv.toDataURL('image/png') : '';
      } catch(e) { obj.img = obj.img || ''; }

      lista[lista.length - 1] = obj;
      setData('pecuario_corrales', lista);
      // re-pintar
      pintarLista('pecuario_corrales', 'lista-corrales', formatCorralLinea);
      if (typeof refrescarCorralesEnUI === 'function') refrescarCorralesEnUI();
      renderDesglosePotrerosCorrales();

      if (typeof limpiarPuntosCorral === 'function') limpiarPuntosCorral();
    }
  );

  function refrescarSuplementosCorrales() {
    const sel = document.getElementById('selSuplCorral');
    if (!sel) return;
    const lista = getData('pecuario_suplementos') || [];
    sel.innerHTML = '<option value="">Sin suplemento</option>';
    lista.forEach((s) => {
      const clave = (s.clave || s.nombre || '').trim();
      if (!clave) return;
      const o = document.createElement('option');
      o.value = clave;
      o.textContent = `${clave}${s.nombre ? ` — ${s.nombre}` : ''}`;
      sel.appendChild(o);
    });
  }
  window.refrescarSuplementosCorrales = refrescarSuplementosCorrales;

  function renderDesglosePotrerosCorrales() {
    const cont = document.getElementById('lista-desglose-potreros-corrales');
    if (!cont) return;
    const potreros = getData('pecuario_potreros') || [];
    const corrales = getData('pecuario_corrales') || [];
    cont.innerHTML = '';
    if (!potreros.length && !corrales.length) {
      cont.innerHTML = '<div>Sin registros.</div>';
      return;
    }
    const byPotrero = {};
    corrales.forEach((c, idx) => {
      const p = (c.potrero || '—').trim() || '—';
      if (!byPotrero[p]) byPotrero[p] = [];
      byPotrero[p].push({ data: c, index: idx });
    });

    const potreroKeys = new Set();
    potreros.forEach((p, idx) => {
      const potreroKey = (p.letra || '').trim() || '—';
      potreroKeys.add(potreroKey);
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '6px';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.gap = '10px';

      const info = document.createElement('div');
      info.textContent = formatPotreroLinea(p);

      const acciones = document.createElement('div');
      acciones.style.display = 'flex';
      acciones.style.gap = '8px';
      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn-terciario';
      btnEdit.textContent = 'Editar';
      btnEdit.dataset.action = 'edit-potrero';
      btnEdit.dataset.index = String(idx);
      const btnLimpiar = document.createElement('button');
      btnLimpiar.type = 'button';
      btnLimpiar.className = 'btn-secundario';
      btnLimpiar.textContent = 'Limpiar';
      btnLimpiar.dataset.action = 'del-potrero';
      btnLimpiar.dataset.index = String(idx);
      acciones.appendChild(btnEdit);
      acciones.appendChild(btnLimpiar);

      header.appendChild(info);
      header.appendChild(acciones);
      wrap.appendChild(header);

      const corralesWrap = document.createElement('div');
      corralesWrap.style.display = 'flex';
      corralesWrap.style.flexDirection = 'column';
      corralesWrap.style.gap = '6px';

      const corralesPot = byPotrero[potreroKey] || [];
      if (corralesPot.length) {
        corralesPot.forEach((c) => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.alignItems = 'center';
          row.style.gap = '10px';

          const infoCor = document.createElement('div');
          infoCor.textContent = formatCorralLinea(c.data);

          const accionesCor = document.createElement('div');
          accionesCor.style.display = 'flex';
          accionesCor.style.gap = '8px';
          const btnEditCor = document.createElement('button');
          btnEditCor.type = 'button';
          btnEditCor.className = 'btn-terciario';
          btnEditCor.textContent = 'Editar';
          btnEditCor.dataset.action = 'edit-corral';
          btnEditCor.dataset.index = String(c.index);
          const btnLimpiarCor = document.createElement('button');
          btnLimpiarCor.type = 'button';
          btnLimpiarCor.className = 'btn-secundario';
          btnLimpiarCor.textContent = 'Limpiar';
          btnLimpiarCor.dataset.action = 'del-corral';
          btnLimpiarCor.dataset.index = String(c.index);
          accionesCor.appendChild(btnEditCor);
          accionesCor.appendChild(btnLimpiarCor);

          row.appendChild(infoCor);
          row.appendChild(accionesCor);
          corralesWrap.appendChild(row);
        });
      } else {
        const empty = document.createElement('div');
        empty.textContent = 'Sin corrales asignados.';
        corralesWrap.appendChild(empty);
      }

      wrap.appendChild(corralesWrap);
      const sep = document.createElement('hr');
      sep.style.border = 'none';
      sep.style.borderTop = '1px solid #e5e7eb';
      sep.style.margin = '12px 0';
      wrap.appendChild(sep);
      cont.appendChild(wrap);
    });

    Object.keys(byPotrero).sort().forEach((key) => {
      if (potreroKeys.has(key)) return;
      const wrap = document.createElement('div');
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.gap = '10px';

      const info = document.createElement('div');
      info.textContent = `Potrero ${key} | Sin registro de potrero.`;
      header.appendChild(info);
      wrap.appendChild(header);

      byPotrero[key].forEach((c) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.gap = '10px';

        const infoCor = document.createElement('div');
        infoCor.textContent = formatCorralLinea(c.data);

        const accionesCor = document.createElement('div');
        accionesCor.style.display = 'flex';
        accionesCor.style.gap = '8px';
        const btnEditCor = document.createElement('button');
        btnEditCor.type = 'button';
        btnEditCor.className = 'btn-terciario';
        btnEditCor.textContent = 'Editar';
        btnEditCor.dataset.action = 'edit-corral';
        btnEditCor.dataset.index = String(c.index);
        const btnLimpiarCor = document.createElement('button');
        btnLimpiarCor.type = 'button';
        btnLimpiarCor.className = 'btn-secundario';
        btnLimpiarCor.textContent = 'Limpiar';
        btnLimpiarCor.dataset.action = 'del-corral';
        btnLimpiarCor.dataset.index = String(c.index);
        accionesCor.appendChild(btnEditCor);
        accionesCor.appendChild(btnLimpiarCor);

        row.appendChild(infoCor);
        row.appendChild(accionesCor);
        wrap.appendChild(row);
      });
      const sep = document.createElement('hr');
      sep.style.border = 'none';
      sep.style.borderTop = '1px solid #e5e7eb';
      sep.style.margin = '12px 0';
      wrap.appendChild(sep);
      cont.appendChild(wrap);
    });
  }

  function cargarPotreroEnFormulario(index) {
    const lista = getData('pecuario_potreros');
    const p = lista[index];
    if (!p) return;
    const form = document.getElementById('form-potreros');
    if (!form) return;
    Object.keys(p).forEach((key) => {
      const el = form.elements.namedItem(key);
      if (el) el.value = p[key];
    });
    lista.splice(index, 1);
    setData('pecuario_potreros', lista);
    pintarLista('pecuario_potreros', 'lista-potreros', formatPotreroLinea);
    if (typeof refrescarPotrerosEnUI === 'function') refrescarPotrerosEnUI();
    renderDesglosePotrerosCorrales();
  }

  function cargarCorralEnFormulario(index) {
    const lista = getData('pecuario_corrales');
    const c = lista[index];
    if (!c) return;
    const form = document.getElementById('form-corrales');
    if (!form) return;
    Object.keys(c).forEach((key) => {
      const el = form.elements.namedItem(key);
      if (el) el.value = c[key];
    });
    lista.splice(index, 1);
    setData('pecuario_corrales', lista);
    pintarLista('pecuario_corrales', 'lista-corrales', formatCorralLinea);
    if (typeof refrescarCorralesEnUI === 'function') refrescarCorralesEnUI();
    renderDesglosePotrerosCorrales();
  }

  function borrarPotrero(index) {
    const lista = getData('pecuario_potreros');
    if (!lista[index]) return;
    if (!confirm('¿Limpiar este potrero?')) return;
    lista.splice(index, 1);
    setData('pecuario_potreros', lista);
    pintarLista('pecuario_potreros', 'lista-potreros', formatPotreroLinea);
    if (typeof refrescarPotrerosEnUI === 'function') refrescarPotrerosEnUI();
    renderDesglosePotrerosCorrales();
  }

  function borrarCorral(index) {
    const lista = getData('pecuario_corrales');
    if (!lista[index]) return;
    if (!confirm('¿Limpiar este corral?')) return;
    lista.splice(index, 1);
    setData('pecuario_corrales', lista);
    pintarLista('pecuario_corrales', 'lista-corrales', formatCorralLinea);
    if (typeof refrescarCorralesEnUI === 'function') refrescarCorralesEnUI();
    renderDesglosePotrerosCorrales();
  }

  const desgloseCont = document.getElementById('lista-desglose-potreros-corrales');
  if (desgloseCont) {
    desgloseCont.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      const index = parseInt(btn.dataset.index || '-1', 10);
      if (Number.isNaN(index) || index < 0) return;
      if (action === 'edit-potrero') cargarPotreroEnFormulario(index);
      if (action === 'del-potrero') borrarPotrero(index);
      if (action === 'edit-corral') cargarCorralEnFormulario(index);
      if (action === 'del-corral') borrarCorral(index);
    });
  }

  refrescarSuplementosCorrales();
  renderDesglosePotrerosCorrales();

  
