  function initTareasActividades(){
    migrarActividadesATareas();
    poblarSelectUsuariosAsignacion();

    // Default: fecha inicio hoy
    const form = document.getElementById('form-actividades');
    if (form){
      const fi = form.querySelector('input[name="fechaInicio"]');
      if (fi && !fi.value) fi.value = ymd(new Date());

      // Guardar tareas (solo admin)
      form.addEventListener('submit', (e)=>{
        if (!esAdministrador()) { e.preventDefault(); return; }
        e.preventDefault();

        const f = new FormData(form);
        const obj = {};
        f.forEach((v,k)=>obj[k]=String(v||''));
        const asignadoA = (obj.asignadoA||'').trim();
        if (!asignadoA){ alert('Selecciona a quién se asigna la tarea.'); return; }

        const inicio = (obj.fechaInicio||'').trim() || ymd(new Date());
        const modulo = (obj.modulo||'').trim();

        // Descripción (puede contener varias líneas = varias tareas)
        const descLibre = (obj.descripcionTarea||'').trim();
        const nuevos = descLibre.split(/\n+/).map(s=>s.trim()).filter(Boolean);

        if (!nuevos.length){
          alert('Escribe la descripción de la tarea.');
          return;
        }

        const tareas = getTareas();
        const creador = (usuarioActualObj() && usuarioActualObj().nombre) ? usuarioActualObj().nombre : '';

        nuevos.forEach((desc, i)=>{
          tareas.push({
            id: `t_${Date.now()}_${Math.random().toString(16).slice(2)}_${i}`,
            modulo,
            descripcion: desc,
            asignadoA,
            periodicidad: (obj.periodicidad||'').trim(),
            semaforo: '',
            notas: (obj.notas||'').trim(),
            herramientas: (obj.herramientas||'').trim(),
            realizada: (obj.realizada||'No').trim(),
            fechaInicio: inicio,
            fechaTermino: ((obj.realizada||'No')==='Si' ? inicio : ''),
            estado: ((obj.realizada||'No')==='Si' ? 'Completada' : 'Pendiente'),
            creadoPor: creador,
            creadoEn: new Date().toISOString()
          });
        });

        setTareas(tareas);
        pintarToast('Tarea(s) guardada(s)');
        form.reset();
        poblarSelectUsuariosAsignacion();
        const fi2 = form.querySelector('input[name="fechaInicio"]');
        if (fi2) fi2.value = ymd(new Date());
renderTareasUI();
        actualizarReportes();
        actualizarPanel();
      });
    }

    // Exponer para refresco al cambiar de usuario
    window.renderTareasUI = renderTareasUI;

    renderTareasUI();
  }


  // ======================
  // Actividades: Personal / Responsabilidades / Tareas especiales + Resumen diario
  // ======================
  const PERSONAL_KEY = 'pecuario_personal_rancho';
  const RESPONS_KEY = 'pecuario_responsabilidades';
  const ESPECIALES_KEY = 'pecuario_tareas_especiales';

  function getPersonalRancho(){ return getData(PERSONAL_KEY) || []; }
  function setPersonalRancho(v){ setData(PERSONAL_KEY, v||[]); }

  function getRespons(){ return getData(RESPONS_KEY) || []; }
  function setRespons(v){ setData(RESPONS_KEY, v||[]); }

  function getEspeciales(){ return getData(ESPECIALES_KEY) || []; }
  function setEspeciales(v){ setData(ESPECIALES_KEY, v||[]); }

  function listaModulosParaRoles(){
    // Usa los botones del panel como fuente
    const btns = document.querySelectorAll('nav button[data-modulo]');
    const mods = [];
    btns.forEach(b=>{
      const id = b.getAttribute('data-modulo');
      const txt = (b.textContent||'').trim();
      if (id && txt) mods.push({id, name: txt});
    });
    // agrega submódulos relevantes
    mods.push({id:'cabezas:altas', name:'Cabezas – Altas'});
    mods.push({id:'cabezas:bajas', name:'Cabezas – Bajas'});
    mods.push({id:'cabezas:pesajes', name:'Cabezas – Pesajes'});
    mods.push({id:'cabezas:cambios', name:'Cabezas – Cambios de Grupo'});
    mods.push({id:'repro', name:'Reproducción y Partos'});
    mods.push({id:'potreros', name:'Potreros'});
    mods.push({id:'corrales', name:'Corrales'});
    return mods;
  }

  function poblarSelectUsuariosMulti(ids){
    const usuarios = getData('pecuario_usuarios') || [];
    ids.forEach(id=>{
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = '<option value="">Selecciona…</option>';
      usuarios.forEach(u=>{
        const o = document.createElement('option');
        o.value = u.nombre;
        o.textContent = u.nombre;
        sel.appendChild(o);
      });
    });
  }

  function poblarSelectModulos(ids){
    const mods = listaModulosParaRoles();
    ids.forEach(id=>{
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = '<option value="">Selecciona…</option>';
      mods.forEach(m=>{
        const o = document.createElement('option');
        o.value = m.id;
        o.textContent = m.name;
        sel.appendChild(o);
      });
    });
  }

  function renderPersonalUI(){
    const cont = document.getElementById('lista-personal');
    if (!cont) return;
    const p = getPersonalRancho();
    cont.innerHTML = '';
    if (!p.length){ cont.innerHTML = '<div>Sin personal registrado.</div>'; return; }
    p.forEach(x=>{
      const div = document.createElement('div');
      div.style.display='flex';
      div.style.justifyContent='space-between';
      div.style.gap='10px';
      div.style.alignItems='center';
      div.textContent = `${x.usuario} | ID: ${x.identificacion||'-'} | Puesto: ${x.puesto||'-'}`;
      const acciones = document.createElement('div');
      acciones.style.display='flex'; acciones.style.gap='8px';
      const bE = document.createElement('button'); bE.type='button'; bE.className='btn-terciario'; bE.textContent='Editar'; bE.dataset.action='edit'; bE.dataset.usuario=x.usuario;
      const bD = document.createElement('button'); bD.type='button'; bD.className='btn-secundario'; bD.textContent='Borrar'; bD.dataset.action='del'; bD.dataset.usuario=x.usuario;
      acciones.appendChild(bE); acciones.appendChild(bD);
      const wrap = document.createElement('div');
      wrap.style.display='flex';
      wrap.style.justifyContent='space-between';
      wrap.style.gap='10px';
      wrap.style.alignItems='center';
      wrap.appendChild(div.cloneNode(true));
      wrap.appendChild(acciones);
      cont.appendChild(wrap);
    });
  }

  function renderResponsUI(){
    const cont = document.getElementById('lista-responsabilidades');
    if (!cont) return;
    const r = getRespons();
    cont.innerHTML='';
    if (!r.length){ cont.innerHTML='<div>Sin responsabilidades registradas.</div>'; return; }
    r.slice().reverse().forEach(x=>{
      const div = document.createElement('div');
      div.style.display='flex';
      div.style.justifyContent='space-between';
      div.style.gap='10px';
      div.style.alignItems='center';
      div.textContent = `${x.usuario} | ${x.moduloNombre||x.moduloId} | ${x.periodicidad||''} | ${x.descripcion}`;
      const acciones = document.createElement('div');
      acciones.style.display='flex'; acciones.style.gap='8px';
      const bD = document.createElement('button'); bD.type='button'; bD.className='btn-secundario'; bD.textContent='Borrar'; bD.dataset.action='del'; bD.dataset.id=x.id;
      acciones.appendChild(bD);
      const wrap = document.createElement('div');
      wrap.style.display='flex';
      wrap.style.justifyContent='space-between';
      wrap.style.gap='10px';
      wrap.style.alignItems='center';
      const left = document.createElement('div'); left.textContent = div.textContent;
      wrap.appendChild(left); wrap.appendChild(acciones);
      cont.appendChild(wrap);
    });
  }

  function renderEspecialesUI(){
    const cont = document.getElementById('lista-tareas-especiales');
    if (!cont) return;
    const e = getEspeciales();
    cont.innerHTML='';
    if (!e.length){ cont.innerHTML='<div>Sin tareas especiales.</div>'; return; }
    e.slice().reverse().forEach(x=>{
      const div = document.createElement('div');
      div.textContent = `${x.usuario} | ${x.moduloNombre||x.moduloId} | ${x.inicio||'-'} → ${x.fin||'-'} | ${x.descripcion}`;
      cont.appendChild(div);
    });
  }

  function actualizarResumenDia(){
    const el = document.getElementById('resumen-dia');
    if (!el) return;
    const hoy = ymd(new Date());
    const tareas = getTareas() || [];
    const especiales = getEspeciales() || [];

    // por módulo: terminadas / pendientes (tareas regulares)
    const porModulo = {};
    tareas.forEach(t=>{
      const mod = (t.modulo||'').trim() || 'Sin módulo';
      if (!porModulo[mod]) porModulo[mod] = {terminadas:0, pendientes:0};
      const terminadaHoy = (t.estado==='Completada' && (t.fechaTermino||'')===hoy);
      const pendiente = (t.estado!=='Completada');
      if (terminadaHoy) porModulo[mod].terminadas++;
      if (pendiente) porModulo[mod].pendientes++;
    });

    const lines = Object.keys(porModulo).sort().map(m=> `• ${m}: Terminadas hoy ${porModulo[m].terminadas}, Pendientes ${porModulo[m].pendientes}`);
    const espHoy = especiales.filter(x=> (x.inicio||'')===hoy || (x.fin||'')===hoy);
    if (espHoy.length) lines.push(`• Tareas especiales (hoy): ${espHoy.length}`);

    el.textContent = lines.length ? lines.join('\n') : '—';
  }

  function initActividadesExtras(){
    poblarSelectUsuariosMulti(['personal-usuario','resp-usuario','esp-usuario']);
    poblarSelectModulos(['resp-modulo','esp-modulo']);

    // Personal
    const fP = document.getElementById('form-personal');
    if (fP){
      fP.addEventListener('submit', (ev)=>{
        ev.preventDefault();
        const usuario = (document.getElementById('personal-usuario').value||'').trim();
        if (!usuario){ alert('Selecciona un trabajador.'); return; }
        const identificacion = (document.getElementById('personal-id').value||'').trim();
        const puesto = (document.getElementById('personal-puesto').value||'').trim();

        const p = getPersonalRancho();
        const i = p.findIndex(x=>x.usuario===usuario);
        const rec = {usuario, identificacion, puesto, updatedAt: new Date().toISOString()};
        if (i>=0) p[i]=rec; else p.push(rec);
        setPersonalRancho(p);
        renderPersonalUI();
        actualizarResumenDia();
        fP.reset();
        poblarSelectUsuariosMulti(['personal-usuario','resp-usuario','esp-usuario']);
        alert('Personal guardado.');
      });
      const btnL = document.getElementById('btn-personal-limpiar');
      if (btnL) btnL.addEventListener('click', ()=> fP.reset());
    }
    const lp = document.getElementById('lista-personal');
    if (lp){
      lp.addEventListener('click', (ev)=>{
        const btn = ev.target.closest('button');
        if (!btn) return;
        const usuario = btn.dataset.usuario;
        const action = btn.dataset.action;
        if (!usuario) return;
        if (action==='del'){
          if (!confirm('¿Borrar este trabajador del Personal?')) return;
          const p = getPersonalRancho().filter(x=>x.usuario!==usuario);
          setPersonalRancho(p);
          renderPersonalUI();
        } else if (action==='edit'){
          const rec = getPersonalRancho().find(x=>x.usuario===usuario);
          if (!rec) return;
          document.getElementById('personal-usuario').value = rec.usuario;
          document.getElementById('personal-id').value = rec.identificacion||'';
          document.getElementById('personal-puesto').value = rec.puesto||'';
        }
      });
    }

    // Responsabilidades
    const fR = document.getElementById('form-responsabilidades');
    if (fR){
      fR.addEventListener('submit', (ev)=>{
        ev.preventDefault();
        const usuario = (document.getElementById('resp-usuario').value||'').trim();
        const moduloId = (document.getElementById('resp-modulo').value||'').trim();
        const periodicidad = (document.getElementById('resp-periodicidad').value||'').trim();
        const descripcion = (document.getElementById('resp-desc').value||'').trim();
        if (!usuario || !moduloId || !descripcion){
          alert('Completa trabajador, módulo y descripción.');
          return;
        }
        const mods = listaModulosParaRoles();
        const mod = mods.find(m=>m.id===moduloId);
        const r = getRespons();
        r.push({
          id: 'resp_' + Date.now() + '_' + Math.random().toString(16).slice(2),
          usuario,
          moduloId,
          moduloNombre: mod ? mod.name : moduloId,
          periodicidad,
          descripcion,
          createdAt: new Date().toISOString()
        });
        setRespons(r);
        renderResponsUI();
        actualizarResumenDia();
        fR.reset();
        alert('Responsabilidad guardada.');
      });
      const btn = document.getElementById('btn-resp-limpiar');
      if (btn) btn.addEventListener('click', ()=> fR.reset());
    }
    const lr = document.getElementById('lista-responsabilidades');
    if (lr){
      lr.addEventListener('click', (ev)=>{
        const btn = ev.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.action==='del' && id){
          if (!confirm('¿Borrar responsabilidad?')) return;
          setRespons(getRespons().filter(x=>x.id!==id));
          renderResponsUI();
          actualizarResumenDia();
        }
      });
    }

    // Tareas especiales
    const fE = document.getElementById('form-tareas-especiales');
    if (fE){
      fE.addEventListener('submit', (ev)=>{
        ev.preventDefault();
        const usuario = (document.getElementById('esp-usuario').value||'').trim();
        const inicio = (document.getElementById('esp-inicio').value||'').trim();
        const fin = (document.getElementById('esp-fin').value||'').trim();
        const moduloId = (document.getElementById('esp-modulo').value||'').trim();
        const herr = (document.getElementById('esp-herr').value||'').trim();
        const desc = (document.getElementById('esp-desc').value||'').trim();
        if (!usuario || !inicio || !fin || !moduloId || !desc){
          alert('Completa trabajador, fechas, módulo y descripción.');
          return;
        }
        const mods = listaModulosParaRoles();
        const mod = mods.find(m=>m.id===moduloId);
        const e = getEspeciales();
        e.push({
          id: 'esp_' + Date.now() + '_' + Math.random().toString(16).slice(2),
          usuario,
          inicio,
          fin,
          moduloId,
          moduloNombre: mod ? mod.name : moduloId,
          herramientas: herr,
          descripcion: desc,
          createdAt: new Date().toISOString()
        });
        setEspeciales(e);
        renderEspecialesUI();
        actualizarResumenDia();
        fE.reset();
        alert('Tarea especial guardada.');
      });
      const btn = document.getElementById('btn-esp-limpiar');
      if (btn) btn.addEventListener('click', ()=> fE.reset());
    }

    renderPersonalUI();
    renderResponsUI();
    renderEspecialesUI();
    actualizarResumenDia();
  }

// Actividades/Tareas: manejo personalizado (asignación + checkboxes)
  initTareasActividades();
  if (typeof initActividadesExtras === 'function') initActividadesExtras();

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
  // Panel + Reportes
  // ======================
  function actualizarPanel() {
    const animales  = cabezasArray({includeBajas:false});
    const pesInd    = getData('pecuario_pesaje_ind');
    const pesGrp    = getData('pecuario_pesaje_grupo');
    const repro     = getData('pecuario_repro');
    const sanidad   = getData('pecuario_sanidad');
    const visitas   = getData('pecuario_visitas');
    const bitacora  = getData('pecuario_bitacora');
const conta     = getData('pecuario_conta_ledger') || [];
    const corrales  = getData('pecuario_corrales');

    // Hora y temperatura actual
    const elHora = document.getElementById('pnl-hora');
    if (elHora){
      const now = new Date();
      elHora.textContent = now.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});
    }
    const elTemp = document.getElementById('pnl-temp');
    if (elTemp){
      const t = localStorage.getItem('pecuario_temp_actual');
      elTemp.textContent = t ? (t + ' °C') : '—';
    }

    const totalBGR = animales.filter(a=>clasificarGrupoCodigo(a.grupo)==='BGR-01').length;
    const totalBGC = animales.filter(a=>clasificarGrupoCodigo(a.grupo)==='BGC-01').length;
    document.getElementById('pnl-animales').textContent = (totalBGR + totalBGC);
    document.getElementById('pnl-pesajes').textContent  = pesInd.length + pesGrp.length;

    const nac = repro.filter(r => (r.fechaParto || '').trim() !== '').length;
    document.getElementById('pnl-nacimientos').textContent = nac;

    document.getElementById('pnl-sanidad').textContent  = sanidad.length;
    document.getElementById('pnl-seguridad').textContent = visitas.length + bitacora.length;
// Corrales abiertos por potrero (parcela)
    const abiertos = (corrales||[]).filter(c => !(c.salida||'').trim());
    const totalPotr = new Set(corrales.map(c=>String(c.potrero||'').trim()).filter(Boolean)).size;
    const totalCorrAb = corrales.filter(c=>String(c.estado||'').trim()==='Abierto').length;
    const elCorr = document.getElementById('pnl-corrales-abiertos');
    if (elCorr) elCorr.textContent = `Potreros: ${totalPotr} | Corrales abiertos: ${totalCorrAb}`;

    
    // Totales de Contabilidad (año seleccionado) + Saldo B-01
    try {
      const yEl = document.getElementById('conta-year');
      const year = yEl ? Number(yEl.value) : (new Date()).getFullYear();
      if (typeof contaTotalsForYear === 'function') {
        const sum = contaTotalsForYear(year);
        const ing = Number(sum.tin || 0);
        const egr = Number(sum.tout || 0);
        const cash = Number(sum.cash || 0);

        const elIE = document.getElementById('pnl-conta');
        if (elIE) elIE.textContent = `Ing: ${fmtMXN(ing)} | Egr: ${fmtMXN(egr)}`;

        const elB01 = document.getElementById('pnl-b01');
        if (elB01) elB01.textContent = fmtMXN(cash);
      }
    } catch (e) {
      const elIE = document.getElementById('pnl-conta');
      if (elIE) elIE.textContent = '—';
      const elB01 = document.getElementById('pnl-b01');
      if (elB01) elB01.textContent = '—';
    }
}

  function actualizarReportes() {
    const setCount = (id, n) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(n);
    };

    setCount('rep-animales',    getData('pecuario_animales').length);
    setCount('rep-bajas',       getData('pecuario_animales_bajas').length);
    setCount('rep-pesajes',     getData('pecuario_pesaje_ind').length + getData('pecuario_pesaje_grupo').length);
    setCount('rep-repro',       getData('pecuario_repro').length);
    setCount('rep-sanidad',     getData('pecuario_sanidad').length);
setCount('rep-conta',       (getData('pecuario_conta_ledger')||[]).length);
    setCount('rep-seguridad',   getData('pecuario_visitas').length + getData('pecuario_bitacora').length);
    setCount('rep-maquinaria',  getData('pecuario_maquinaria').length);
    setCount('rep-actividades', getTareas().length);
    setCount('rep-potreros',    getData('pecuario_potreros').length);
    setCount('rep-corrales',    getData('pecuario_corrales').length);
    setCount('rep-supl',        getData('pecuario_suplementos').length + getData('pecuario_supl_suministros').length);
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

