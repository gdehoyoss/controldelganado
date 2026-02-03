// ======================
// Configuración y utilidades varias
// ======================

// Perfil del rancho
  (function () {
    const form = document.getElementById('form-config');
    if (!form) return;
    const saved = getData('pecuario_config');
    if (saved && saved.length) {
      const cfg = saved[saved.length - 1];
      Object.keys(cfg).forEach(k => {
        if (form.elements[k]) form.elements[k].value = cfg[k];
      });
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const datos = new FormData(form);
      const obj = {};
      datos.forEach((val, key) => { obj[key] = val; });
      if (typeof validateCallback === 'function') { if (validateCallback(obj, form) === false) return; }

      const lista = getData('pecuario_config');
      lista.push(obj);
      setData('pecuario_config', lista);
      alert('Perfil guardado.');
      actualizarPanel();
      actualizarReportes();
    });
  })();

  // ======================
  // Razas: agregar
  // ======================
  const btnAgregarRaza = document.getElementById('btnAgregarRaza');
  if (btnAgregarRaza) {
    btnAgregarRaza.addEventListener('click', ()=> {
      const txt = document.getElementById('txtNuevaRaza');
      const raza = (txt.value || '').trim();
      if (!raza) return;
      const extra = getData('pecuario_razas_extra');
      extra.push(raza);
      setData('pecuario_razas_extra', extra);
      txt.value = '';
      refrescarRazasEnUI();
      alert('Raza agregada a las listas.');
    });
  }

  // ======================
  // Indicadores (Indicadores por corral)
  // ======================
  function hoyISODate(){
    const d = new Date();
    const z = (n)=> String(n).padStart(2,'0');
    return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
  }

  function refrescarCorralesPirnos(){
    const sel = document.getElementById('selCorralPirnos');
    if (!sel) return;
    const corr = getData('pecuario_corrales') || [];
    const seen = new Set();
    const items = [];
    corr.forEach(c=>{
      const pot = (c.potrero||'').trim();
      const id = (c.corralId||c.corral||'').trim();
      if (!id) return;
      const key = `${pot}|${id}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push({key, pot, id});
    });
    items.sort((a,b)=> (a.pot+a.id).localeCompare(b.pot+b.id,'es'));
    sel.innerHTML = '<option value="">Selecciona…</option>';
    items.forEach(it=>{
      const o = document.createElement('option');
      o.value = it.key;
      o.textContent = `${it.pot ? 'Potrero '+it.pot+' · ' : ''}Corral ${it.id}`;
      sel.appendChild(o);
    });
  }

  function pirnosResumen(r){
    const f = r.fecha || (r._fechaRegistro ? r._fechaRegistro.slice(0,10) : '');
    const cor = r.corralId ? `Corral ${r.corralId}` : (r.corralKey||'');
    const pot = r.potrero ? `Potrero ${r.potrero}` : '';
    const head = `${f || '-'} | ${pot ? pot+' | ' : ''}${cor}`;
    const infil = `Infil: 15cm ${r.infil15||'-'} / 30cm ${r.infil30||'-'}`;
    const suelo = `Desnudo: ${r.sueloDesnudoPct||'0'}% | Escarabajos: ${r.escarabajos||'-'}`;
    const hec = `Heces: ${r.heces||'-'} | Act. biol.: ${r.actividadDias||'-'} d`;
    const man = `Mantillo: nuevas esp. ${r.nuevasEspecies||'-'} | Forraje acostado ${r.forrajeAcostadoPct||'0'}%`;
    const rec = `Recuperación: ${r.recuperacionDias||'-'} d | Rumen: ${r.rumen||'-'}`;
    return `${head}\n${infil}\n${suelo}\n${hec}\n${man}\n${rec}`;
  }

  function renderPirnosList(filterKey){
    const cont = document.getElementById('lista-pirnos');
    if (!cont) return;
    const lista = getData('pecuario_pirnos') || [];
    const rows = filterKey ? lista.filter(r => (r.corralKey||'') === filterKey) : lista;
    if (!rows.length){
      cont.innerHTML = '<div>Sin registros.</div>';
      return;
    }
    cont.innerHTML = '';
    rows.slice().reverse().forEach(r=>{
      const div = document.createElement('div');
      div.className = 'item';
      div.style.whiteSpace = 'pre-line';
      div.textContent = pirnosResumen(r);
      cont.appendChild(div);
    });
  }

  // Form handler
  manejarFormulario(
    'form-pirnos',
    'pecuario_pirnos',
    null,
    null,
    (obj, lista) => {
      // Derivar potrero/corral desde corralKey
      const key = (obj.corralKey||'').trim();
      const parts = key.split('|');
      obj.potrero = (parts[0]||'').trim();
      obj.corralId = (parts[1]||'').trim();
      // Re-render list
      renderPirnosList(document.getElementById('selCorralPirnos')?.value || '');
      // reponer fecha por default
      const f = document.getElementById('pirnosFecha');
      if (f) f.value = hoyISODate();
    },
    (obj, form) => {
      if (!obj.fecha) obj.fecha = hoyISODate();
      if (!obj.corralKey) { alert('Selecciona un corral.'); return false; }
      return true;
    }
  );

  // UI wiring
  document.addEventListener('DOMContentLoaded', () => {
    const f = document.getElementById('pirnosFecha');
    if (f && !f.value) f.value = hoyISODate();
    refrescarCorralesPirnos();
    const sel = document.getElementById('selCorralPirnos');
    if (sel){
      sel.addEventListener('change', ()=> renderPirnosList(sel.value || ''));
    }
    const btnAll = document.getElementById('btnVerTodosPirnos');
    if (btnAll){
      btnAll.addEventListener('click', ()=> renderPirnosList(''));
    }
    // render initial
    renderPirnosList('');
  });


  // ======================
  // Suplementos (modal)
  // ======================
  const modal = document.getElementById('modalSupl');
  const btnAbrirSuplementos = document.getElementById('btnAbrirSuplementos');
  const btnNuevoSupl = document.getElementById('btnNuevoSupl');
  const btnCerrarSupl = document.getElementById('btnCerrarSupl');
  const btnBorrarSupl = document.getElementById('btnBorrarSupl');

  function abrirModalSupl() {
    if (!modal) return;
    modal.classList.add('activo');
    const form = document.getElementById('form-supl');
    if (form) {
      form.reset();
      // inicializar ingredientes
      if (typeof initIngredientesUI === 'function') initIngredientesUI();
    }
  }
  function cerrarModalSupl() {
    if (!modal) return;
    modal.classList.remove('activo');
  }

  if (btnAbrirSuplementos) {
    btnAbrirSuplementos.addEventListener('click', ()=> {
      // si el usuario estaba capturando un corral, pre-llenar
      const f = document.getElementById('form-corrales');
      const c = f ? (f.corralId.value || '') : '';
      abrirModalSupl();
    });
  }
  if (btnNuevoSupl) btnNuevoSupl.addEventListener('click', ()=> abrirModalSupl());
  if (btnCerrarSupl) btnCerrarSupl.addEventListener('click', ()=> cerrarModalSupl());
  if (modal) {
    modal.addEventListener('click', (e)=> {
      if (e.target === modal) cerrarModalSupl();
    });
  }

  function pintarSuplementos() {
    const cont = document.getElementById('lista-supl');
    if (!cont) return;
    const lista = getData('pecuario_suplementos');
    cont.innerHTML = '';
    if (!lista.length) {
      cont.innerHTML = '<div>Sin registros.</div>';
      return;
    }
    lista.slice().reverse().forEach(s => {
      const div = document.createElement('div');
      const cor = s.corralId ? ` | Corral ${s.corralId}` : '';
      div.textContent = `${s.nombre || '-'}${cor} | Temporada/Clima: ${s.temporada || '-'} | Frec: ${s.frecuencia || '-'}`;
      cont.appendChild(div);
    });
  }

  const formSupl = document.getElementById('form-supl');
  if (formSupl) {
    formSupl.addEventListener('submit', (e)=> {
      e.preventDefault();
      if (typeof syncIngredientesJSON === 'function') syncIngredientesJSON();
      const datos = new FormData(formSupl);
      const obj = {};
      datos.forEach((val, key) => { obj[key] = val; });
      if (typeof validateCallback === 'function') { if (validateCallback(obj, form) === false) return; }

      const lista = getData('pecuario_suplementos');
      obj._fechaRegistro = new Date().toISOString();
      lista.push(obj);
      setData('pecuario_suplementos', lista);
      pintarSuplementos();
      actualizarPanel();
      actualizarReportes();
      cerrarModalSupl();
      alert('Suplemento guardado.');
    });
  }

  if (btnBorrarSupl) {
    btnBorrarSupl.addEventListener('click', ()=> {
      if (confirm('¿Borrar TODOS los suplementos?')) {
        setData('pecuario_suplementos', []);
        pintarSuplementos();
        actualizarReportes();
      }
    });
  }

  // ======================
  // v40 — mejoras solicitadas

  function pintarToast(msg){
    const id='toastPecuarioGB';
    let el=document.getElementById(id);
    if(!el){
      el=document.createElement('div');
      el.id=id;
      el.style.position='fixed';
      el.style.left='50%';
      el.style.bottom='18px';
      el.style.transform='translateX(-50%)';
      el.style.background='rgba(17,24,39,0.92)';
      el.style.color='#fff';
      el.style.padding='10px 14px';
      el.style.borderRadius='12px';
      el.style.fontWeight='700';
      el.style.zIndex='9999';
      el.style.opacity='0';
      el.style.transition='opacity .2s ease';
      document.body.appendChild(el);
    }
    el.textContent=msg||'Listo';
    el.style.opacity='1';
    clearTimeout(el._t);
    el._t=setTimeout(()=>{ el.style.opacity='0'; }, 1800);
  }


  // ======================


  function refrescarCorralesEnUI(){
    // Para selects dependientes (ej. suplementos)
    const selPot = document.getElementById('selPotreroSupl');
    const selCor = document.getElementById('selCorralSupl');
    if (!selPot || !selCor) return;
    const p = selPot.value || '';
    const corr = getData('pecuario_corrales').filter(c => (c.potrero||'')===p && !(c.salida||'').trim());
    selCor.innerHTML = '<option value="">Selecciona…</option>';
    corr.forEach(c=>{
      const id = (c.corralId||'').trim();
      if (!id) return;
      const o = document.createElement('option');
      o.value = id;
      o.textContent = `Corral ${id}`;
      selCor.appendChild(o);
    });
 
    try { if (typeof refrescarCorralesPirnos === 'function') refrescarCorralesPirnos(); } catch(e) {}
 }

  // --------- Pesaje: ubicaciones (Potrero/Corral) + sexo automático ----------
  function refrescarUbicacionesEnUI(){
    const sel = document.getElementById('selUbicInd');
    if (!sel) return;
    const potreros = getData('pecuario_potreros').map(p => (p.letra||'').trim()).filter(Boolean);
    const corrales = getData('pecuario_corrales');
    sel.innerHTML = '';
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = 'Selecciona…';
    sel.appendChild(opt0);

    // Potreros
    potreros.forEach(l => {
      const o = document.createElement('option');
      o.value = `Potrero ${l}`;
      o.textContent = `Potrero ${l}`;
      sel.appendChild(o);
    });

    // Corrales
    corrales.forEach(c => {
      const p = (c.potrero||'').trim();
      const id = (c.corralId||'').trim();
      if (!p || !id) return;
      const o = document.createElement('option');
      o.value = `Potrero ${p} / Corral ${id}`;
      o.textContent = `Potrero ${p} / Corral ${id}`;
      sel.appendChild(o);
    });
  }

  function buscarAnimalPorArete(areteOficial){
    const a = (areteOficial||'').trim();
    if (!a) return null;
    const animales = getData('pecuario_animales');
    return animales.find(x => (x.areteOficial||'').trim() === a) || null;
  }

  (function initPesajeAuto(){
    const form = document.getElementById('form-pesaje-ind');
    if (!form) return;
    const inArete = form.querySelector('input[name="areteOficial"]');
    const inAreteR = form.querySelector('input[name="areteRancho"]');
    const selSexo = document.getElementById('selSexoPesInd');

    const sync = ()=>{
      const a = buscarAnimalPorArete(inArete ? inArete.value : '');
      if (!a) return;
      if (inAreteR && !inAreteR.value) inAreteR.value = a.areteRancho || '';
      if (selSexo && a.sexo) selSexo.value = a.sexo;
    };

    if (inArete) {
      inArete.addEventListener('change', sync);
      inArete.addEventListener('blur', sync);
    }
  })();

  // --------- GPS Corrales ----------
  window.puntosCorral = [];
  function drawPolygonOn(canvas, points){
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (!points || points.length < 2) return;

    // bbox
    let minLat=Infinity,maxLat=-Infinity,minLon=Infinity,maxLon=-Infinity;
    points.forEach(p=>{
      minLat=Math.min(minLat,p.lat); maxLat=Math.max(maxLat,p.lat);
      minLon=Math.min(minLon,p.lon); maxLon=Math.max(maxLon,p.lon);
    });
    const pad=20;
    const w=canvas.width-2*pad, h=canvas.height-2*pad;
    const dx = (maxLon-minLon) || 1e-9;
    const dy = (maxLat-minLat) || 1e-9;

    const xy = (p)=>{
      const x = pad + ((p.lon - minLon)/dx)*w;
      const y = pad + (1-((p.lat - minLat)/dy))*h;
      return {x,y};
    };

    // poly
    ctx.beginPath();
    points.forEach((p,i)=>{
      const {x,y}=xy(p);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.lineWidth=3;
    ctx.strokeStyle='rgba(209,0,0,0.85)';
    ctx.stroke();
    ctx.fillStyle='rgba(209,0,0,0.08)';
    ctx.fill();

    // vertices
    points.forEach((p,i)=>{
      const {x,y}=xy(p);
      ctx.beginPath();
      ctx.arc(x,y,4,0,Math.PI*2);
      ctx.fillStyle='rgba(17,24,39,0.85)';
      ctx.fill();
      ctx.font='12px system-ui';
      ctx.fillText(String(i+1), x+6, y-6);
    });
  }

  function renderPuntosCorral(){
    const lista = document.getElementById('listaPuntosCorral');
    const areaEl = document.getElementById('areaCorralM2');
    const canvas = document.getElementById('canvasCorral');
    if (lista) {
      if (!window.puntosCorral.length) lista.textContent = 'Sin puntos aún.';
      else lista.textContent = window.puntosCorral.map((p,i)=>`${i+1}. ${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}`).join(' | ');
    }
    if (areaEl) {
      const area = window.puntosCorral.length >=3 ? areaPoligonoM2(window.puntosCorral) : 0;
      areaEl.value = area ? String(Math.round(area)) : '';
    }
    if (canvas) drawPolygonOn(canvas, window.puntosCorral);

    recalcularCorralForm();
  }

  function limpiarPuntosCorral(){
    window.puntosCorral = [];
    renderPuntosCorral();
  }

  function recalcularCorralForm(){
    const form = document.getElementById('form-corrales');
    if (!form) return;
    const area = parseFloat((form.areaM2 && form.areaM2.value) ? form.areaM2.value : '0') || 0;
    const cab  = parseFloat(form.cabezas ? form.cabezas.value : '0') || 0;

    const m2El = form.m2PorCabeza;
    const haEl = form.cabezasHa;
    const densEl = form.densidadAuto;

    if (area>0 && cab>0) {
      const m2 = area/cab;
      const ha = cab*10000/area;
      if (m2El) m2El.value = m2.toFixed(1);
      if (haEl) haEl.value = ha.toFixed(0);
      if (densEl) densEl.value = ha.toFixed(0);
    } else {
      if (m2El) m2El.value = '';
      if (haEl) haEl.value = '';
      if (densEl) densEl.value = '';
    }
  }

  (function initGPSCorral(){
    const b1 = document.getElementById('btnPuntoGPSCorral');
    const b2 = document.getElementById('btnLimpiarGPSCorral');
    if (b1) b1.addEventListener('click', async ()=>{
      const p = await geoGetPoint();
      if (!p) return;
      window.puntosCorral.push(p);
      renderPuntosCorral();
    });
    if (b2) b2.addEventListener('click', limpiarPuntosCorral);

    const form = document.getElementById('form-corrales');
    if (form && form.cabezas) {
      form.cabezas.addEventListener('input', recalcularCorralForm);
    }
    renderPuntosCorral();
  })();

  // --------- Mapa de corrales dentro del potrero ----------
  (function initMapaCorrales(){
    const btn = document.getElementById('btnMapaCorrales');
    const info = document.getElementById('mapaCorralesInfo');
    const canvas = document.getElementById('canvasPotrero');
    const form = document.getElementById('form-potreros');
    if (!btn || !canvas || !form) return;

    btn.addEventListener('click', ()=>{
      const letra = (form.letra && form.letra.value) ? form.letra.value : '';
      if (!letra) { if (info) info.textContent = 'Selecciona primero el potrero.'; return; }
      const potPts = (window.puntos||[]).slice();
      if (potPts.length < 3) { if (info) info.textContent = 'Captura el polígono del potrero (GPS) para poder generar el mapa.'; return; }
      const corr = getData('pecuario_corrales').filter(c => (c.potrero||'')===letra && c.puntos && c.puntos.length>=3);

      // dibujar potrero base
      drawPolygonOn(canvas, potPts);

      // dibujar corrales encima, mismo bbox conjunto (recalcular bbox global)
      const allPts = potPts.concat(...corr.map(c=>c.puntos));
      let minLat=Infinity,maxLat=-Infinity,minLon=Infinity,maxLon=-Infinity;
      allPts.forEach(p=>{
        minLat=Math.min(minLat,p.lat); maxLat=Math.max(maxLat,p.lat);
        minLon=Math.min(minLon,p.lon); maxLon=Math.max(maxLon,p.lon);
      });
      const ctx = canvas.getContext('2d');
      const pad=20;
      const w=canvas.width-2*pad, h=canvas.height-2*pad;
      const dx=(maxLon-minLon)||1e-9, dy=(maxLat-minLat)||1e-9;
      const xy=(p)=>({x: pad + ((p.lon-minLon)/dx)*w, y: pad + (1-((p.lat-minLat)/dy))*h});

      corr.forEach((c,idx)=>{
        const pts=c.puntos;
        ctx.beginPath();
        pts.forEach((p,i)=>{
          const {x,y}=xy(p);
          if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.closePath();
        ctx.lineWidth=2;
        ctx.strokeStyle='rgba(17,24,39,0.8)';
        ctx.stroke();
        ctx.fillStyle='rgba(17,24,39,0.05)';
        ctx.fill();

        // etiqueta
        const c0=xy(pts[0]);
        ctx.font='12px system-ui';
        ctx.fillStyle='rgba(17,24,39,0.85)';
        ctx.fillText(`C${c.corralId||idx+1}`, c0.x+6, c0.y+12);
      });

      // guardar imagen dentro del registro del potrero (último por letra)
      try{
        const img = canvas.toDataURL('image/png');
        const potreros = getData('pecuario_potreros');
        for (let i=potreros.length-1; i>=0; i--){
          if ((potreros[i].letra||'')===letra){
            potreros[i].mapaCorralesImg = img;
            setData('pecuario_potreros', potreros);
            break;
          }
        }
      }catch(e){}

      const cabezas = corr.reduce((s,c)=> s + (parseFloat(c.cabezas||'0')||0), 0);
      if (info) info.textContent = `Mapa generado. Corrales con polígono: ${corr.length}. Cabezas (suma): ${cabezas}.`;
    });
  })();

  // --------- Suplementos: ingredientes en tabla + suministro por corral ----------
  function initIngredientesUI(){
    const wrap = document.getElementById('ingWrap');
    if (!wrap) return;
    wrap.innerHTML = '';
    addIngredienteRow(); addIngredienteRow();
  }

  function addIngredienteRow(nombre='', pct=''){
    const wrap = document.getElementById('ingWrap');
    if (!wrap) return;
    const row = document.createElement('div');
    row.className = 'fila-tres';
    row.style.gridTemplateColumns = '2fr 1fr auto';

    const a = document.createElement('div');
    a.innerHTML = `<label>Ingrediente</label><input class="ing-nombre" value="${(nombre||'').replace(/"/g,'&quot;')}" placeholder="Ej. Maíz" />`;
    const b = document.createElement('div');
    b.innerHTML = `<label>%</label><input type="number" step="0.1" class="ing-pct" value="${pct}" placeholder="0" />`;
    const c = document.createElement('div');
    c.innerHTML = `<label>&nbsp;</label><button type="button" class="btn-secundario">Quitar</button>`;
    c.querySelector('button').addEventListener('click', ()=>row.remove());

    row.appendChild(a); row.appendChild(b); row.appendChild(c);
    wrap.appendChild(row);
  }

  function syncIngredientesJSON(){
    const wrap = document.getElementById('ingWrap');
    const hid  = document.getElementById('ingredientesJSON');
    if (!wrap || !hid) return;
    const rows = [...wrap.querySelectorAll('.fila-tres')];
    const out = rows.map(r=>{
      const n = r.querySelector('.ing-nombre')?.value?.trim() || '';
      const p = parseFloat(r.querySelector('.ing-pct')?.value || '0') || 0;
      return n ? {ingrediente:n, porcentaje:p} : null;
    }).filter(Boolean);
    hid.value = JSON.stringify(out);
  }

  (function initSuplUI(){
    const btnAdd = document.getElementById('btnAddIng');
    const btnClr = document.getElementById('btnClearIng');
    if (btnAdd) btnAdd.addEventListener('click', ()=>addIngredienteRow());
    if (btnClr) btnClr.addEventListener('click', initIngredientesUI);

    // Catálogo -> select
    function refrescarCatalogo(){
      const sel = document.getElementById('selSuplCatalogo');
      if (!sel) return;
      const cat = getData('pecuario_suplementos');
      sel.innerHTML = '<option value="">Selecciona…</option>';
      cat.forEach(s=>{
        const clave = (s.clave||s.nombre||'').trim();
        if (!clave) return;
        const o = document.createElement('option');
        o.value = clave;
        o.textContent = `${clave} — ${s.nombre||''}`;
        sel.appendChild(o);
      });
    }

    function refrescarCorralesSupl(){
      const selPot = document.getElementById('selPotreroSupl');
      const selCor = document.getElementById('selCorralSupl');
      if (!selPot || !selCor) return;
      const p = selPot.value || '';
      const corr = getData('pecuario_corrales').filter(c => (c.potrero||'')===p && !(c.salida||'').trim());
      selCor.innerHTML = '<option value="">Selecciona…</option>';
      corr.forEach(c=>{
        const id = (c.corralId||'').trim();
        if (!id) return;
        const o = document.createElement('option');
        o.value = id;
        o.textContent = `Corral ${id}`;
        selCor.appendChild(o);
      });
    }

    function refrescarCabezas(){
      const selPot = document.getElementById('selPotreroSupl');
      const selCor = document.getElementById('selCorralSupl');
      const out = document.getElementById('suplCabezas');
      if (!selPot || !selCor || !out) return;
      const p = selPot.value || '';
      const cId = selCor.value || '';
      if (!p || !cId) { out.value=''; return; }
      const corr = getData('pecuario_corrales').slice().reverse().find(c => (c.potrero||'')===p && (c.corralId||'')===cId && !(c.salida||'').trim());
      out.value = corr ? (corr.cabezas || '') : '';
    }

    function renderSuministros(){
      const cont = document.getElementById('lista-supl-suministros');
      if (!cont) return;
      const regs = getData('pecuario_supl_suministros');
      if (!regs.length) { cont.innerHTML = '<div>Sin registros.</div>'; return; }
      const byP = {};
      regs.slice().reverse().forEach(r=>{
        const p = r.potrero || '—';
        byP[p] = byP[p] || [];
        byP[p].push(r);
      });
      cont.innerHTML = '';
      Object.keys(byP).sort().forEach(p=>{
        const h = document.createElement('div');
        h.innerHTML = `<b>Potrero ${p}</b>`;
        cont.appendChild(h);
        byP[p].forEach(r=>{
          const d = document.createElement('div');
          d.textContent = `${r.fecha||'-'} | Corral ${r.corralId||'-'} | Cabezas: ${r.cabezas||'-'} | ${r.suplClave||'-'} | ${r.cantidad||''}${r.unidad||''}/cab | ${r.frecuencia||''} | ${r.uso||''}`;
          cont.appendChild(d);
        });
        const sep = document.createElement('hr');
        sep.style.border='none'; sep.style.borderTop='1px solid #e5e7eb'; sep.style.margin='10px 0';
        cont.appendChild(sep);
      });
    }

    // listeners
    const selPot = document.getElementById('selPotreroSupl');
    const selCor = document.getElementById('selCorralSupl');
    if (selPot) selPot.addEventListener('change', ()=>{ refrescarCorralesSupl(); refrescarCabezas(); });
    if (selCor) selCor.addEventListener('change', refrescarCabezas);

    // suministro submit
    const form = document.getElementById('form-supl-suministro');
    if (form) {
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const datos = new FormData(form);
        const obj = {};
        datos.forEach((v,k)=>obj[k]=String(v||''));
// completar cabezas auto si falta
        if (!obj.cabezas) obj.cabezas = (document.getElementById('suplCabezas')?.value)||'';
        const lista = getData('pecuario_supl_suministros');
        lista.push(obj);
        setData('pecuario_supl_suministros', lista);
        pintarToast('Suministro guardado');
        form.reset();
        refrescarCorralesSupl();
        refrescarCabezas();
        renderSuministros();
        actualizarReportes();
      });
    }

    // sobre-escribir pintarSuplementos para catálogo
    window.pintarSuplementos = function(){
      const cont = document.getElementById('lista-supl');
      if (!cont) return;
      const lista = getData('pecuario_suplementos');
      cont.innerHTML = '';
      if (!lista.length) { cont.innerHTML = '<div>Sin suplementos.</div>'; refrescarCatalogo(); return; }
      lista.slice().reverse().forEach(s=>{
        const d = document.createElement('div');
        const clave = s.clave || s.nombre || '';
        const uso = s.uso ? ` | Uso: ${s.uso}` : '';
        d.textContent = `${clave} | ${s.nombre||''}${uso} | Temporada: ${s.temporada||''}`;
        cont.appendChild(d);
      });
      refrescarCatalogo();
      if (typeof refrescarSuplementosCorrales === 'function') refrescarSuplementosCorrales();
    };

    // inicial
    refrescarCatalogo();
    refrescarCorralesSupl();
    refrescarCabezas();
    renderSuministros();
  })();

  // --------- Usuarios y permisos ----------
  const MODS = [
    {id:'panel', label:'Panel'},
    {id:'animales', label:'Ganado'},
    {id:'potreros', label:'Potreros y Corrales'},
    {id:'repro', label:'Reproducción y partos'},
    {id:'sanidad', label:'Sanidad'},    {id:'conta', label:'Contabilidad'},
    {id:'seguridad', label:'Registros del Velador'},
    {id:'maquinaria', label:'Maquinaria y equipo'},
    {id:'actividades', label:'Actividades'},
    {id:'reportes', label:'Reportes'},
    {id:'config', label:'Perfil del rancho'}
  ];

  function normalizeUsuarios(arr){
    const baseRoles = new Set(["Propietario","Gerente","Supervisor","Vaquero","Auxiliar","Otro"]);
    const list = Array.isArray(arr)
      ? arr
      : (arr && typeof arr === 'object')
        ? Object.values(arr)
        : [];
    return list.map((u)=>{
      const uu = Object.assign({}, u||{});
      let r = String(uu.rol||'').trim();
      // Migración: "Consulta" se trata como "Otro"
      if (r === 'Consulta') r = 'Otro';

      if (!uu.rolBase){
        uu.rolBase = baseRoles.has(r) ? r : 'Otro';
      }

      // Si rolBase no es "Otro", el rol visible = rolBase
      if (uu.rolBase !== 'Otro'){
        uu.rol = uu.rolBase;
      } else {
        // "Otro": conserva nombre personalizado si existe; si no, usa "Otro"
        const custom = String(uu.rol||'').trim();
        uu.rol = (custom && custom !== 'Consulta') ? custom : 'Otro';
      }

      return uu;
    });
  }

  const PERSONAL_KEY = 'pecuario_personal_rancho';

  function getUsuarios(){ return normalizeUsuarios(getData('pecuario_usuarios') || []); }
  function setUsuarios(u){ setData('pecuario_usuarios', normalizeUsuarios(u)); }
  function getPersonalRancho(){ return getData(PERSONAL_KEY) || []; }

  function renderPermisosCheckboxes(){
    const cont = document.getElementById('chkPermisos');
    if (!cont) return;
    cont.innerHTML = '';
    MODS.forEach(m=>{
      const row = document.createElement('div');
      row.style.display='inline-flex';
      row.style.alignItems='center';
      row.style.gap='8px';
      row.style.margin='6px 12px 6px 0';
      row.innerHTML = `<input type="checkbox" id="perm_${m.id}" value="${m.id}" checked> <label for="perm_${m.id}">${m.label}</label>`;
      cont.appendChild(row);
    });
  }

  function renderListaUsuarios(){
    const cont = document.getElementById('lista-usuarios');
    if (!cont) return;
    const usuarios = getUsuarios();
    if (!usuarios.length) { cont.innerHTML = '<div>Sin usuarios.</div>'; return; }
    cont.innerHTML = '';
    usuarios.slice().reverse().forEach(u=>{
      const d = document.createElement('div');
      const perms = (u.permisos||[]).join(', ');
      const idTxt = u.personalId ? ` | ID: ${u.personalId}` : '';
      const puestoTxt = u.puesto ? ` | Puesto: ${u.puesto}` : '';
      const estadoTxt = (u.activo === 'Activo') ? 'Alta autorizada' : 'Baja autorizada';
      d.textContent = `${u.nombre} | ${u.rol}${idTxt}${puestoTxt} | Estado: ${estadoTxt} | Permisos: ${perms}`;
      cont.appendChild(d);
    });
  }

  function renderPersonalUsuariosSelect(){
    const sel = document.getElementById('usuario-personal');
    const info = document.getElementById('usuarioPersonalInfo');
    if (!sel) return;
    const personal = getPersonalRancho();
    sel.innerHTML = '<option value="">Selecciona…</option>';
    personal.forEach(p=>{
      const o = document.createElement('option');
      o.value = p.usuario;
      o.textContent = p.usuario;
      sel.appendChild(o);
    });
    if (!personal.length && info){
      info.textContent = 'No hay personal registrado. Captúralo en Responsabilidades y tareas > Personal del Rancho.';
    }
    const actualizarInfo = ()=>{
      if (!info) return;
      const rec = personal.find(p=>p.usuario===sel.value);
      if (!rec){
        info.textContent = personal.length
          ? 'ID: — | Puesto: —'
          : 'No hay personal registrado. Captúralo en Responsabilidades y tareas > Personal del Rancho.';
        return;
      }
      info.textContent = `ID: ${rec.identificacion||'—'} | Puesto: ${rec.puesto||'—'}`;
    };
    sel.onchange = actualizarInfo;
    actualizarInfo();
  }

  function asegurarUsuarioDefault(){
    const u = getUsuarios();
    if (u.length) return;
    const all = MODS.map(m=>m.id);
    setUsuarios([{nombre:'Gilberto', rol:'Propietario', activo:'Activo', permisos: all}]);
    localStorage.setItem('pecuario_usuario_actual', 'Gilberto');
  }

  function llenarUsuariosHeader(){
    const sel = document.getElementById('selUsuario');
    const lbl = document.getElementById('lblRol');
    if (!sel || !lbl) return;
    const usuarios = getUsuarios().filter(u=> (u.activo==='Activo' || u.activo==='Sí'));
    sel.innerHTML = '';
    usuarios.forEach(u=>{
      const o=document.createElement('option');
      o.value=u.nombre;
      o.textContent=u.nombre;
      sel.appendChild(o);
    });
    const actual = localStorage.getItem('pecuario_usuario_actual') || (usuarios[0]?.nombre||'');
    if (actual) sel.value = actual;
    const uAct = usuarios.find(x=>x.nombre===sel.value) || usuarios[0];
    lbl.textContent = uAct ? uAct.rol : '—';

    sel.addEventListener('change', ()=>{
      localStorage.setItem('pecuario_usuario_actual', sel.value);
      const uu = getUsuarios().find(x=>x.nombre===sel.value);
      lbl.textContent = uu ? uu.rol : '—';
      aplicarPermisos();
      if (typeof poblarSelectUsuariosAsignacion === 'function') poblarSelectUsuariosAsignacion();
      if (window.renderTareasUI) window.renderTareasUI();
    });
  }

  
  function aplicarPermisosPanel(permisos){
    // Oculta tarjetas del panel si el usuario no tiene permiso del módulo asociado
    document.querySelectorAll('#mod-panel .tarjetas-grid .tarjeta[data-perm]').forEach(card=>{
      const need = card.getAttribute('data-perm');
      card.style.display = permisos.includes(need) ? '' : 'none';
    });
  }

  function aplicarPermisos(){
    const nombre = localStorage.getItem('pecuario_usuario_actual') || '';
    const u = getUsuarios().find(x=>x.nombre===nombre) || null;
    const permisos = u ? (u.permisos||[]) : MODS.map(m=>m.id);

    document.querySelectorAll('nav button[data-modulo]').forEach(b=>{
      const id = b.getAttribute('data-modulo');
      const allow = (id === 'panel') || permisos.includes(id);
      b.style.display = allow ? '' : 'none';
    });

    aplicarPermisosPanel(permisos);
    aplicarPermisosReportes();
  }

  (function initUsuarios(){
    asegurarUsuarioDefault();
    renderPermisosCheckboxes();
    renderListaUsuarios();
    renderPersonalUsuariosSelect();
    llenarUsuariosHeader();
    aplicarPermisos();

    const form = document.getElementById('form-usuarios');
    if (!form) return;

    // Rol: 'Otro' con nombre editable
    const selRol = form.querySelector('select[name="rol"]');
    const wrapOtro = document.getElementById('rolOtroWrap');
    const inpOtro = form.querySelector('input[name="rolOtro"]');
    const toggleOtro = ()=>{
      const v = selRol ? selRol.value : '';
      const show = (v === 'Otro');
      if (wrapOtro) wrapOtro.style.display = show ? '' : 'none';
      if (inpOtro){
        inpOtro.required = show;
        if (!show) inpOtro.value = '';
      }
    };
    if (selRol) selRol.addEventListener('change', toggleOtro);
    toggleOtro();

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const datos = new FormData(form);
      const obj = {};
      datos.forEach((v,k)=>obj[k]=String(v||''));
      const personal = getPersonalRancho();
      const rec = personal.find(p=>p.usuario===obj.nombre);
      if (!rec){
        alert('Selecciona un trabajador capturado en Personal del Rancho.');
        return;
      }
      obj.personalId = rec.identificacion || '';
      obj.puesto = rec.puesto || '';
      // Normalizar rol (con 'Otro' editable)
      const rolSel = (obj.rol||'').trim();
      const rolOtro = (obj.rolOtro||'').trim();
      if (rolSel === 'Otro'){
        if (!rolOtro){ alert('Seleccionaste "Otro". Escribe el nombre del rol.'); return; }
        obj.rolBase = 'Otro';
        obj.rol = rolOtro;
      } else {
        obj.rolBase = rolSel;
        obj.rol = rolSel;
      }
      delete obj.rolOtro;

      const perms = [];
      MODS.forEach(m=>{
        const chk = document.getElementById('perm_'+m.id);
        if (chk && chk.checked) perms.push(m.id);
      });
      obj.permisos = perms;
      const usuarios = getUsuarios();
      const idx = usuarios.findIndex(u=>u.nombre===obj.nombre);
      if (idx >= 0){
        usuarios[idx] = Object.assign({}, usuarios[idx], obj);
      } else {
        usuarios.push(obj);
      }
      setUsuarios(usuarios);
      pintarToast('Usuario guardado');
      form.reset();
      renderPermisosCheckboxes();
      renderListaUsuarios();
      renderPersonalUsuariosSelect();
      llenarUsuariosHeader();
      aplicarPermisos();
      if (typeof poblarSelectUsuariosAsignacion === 'function') poblarSelectUsuariosAsignacion();
      if (window.renderTareasUI) window.renderTareasUI();
    });
  })();


  
  
