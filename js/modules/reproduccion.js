  function initReproProporciones(){
    const form = document.getElementById('form-repro');
    if (!form) return;

    // crea selects de proporción debajo de cada select de raza/cruza
    const razaH = form.querySelector('select[name="razaH"]');
    const cruzaH1 = form.querySelector('select[name="cruzaH1"]');
    const cruzaH2 = form.querySelector('select[name="cruzaH2"]');
    const razaM = form.querySelector('select[name="razaM"]');
    const cruzaM1 = form.querySelector('select[name="cruzaM1"]');
    const cruzaM2 = form.querySelector('select[name="cruzaM2"]');

    const pH = ensurePropSelect(razaH, 'pHpre');
    const pH1 = ensurePropSelect(cruzaH1, 'pH1');
    const pH2 = ensurePropSelect(cruzaH2, 'pH2');
    const pM = ensurePropSelect(razaM, 'pMpre');
    const pM1 = ensurePropSelect(cruzaM1, 'pM1');
    const pM2 = ensurePropSelect(cruzaM2, 'pM2');

    function setDefaultProps(which){
      // which: 'H' or 'M'
      const selPre = which==='H' ? razaH : razaM;
      const sel1 = which==='H' ? cruzaH1 : cruzaM1;
      const sel2 = which==='H' ? cruzaH2 : cruzaM2;
      const pPre = which==='H' ? pH : pM;
      const pp1 = which==='H' ? pH1 : pM1;
      const pp2 = which==='H' ? pH2 : pM2;
      if (!pPre) return;
      const has1 = sel1 && sel1.value;
      const has2 = sel2 && sel2.value;
      if (!has1 && !has2){
        pPre.value = '1/1';
        if (pp1) pp1.value = '';
        if (pp2) pp2.value = '';
      } else if (has1 && !has2){
        pPre.value = '1/2';
        if (pp1) pp1.value = '1/2';
        if (pp2) pp2.value = '';
      } else {
        pPre.value = '1/2';
        if (pp1) pp1.value = '1/4';
        if (pp2) pp2.value = '1/4';
      }
    }

    function sumProps(selPre, sel1, sel2, pPre, p1, p2){
      const out = {};
      const add = (breed, prop)=>{
        const b = String(breed||'').trim();
        if (!b) return;
        out[b] = (out[b]||0) + prop;
      };
      const total = propToNum(pPre?.value) + propToNum(p1?.value) + propToNum(p2?.value);
      const falt = Math.max(0, 1 - total);
      add(selPre?.value, propToNum(pPre?.value));
      add(sel1?.value, propToNum(p1?.value));
      add(sel2?.value, propToNum(p2?.value));
      if (falt > 1e-6) add('Otras', falt);
      return out;
    }

    function calcCria(){
      const ph = sumProps(razaH, cruzaH1, cruzaH2, pH, pH1, pH2);
      const pm = sumProps(razaM, cruzaM1, cruzaM2, pM, pM1, pM2);

      // 50/50
      const all = {};
      Object.keys(ph).forEach(k=> all[k] = (all[k]||0) + ph[k]*0.5);
      Object.keys(pm).forEach(k=> all[k] = (all[k]||0) + pm[k]*0.5);

      const ranked = Object.entries(all).sort((a,b)=>b[1]-a[1]);
      const top = ranked.filter(x=>x[0] && x[0]!=='').slice(0,3);

      const setVal = (name, breed, propNum)=>{
        const sel = form.querySelector(`select[name="${name}"]`);
        if (sel && breed) sel.value = breed;
        const propSel = form.querySelector(`select[data-prop="${name}"]`);
        if (propSel) propSel.value = numToBestProp(propNum||0);
      };

      // añade campos de cría si no existen: crea al final del form
      let criaBox = document.getElementById('criaBoxProps');
      if (!criaBox){
        criaBox = document.createElement('div');
        criaBox.id = 'criaBoxProps';
        criaBox.className = 'tarjeta';
        criaBox.style.background='#fff';
        criaBox.style.border='1px solid #e5e7eb';
        criaBox.style.marginTop='12px';
        criaBox.innerHTML = `
          <h3 style="margin:0 0 8px;">Cría (estimación de cruza)</h3>
          <div class="fila-tres">
            <div>
              <label>Cruza preponderante</label>
              <select name="razaC" class="selRaza"></select>
              <select data-prop="razaC" class="selProp"></select>
            </div>
            <div>
              <label>Cruza 1</label>
              <select name="cruzaC1" class="selRaza"></select>
              <select data-prop="cruzaC1" class="selProp"></select>
            </div>
            <div>
              <label>Cruza 2</label>
              <select name="cruzaC2" class="selRaza"></select>
              <select data-prop="cruzaC2" class="selProp"></select>
            </div>
          </div>
          <p class="nota">La suma siempre se normaliza a 1. Si falta proporción, se asigna a “Otras”.</p>
        `;
        form.appendChild(criaBox);
        // llena razas
        refrescarRazasEnUI();
        // llena props
        criaBox.querySelectorAll('select.selProp').forEach(sel=>{
          sel.innerHTML = '<option value="">Proporción…</option>' + PROPS.map(p=>`<option>${p}</option>`).join('');
        });
      }

      // set values
      const b0 = top[0] ? top[0][0] : '';
      const p0 = top[0] ? top[0][1] : 0;
      const b1 = top[1] ? top[1][0] : '';
      const p1n = top[1] ? top[1][1] : 0;
      const b2 = top[2] ? top[2][0] : '';
      const p2n = top[2] ? top[2][1] : 0;

      const selC = criaBox.querySelector('select[name="razaC"]'); if (selC) selC.value = b0 || '';
      const selC1 = criaBox.querySelector('select[name="cruzaC1"]'); if (selC1) selC1.value = b1 || '';
      const selC2 = criaBox.querySelector('select[name="cruzaC2"]'); if (selC2) selC2.value = b2 || '';
      const pr0 = criaBox.querySelector('select[data-prop="razaC"]'); if (pr0) pr0.value = numToBestProp(p0);
      const pr1 = criaBox.querySelector('select[data-prop="cruzaC1"]'); if (pr1) pr1.value = numToBestProp(p1n);
      const pr2 = criaBox.querySelector('select[data-prop="cruzaC2"]'); if (pr2) pr2.value = numToBestProp(p2n);
    }

    // eventos para recalcular
    [razaH,cruzaH1,cruzaH2,razaM,cruzaM1,cruzaM2,pH,pH1,pH2,pM,pM1,pM2].filter(Boolean).forEach(el=>{
      el.addEventListener('change', ()=>{ calcCria(); });
    });

    // autofill desde Cabezas al escribir aretes
    const inpV = form.querySelector('input[name="vientre"]');
    const inpT = form.querySelector('input[name="toro"]');
    function fillFromArete(which){
      const a = which==='H' ? (inpV?.value||'').trim() : (inpT?.value||'').trim();
      const cab = getCabeza(a);
      if (!cab) return;
      if (which==='H'){
        if (razaH) razaH.value = cab.razaPre || '';
        if (cruzaH1) cruzaH1.value = cab.cruza1 || '';
        if (cruzaH2) cruzaH2.value = cab.cruza2 || '';
        setDefaultProps('H');
      } else {
        if (razaM) razaM.value = cab.razaPre || '';
        if (cruzaM1) cruzaM1.value = cab.cruza1 || '';
        if (cruzaM2) cruzaM2.value = cab.cruza2 || '';
        setDefaultProps('M');
      }
      calcCria();
    }
    if (inpV) inpV.addEventListener('change', ()=> fillFromArete('H'));
    if (inpT) inpT.addEventListener('change', ()=> fillFromArete('M'));

    // defaults iniciales
    setDefaultProps('H');
    setDefaultProps('M');
    calcCria();
  }

// (Cabezas) inicialización manejada por initCabezasModule()

  // ======================
  // Pesajes: Individual
  // ======================
  function ultimoPesajeAnimal(arete) {
    const lista = getData('pecuario_pesaje_ind');
    const matches = lista.filter(x => (x.areteOficial||'') === (arete||'') && x.peso);
    if (matches.length < 2) return null;
    // último previo (antes del último)
    const last = matches[matches.length - 1];
    const prev = matches[matches.length - 2];
    const delta = (parseFloat(last.peso||0) - parseFloat(prev.peso||0));
    return { last, prev, delta };
  }

  manejarFormulario(
    'form-pesaje-ind',
    'pecuario_pesaje_ind',
    'lista-pesaje-ind',
    (p) => {
      const w = parseFloat(p.peso||0);
      const arete = p.areteOficial || '-';
      const deltaObj = ultimoPesajeAnimal(p.areteOficial);
      const deltaTxt = deltaObj ? ` | Δ vs último: ${deltaObj.delta.toFixed(1)} kg` : '';
      return `Arete ${arete} | Fecha: ${p.fecha || '-'} | Peso: ${w ? w.toFixed(1) : ''} kg | Ubicación: ${p.ubicacion || '-'}${deltaTxt}`;
    },
    (obj) => {
      const el = document.getElementById('notaDeltaInd');
      const info = ultimoPesajeAnimal(obj.areteOficial);
      if (el) {
        if (info) el.textContent = `Ganancia/Pérdida vs último pesaje: ${info.delta.toFixed(1)} kg (Arete ${obj.areteOficial}).`;
        else el.textContent = 'Primer pesaje de este arete (no hay comparación aún).';
      }
    }
  );

  // ======================
  // Pesajes: Grupo
  // ======================
  const formPesGrupo = document.getElementById('form-pesaje-grupo');
  if (formPesGrupo) {
    formPesGrupo.addEventListener('input', () => {
      const cabezas = parseFloat(formPesGrupo.cabezas.value || '0') || 0;
      const total = parseFloat(formPesGrupo.pesoTotal.value || '0') || 0;
      const prom = (cabezas > 0) ? (total / cabezas) : 0;
      formPesGrupo.pesoProm.value = prom ? prom.toFixed(1) : '';

      // delta promedio vs último del mismo "grupo"
      const g = formPesGrupo.grupo.value || '';
      const lista = getData('pecuario_pesaje_grupo').filter(x => (x.grupo||'') === g && x.pesoProm);
      if (lista.length) {
        const last = lista[lista.length - 1];
        const lastProm = parseFloat(last.pesoProm||0) || 0;
        const delta = prom - lastProm;
        formPesGrupo.deltaProm.value = (cabezas>0 && total>0 && g) ? delta.toFixed(1) : '';
      } else {
        formPesGrupo.deltaProm.value = '';
      }
    });
  }

  manejarFormulario(
    'form-pesaje-grupo',
    'pecuario_pesaje_grupo',
    'lista-pesaje-grupo',
    (p) => {
      const prom = parseFloat(p.pesoProm||0) || ((parseFloat(p.pesoTotal||0) || 0) / (parseFloat(p.cabezas||0) || 1));
      const delta = parseFloat(p.deltaProm||0);
      const deltaTxt = (p.deltaProm !== '' && !isNaN(delta)) ? ` | Δ prom: ${delta.toFixed(1)} kg/cab` : '';
      return `Grupo ${p.grupo || '-'} | Fecha: ${p.fecha || '-'} | Potrero: ${p.potrero || '-'} | Corral: ${p.corral || '-'} | Cabezas: ${p.cabezas || ''} | Total: ${p.pesoTotal || ''} kg | Prom: ${prom.toFixed(1)} kg/cab${deltaTxt}`;
    },
    (obj) => {
      const el = document.getElementById('notaDeltaGrupo');
      if (!el) return;
      if (obj.deltaProm) el.textContent = `Ganancia/Pérdida promedio vs último del grupo: ${obj.deltaProm} kg/cabeza.`;
      else el.textContent = 'Primer pesaje de este grupo (no hay comparación aún).';
    }
  );

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

  // Potreros storage
  manejarFormulario(
    'form-potreros',
    'pecuario_potreros',
    'lista-potreros',
    (p) => {
      const letra = p.letra || p.nombre || '-';
      const area = parseFloat(p.areaM2 || '0') || 0;
      const pts = (p.puntos && p.puntos.length) ? p.puntos.length : 0;
      const corrales = getData('pecuario_corrales').filter(c => (c.potrero||'') === letra && !(c.salida||'').trim());
      const cabezas = corrales.reduce((s,c)=> s + (parseFloat(c.cabezas||'0')||0), 0);
      const dens = (area>0 && cabezas>0) ? (cabezas * 10000 / area).toFixed(0) : '';
      const densTxt = dens ? ` | Densidad est.: ${dens} cab/ha` : '';
      return `Potrero ${letra} | Área: ${area ? area + ' m²' : '—'} | Puntos GPS: ${pts}${densTxt} | ${p.nombre ? 'Nombre: ' + p.nombre : ''}`;
    },
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
      pintarLista('pecuario_potreros', 'lista-potreros', (p) => {
      const letra = p.letra || p.nombre || '-';
      const area = parseFloat(p.areaM2 || '0') || 0;
      const pts = (p.puntos && p.puntos.length) ? p.puntos.length : 0;
      const corrales = getData('pecuario_corrales').filter(c => (c.potrero||'') === letra && !(c.salida||'').trim());
      const cabezas = corrales.reduce((s,c)=> s + (parseFloat(c.cabezas||'0')||0), 0);
      const dens = (area>0 && cabezas>0) ? (cabezas * 10000 / area).toFixed(0) : '';
      const densTxt = dens ? ` | Densidad est.: ${dens} cab/ha` : '';
      return `Potrero ${letra} | Área: ${area ? area + ' m²' : '—'} | Puntos GPS: ${pts}${densTxt} | ${p.nombre ? 'Nombre: ' + p.nombre : ''}`;
    });
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
    (c) => {
      const area = c.areaM2 || c.area || '';
      const cab = c.cabezas || '';
      const dens = c.cabezasHa || c.densidadAuto || c.densidad || '';
      return `Corral ${c.corralId || '-'} | Potrero ${c.potrero || '-'} | Área: ${area ? area + ' m²' : '-'} | Cabezas: ${cab || '-'} | Cab/ha: ${dens || '-'} | Grupo: ${c.grupo || '-'} | Entrada: ${c.entrada || '-'} | Salida: ${c.salida || ''}`;
    },
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
      pintarLista('pecuario_corrales', 'lista-corrales', (c) => {
        const area = c.areaM2 || c.area || '';
        const cab = c.cabezas || '';
        const dens = c.cabezasHa || c.densidadAuto || c.densidad || '';
        return `Corral ${c.corralId || '-'} | Potrero ${c.potrero || '-'} | Área: ${area ? area + ' m²' : '-'} | Cabezas: ${cab || '-'} | Cab/ha: ${dens || '-'} | Grupo: ${c.grupo || '-'} | Entrada: ${c.entrada || '-'} | Salida: ${c.salida || ''}`;
      });

      if (typeof limpiarPuntosCorral === 'function') limpiarPuntosCorral();
    }
  );

  // ======================
  // Reproducción: calcular cruza cría y fecha probable
  // ======================
  function calcCruzaCria(form) {
    const partes = [];
    const add = (x)=>{ if (x && x.trim()) partes.push(x.trim()); };
    add(form.razaH.value); add(form.cruzaH1.value); add(form.cruzaH2.value);
    add('×');
    add(form.razaM.value); add(form.cruzaM1.value); add(form.cruzaM2.value);
    form.cruzaCria.value = partes.filter(Boolean).join(' ');
    if (form.cruzaPreH) form.cruzaPreH.value = form.razaH.value || '';
    if (form.cruzaPreM) form.cruzaPreM.value = form.razaM.value || '';
  }

  const formRepro = document.getElementById('form-repro');
  if (formRepro) {
    formRepro.addEventListener('change', ()=> calcCruzaCria(formRepro));
    formRepro.addEventListener('input', ()=> calcCruzaCria(formRepro));
  }
  const btnCalcularProb = document.getElementById('btnCalcularProb');
  if (btnCalcularProb && formRepro) {
    btnCalcularProb.addEventListener('click', ()=> {
      const fe = formRepro.fechaEmp.value;
      if (!fe) return alert('Primero captura la fecha de empadre.');
      const d = new Date(fe + 'T00:00:00');
      d.setDate(d.getDate() + 283);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      formRepro.fechaProb.value = `${yyyy}-${mm}-${dd}`;
    });
  }

  manejarFormulario(
    'form-repro',
    'pecuario_repro',
    'lista-repro',
    (r) => `Hembra ${r.vientre || '-'} (${r.razaH || '-'}) | Toro: ${r.toro || '-'} (${r.razaM || '-'}) | Empadre: ${r.fechaEmp || '-'} | Prob: ${r.fechaProb || '-'} | Parto: ${r.fechaParto || '-'} | Cría: ${r.sexoCria || '-'} ${r.pesoCria || ''} kg`,
    null
  );

  // ======================
  // Sanidad, Clima, Contabilidad, Seguridad, Maquinaria, Actividades
  // ======================
  manejarFormulario(
    'form-sanidad',
    'pecuario_sanidad',
    'lista-sanidad',
    (s) => `Arete ${s.arete || '-'} | ${s.tipo || ''} | Enf: ${s.enfermedad || '-'} | Tratamiento: ${s.tratamiento || '-'}`,
    null,
    (obj, form) => {
      // Enfermedad / motivo: mismo catálogo que en Nacimientos (con "Otro" editable)
      const cat = (obj.enfermedadCat || '').trim();
      const otro = (obj.enfermedadOtro || '').trim();

      if (cat === 'Otro') {
        if (!otro) {
          alert('Seleccionaste "Otro". Especifica la enfermedad/motivo.');
          return false;
        }
        obj.enfermedad = otro;
      } else if (cat) {
        obj.enfermedad = cat;
      } else {
        // Si no selecciona, se deja vacío (compatible con registros anteriores)
        obj.enfermedad = (obj.enfermedad || '').trim();
      }
      return true;
    }
  );

  // ===== CONTABILIDAD (v2: Ingresos/Egresos contra Caja y Bancos) =====
  const CONTA_LEDGER_KEY  = 'pecuario_conta_ledger';
  const CONTA_OPEN_KEY    = 'pecuario_conta_opening';
  const CONTA_CLOSED_KEY  = 'pecuario_conta_closed';

  const CONTA_ACCOUNTS = [
    // ===================== CUENTAS DE RESULTADOS — INGRESOS
    { tipo:'Ingreso', grupo:'Resultados', code:'RV-01', name:'Venta de becerros' },
    { tipo:'Ingreso', grupo:'Resultados', code:'RV-02', name:'Venta de Vaquillas' },
    { tipo:'Ingreso', grupo:'Resultados', code:'RV-03', name:'Venta de Novillos' },
    { tipo:'Ingreso', grupo:'Resultados', code:'RV-04', name:'Venta de Vientres' },
    { tipo:'Ingreso', grupo:'Resultados', code:'RV-05', name:'Venta de Toretes' },
    { tipo:'Ingreso', grupo:'Resultados', code:'RV-06', name:'Venta de Toros' },
    { tipo:'Ingreso', grupo:'Resultados', code:'RV-07', name:'Venta de insumos' },
    { tipo:'Ingreso', grupo:'Resultados', code:'RV-10', name:'Ingresos Varios' },
    { tipo:'Ingreso', grupo:'Resultados', code:'RV-12', name:'Ingresos por intereses' },
    { tipo:'Ingreso', grupo:'Resultados', code:'RV-13', name:'Apoyos y subsidios' },

    // ===================== CUENTAS DE BALANCE — INGRESOS (entradas de efectivo)
    { tipo:'Ingreso', grupo:'Balance', code:'BP-01',  name:'Patrimonio', balanceClass:'Equity' },
    { tipo:'Ingreso', grupo:'Balance', code:'BPB-02', name:'Préstamos Bancarios', balanceClass:'Liability' },

    // (Opcional) Entradas por recuperación/venta de activos: si se usan, disminuyen el saldo del activo
    { tipo:'Ingreso', grupo:'Balance', code:'BA-01',  name:'Inventario de Animales', balanceClass:'Asset' },
    { tipo:'Ingreso', grupo:'Balance', code:'BME-01', name:'Maquinaria y Equipo', balanceClass:'Asset' },
    { tipo:'Ingreso', grupo:'Balance', code:'BCI-01', name:'Corrales e Instalaciones', balanceClass:'Asset' },
    { tipo:'Ingreso', grupo:'Balance', code:'BTE-01', name:'Terrenos y Edificios', balanceClass:'Asset' },
    { tipo:'Ingreso', grupo:'Balance', code:'BV-03',  name:'Otros Activos', balanceClass:'Asset' },

    // ===================== CUENTAS DE RESULTADOS — EGRESOS
    { tipo:'Egreso', grupo:'Resultados', code:'RGP-01', name:'Gastos Nóminas' },
    { tipo:'Egreso', grupo:'Resultados', code:'RGP-02', name:'Prestaciones a Trabajadores' },
    { tipo:'Egreso', grupo:'Resultados', code:'RGP-03', name:'Gastos de traslado personal' },
    { tipo:'Egreso', grupo:'Resultados', code:'RGP-04', name:'Alimentos al personal' },
    { tipo:'Egreso', grupo:'Resultados', code:'RGP-05', name:'Otros - Personal' },

    { tipo:'Egreso', grupo:'Resultados', code:'RGV-01', name:'Gastos de viaje' },

    { tipo:'Egreso', grupo:'Resultados', code:'RGM-01', name:'Mantenimiento: Maquinaria y equipo' },
    { tipo:'Egreso', grupo:'Resultados', code:'RGM-02', name:'Mantenimiento: Corrales y cercas' },
    { tipo:'Egreso', grupo:'Resultados', code:'RGM-03', name:'Mantenimiento: Bodegas y casas' },
    { tipo:'Egreso', grupo:'Resultados', code:'RGM-04', name:'Mantenimiento: Equipo de riego y bombas' },
    { tipo:'Egreso', grupo:'Resultados', code:'RGM-05', name:'Mantenimiento: Otros' },

    { tipo:'Egreso', grupo:'Resultados', code:'RGAG-01', name:'Gastos alimento Ganado' },
    { tipo:'Egreso', grupo:'Resultados', code:'RGMD-01', name:'Gastos Medicamentos' },
    { tipo:'Egreso', grupo:'Resultados', code:'RGH-01',  name:'Gastos Herramientas' },
    { tipo:'Egreso', grupo:'Resultados', code:'RH-01',   name:'Honorarios' },
    { tipo:'Egreso', grupo:'Resultados', code:'RM-01',   name:'Mermas' },
    { tipo:'Egreso', grupo:'Resultados', code:'RMD-01',  name:'Muertes y desechos' },
    { tipo:'Egreso', grupo:'Resultados', code:'RCL-01',  name:'Combustibles y Lub.' },
    { tipo:'Egreso', grupo:'Resultados', code:'RE-01',   name:'Electricidad Riego' },
    { tipo:'Egreso', grupo:'Resultados', code:'RE-02',   name:'Electricidad general' },
    { tipo:'Egreso', grupo:'Resultados', code:'RS-01',   name:'Servicios en general' },
    { tipo:'Egreso', grupo:'Resultados', code:'RDI-01',  name:'Derechos e impuestos' },
    { tipo:'Egreso', grupo:'Resultados', code:'RFG-01',  name:'Fletes Ganado' },
    { tipo:'Egreso', grupo:'Resultados', code:'RFA-01',  name:'Fletes Alimento' },

    // ===================== CUENTAS DE BALANCE — EGRESOS (salidas de efectivo)
    { tipo:'Egreso', grupo:'Balance', code:'BP-01',  name:'Devoluciones Patrimonio', balanceClass:'Equity' },
    { tipo:'Egreso', grupo:'Balance', code:'BPB-02', name:'Pagos préstamos Bancarios', balanceClass:'Liability' },
    { tipo:'Egreso', grupo:'Balance', code:'BGI-01', name:'Pago de intereses', balanceClass:'Expense' },
    { tipo:'Egreso', grupo:'Balance', code:'BOG-02', name:'Otros Pagos', balanceClass:'Expense' },

    // Adquisición de Activos (erogación de efectivo, incrementa activos)
    { tipo:'Egreso', grupo:'Balance', code:'BME-01', name:'Maquinaria y Equipo (adquisición)', balanceClass:'Asset' },
    { tipo:'Egreso', grupo:'Balance', code:'BCI-01', name:'Corrales e Instalaciones (adquisición)', balanceClass:'Asset' },
    { tipo:'Egreso', grupo:'Balance', code:'BTE-01', name:'Terrenos y Edificios (adquisición)', balanceClass:'Asset' },
    { tipo:'Egreso', grupo:'Balance', code:'BVT-01', name:'Vientres y Toros (adquisición)', balanceClass:'Asset' },
    { tipo:'Egreso', grupo:'Balance', code:'BA-01',  name:'Inventario de Animales (adquisición)', balanceClass:'Asset' },
    { tipo:'Egreso', grupo:'Balance', code:'BV-03',  name:'Otros Activos (adquisición)', balanceClass:'Asset' },
  ].map(a => ({ ...a, key: `${a.code}||${a.name}||${a.tipo}||${a.grupo}` }));

  function fmtMXN(n){
    const v = Number(n||0);
    try { return v.toLocaleString('es-MX', { style:'currency', currency:'MXN' }); }
    catch(e){ return '$' + v.toFixed(2); }
  }

  function getContaLedger(){ return getData(CONTA_LEDGER_KEY) || []; }
  function setContaLedger(arr){ setData(CONTA_LEDGER_KEY, arr || []); }

  function getContaOpening(){ return getData(CONTA_OPEN_KEY) || {}; }
  function setContaOpening(o){ setData(CONTA_OPEN_KEY, o || {}); }

  function getContaClosed(){ return getData(CONTA_CLOSED_KEY) || {}; }
  function setContaClosed(o){ setData(CONTA_CLOSED_KEY, o || {}); }

  function contaYearOf(fecha){
    if (!fecha) return null;
    const y = String(fecha).slice(0,4);
    const n = Number(y);
    return Number.isFinite(n) ? n : null;
  }

  function contaCanEdit(){
    const r = (rolActual() || '').trim();
    return ['Propietario','Gerente','Supervisor'].includes(r);
  }

  function contaMigrateLegacy(){
    const existing = getContaLedger();
    if (existing && existing.length) return;
    const legacy = getData('pecuario_conta') || [];
    if (!legacy.length) return;

    const conv = legacy.map((c, i) => {
      const tipo = (String(c.tipo||'').toLowerCase().includes('ing')) ? 'Ingreso' : 'Egreso';
      const cuentaNombre = String(c.cuenta||'Sin cuenta').trim() || 'Sin cuenta';
      const key = `LEG||${cuentaNombre}||${tipo}`;
      return {
        id: 'LEG-' + Date.now() + '-' + i,
        fecha: c.fecha || '',
        cuentaKey: key,
        cuentaCode: '',
        cuentaName: cuentaNombre,
        tipo,
        tercero: '',
        factura: '',
        tipoProducto: '',
        refPago: '',
        descripcion: c.desc || '',
        monto: Number(c.monto||0),
        usuario: localStorage.getItem('pecuario_usuario_actual') || ''
      };
    });

    // Guardar catálogo legacy dinámico (solo si se requiere render)
    setContaLedger(conv);
  }

  function contaGetAccountByKey(key){
    const acc = CONTA_ACCOUNTS.find(a=>a.key===key);
    if (acc) return acc;
    // Legacy / desconocida
    const parts = String(key||'').split('||');
    return { key, code: parts[0] || '', name: parts[1] || 'Cuenta', tipo: parts[2] || 'Egreso', grupo: parts[3] || '' };
  }

  function contaYears(){
    const yNow = new Date().getFullYear();
    const years = new Set([yNow]);
    getContaLedger().forEach(m=>{
      const y = contaYearOf(m.fecha);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a,b)=>b-a);
  }

  function contaIsClosed(year){
    const c = getContaClosed();
    return !!c[String(year)];
  }

  function contaSetClosed(year, val){
    const c = getContaClosed();
    c[String(year)] = !!val;
    setContaClosed(c);
  }

  function contaGetOpening(year){
    const o = getContaOpening();
    return Number(o[String(year)] || 0);
  }

  function contaSetOpening(year, val){
    const o = getContaOpening();
    o[String(year)] = Number(val||0);
    setContaOpening(o);
  }

  function contaTotalsForYear(year){
    const ledger = getContaLedger().filter(m => contaYearOf(m.fecha) === Number(year));
    let tin=0, tout=0;
    ledger.forEach(m=>{
      const acc = contaGetAccountByKey(m.cuentaKey);
      const amt = Number(m.monto||0);
      if (acc.tipo === 'Ingreso') tin += amt;
      else tout += amt;
    });
    const opening = contaGetOpening(year);
    const cash = opening + tin - tout;
    return { ledger, opening, tin, tout, cash, net: tin - tout };
  }

  function contaFillAccountSelect(sel, opts){
    if (!sel) return;
    const includeAll = opts && opts.includeAll;
    const includeLegacy = opts && opts.includeLegacy;
    sel.innerHTML = '';

    if (includeAll){
      const o = document.createElement('option');
      o.value = '';
      o.textContent = 'Todas…';
      sel.appendChild(o);
    }

    // Agrupar por Tipo (Ingreso/Egreso) y Grupo (Resultados/Balance)
    const groups = [
      { tipo:'Ingreso', grupo:'Resultados', label:'Ingresos — Resultados' },
      { tipo:'Ingreso', grupo:'Balance',    label:'Ingresos — Balance' },
      { tipo:'Egreso',  grupo:'Resultados', label:'Egresos — Resultados' },
      { tipo:'Egreso',  grupo:'Balance',    label:'Egresos — Balance' },
    ];

    groups.forEach(g=>{
      const og = document.createElement('optgroup');
      og.label = g.label;
      CONTA_ACCOUNTS
        .filter(a=>a.tipo===g.tipo && a.grupo===g.grupo)
        .forEach(a=>{
          const o = document.createElement('option');
          o.value = a.key;
          o.textContent = `${a.code} — ${a.name}`;
          og.appendChild(o);
        });
      if (og.children.length) sel.appendChild(og);
    });

    if (includeLegacy){
      const legacyKeys = new Set(
        (getContaLedger()||[])
          .map(m=>m.cuentaKey)
          .filter(k=>k && String(k).startsWith('LEGACY:'))
      );

      if (legacyKeys.size){
        const gL = document.createElement('optgroup');
        gL.label = 'Cuentas (históricas)';
        Array.from(legacyKeys).sort().forEach(k=>{
          const a = contaGetAccountByKey(k);
          const o = document.createElement('option');
          o.value = k;
          o.textContent = `${a.code ? (a.code+' — ') : ''}${a.name || 'Cuenta'}`;
          gL.appendChild(o);
        });
        sel.appendChild(gL);
      }
    }
  }

  function contaCsvEscape(v){
    const s = String(v ?? '');
    const needs = /[",\n]/.test(s);
    const out = s.replace(/"/g,'""');
    return needs ? `"${out}"` : out;
  }

  function contaDownloadCsv(filename, rows){
    const csv = rows.map(r=>r.map(contaCsvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function contaRender(){
    const yearSel = document.getElementById('conta-year');
    const year = Number(yearSel?.value || new Date().getFullYear());

    // editor controls
    const canEdit = contaCanEdit();
    const isClosed = contaIsClosed(year);

    const openingInp = document.getElementById('conta-opening');
    const alertBox = document.getElementById('conta-alert');
    const editorNote = document.getElementById('conta-editor-only');
    const form = document.getElementById('form-conta2');

    if (openingInp){
      openingInp.value = String(contaGetOpening(year));
      openingInp.disabled = !canEdit || isClosed;
    }

    if (form){
      form.style.display = canEdit ? '' : 'none';
      form.querySelectorAll('input,select,textarea,button').forEach(el=>{
        if (el.id === 'btn-conta-limpiar') return;
        if (el.type === 'button' && el.id === 'btn-conta-limpiar') return;
        if (el.tagName === 'BUTTON' && el.type === 'submit') el.disabled = (!canEdit || isClosed);
      });
    }

    if (editorNote){
      editorNote.textContent = (!canEdit)
        ? 'Este módulo está en modo lectura para tu rol.'
        : (isClosed ? 'Este ejercicio está CERRADO. Reabre para capturar movimientos.' : '');
      editorNote.style.display = editorNote.textContent ? '' : 'none';
    }

    const btnCerrar = document.getElementById('btn-conta-cerrar');
    const btnReabrir = document.getElementById('btn-conta-reabrir');
    if (btnCerrar) btnCerrar.disabled = !canEdit;
    if (btnReabrir) btnReabrir.disabled = !canEdit;

    const t = contaTotalsForYear(year);

    // KPIs
    const cashEl = document.getElementById('conta-cash');
    const cashHint = document.getElementById('conta-cash-hint');
    if (cashEl) cashEl.textContent = fmtMXN(t.cash);
    if (cashHint){
      cashHint.textContent = (t.cash >= 0)
        ? 'Saldo deudor: utilidad / sobrante de efectivo.'
        : 'Saldo acreedor: faltante / sobregiro en Caja y Bancos.';
    }
    const kIn = document.getElementById('conta-kpi-in');
    const kOut = document.getElementById('conta-kpi-out');
    const kNet = document.getElementById('conta-kpi-net');
    if (kIn) kIn.textContent = fmtMXN(t.tin);
    if (kOut) kOut.textContent = fmtMXN(t.tout);
    if (kNet) kNet.textContent = fmtMXN(t.net);

    // alert
    if (alertBox){
      if (isClosed) {
        alertBox.textContent = `Ejercicio ${year} cerrado. El saldo se arrastra como saldo inicial al siguiente ejercicio.`;
      } else {
        alertBox.textContent = '';
      }
      alertBox.style.display = alertBox.textContent ? '' : 'none';
    }

    // Filters
    const fCuenta = document.getElementById('conta-filter-cuenta');
    const fSearch = document.getElementById('conta-search');
    const fEstado = document.getElementById('conta-filter-estado');
    const cuentaKey = fCuenta?.value || '';
    const q = (fSearch?.value || '').toLowerCase();
    const estado = fEstado?.value || 'all';

    let rows = t.ledger.slice().sort((a,b)=> (b.fecha||'').localeCompare(a.fecha||''));
    if (cuentaKey) rows = rows.filter(m=>m.cuentaKey===cuentaKey);
    if (estado==='ingreso') rows = rows.filter(m=>contaGetAccountByKey(m.cuentaKey).tipo==='Ingreso');
    if (estado==='egreso') rows = rows.filter(m=>contaGetAccountByKey(m.cuentaKey).tipo==='Egreso');
    if (q){
      rows = rows.filter(m=>{
        const s = [
          m.tercero, m.factura, m.tipoProducto, m.areteOficial, m.refPago, m.descripcion,
          contaGetAccountByKey(m.cuentaKey).name,
          contaGetAccountByKey(m.cuentaKey).code
        ].join(' ').toLowerCase();
        return s.includes(q);
      });
    }

    // Movimientos table
    const tbody = document.getElementById('conta-tbody');
    if (tbody){
      tbody.innerHTML = rows.map(m=>{
        const a = contaGetAccountByKey(m.cuentaKey);
        const amt = Number(m.monto||0);
        const inCol = (a.tipo==='Ingreso') ? fmtMXN(amt) : '';
        const outCol = (a.tipo==='Egreso') ? fmtMXN(amt) : '';
        return `<tr>
          <td>${escapeHtml(m.fecha||'')}</td>
          <td>${escapeHtml((a.code? a.code+' — ':'') + a.name)}</td>
          <td>${escapeHtml(m.areteOficial||'')}</td>
          <td>${escapeHtml(m.tercero||'')}</td>
          <td>${escapeHtml(m.factura||'')}</td>
          <td>${escapeHtml(m.tipoProducto||'')}</td>
          <td>${escapeHtml(m.refPago||'')}</td>
          <td style="text-align:right;">${escapeHtml(inCol)}</td>
          <td style="text-align:right;">${escapeHtml(outCol)}</td>
          <td>${escapeHtml(m.descripcion||'')}</td>
        </tr>`;
      }).join('') || `<tr><td colspan="10" class="muted">Sin movimientos en este ejercicio.</td></tr>`;
    }

    // Resumen por cuenta
    const resumenBody = document.getElementById('conta-resumen-tbody');
    if (resumenBody){
      const map = new Map(); // key -> {in,out}
      t.ledger.forEach(m=>{
        const a = contaGetAccountByKey(m.cuentaKey);
        const k = m.cuentaKey;
        if (!map.has(k)) map.set(k, { a, in:0, out:0 });
        const obj = map.get(k);
        const amt = Number(m.monto||0);
        if (a.tipo==='Ingreso') obj.in += amt; else obj.out += amt;
      });

      const arr = Array.from(map.values()).sort((x,y)=> (x.a.tipo + x.a.code + x.a.name).localeCompare(y.a.tipo + y.a.code + y.a.name));
      resumenBody.innerHTML = arr.map(x=>{
        const net = x.in - x.out;
        return `<tr>
          <td>${escapeHtml((x.a.code? x.a.code+' — ':'') + x.a.name)}</td>
          <td style="text-align:right;">${escapeHtml(fmtMXN(x.in))}</td>
          <td style="text-align:right;">${escapeHtml(fmtMXN(x.out))}</td>
          <td style="text-align:right;">${escapeHtml(fmtMXN(net))}</td>
        </tr>`;
      }).join('') || `<tr><td colspan="4" class="muted">Sin movimientos.</td></tr>`;
    }

    // =====================
    // Estado de Resultados (Resultados)
    const erIngBody = document.getElementById('conta-er-ing-tbody');
    const erEgrBody = document.getElementById('conta-er-egr-tbody');
    const erUtil = document.getElementById('conta-er-util');
    const erUtilV = document.getElementById('conta-er-util-v');

    // contar vientres activos (para "Por Vientre")
    const activos = (getData('pecuario_animales') || []);
    const nVientres = (activos||[]).filter(a => String(a.grupo||'').toLowerCase().includes('vient')).length || 0;

    const sumByKey = new Map();
    t.ledger.forEach(m=>{
      const acc = contaGetAccountByKey(m.cuentaKey);
      const k = m.cuentaKey;
      const amt = Number(m.monto||0);
      if (!sumByKey.has(k)) sumByKey.set(k, {acc, sum:0});
      sumByKey.get(k).sum += amt;
    });

    const resIng = CONTA_ACCOUNTS.filter(a=>a.grupo==='Resultados' && a.tipo==='Ingreso');
    const resEgr = CONTA_ACCOUNTS.filter(a=>a.grupo==='Resultados' && a.tipo==='Egreso');

    const getSum = (a)=> (sumByKey.get(a.key)?.sum || 0);
    const totalIngRes = resIng.reduce((s,a)=> s + getSum(a), 0);
    const totalEgrRes = resEgr.reduce((s,a)=> s + getSum(a), 0);
    const utilRes = totalIngRes - totalEgrRes;

    const pct = (v)=> totalIngRes ? ((v/totalIngRes)*100).toFixed(1)+'%' : '';
    const perV = (v)=> nVientres ? fmtMXN(v / nVientres) : '';

    if (erIngBody){
      const rows = [];
      rows.push(`<tr><td colspan="4"><b>Ingresos de Resultados</b></td></tr>`);
      resIng.forEach(a=>{
        const v = getSum(a);
        rows.push(`<tr>
          <td>${escapeHtml(a.code+' — '+a.name)}</td>
          <td style="text-align:right;">${escapeHtml(fmtMXN(v))}</td>
          <td style="text-align:right;">${escapeHtml(pct(v))}</td>
          <td style="text-align:right;">${escapeHtml(perV(v))}</td>
        </tr>`);
      });
      rows.push(`<tr>
        <td><b>Total Ingresos de Resultados</b></td>
        <td style="text-align:right;"><b>${escapeHtml(fmtMXN(totalIngRes))}</b></td>
        <td></td>
        <td style="text-align:right;"><b>${escapeHtml(nVientres? fmtMXN(totalIngRes/nVientres): '')}</b></td>
      </tr>`);
      erIngBody.innerHTML = rows.join('');
    }

    if (erEgrBody){
      const rows = [];
      rows.push(`<tr><td colspan="4"><b>Egresos de Resultados</b></td></tr>`);
      resEgr.forEach(a=>{
        const v = getSum(a);
        rows.push(`<tr>
          <td>${escapeHtml(a.code+' — '+a.name)}</td>
          <td style="text-align:right;">${escapeHtml(fmtMXN(v))}</td>
          <td style="text-align:right;">${escapeHtml(pct(v))}</td>
          <td style="text-align:right;">${escapeHtml(perV(v))}</td>
        </tr>`);
      });
      rows.push(`<tr>
        <td><b>Total Egresos de Resultados</b></td>
        <td style="text-align:right;"><b>${escapeHtml(fmtMXN(totalEgrRes))}</b></td>
        <td></td>
        <td style="text-align:right;"><b>${escapeHtml(nVientres? fmtMXN(totalEgrRes/nVientres): '')}</b></td>
      </tr>`);
      erEgrBody.innerHTML = rows.join('');
    }

    if (erUtil) erUtil.textContent = fmtMXN(utilRes);
    if (erUtilV) erUtilV.textContent = nVientres ? fmtMXN(utilRes/nVientres) : '';

    // =====================
    // Balance General (Balance)
    const bgBody = document.getElementById('conta-bg-tbody');
    const bgTotAct = document.getElementById('conta-bg-total-act');
    const bgPasivo = document.getElementById('conta-bg-pasivo');
    const bgPatr = document.getElementById('conta-bg-patrimonio');

    // Saldos de cuentas de Balance por clase
    const bal = {
      assets: {'BA-01':0,'BVT-01':0,'BME-01':0,'BCI-01':0,'BTE-01':0,'BV-03':0},
      loan: 0,
      equity: 0
    };

    const nameByCode = {};
    CONTA_ACCOUNTS.forEach(a=>{
      if (a.grupo==='Balance'){
        nameByCode[a.code] = nameByCode[a.code] || a.name;
      }
    });

    t.ledger.forEach(m=>{
      const acc = contaGetAccountByKey(m.cuentaKey);
      if (!acc || acc.grupo!=='Balance') return;
      const code = String(acc.code||'').trim();
      const amt = Number(m.monto||0);

      const cls = acc.balanceClass || '';
      if (cls==='Asset'){
        if (bal.assets.hasOwnProperty(code)){
          // Egreso = compra (sube activo). Ingreso = venta/recuperación (baja activo)
          bal.assets[code] += (acc.tipo==='Egreso' ? amt : -amt);
        }
      } else if (cls==='Liability'){
        if (code==='BPB-02'){
          bal.loan += (acc.tipo==='Ingreso' ? amt : -amt);
        }
      } else if (cls==='Equity'){
        if (code==='BP-01'){
          bal.equity += (acc.tipo==='Ingreso' ? amt : -amt);
        }
      }
    });

    const cash = Number(t.cash||0);
    const totalAssets = cash + Object.values(bal.assets).reduce((s,v)=>s+Number(v||0),0);
    const patrimonioCalc = totalAssets - bal.loan;

    if (bgBody){
      const rows = [];
      rows.push(`<tr><td><b>Activos</b></td><td></td></tr>`);
      rows.push(`<tr><td>B-01 — Caja y Bancos</td><td style="text-align:right;">${escapeHtml(fmtMXN(cash))}</td></tr>`);
      const order = ['BA-01','BVT-01','BME-01','BCI-01','BTE-01','BV-03'];
      order.forEach(code=>{
        const nm = nameByCode[code] || code;
        rows.push(`<tr><td>${escapeHtml(code+' — '+nm)}</td><td style="text-align:right;">${escapeHtml(fmtMXN(bal.assets[code]||0))}</td></tr>`);
      });
      bgBody.innerHTML = rows.join('');
    }
    if (bgTotAct) bgTotAct.textContent = fmtMXN(totalAssets);
    if (bgPasivo) bgPasivo.textContent = fmtMXN(bal.loan);
    if (bgPatr) bgPatr.textContent = fmtMXN(patrimonioCalc);

// Reporte por cuenta
    const repSel = document.getElementById('conta-rep-cuenta');
    const repKey = repSel?.value || '';
    const repBody = document.getElementById('conta-rep-tbody');
    if (repBody){
      const repRows = repKey ? t.ledger.filter(m=>m.cuentaKey===repKey).sort((a,b)=> (a.fecha||'').localeCompare(b.fecha||'')) : [];
      repBody.innerHTML = repKey
        ? (repRows.map(m=>{
            const amt = Number(m.monto||0);
            return `<tr>
              <td>${escapeHtml(m.fecha||'')}</td>
              <td>${escapeHtml(m.tercero||'')}</td>
              <td>${escapeHtml(m.factura||'')}</td>
              <td>${escapeHtml(m.areteOficial||'')}</td>
              <td>${escapeHtml(m.tipoProducto||'')}</td>
              <td>${escapeHtml(m.refPago||'')}</td>
              <td style="text-align:right;">${escapeHtml(fmtMXN(amt))}</td>
              <td>${escapeHtml(m.descripcion||'')}</td>
            </tr>`;
          }).join('') || `<tr><td colspan="8" class="muted">Sin movimientos para esta cuenta.</td></tr>`)
        : `<tr><td colspan="8" class="muted">Selecciona una cuenta para ver su reporte.</td></tr>`;
    }
  }

