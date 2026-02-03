

  // Ajuste dinámico para que la barra de navegación quede justo debajo del header
  (function(){
    function setHeaderH(){
      const h = document.querySelector('header');
      if(!h) return;
      document.documentElement.style.setProperty('--headerH', h.offsetHeight + 'px');
    }
    window.addEventListener('load', setHeaderH);
    window.addEventListener('resize', ()=>{
      clearTimeout(window.__hdrT);
      window.__hdrT = setTimeout(setHeaderH, 150);
    });
    setTimeout(setHeaderH, 0);
  })();

  // ======================
  // Utilidades localStorage
  // ======================
  function getData(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      return [];
    }
  }
  function setData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  

  

  // ======================
  // Cabezas (inventario único por arete)
  // ======================
  const CABEZAS_KEY = 'pecuario_cabezas';
  const CAMBIOS_GRUPO_KEY = 'pecuario_cabezas_cambios_grupo';

  function getCabezasMap(){
    try {
      const raw = localStorage.getItem(CABEZAS_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === 'object') ? obj : {};
    } catch(e){ return {}; }
  }
  function setCabezasMap(map){
    localStorage.setItem(CABEZAS_KEY, JSON.stringify(map || {}));
  }
  function cabezasArray({includeBajas=false} = {}){
    const map = getCabezasMap();
    const arr = Object.values(map || {});
    return includeBajas ? arr : arr.filter(x => (x && x.status !== 'Baja'));
  }
  function getCabeza(arete){
    const a = String(arete||'').trim();
    if (!a) return null;
    const map = getCabezasMap();
    return map[a] || null;
  }
  function findCabezaPorArete(arete){
    const a = String(arete||'').trim();
    if (!a) return null;
    const directa = getCabeza(a);
    if (directa) return { cabeza: directa, matchedBy: 'oficial' };
    const map = getCabezasMap();
    const found = Object.values(map || {}).find(c => (c.areteRancho||'').trim() === a);
    if (found) return { cabeza: found, matchedBy: 'rancho' };
    return null;
  }
  function upsertCabeza(rec, {mode='upsert', reason=''} = {}){
    const a = String(rec.areteOficial||'').trim();
    if (!a) return {ok:false, msg:'Arete oficial requerido'};
    const map = getCabezasMap();
    const prev = map[a] ? {...map[a]} : null;

    const now = new Date().toISOString();
    const base = prev ? {...prev} : { areteOficial: a, status:'Activa', _createdAt: now, _hist: [] };

    // normaliza
    const clean = (v)=> String(v||'').trim();
    base.areteRancho = clean(rec.areteRancho);
    base.sexo = clean(rec.sexo);
    base.razaPre = clean(rec.razaPre);
    base.cruza1 = clean(rec.cruza1);
    base.cruza2 = clean(rec.cruza2);
    base.fechaNac = clean(rec.fechaNac);
    base.grupo = clean(rec.grupo);
    base.obs = clean(rec.obs);
    base.origenAlta = clean(rec.origenAlta || base.origenAlta);
    base.inventarioTipo = resolverInventarioTipo(rec.inventarioTipo, base.inventarioTipo, base.grupo);
    base._updatedAt = now;

    // reactivar si estaba en baja y se vuelve a registrar
    if (base.status === 'Baja' && mode !== 'baja'){
      base.status = 'Activa';
      base.baja = null;
    }

    // bitácora de cambios
    const diff = {};
    if (prev){
      ['areteRancho','sexo','razaPre','cruza1','cruza2','fechaNac','grupo','obs','origenAlta','inventarioTipo','status'].forEach(k=>{
        if ((prev[k]||'') !== (base[k]||'')) diff[k] = {de: prev[k]||'', a: base[k]||''};
      });
    } else {
      diff._nuevo = true;
    }
    if (!Array.isArray(base._hist)) base._hist = [];
    if (Object.keys(diff).length){
      base._hist.push({fecha: now, tipo: prev ? 'Edición' : 'Alta', reason: reason||'', cambios: diff, usuario: localStorage.getItem('pecuario_usuario_actual')||''});
    }

    map[a] = base;
    setCabezasMap(map);
    return {ok:true, cabeza: base, prev};
  }

  function getCambiosGrupo(){
    return getData(CAMBIOS_GRUPO_KEY) || [];
  }
  function setCambiosGrupo(arr){
    setData(CAMBIOS_GRUPO_KEY, arr || []);
  }
  function registrarCambioGrupo(arete, deGrupo, aGrupo){
    const a = String(arete||'').trim();
    if (!a) return {ok:false, msg:'Arete requerido'};
    const cab = getCabeza(a);
    if (!cab) return {ok:false, msg:'No existe ese arete en inventario'};
    const antes = String(deGrupo||cab.grupo||'').trim();
    const ahora = String(aGrupo||'').trim();
    if (!ahora) return {ok:false, msg:'Selecciona un grupo'};
    if (antes === ahora) return {ok:false, msg:'Ya está en ese grupo'};

    // actualiza cabeza + bitácora
    const res = upsertCabeza({ ...cab, grupo: ahora }, {mode:'upsert', reason:'Cambio de grupo'});
    // registro global
    const lista = getCambiosGrupo();
    lista.push({
      areteOficial: a,
      de: antes,
      a: ahora,
      inventarioTipo: resolverInventarioTipo(cab.inventarioTipo, '', cab.grupo),
      fecha: new Date().toISOString(),
      usuario: localStorage.getItem('pecuario_usuario_actual')||''
    });
    setCambiosGrupo(lista);
    return {ok:true};
  }

  function migrarCabezasLegacy(){
    const existing = localStorage.getItem(CABEZAS_KEY);
    if (existing) return;
    const legacy = getData('pecuario_animales'); // v40
    const map = {};
    // usa el último registro por arete
    legacy.forEach((r)=>{
      const a = String(r.areteOficial||'').trim();
      if (!a) return;
      map[a] = {
        areteOficial: a,
        areteRancho: String(r.areteRancho||'').trim(),
        sexo: String(r.sexo||'').trim(),
        razaPre: String(r.razaPre||r.razaPreponderante||'').trim(),
        cruza1: String(r.cruza1||'').trim(),
        cruza2: String(r.cruza2||'').trim(),
        fechaNac: String(r.fechaNac||'').trim(),
        grupo: String(r.grupo||'').trim(),
        obs: String(r.obs||'').trim(),
        inventarioTipo: resolverInventarioTipo(r.inventarioTipo, '', r.grupo),
        status:'Activa',
        _createdAt: r._fechaRegistro || new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        _hist: [{fecha: r._fechaRegistro||new Date().toISOString(), tipo:'Migración', cambios:{}, usuario:''}]
      };
    });

    // aplica bajas legacy
    try {
      const bajas = getAnimalesBajas ? (getAnimalesBajas()||[]) : (getData('pecuario_animales_bajas')||[]);
      bajas.forEach(b=>{
        const a = String(b.areteOficial||'').trim();
        if (!a) return;
        if (!map[a]) {
          map[a] = { areteOficial:a, status:'Baja', grupo:'', sexo:'', razaPre:'', cruza1:'', cruza2:'', fechaNac:'', areteRancho:'', obs:'', inventarioTipo:'', _createdAt: new Date().toISOString(), _updatedAt: new Date().toISOString(), _hist: [] };
        }
        map[a].inventarioTipo = resolverInventarioTipo(b.inventarioTipo, map[a].inventarioTipo, map[a].grupo);
        map[a].status = 'Baja';
        map[a].baja = { ...(b._baja||{}), motivo: b.motivo||'', fecha: b.fecha||'', obs: b.obs||'', monto: b.monto||'' };
      });
    } catch(e){}

    setCabezasMap(map);

    // limpia legacy activo (evita doble conteo)
    setData('pecuario_animales', []);
  }

  function clasificarGrupoCodigo(grupo){
    const g = String(grupo||'').toLowerCase();
    if (g.includes('bgr-01') || g.includes('reprodu')) return 'BGR-01';
    if (g.includes('bgc-01') || g.includes('comercial')) return 'BGC-01';
    if (g.startsWith('vientre') || g.startsWith('cría') || g.includes('toro')) return 'BGR-01';
    return 'BGC-01';
  }

  function normalizarInventarioTipo(tipo){
    const t = String(tipo||'').trim();
    if (!t) return '';
    const low = t.toLowerCase();
    if (low.includes('reprodu')) return 'Ganado Reproducción';
    if (low.includes('comercial')) return 'Ganado Comercial';
    return t;
  }

  function resolverInventarioTipo(nuevoTipo, tipoPrevio, grupo){
    const limpio = normalizarInventarioTipo(nuevoTipo || tipoPrevio);
    if (limpio) return limpio;
    const code = clasificarGrupoCodigo(grupo);
    return code === 'BGR-01' ? 'Ganado Reproducción' : 'Ganado Comercial';
  }

  function normalizarMotivoBaja(motivo){
    const m = String(motivo||'').trim();
    const low = m.toLowerCase();
    if (!m) return 'Otros';
    if (low.includes('venta')) return 'Ventas';
    if (low.includes('muerte') || low.includes('desecho')) return 'Muertes y desechos';
    if (low.includes('extravi')) return 'Extraviados';
    return 'Otros';
  }

function escapeHtml(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;');
  }
// ======================
  // Listas maestras (razas, grupos, potreros)
  // ======================
  const razasBase = [
    "Charolais","Angus","Pardo Suizo","Brahman","Holstein","Santa Gertrudis",
    "Limousin","Wagyu","Akaushi","Nelore","Brafor","Tropicarne","Hereford",
    "Beefmaster","Brangus"
  ];

  const gruposBase = [
    "Ganado Reproducción (BGR-01)",
    "Ganado Comercial (BGC-01)",
    "En espera",
    "Vientre en desarrollo",
    "Vientre en empadre",
    "Vientre en gestación",
    "Vientre en parición",
    "Vientre amamantando",
    "Vientre vacío",
    "Cría en desarrollo",
    "Ganado estabulado",
    "Toro"
  ];

  function getRazas() {
    const extra = getData('pecuario_razas_extra');
    const all = [...razasBase, ...extra].filter(Boolean);
    // dedupe
    return Array.from(new Set(all.map(r => (r||'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'es'));
  }

  function llenarSelect(selectEl, opciones, withBlank=true, blankText="Selecciona…") {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    if (withBlank) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = blankText;
      selectEl.appendChild(o);
    }
    opciones.forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      selectEl.appendChild(o);
    });
  }

  function llenarPotreros(selectEl) {
    const letras = [];
    for (let i=0;i<26;i++) letras.push(String.fromCharCode(65+i));
    llenarSelect(selectEl, letras, true, "Selecciona…");
  }

  function refrescarRazasEnUI() {
    const razas = getRazas();
    llenarSelect(document.getElementById('selRazaPre'), razas);
    llenarSelect(document.getElementById('selCruza1'), razas, true, "Cruza 1…");
    llenarSelect(document.getElementById('selCruza2'), razas, true, "Cruza 2…");

    // Repro: todos los selects con clase selRaza
    document.querySelectorAll('select.selRaza').forEach(sel => llenarSelect(sel, razas));
  }

  function refrescarGruposEnUI() {
    llenarSelect(document.getElementById('selGrupoAnimales'), gruposBase);
    llenarSelect(document.getElementById('selGrupoPesajes'), gruposBase);
    llenarSelect(document.getElementById('selGrupoCorrales'), gruposBase);
    llenarSelect(document.getElementById('selGrupoCria'), gruposBase);
  }

    // ======================
  // Inventario: cambio de grupo
  // ======================
  function refrescarSelectorAnimalesCambioGrupo(){
    const selA = document.getElementById('selAnimalCambioGrupo');
    const selG = document.getElementById('selNuevoGrupoAnimal');
    if (!selA || !selG) return;

    // llenar grupos
    llenarSelect(selG, gruposBase, true, "Selecciona…");

    // llenar animales (último registro por arete)
    const lista = cabezasArray({includeBajas:false});
    const map = {};
    lista.forEach((a, idx)=>{
      const k = (a.areteOficial||'').trim();
      if (!k) return;
      map[k] = { ...a, _idx: idx }; // nos quedamos con el más reciente
    });
    const keys = Object.keys(map).sort();
    selA.innerHTML = '';
    if (!keys.length){
      const o=document.createElement('option');
      o.value='';
      o.textContent='Sin animales registrados';
      selA.appendChild(o);
      return;
    }
    keys.forEach(k=>{
      const a = map[k];
      const o=document.createElement('option');
      o.value = k;
      o.textContent = `${k}  |  Rancho: ${a.areteRancho||'-'}  |  Grupo: ${a.grupo||'-'}  |  Sexo: ${a.sexo||'-'}`;
      selA.appendChild(o);
    });
  }

  function cambiarGrupoAnimal(areteOficial, nuevoGrupo){
    const lista = cabezasArray({includeBajas:false});
    // buscar el más reciente
    let idx = -1;
    for (let i=lista.length-1; i>=0; i--){
      if ((lista[i].areteOficial||'') === (areteOficial||'')) { idx = i; break; }
    }
    if (idx < 0) return false;

    const a = lista[idx];
    const antes = a.grupo || '';
    const ahora = nuevoGrupo || '';
    if (!ahora) { alert('Selecciona un grupo.'); return false; }
    if (antes === ahora) { alert('El animal ya está en ese grupo.'); return false; }

    const fecha = new Date().toISOString();
    if (!Array.isArray(a._histGrupo)) a._histGrupo = [];
    a._histGrupo.push({ fecha, de: antes, a: ahora });
    a._fechaUltCambioGrupo = fecha;
    a.grupo = ahora;

    lista[idx] = a;
    setData('pecuario_animales', lista);

    // refrescar UI
    pintarLista('pecuario_animales','lista-animales', fmtAnimalLinea);
actualizarPanel();
    actualizarReportes();
    refrescarSelectorAnimalesCambioGrupo();
  if (typeof initCabezasModule === 'function') initCabezasModule();
    alert('Grupo actualizado.');
    return true;
  }

  // ======================
  // Reportes: permisos por rol
  // ======================
  const ROLES = ["Propietario","Gerente","Supervisor","Vaquero","Auxiliar","Otro"];
  const REPORT_ITEMS = [
    {key:"animales", label:"Ganado"},
    {key:"bajas", label:"Bajas (Ventas / Muertes)"},
    {key:"pesajes", label:"Pesajes"},
    {key:"repro", label:"Reproducción y partos"},
    {key:"sanidad", label:"Sanidad"},    {key:"conta", label:"Contabilidad"},
    {key:"seguridad", label:"Registros del Velador"},
    {key:"maquinaria", label:"Maquinaria y equipo"},
    {key:"actividades", label:"Responsabilidades y tareas"},
    {key:"potreros", label:"Potreros"},
    {key:"corrales", label:"Corrales"},
    {key:"indicadores", label:"Indicadores"},
    {key:"supl", label:"Suplementos"}
  ];

  function getPermReportesRoles(){
    try { return JSON.parse(localStorage.getItem('pecuario_reportes_roles') || '{}'); }
    catch(e){ return {}; }
  }
  function setPermReportesRoles(obj){
    localStorage.setItem('pecuario_reportes_roles', JSON.stringify(obj||{}));
  }
  function defaultPermReportes(){
    const o = {};
    ROLES.forEach(r=> o[r] = REPORT_ITEMS.map(x=>x.key));
    return o;
  }

  function renderPermReportesUI(){
    const selRol = document.getElementById('selRolReportes');
    const cont = document.getElementById('chkPermReportes');
    const btnSave = document.getElementById('btnGuardarPermReportes');
    const btnReset = document.getElementById('btnRestaurarPermReportes');
    if (!selRol || !cont) return;

    // roles
    selRol.innerHTML = '';
    ROLES.forEach(r=>{
      const o=document.createElement('option'); o.value=r; o.textContent=r; selRol.appendChild(o);
    });

    // inicializar default si no existe
    let perms = getPermReportesRoles();
    if (!Object.keys(perms).length){
      perms = defaultPermReportes();
      setPermReportesRoles(perms);
    }

    
    // Migración: si existía 'Consulta', pásalo a 'Otro'
    if (perms['Consulta'] && !perms['Otro']) {
      perms['Otro'] = perms['Consulta'];
      delete perms['Consulta'];
      setPermReportesRoles(perms);
    }
const renderChecks = ()=>{
      const rol = selRol.value;
      const allowed = new Set((perms[rol] || REPORT_ITEMS.map(x=>x.key)));
      cont.innerHTML = '<div class="nota" style="margin-bottom:8px;">Selecciona qué filas aparecerán para este rol.</div>';
      const wrap = document.createElement('div');
      wrap.style.display='grid';
      wrap.style.gridTemplateColumns='repeat(auto-fit, minmax(190px, 1fr))';
      wrap.style.gap='8px';

      REPORT_ITEMS.forEach(it=>{
        const lab=document.createElement('label');
        lab.style.display='flex';
        lab.style.gap='8px';
        lab.style.alignItems='center';
        lab.style.padding='8px';
        lab.style.border='1px solid #e5e7eb';
        lab.style.borderRadius='12px';
        lab.style.background='#fff';

        const chk=document.createElement('input');
        chk.type='checkbox';
        chk.id='repperm_'+it.key;
        chk.checked = allowed.has(it.key);

        const span=document.createElement('span');
        span.textContent = it.label;

        lab.appendChild(chk);
        lab.appendChild(span);
        wrap.appendChild(lab);
      });
      cont.appendChild(wrap);
    };

    selRol.addEventListener('change', renderChecks);
    renderChecks();

    if (btnSave){
      btnSave.addEventListener('click', ()=>{
        const rol = selRol.value;
        const selected = [];
        REPORT_ITEMS.forEach(it=>{
          const chk = document.getElementById('repperm_'+it.key);
          if (chk && chk.checked) selected.push(it.key);
        });
        perms[rol] = selected;
        setPermReportesRoles(perms);
        aplicarPermisosReportes();
        alert('Permisos de reportes guardados.');
      });
    }

    if (btnReset){
      btnReset.addEventListener('click', ()=>{
        perms = defaultPermReportes();
        setPermReportesRoles(perms);
        renderChecks();
        aplicarPermisosReportes();
        alert('Permisos restaurados.');
      });
    }
  }

  function rolActual(){
    const nombre = localStorage.getItem('pecuario_usuario_actual') || '';
    const u = getUsuarios().find(x=>x.nombre===nombre) || null;
    return u ? (u.rolBase || u.rol || '') : '';
  }

  function aplicarPermisosReportes(){
    const rol = rolActual();
    let perms = getPermReportesRoles();
    if (!Object.keys(perms).length) perms = defaultPermReportes();
    const allowed = new Set(perms[rol] || REPORT_ITEMS.map(x=>x.key));
    document.querySelectorAll('#mod-reportes tr[data-rep]').forEach(tr=>{
      const k = tr.getAttribute('data-rep');
      tr.style.display = allowed.has(k) ? '' : 'none';
    });
  }


  // ======================
  // Reportes: modal con filtros (click por módulo)
  // ======================
  const REPORT_MODAL_CFG = {
    animales: {
      title: "Ganado (Inventario activo)",
      keys: ["pecuario_cabezas"],
      normalize: (dataByKey) => {
        const raw = dataByKey["pecuario_cabezas"];
        const arr = Array.isArray(raw) ? raw : Object.values(raw || {});
        return (arr||[]).filter(x => x && x.status !== 'Baja').map(x=>({
          ...x,
          inventarioTipo: resolverInventarioTipo(x.inventarioTipo, '', x.grupo)
        }));
      },
      filters: [
        {label:"Inventario", field:"inventarioTipo", values: ()=> ["Ganado Reproducción","Ganado Comercial"]},
        {label:"Grupo", field:"grupo", values: ()=> gruposBase},
        {label:"Sexo", field:"sexo", values: ()=> ["Hembra","Macho"]},
        {label:"Raza preponderante", field:"razaPre", values: ()=> getRazas()}
      ],
      columns: [
        {label:"Arete", field:"areteOficial"},
        {label:"Arete rancho", field:"areteRancho"},
        {label:"Inventario", field:"inventarioTipo"},
        {label:"Grupo", field:"grupo"},
        {label:"Sexo", field:"sexo"},
        {label:"Raza", field:"razaPre"},
        {label:"Ubicación", field:"ubicacion"},
        {label:"Edad", field:"edad"},
        {label:"Estado", field:"estado"},
        {label:"Obs.", field:"obs"}
      ]
    },

    bajas: {
      title: "Bajas (Ventas / Muertes / Desechos)",
      keys: ["pecuario_animales_bajas"],
      normalize: (dataByKey) => {
        const arr = (dataByKey[ANIMALES_BAJAS_KEY] || dataByKey["pecuario_animales_bajas"] || []);
        return (arr||[]).map(x=>{
          const code = (x._cuentaMov || x._cuentaVenta || x.cuentaCodigo || x.cuenta || '').trim();
          const name = (x._cuentaNombre || x._cuentaName || x.cuentaNombre || x.cuentaName || '').trim();
          const found = code ? CONTA_ACCOUNTS.find(a=>a.code===code) : null;
          const nm = name || (found ? (found.name||'') : '');
          const cuentaLabel = code ? (nm ? `${code} — ${nm}` : code) : '';
          const motivoRaw = x._motivoBaja || x.motivo || '';
          const motivo = normalizarMotivoBaja(motivoRaw);
          return {
            fecha: x._fechaBaja || x.fecha || '',
            motivo,
            motivoDetalle: motivoRaw,
            cuentaCodigo: code,
            cuentaNombre: nm,
            cuentaLabel,
            monto: (x._montoVenta!==undefined && x._montoVenta!==null && x._montoVenta!=='') ? x._montoVenta : (x.monto||''),
            areteOficial: x.areteOficial || '',
            grupo: x.grupo || '',
            sexo: x.sexo || '',
            razaPre: x.razaPre || '',
            inventarioTipo: resolverInventarioTipo(x.inventarioTipo, '', x.grupo),
            detalle: x._contaMovId ? `Mov: ${x._contaMovId}` : (x.detalle || x.obs || x.observaciones || ''),
            usuario: x._usuarioBaja || x.usuario || x.usuarioCapturo || ''
          };
        });
      },
      filters: [
        {label:"Motivo", field:"motivo", values: ()=> ["Ventas","Muertes y desechos","Extraviados","Otros"]},
        {label:"Inventario", field:"inventarioTipo", values: ()=> ["Ganado Reproducción","Ganado Comercial"]},
        {label:"Cuenta", field:"cuentaLabel", values: ()=> CONTA_ACCOUNTS.filter(a=>a.code && (['BGR-01','BGC-01','BRD-01'].includes(a.code))).map(a=>`${a.code} — ${a.name}`)},
        {label:"Grupo", field:"grupo", values: ()=> gruposBase},
        {label:"Sexo", field:"sexo", values: ()=> ["Hembra","Macho"]},
        {label:"Raza", field:"razaPre", values: ()=> getRazas()},
        {label:"Arete oficial", field:"areteOficial", type:"text"}
      ],
      columns: [
        {label:"Fecha", field:"fecha"},
        {label:"Motivo", field:"motivo"},
        {label:"Inventario", field:"inventarioTipo"},
        {label:"Cuenta", field:"cuentaLabel"},
        {label:"Monto", field:"monto"},
        {label:"Arete", field:"areteOficial"},
        {label:"Grupo", field:"grupo"},
        {label:"Sexo", field:"sexo"},
        {label:"Raza", field:"razaPre"},
        {label:"Detalle", field:"detalle"},
        {label:"Registró", field:"usuario"}
      ]
    },

    pesajes: {
      title: "Pesajes (Individual y por grupo)",
      keys: ["pecuario_pesaje_ind","pecuario_pesaje_grupo"],
      normalize: (dataByKey) => {
        const ind = (dataByKey["pecuario_pesaje_ind"]||[]).map(x=>({
          ...x,
          _tipo:"Individual",
          potrero: x.potrero || '',
          corral: x.corral || '',
          cabezas: x.cabezas || '',
          pesoTotal: x.pesoTotal || '',
          pesoProm: x.pesoProm || '',
          deltaProm: x.deltaProm || x.delta || '',
          ganPer: (parseFloat(x.deltaProm||x.delta||0)>0) ? "Ganancia" : (parseFloat(x.deltaProm||x.delta||0)<0 ? "Pérdida" : "Sin cambio")
        }));
        const grp = (dataByKey["pecuario_pesaje_grupo"]||[]).map(x=>({
          ...x,
          _tipo:"Grupo",
          areteOficial: x.areteOficial || '',
          areteRancho: x.areteRancho || '',
          peso: x.peso || '',
          ubicacion: x.ubicacion || '',
          delta: x.delta || '',
          ganPer: (parseFloat(x.deltaProm||0)>0) ? "Ganancia" : (parseFloat(x.deltaProm||0)<0 ? "Pérdida" : "Sin cambio")
        }));
        return ind.concat(grp);
      },
      filters: [
        {label:"Arete oficial", field:"areteOficial", type:"text"},
        {label:"Arete rancho", field:"areteRancho", type:"text"},
        {label:"Fecha", field:"fecha"},
        {label:"Tipo", field:"_tipo", values: ()=> ["Individual","Grupo"]},
        {label:"Grupo", field:"grupo", values: ()=> gruposBase},
        {label:"Potrero", field:"potrero", values: ()=> (getData('pecuario_potreros')||[]).map(p=>p.letra).filter(Boolean)},
        {label:"Corral", field:"corral"},
        {label:"No. de cabezas", field:"cabezas"},
        {label:"Peso", field:"peso"},
        {label:"Peso total", field:"pesoTotal"},
        {label:"Peso promedio", field:"pesoProm"},
        {label:"Ganancia o pérdida", field:"ganPer", values: ()=> ["Ganancia","Pérdida","Sin cambio"]}
      ],
      columns: [
        {label:"Fecha", field:"fecha"},
        {label:"Tipo", field:"_tipo"},
        {label:"Grupo", field:"grupo"},
        {label:"Arete", field:"areteOficial"},
        {label:"Arete rancho", field:"areteRancho"},
        {label:"Potrero", field:"potrero"},
        {label:"Corral", field:"corral"},
        {label:"No. cabezas", field:"cabezas"},
        {label:"Peso", field:"peso"},
        {label:"Peso total", field:"pesoTotal"},
        {label:"Promedio", field:"pesoProm"},
        {label:"Gan/Per", field:"ganPer"},
        {label:"Δ", field:"deltaProm"},
        {label:"Ubicación", field:"ubicacion"}
      ]
    },

    repro: {
      title: "Reproducción y partos",
      keys: ["pecuario_repro"],
      normalize: (dataByKey) => {
        return (dataByKey["pecuario_repro"]||[]).map(x=>({
          ...x,
          saludCat: (x.saludCat && x.saludCat.trim()) ? x.saludCat : "Ninguno"
        }));
      },
      filters: [
        {label:"Fecha probable de parición", field:"fechaProb"},
        {label:"Calostro — toma (nivel)", field:"calostroNivel", values: ()=> ["Normal","Regular","Mala"]},
        {label:"Calostro — completó", field:"calostroComp", values: ()=> ["Sí","No"]},
        {label:"Problema de salud al nacer", field:"saludCat", values: ()=> ["Ninguno","Digestivo","Respiratorio","Infeccioso","Motriz","Ocular","Otro"]},
        {label:"Raza hembra", field:"razaH", values: ()=> getRazas()},
        {label:"Raza toro", field:"razaT", values: ()=> getRazas()},
        {label:"Resultado", field:"resultado", values: ()=> ["Gestación","Preñez","Parto","Nacimiento","Aborto","Falla","Otro"]}
      ],
      columns: [
        {label:"Fecha", field:"fecha"},
        {label:"Fecha empadre", field:"fechaEmp"},
        {label:"Fecha probable", field:"fechaProb"},
        {label:"Vientre", field:"vientre"},
        {label:"Raza H", field:"razaH"},
        {label:"Toro", field:"toro"},
        {label:"Raza T", field:"razaT"},
        {label:"Cruza 1", field:"cruza1"},
        {label:"Cruza 2", field:"cruza2"},
        {label:"Resultado", field:"resultado"},
        {label:"Calostro", field:"calostroNivel"},
        {label:"Salud nacer", field:"saludCat"},
        {label:"Obs.", field:"obs"}
      ]
    },

    sanidad: {
      title: "Sanidad",
      keys: ["pecuario_sanidad"],
      filters: [
        {label:"Arete oficial", field:"arete", type:"text"},
        {label:"Fecha", field:"fecha"},
        {label:"Tipo de evento", field:"tipo", values: ()=> ["Preventivo (vacuna)","Correctivo (enfermedad)"]},
        {label:"Enfermedad / motivo", field:"enfermedadCat", values: ()=> ["Digestivo","Respiratorio","Infeccioso","Motriz","Ocular","Otro"]},
        {label:"Temperatura", field:"temp"},
        {label:"Tratamiento / vacuna", field:"tratamiento"}
      ],
      columns: [
        {label:"Fecha", field:"fecha"},
        {label:"Arete", field:"arete"},
        {label:"Tipo", field:"tipo"},
        {label:"Enfermedad", field:"enfermedadCat"},
        {label:"Temperatura", field:"temp"},
        {label:"Tratamiento", field:"tratamiento"},
        {label:"Detalle", field:"detalle"},
        {label:"Obs.", field:"obs"}
      ]
    },

    conta: {
      title: "Contabilidad",
      keys: ["pecuario_conta_ledger"],
      filters: [
        {label:"Tipo", field:"tipo", values: ()=> ["Ingreso","Egreso"]},
        {label:"Cuenta", field:"cuentaLabel", values: ()=> CONTA_ACCOUNTS.map(a=>`${a.code} — ${a.name}`)},
        {label:"Referencia pago", field:"refPago", values: ()=> ["Transferencia","Efectivo","Cheque","Tarjeta de Credito","Tarjeta de Debito"]},
        {label:"Proveedor/Cliente", field:"proveedor", type:"text"}
      ],
      normalize: (dataByKey) => {
        const arr = (dataByKey["pecuario_conta_ledger"]||[]).map(x=>({ ...x }));
        return arr.map(r=>{
          const cod = (r.cuentaCodigo || r.cuentaCode || r.cuenta || '').trim();
          const acc = cod ? CONTA_ACCOUNTS.find(a=>a.code===cod) : null;
          const name = (r.cuentaNombre || r.cuentaName || (acc ? acc.name : '') || '').trim();

          return {
            fecha: r.fecha || '',
            tipo: r.tipo || (acc ? acc.tipo : ''),
            cuentaCodigo: cod,
            cuentaNombre: name,
            cuentaLabel: cod ? (name ? `${cod} — ${name}` : cod) : (name || ''),
            proveedor: r.tercero || r.proveedor || r.cliente || '',
            factura: r.factura || '',
            producto: r.productoTipo || r.producto || '',
            refPago: r.refPago || '',
            monto: r.monto,
            arete: r.arete || '',
            descripcion: r.descripcion || ''
          };
        });
      },
      columns: [
        {label:"Fecha", field:"fecha"},
        {label:"Tipo", field:"tipo"},
        {label:"Cuenta", field:"cuentaLabel"},
        {label:"Proveedor/Cliente", field:"proveedor"},
        {label:"Factura", field:"factura"},
        {label:"Producto", field:"producto"},
        {label:"Ref. pago", field:"refPago"},
        {label:"Monto", field:"monto"},
        {label:"Arete", field:"arete"},
        {label:"Descripción", field:"descripcion"}
      ]
    },

    seguridad: {
      title: "Registros del Velador (Bitácora + Visitas)",
      keys: ["pecuario_bitacora","pecuario_visitas"],
      normalize: (dataByKey) => {
        const b = (dataByKey["pecuario_bitacora"]||[]).map(x=>({
          ...x,
          _tipo:"Bitacora diaria del velador",
          horaLlegada: x.hora || x.horaLlegada || '',
          horaSalida: x.horaSalida || '',
          nombre: x.nombre || '',
          asunto: x.asunto || '',
          vehiculo: x.vehiculo || '',
          placas: x.placas || ''
        }));
        const v = (dataByKey["pecuario_visitas"]||[]).map(x=>({
          ...x,
          _tipo:"Registro de visitantes"
        }));
        return b.concat(v);
      },
      filters: [
        {label:"Tipo", field:"_tipo", values: ()=> ["Registro de visitantes","Bitacora diaria del velador"]},
        {label:"Fecha", field:"fecha"},
        {label:"Hora llegada", field:"horaLlegada"},
        {label:"Hora salida", field:"horaSalida"},
        {label:"Nombre visitante / grupo", field:"nombre", type:"text"},
        {label:"Asunto / a quien busca", field:"asunto", type:"text"},
        {label:"Vehículo", field:"vehiculo"},
        {label:"Placas", field:"placas", type:"text"}
      ],
      columns: [
        {label:"Fecha", field:"fecha"},
        {label:"Tipo", field:"_tipo"},
        {label:"Hora llegada", field:"horaLlegada"},
        {label:"Hora salida", field:"horaSalida"},
        {label:"Nombre", field:"nombre"},
        {label:"Asunto", field:"asunto"},
        {label:"Vehículo", field:"vehiculo"},
        {label:"Placas", field:"placas"},
        {label:"Descripción/Obs.", field:"evento"},
        {label:"Obs.", field:"obs"},
        {label:"Usuario", field:"usuario"}
      ]
    },

    maquinaria: {
      title: "Maquinaria y equipo",
      keys: ["pecuario_maquinaria"],
      normalize: (dataByKey) => {
        const base = dataByKey["pecuario_maquinaria"] || [];
        return (base || []).map((r) => {
          const fechaRegistro = r._fechaRegistro ? String(r._fechaRegistro).slice(0, 10) : '';
          return {
            ...r,
            fechaRegistro
          };
        }).sort((a, b) => {
          const ta = String(a.tipo || '').localeCompare(String(b.tipo || ''), 'es');
          if (ta !== 0) return ta;
          return String(a.fechaRegistro || '').localeCompare(String(b.fechaRegistro || ''), 'es');
        });
      },
      filters: [
        {label:"Tipo de activo", field:"tipo", values: ()=> ["Maquinaria","Equipo","Herramienta","Instalación"]},
        {label:"Cantidad", field:"cantidad"},
        {label:"Vida útil", field:"vida"},
        {label:"Descripción", field:"desc", type:"text"},
        {label:"Valor del activo", field:"valor"},
        {label:"Fecha de adquisición", field:"fechaAdq"},
        {label:"Último mantenimiento", field:"fechaMant"},
        {label:"Fecha de registro", field:"fechaRegistro"}
      ],
      columns: [
        {label:"Tipo", field:"tipo"},
        {label:"Cantidad", field:"cantidad"},
        {label:"Vida útil", field:"vida"},
        {label:"Descripción", field:"desc"},
        {label:"Valor", field:"valor"},
        {label:"Marca/Modelo", field:"marcaModelo"},
        {label:"Fecha adq.", field:"fechaAdq"},
        {label:"Último mant.", field:"fechaMant"},
        {label:"Costo mant.", field:"costoMant"},
        {label:"Detalle mant.", field:"detMant"},
        {label:"Fecha reg.", field:"fechaRegistro"}
      ]
    },

    actividades: {
      title: "Actividades / Tareas",
      keys: ["pecuario_actividades"],
      filters: [
        {label:"Módulo", field:"modulo", values: ()=> ["Ganado","Pesajes","Potreros","Corrales","Reproducción y Partos","Sanidad","Contabilidad","Seguridad","Maquinaria y Equipo","Otro"]},
        {label:"Asignado a", field:"asignadoA"},
        {label:"Fecha de inicio", field:"fechaInicio"},
        {label:"Fecha fin", field:"fechaFin"},
        {label:"Estado", field:"estado", values: ()=> ["Pendiente","Completada"]},
        {label:"Periodicidad", field:"periodicidad", values: ()=> ["Diaria","Terciada","Semanal","Quincenal","Mensual","Trimestral","Semestral","Anual"]},
        {label:"Color", field:"semaforo", values: ()=> ["Verde","Amarillo","Rojo","Sin color"]}
      ],
      columns: [
        {label:"Módulo", field:"modulo"},
        {label:"Inicio", field:"fechaInicio"},
        {label:"Fin", field:"fechaFin"},
        {label:"Estado", field:"estado"},
        {label:"Asignado a", field:"asignadoA"},
        {label:"Periodicidad", field:"periodicidad"},
        {label:"Descripción", field:"descripcion"},
        {label:"Color", field:"semaforo"},
        {label:"Creó", field:"creadoPor"}
      ]
    },

    potreros: {
      title: "Potreros",
      keys: ["pecuario_potreros"],
      filters: [
        {label:"Potrero", field:"letra"},
        {label:"Área estimada (m²)", field:"areaM2"},
        {label:"Estatus", field:"estatus"}
      ],
      columns: [
        {label:"Letra", field:"letra"},
        {label:"Nombre", field:"nombre"},
        {label:"Área (m²)", field:"areaM2"},
        {label:"Estatus", field:"estatus"},
        {label:"Descripción", field:"desc"}
      ]
    },

    corrales: {
      title: "Corrales",
      keys: ["pecuario_corrales"],
      filters: [
        {label:"Corral", field:"corralId"},
        {label:"Potrero asociado", field:"potrero", values: ()=> (getData('pecuario_potreros')||[]).map(p=>p.letra).filter(Boolean)},
        {label:"Grupo animales", field:"grupo", values: ()=> gruposBase},
        {label:"Área (m²)", field:"areaM2"},
        {label:"Fecha/hora entrada", field:"entrada"},
        {label:"Fecha/hora salida", field:"salida"},
        {label:"No. animales", field:"cabezas"},
        {label:"m² por animal", field:"m2PorCabeza"},
        {label:"Densidad", field:"densidadAuto"},
        {label:"Acceso a bebederos", field:"bebedero", values: ()=> ["Sí","No","No especificado"]},
        {label:"Acceso a comederos", field:"comedero", values: ()=> ["Sí","No","No especificado"]},
        {label:"Fecha de registro", field:"_fechaRegistro"}
      ],
      columns: [
        {label:"Corral", field:"corralId"},
        {label:"Potrero", field:"potrero"},
        {label:"Grupo", field:"grupo"},
        {label:"Área (m²)", field:"areaM2"},
        {label:"Entrada", field:"entrada"},
        {label:"Salida", field:"salida"},
        {label:"No. animales", field:"cabezas"},
        {label:"m²/animal", field:"m2PorCabeza"},
        {label:"Densidad", field:"densidadAuto"},
        {label:"Bebederos", field:"bebedero"},
        {label:"Comederos", field:"comedero"},
        {label:"Fecha reg.", field:"_fechaRegistro"},
        {label:"Obs.", field:"obs"}
      ]
    },

    indicadores: {
      title: "Indicadores (Pastoreo intensivo / regenerativo / no selectivo)",
      keys: ["pecuario_pirnos"],
      filters: [
        {label:"Corral", field:"corralKey"},
        {label:"Recuperación corral (días)", field:"recuperacionDias"},
        {label:"Infiltración 15 cm", field:"infil15", values: ()=> ["Sí","No"]},
        {label:"Infiltración 30 cm", field:"infil30", values: ()=> ["Sí","No"]},
        {label:"Escarabajos", field:"escarabajos", values: ()=> ["Sí","No"]},
        {label:"Heces", field:"heces", values: ()=> ["Sopa","Pastel","Piedra"]},
        {label:"Nuevas especies", field:"nuevasEspecies", values: ()=> ["Sí","No"]},
        {label:"Llenado del rumen", field:"rumen", values: ()=> ["Vacío","Medio","Lleno"]}
      ],
      normalize: (dataByKey) => {
        return (dataByKey["pecuario_pirnos"]||[]).map(x=>({
          ...x,
          escarabajos: x.escarabajos || x.escarabajosSiNo || '',
          heces: (x.heces||'')==="1" ? "Sopa" : ((x.heces||'')==="2" ? "Pastel" : ((x.heces||'')==="3" ? "Piedra" : (x.heces||''))),
          nuevasEspecies: x.nuevasEspecies || x.nuevasEsp || '',
          rumen: (x.rumen||'')==="1" ? "Vacío" : ((x.rumen||'')==="2" ? "Medio" : ((x.rumen||'')==="3" ? "Lleno" : (x.rumen||'')))
        }));
      },
      columns: [
        {label:"Fecha", field:"fecha"},
        {label:"Corral", field:"corralKey"},
        {label:"Recuperación (d)", field:"recuperacionDias"},
        {label:"Infil 15", field:"infil15"},
        {label:"Infil 30", field:"infil30"},
        {label:"Suelo desnudo %", field:"sueloDesnudoPct"},
        {label:"Escarabajos", field:"escarabajos"},
        {label:"Heces", field:"heces"},
        {label:"Bio (días)", field:"bioDias"},
        {label:"Nuevas especies", field:"nuevasEspecies"},
        {label:"Forraje acostado %", field:"forrajeAcostadoPct"},
        {label:"Rumen", field:"rumen"}
      ]
    },

    supl: {
      title: "Suplementos (catálogo)",
      keys: ["pecuario_suplementos"],
      filters: [
        {label:"Clave", field:"clave"},
        {label:"Nombre del suplemento", field:"nombre", type:"text"},
        {label:"Temporada/Clima", field:"temporada"},
        {label:"Uso/Objetivo", field:"uso"},
        {label:"Ingrediente", field:"_ing~", values: ()=> {
          const s = getData('pecuario_suplementos')||[];
          const all = new Set();
          s.forEach(x=> (x.ingredientes||[]).forEach(i=>{ if(i && i.nombre) all.add(i.nombre); }));
          return Array.from(all).sort();
        }},
        {label:"Frecuencia", field:"frecuencia"}
      ],
      normalize: (dataByKey) => {
        const s = (dataByKey["pecuario_suplementos"]||[]).map(x=>{
          const ings = (x.ingredientes||[]).map(i=>i.nombre).filter(Boolean).join(", ");
          return {...x, _ing: ings};
        });
        return s;
      },
      columns: [
        {label:"Clave", field:"clave"},
        {label:"Nombre", field:"nombre"},
        {label:"Temporada", field:"temporada"},
        {label:"Uso", field:"uso"},
        {label:"Ingredientes", field:"_ing"},
        {label:"Preparación", field:"prep"},
        {label:"Frecuencia", field:"frecuencia"}
      ]
    }
  };

  function repGetAllData(keys){
    const out = {};
    (keys||[]).forEach(k=>{
      const raw = getData(k);
      if (Array.isArray(raw)) {
        out[k] = raw;
      } else if (raw && typeof raw === 'object') {
        out[k] = Object.values(raw);
      } else {
        out[k] = [];
      }
    });
    return out;
  }

  function repDistinct(arr, field){
    const set = new Set();
    arr.forEach(r=>{
      const v = (r && r[field] != null) ? String(r[field]).trim() : '';
      if (v) set.add(v);
    });
    return Array.from(set).sort((a,b)=>a.localeCompare(b,'es'));
  }

  function repToText(v){
    if (v == null) return '';
    if (typeof v === 'number') return String(v);
    return String(v);
  }

  function repDownloadCSV(filename, rows, columns){
    const esc = (s) => {
      const t = repToText(s);
      if (/[",\n]/.test(t)) return '"' + t.replace(/"/g,'""') + '"';
      return t;
    };
    const head = columns.map(c=>esc(c.label)).join(',');
    const body = rows.map(r => columns.map(c=>esc(r[c.field])).join(',')).join('\n');
    const csv = head + '\n' + body;
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 800);
  }

  function openReporteModal(modKey){
    const cfg = REPORT_MODAL_CFG[modKey];
    if (!cfg) return;

    const modal = document.getElementById('modalReportes');
    const title = document.getElementById('repModalTitle');
    const sub = document.getElementById('repModalSub');
    const headRow = document.getElementById('repTblHead');
    const body = document.getElementById('repTblBody');
    const nota = document.getElementById('repTblNota');

    const f1W = document.getElementById('repF1Wrap');
    const f2W = document.getElementById('repF2Wrap');
    const f3W = document.getElementById('repF3Wrap');
    const f1L = document.getElementById('repF1Lbl');
    const f2L = document.getElementById('repF2Lbl');
    const f3L = document.getElementById('repF3Lbl');
    const f1 = document.getElementById('repF1');
    const f2 = document.getElementById('repF2');
    const f3 = document.getElementById('repF3');
    const search = document.getElementById('repSearch');
    const btnCSV = document.getElementById('btnRepCSV');

    title.textContent = cfg.title || "Reporte";
    sub.textContent = "Filtra y revisa todos los registros del módulo.";

    // data
    const dataByKey = repGetAllData(cfg.keys);
    let rows = (cfg.normalize ? cfg.normalize(dataByKey) : (dataByKey[cfg.keys[0]]||[])).map(r=>({...r}));

    // Normalizaciones suaves
    rows.forEach(r=>{
      if (!r.anio && r.fecha) {
        const y = String(r.fecha).slice(0,4);
        if (/^\d{4}$/.test(y)) r.anio = y;
      }
      if (modKey==="conta") {
        // Compatibilidad (versiones anteriores / campos internos)
        if (!r.cuentaCodigo) r.cuentaCodigo = String(r.cuentaCode || r.cuenta || '').trim();
        if (!r.cuentaNombre) r.cuentaNombre = String(r.cuentaName || r.cuentaDesc || '').trim();
        if (!r.proveedor) r.proveedor = String(r.tercero || r.provCliente || r.cliente || r.proveedorCliente || '').trim();

        const cod = (r.cuentaCodigo || '').trim();
        const acc = cod ? CONTA_ACCOUNTS.find(a=>a.code===cod) : null;

        if (!r.tipo && acc) r.tipo = acc.tipo;
        if ((!r.cuentaNombre || !r.cuentaNombre.trim()) && acc) r.cuentaNombre = acc.name;

        if (!r.cuentaLabel) {
          const lbl = (r.cuentaNombre || '').trim();
          r.cuentaLabel = cod ? (lbl ? `${cod} — ${lbl}` : cod) : (lbl || '');
        }

        if (r.monto != null) r.monto = (typeof r.monto==='number') ? r.monto.toFixed(2) : r.monto;
      }
      if (modKey==="actividades") {
        r.descripcion = r.descripcion || r.descTarea || r.desc || '';
      }
    });

    // columns
    const cols = cfg.columns || [];
    headRow.innerHTML = cols.map(c=>`<th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">${c.label}</th>`).join('');

    // filters setup
    const fs = cfg.filters || [];
    const wrapMap = [f1W,f2W,f3W];
    const lblMap = [f1L,f2L,f3L];
    const selMap = [f1,f2,f3];

    // reset search
    if (search) search.value = '';

    // Build select options (3 slots iguales: "Filtrar por" + opciones por campo)
    const filterFields = (cfg.filters || []).filter(Boolean);

    function fillFilterSelect(sel){
      if (!sel) return;
      sel.innerHTML = '';
      const o0 = document.createElement('option');
      o0.value = '';
      o0.textContent = '(Todos)';
      sel.appendChild(o0);

      function getValsForFilter(f){
        // filtros de texto: permitir captura manual
        if (f && f.type === 'text') return ['__PROMPT__'];
        try{
          if (Array.isArray(f.values)) return f.values;
          if (typeof f.values === 'function') return f.values(rows) || [];
        }catch(e){}
        return repDistinct(rows, f.field);
      }

      filterFields.forEach(f=>{
        let raw = getValsForFilter(f) || [];
        // normalizar/dedup/ordenar
        const values = Array.from(new Set(raw.map(v => repToText(v).trim()).filter(Boolean)))
          .sort((a,b)=>a.localeCompare(b,'es'));
        if (!values.length) return;

        const og = document.createElement('optgroup');
        og.label = f.label || f.field;
        values.forEach(v=>{
          const o = document.createElement('option');
          o.value = (v==='__PROMPT__') ? `${f.field}::__PROMPT__` : `${f.field}::${v}`;
          o.textContent = (v==='__PROMPT__') ? '✍ Escribir…' : v;
          og.appendChild(o);
        });
        sel.appendChild(og);
      });

      sel.value = '';
    }

    // Mostrar/ocultar contenedor de filtros
    for (let i=0;i<3;i++){
      const w = wrapMap[i], l = lblMap[i], s = selMap[i];
      if (!w || !l || !s) continue;
      if (!filterFields.length){
        w.style.display = 'none';
        continue;
      }
      w.style.display = '';
      l.textContent = 'Filtrar por';
      fillFilterSelect(s);
    }
function getFiltered(){
      let out = rows.slice();
      selMap.slice(0,3).forEach((s)=>{
        if (!s) return;
        const v = (s.value||'').trim();
        if (!v) return;
        const parts = v.split('::');
        const field = parts[0] || '';
        const val = parts.slice(1).join('::'); // por si el valor trae "::"
        if (!field) return;
        {
        let f = field;
        let mode = 'eq';
        if (f.endsWith('~')) { mode = 'contains'; f = f.slice(0,-1); }
        if (!f) return;
        if (mode==='contains') {
          out = out.filter(r => repToText(r[f]).toLowerCase().includes(String(val||'').toLowerCase()));
        } else {
          out = out.filter(r => repToText(r[f]).trim() === val);
        }
      }
      });
      const q = (search && search.value) ? search.value.trim().toLowerCase() : '';
      if (q){
        out = out.filter(r=>{
          return cols.some(c => repToText(r[c.field]).toLowerCase().includes(q));
        });
      }
      return out;
    }

    function render(){
      const out = getFiltered();
      body.innerHTML = '';
      if (!out.length){
        body.innerHTML = `<tr><td colspan="${cols.length}" style="padding:10px;">Sin registros con estos filtros.</td></tr>`;
        if (nota) nota.textContent = '';
        return;
      }
      out.slice(0, 2000).forEach(r=>{
        const tr = document.createElement('tr');
        tr.innerHTML = cols.map(c=>`<td style="padding:6px; border-bottom:1px solid #f1f5f9; vertical-align:top;">${repToText(r[c.field]) || '—'}</td>`).join('');
        body.appendChild(tr);
      });
      if (nota) nota.textContent = `Mostrando ${Math.min(out.length,2000)} de ${out.length} registros.`;
      // bind CSV
      if (btnCSV){
        btnCSV.onclick = () => repDownloadCSV(`reporte_${modKey}.csv`, out, cols);
      }
    }

    // listeners
    [f1,f2,f3].forEach(s=>{
      if (!s) return;
      s.onchange = ()=>{
        const v = (s.value||'');
        if (v.endsWith('::__PROMPT__')){
          const field = v.split('::')[0] || '';
          const label = (field||'').replace('~','');
          const txt = window.prompt('Escribe el valor para filtrar:', '');
          if (txt === null){ s.value=''; render(); return; }
          const clean = String(txt).trim();
          if (!clean){ s.value=''; render(); return; }
          // crea opción temporal
          const opt = document.createElement('option');
          opt.value = `${field}::${clean}`;
          opt.textContent = clean;
          s.appendChild(opt);
          s.value = opt.value;
        }
        render();
      };
    });
    if (search) search.oninput = () => { window.clearTimeout(search._t); search._t = window.setTimeout(render, 120); };

    render();
    if (modal){
      modal.classList.add('activo');
      modal.setAttribute('aria-hidden','false');
    }
  }

  function closeReporteModal(){
    const modal = document.getElementById('modalReportes');
    if (modal){
      modal.classList.remove('activo');
      modal.setAttribute('aria-hidden','true');
    }
  }

  function setupReportesModal(){
    // click rows (delegated for estabilidad)
    const reportesTable = document.querySelector('#mod-reportes table');
    if (reportesTable && !reportesTable.dataset.repBound){
      reportesTable.addEventListener('click', (event)=>{
        const tr = event.target.closest('tr[data-rep]');
        if (!tr || !reportesTable.contains(tr)) return;
        const k = tr.getAttribute('data-rep');
        if (k) openReporteModal(k);
      });
      reportesTable.dataset.repBound = 'true';
    }

    const btnCerrar = document.getElementById('btnRepCerrar');
    if (btnCerrar) btnCerrar.addEventListener('click', closeReporteModal);

    const modal = document.getElementById('modalReportes');
    if (modal){
      modal.addEventListener('click', (e)=>{
        if (e.target === modal) closeReporteModal();
      });
    }

    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape'){
        const m = document.getElementById('modalReportes');
        if (m && m.classList.contains('activo')) closeReporteModal();
      }
    });
  }


function refrescarPotrerosEnUI() {
    llenarPotreros(document.getElementById('selPotreroLetra'));
    llenarPotreros(document.getElementById('selPotreroPesajes'));
    llenarPotreros(document.getElementById('selPotreroCorrales'));
    llenarPotreros(document.getElementById('selPotreroSupl'));
    // ubicaciones para pesaje individual
    if (typeof refrescarUbicacionesEnUI === 'function') refrescarUbicacionesEnUI();
    if (typeof refrescarCorralesEnUI === 'function') refrescarCorralesEnUI();
  }

  
