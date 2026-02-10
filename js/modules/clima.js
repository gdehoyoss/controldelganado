// ======================
// Clima y pronóstico
// ======================

async function fetchTempActual(p){
  try{
    if (!p || p.lat===undefined || p.lon===undefined) return;
    const lat = p.lat, lon = p.lon;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`;
    const r = await fetch(url);
    if (!r.ok) return;
    const data = await r.json();
    if (data && data.current && data.current.temperature_2m !== undefined){
      const t = data.current.temperature_2m;
      localStorage.setItem('pecuario_temp_actual', String(t));
      const elTemp = document.getElementById('pnl-temp');
      if (elTemp) elTemp.textContent = String(t) + ' °C';
    }
  }catch(e){}
}

// --------- Pronóstico 7 días (Panel) - Open-Meteo ----------
(function initPronosticoPanel(){
  const btnPerm = document.getElementById('btnPermitirUbicacion');
  const btnUpd  = document.getElementById('btnActualizarPronostico');
  const grid    = document.getElementById('wx7');
  const status  = document.getElementById('wxStatus');
  const controls = document.querySelector('.wx-controls');
  let accumEl = document.getElementById("wxAccum");
  if (!btnPerm || !btnUpd || !grid) return;

  const W = {
    0:'Despejado', 1:'Mayormente despejado', 2:'Parcialmente nublado', 3:'Nublado',
    45:'Niebla', 48:'Niebla escarchada',
    51:'Llovizna ligera', 53:'Llovizna', 55:'Llovizna intensa',
    61:'Lluvia ligera', 63:'Lluvia', 65:'Lluvia intensa',
    71:'Nieve ligera', 73:'Nieve', 75:'Nieve intensa',
    80:'Chubascos ligeros', 81:'Chubascos', 82:'Chubascos intensos',
    95:'Tormenta', 96:'Tormenta con granizo', 99:'Tormenta con granizo'
  };
  const D = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  const iconSvg = (kind) => {
    if (kind === 'sun') return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" stroke="#8b4513" stroke-width="2"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M19.8 4.2l-2.1 2.1M6.3 17.7l-2.1 2.1"
          stroke="#8b4513" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    if (kind === 'rain') return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7.5 18.5h9.2a4.3 4.3 0 0 0 0-8.6h-.4A5.6 5.6 0 0 0 6 10.6a3.9 3.9 0 0 0 1.5 7.9z"
          stroke="#4b3b2d" stroke-width="2" stroke-linejoin="round"/>
        <path d="M9 20.5l-1 2M13 20.5l-1 2M17 20.5l-1 2" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7.5 18.5h9.2a4.3 4.3 0 0 0 0-8.6h-.4A5.6 5.6 0 0 0 6 10.6a3.9 3.9 0 0 0 1.5 7.9z"
          stroke="#4b3b2d" stroke-width="2" stroke-linejoin="round"/>
      </svg>`;
  };

  const kindFromCode = (code) => {
    code = Number(code);
    if (code === 0 || code === 1) return 'sun';
    if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloud';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return 'rain';
    return 'cloud';
  };

  const fmtYMD = (d)=>{
    const z=(n)=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
  };
  const shiftYearISO = (iso, delta)=>{
    const d = new Date(String(iso) + 'T12:00:00');
    d.setFullYear(d.getFullYear() + delta);
    return fmtYMD(d);
  };

  let lastPos = null;

  async function ensurePos(){
    try{
      if (status) status.textContent = 'Solicitando ubicación…';
      const p = await geoGetPoint();
      lastPos = p;
      if (status) status.textContent = `Ubicación OK (±${Math.round(p.acc||0)}m).`;
      fetchTempActual(p);
      return p;

    } catch (e) {
      if (status) status.textContent = 'Ubicación no disponible. Revisa permisos del navegador.';
      throw e;
    }
  }

  async function cargarAcumuladoAnual(p){
    if (!accumEl) return;
    try{
      const today = new Date();
      const year = today.getFullYear();
      const start = `${year}-01-01`;
      const end = fmtYMD(today);
      accumEl.textContent = 'Calculando acumulado anual…';
      const urlA = `https://archive-api.open-meteo.com/v1/archive?latitude=${p.lat}&longitude=${p.lon}&start_date=${start}&end_date=${end}&daily=precipitation_sum&timezone=auto`;
      const rA = await fetch(urlA);
      if (!rA.ok) throw new Error('Error acumulado');
      const dA = await rA.json();
      const ps = (dA.daily && dA.daily.precipitation_sum) ? dA.daily.precipitation_sum : [];
      const sum = (ps||[]).reduce((a,b)=>a + (Number(b)||0), 0);
      accumEl.textContent = `Acumulado lluvia ${year} (1 Ene – ${end}): ${sum.toFixed(1)} mm`;
    } catch(e){
      accumEl.textContent = 'Acumulado anual: —';
    }
  }

  async function cargar(){
    try{
      const p = lastPos || await ensurePos();
      grid.innerHTML = '<div class="nota">Cargando pronóstico…</div>';

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('Error al consultar clima');
      const data = await r.json();

      // guarda temperatura actual para Panel
      try{
        if (data.current && (data.current.temperature_2m !== undefined)){
          localStorage.setItem('pecuario_temp_actual', String(data.current.temperature_2m));
        }
      }catch(e){}

      const daily = data.daily || {};
      const fechas = (daily.time || []).slice(0, 7);
      const tmax = (daily.temperature_2m_max || []).slice(0, 7);
      const tmin = (daily.temperature_2m_min || []).slice(0, 7);
      const code = (daily.weathercode || []).slice(0, 7);
      const rain = (daily.precipitation_sum || []).slice(0, 7);
      let prevByDate = {};
      let prevAccumByDate = {};

      if (!fechas.length) {
        grid.innerHTML = '<div class="nota">Sin datos de pronóstico.</div>';
        return;
      }

      grid.innerHTML = '';

      try{
        const prevRangeEnd = shiftYearISO(fechas[fechas.length - 1], -1);
        const prevYear = Number(prevRangeEnd.slice(0, 4));
        const prevRangeStart = `${prevYear}-01-01`;
        const urlPrev = `https://archive-api.open-meteo.com/v1/archive?latitude=${p.lat}&longitude=${p.lon}&start_date=${prevRangeStart}&end_date=${prevRangeEnd}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        const rPrev = await fetch(urlPrev);
        if (rPrev.ok){
          const dPrev = await rPrev.json();
          const prevDaily = dPrev.daily || {};
          const prevTimes = prevDaily.time || [];
          const prevTmax = prevDaily.temperature_2m_max || [];
          const prevTmin = prevDaily.temperature_2m_min || [];
          const prevRain = prevDaily.precipitation_sum || [];
          let accum = 0;
          prevTimes.forEach((iso, idx)=>{
            const rainMm = Number(prevRain[idx] ?? 0);
            accum += rainMm;
            prevByDate[iso] = {
              tmax: Number(prevTmax[idx]),
              tmin: Number(prevTmin[idx]),
              rain: rainMm
            };
            prevAccumByDate[iso] = accum;
          });
        }
      }catch(e){
        prevByDate = {};
        prevAccumByDate = {};
      }

      // Re-crear el acumulado anual (se borra al limpiar el grid)
      accumEl = document.createElement('span');
      accumEl.className = 'wx-accum';
      accumEl.id = 'wxAccum';
      accumEl.textContent = 'Acumulado anual: —';

      // Mostrar el acumulado arriba del contenedor de tarjetas de temperatura
      if (accumEl && !accumEl.isConnected) grid.appendChild(accumEl);

      fechas.forEach((iso, i)=>{
        const d = new Date(String(iso) + 'T12:00:00');
        const dayName = D[d.getDay()] || String(iso);
        const dayNum = d.getDate();
        const day = `${dayName} ${dayNum}`;
        const kind = kindFromCode(code[i]);
        const desc = W[code[i]] || '';
        const mm = Number(rain[i] ?? 0);
        const prevIso = shiftYearISO(iso, -1);
        const prev = prevByDate[prevIso];
        const prevAccum = prevAccumByDate[prevIso];
        const prevTempText = prev ? `${Math.round(prev.tmax)}° / ${Math.round(prev.tmin)}°` : '—';
        const prevRainText = prev ? `${prev.rain.toFixed(1)} mm` : '—';
        const prevAccumText = prevAccum !== undefined ? `${prevAccum.toFixed(1)} mm` : '—';

        const card = document.createElement('div');
        card.className = 'wx-card';
        card.innerHTML = `
          <div class="wx-day">${day}</div>
          <div class="wx-icon" title="${desc}">${iconSvg(kind)}</div>
          <div class="wx-temp">${Math.round(tmax[i])}° <small>/ ${Math.round(tmin[i])}°</small></div>
          <div class="wx-rain">${mm.toFixed(1)} mm</div>
          <div class="wx-prev">
            <div>Año ant: ${prevTempText}</div>
            <div>Lluvia: ${prevRainText}</div>
            <div>Acum: ${prevAccumText}</div>
          </div>
        `;
        grid.appendChild(card);
      });

      await cargarAcumuladoAnual(p);

      if (status) status.textContent = `Actualizado: ${new Date().toLocaleString()}`;
    } catch (e) {
      grid.innerHTML = '<div class="nota">No se pudo cargar el pronóstico. Revisa internet y permisos de ubicación.</div>';
      if (accumEl) accumEl.textContent = 'Acumulado anual: —';
    }
  }

  btnPerm.addEventListener('click', async ()=>{ try { await ensurePos(); await cargar(); } catch(e){} });
  btnUpd.addEventListener('click', cargar);
})();

// --- FIX (2026-01-20): al abrir la app, intenta mostrar temperatura actual (si ya hay permiso o coords cacheadas)
(function(){
  const run = async ()=>{
    const elTemp = document.getElementById('pnl-temp');
    if (elTemp){
      const t = localStorage.getItem('pecuario_temp_actual');
      elTemp.textContent = t ? (t + ' °C') : '—';
    }
    try{
      const raw = localStorage.getItem('pecuario_geo_cache');
      if (raw){
        const p = JSON.parse(raw);
        if (p && p.lat && p.lon) fetchTempActual(p);
      }
    }catch(e){}
  };
  window.addEventListener('load', ()=>{ setTimeout(run, 200); });
})();
