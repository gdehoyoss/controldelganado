// ======================
// Actividades/Tareas (asignación por usuario)
// ======================

function getTareas(){ return getData('pecuario_actividades') || []; }
function setTareas(t){ setData('pecuario_actividades', t || []); }

function usuarioActualObj(){
  const nombre = localStorage.getItem('pecuario_usuario_actual') || '';
  return getUsuarios().find(x=>x.nombre===nombre) || null;
}
function rolBaseActual(){
  const u = usuarioActualObj();
  return u ? (u.rolBase || u.rol || '') : '';
}
function esAdministrador(){
  return ['Propietario','Gerente','Supervisor'].includes(rolBaseActual());
}

function ymd(d){
  const z = (n)=> String(n).padStart(2,'0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
}

function migrarActividadesATareas(){
  const arr = getData('pecuario_actividades') || [];
  if (!arr.length) return;
  // Si ya tiene 'estado', asumimos que ya son tareas
  if (arr.some(x=>x && typeof x==='object' && ('estado' in x))) return;

  const now = new Date();
  const tareas = [];
  arr.forEach((a,i)=>{
    if (!a || typeof a !== 'object') return;
    const desc = (a.actividad || a.actividadSeleccionada || '').trim();
    const asign = (a.responsable || '').trim();
    tareas.push({
      id: `t_${Date.now()}_${i}`,
      modulo: (a.modulo || '').trim(),
      descripcion: desc || 'Tarea',
      asignadoA: asign,
      periodicidad: (a.periodicidad || '').trim(),
      semaforo: (a.semaforo || '').trim(),
      notas: (a.notas || '').trim(),
      fechaInicio: (a.fechaInicio || '').trim(),
      fechaTermino: '',
      estado: 'Pendiente',
      creadoPor: (a.creadoPor || '').trim(),
      creadoEn: now.toISOString()
    });
  });
  setTareas(tareas);
}

function renderTareasUI(){
  const pend = document.getElementById('listaTareasPend');
  const comp = document.getElementById('listaTareasComp');
  const adminBox = document.getElementById('actAdminBox');
  if (!pend || !comp) return;

  const tareas = getTareas();
  const u = usuarioActualObj();
  const nombre = u ? u.nombre : '';

  // Mostrar/ocultar caja admin
  if (adminBox) adminBox.style.display = esAdministrador() ? '' : 'none';

  const visibles = esAdministrador()
    ? tareas
    : tareas.filter(t => String(t.asignadoA||'').trim() === String(nombre||'').trim());

  const pendientes = visibles.filter(t => (t.estado||'Pendiente') !== 'Completada');
  const completadas = visibles.filter(t => (t.estado||'') === 'Completada');

  const renderItem = (t)=> {
    const wrap = document.createElement('div');
    wrap.className = 'tarjeta';
    wrap.style.background = '#fff';
    wrap.style.border = '1px solid #e5e7eb';
    wrap.style.margin = '6px 0';
    wrap.style.padding = '10px';

    const inicio = (t.fechaInicio||'').trim();
    const fin = (t.fechaTermino||'').trim();
    const meta = [
      t.modulo ? `Módulo: ${t.modulo}` : '',
      inicio ? `Inicio: ${inicio}` : '',
      t.periodicidad ? `Periodicidad: ${t.periodicidad}` : '',
      (t.estado === 'Completada' && t.semaforo) ? `Semáforo: ${t.semaforo}` : '',
      (esAdministrador() && t.asignadoA) ? `Asignado a: ${t.asignadoA}` : ''
    ].filter(Boolean).join(' | ');

    if (!esAdministrador()){
      const lbl = document.createElement('label');
      lbl.style.display='flex';
      lbl.style.gap='10px';
      lbl.style.alignItems='flex-start';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = (t.estado === 'Completada');
      cb.disabled = (t.estado === 'Completada'); // una vez completada, no se desmarca
      cb.dataset.id = t.id;

      cb.addEventListener('change', ()=>{
        if (!cb.checked) return;
        const all = getTareas();
        const idx = all.findIndex(x=>x.id===t.id);
        if (idx>=0){
          all[idx].estado = 'Completada';
          if (!all[idx].fechaTermino) all[idx].fechaTermino = ymd(new Date());
          all[idx].terminadoPor = nombre;
          setTareas(all);
          renderTareasUI();
          actualizarReportes();
          actualizarPanel();
        }
      });

      const txt = document.createElement('div');
      txt.innerHTML =
        `<b>${escapeHtml(t.descripcion||'Tarea')}</b>` +
        (meta ? `<div class="nota" style="margin-top:4px;">${escapeHtml(meta)}</div>` : '') +
        (t.notas ? `<div class="nota" style="margin-top:4px;">Notas: ${escapeHtml(t.notas)}</div>` : '');

      lbl.appendChild(cb);
      lbl.appendChild(txt);
      wrap.appendChild(lbl);

      if (fin){
        const d = document.createElement('div');
        d.className='nota';
        d.style.marginTop='6px';
        d.textContent = `Terminada: ${fin}`;
        wrap.appendChild(d);
      }
      return wrap;
    }

    // Vista admin (Propietario/Gerente/Supervisor)
    const title = document.createElement('div');
    title.style.fontWeight='900';
    title.textContent = (t.descripcion||'Tarea');
    wrap.appendChild(title);

    if (meta){
      const mdiv = document.createElement('div');
      mdiv.className='nota';
      mdiv.style.marginTop='4px';
      mdiv.textContent = meta;
      wrap.appendChild(mdiv);
    }

    if (t.notas){
      const nd = document.createElement('div');
      nd.className='nota';
      nd.style.marginTop='4px';
      nd.textContent = `Notas: ${t.notas}`;
      wrap.appendChild(nd);
    }

    if (t.estado === 'Completada'){
      const d = document.createElement('div');
      d.className='nota';
      d.style.marginTop='6px';
      d.textContent = `Terminada: ${fin || '—'}` + (t.terminadoPor ? ` (por ${t.terminadoPor})` : '');
      wrap.appendChild(d);

      // Semáforo editable SOLO en tareas completadas
      const row = document.createElement('div');
      row.style.display='flex';
      row.style.gap='8px';
      row.style.alignItems='center';
      row.style.flexWrap='wrap';
      row.style.marginTop='8px';

      const lab = document.createElement('span');
      lab.className='nota';
      lab.innerHTML = '<b>Semáforo:</b>';

      const sel = document.createElement('select');
      sel.style.padding='6px 8px';
      sel.style.borderRadius='10px';
      sel.style.border='1px solid #e5e7eb';
      sel.style.fontWeight='600';

      const opts = [
        {v:'', t:'Sin color'},
        {v:'Verde', t:'Verde'},
        {v:'Amarillo', t:'Amarillo'},
        {v:'Rojo', t:'Rojo'}
      ];
      opts.forEach(o=>{
        const op = document.createElement('option');
        op.value = o.v;
        op.textContent = o.t;
        sel.appendChild(op);
      });
      sel.value = (t.semaforo||'').trim();

      sel.addEventListener('change', ()=>{
        const all = getTareas();
        const idx = all.findIndex(x=>x.id===t.id);
        if (idx>=0){
          all[idx].semaforo = sel.value;
          setTareas(all);
          pintarToast('Semáforo actualizado');
          renderTareasUI();
          actualizarPanel();
          actualizarReportes();
        }
      });

      row.appendChild(lab);
      row.appendChild(sel);
      wrap.appendChild(row);
    } else {
      const p = document.createElement('div');
      p.className='nota';
      p.style.marginTop='6px';
      p.innerHTML = '<b>Pendiente</b>';
      wrap.appendChild(p);
    }

    return wrap;
  };

  const renderList = (arr, el, emptyText)=>{
    if (!arr.length){
      el.innerHTML = `<div class="nota">${emptyText}</div>`;
      return;
    }
    el.innerHTML = '';
    arr.slice().reverse().forEach(t=>{
      el.appendChild(renderItem(t));
    });
  };

  renderList(pendientes, pend, esAdministrador() ? 'Sin tareas pendientes.' : 'No tienes tareas pendientes.');
  renderList(completadas, comp, esAdministrador() ? 'Sin tareas completadas.' : 'No tienes tareas completadas.');
}

function poblarSelectUsuariosAsignacion(){
  const sel = document.getElementById('selAsignadoA');
  if (!sel) return;
  const usuarios = getUsuarios().filter(u=> (u.activo==='Activo' || u.activo==='Sí'));
  sel.innerHTML = '<option value="">Selecciona…</option>';
  usuarios.forEach(u=>{
    const o = document.createElement('option');
    o.value = u.nombre;
    o.textContent = u.nombre;
    sel.appendChild(o);
  });
}

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
