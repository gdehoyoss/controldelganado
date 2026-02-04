// ======================
// Actividades/Tareas (asignación por usuario)
// ======================

function getTareas(){ return getData('pecuario_actividades') || []; }
function setTareas(t){ setData('pecuario_actividades', t || []); }
const PUESTOS_KEY = 'pecuario_puestos_personal';
const DEFAULT_PUESTOS = ['Propietario','Gerente','Supervisor','Vaquero','Regador','Operador','Auxiliar'];

function getPuestosPersonal(){
  const raw = getData(PUESTOS_KEY);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return Object.values(raw);
  if (typeof raw === 'string') return [raw];
  return [];
}
function setPuestosPersonal(v){ setData(PUESTOS_KEY, v || []); }
function puestosDisponibles(){
  const extra = getPuestosPersonal();
  const combo = DEFAULT_PUESTOS.concat(extra);
  return Array.from(new Set(combo.map(p=>String(p||'').trim()).filter(Boolean)));
}

function usuarioActualObj(){
  const nombre = localStorage.getItem('pecuario_usuario_actual') || '';
  const toArray = (val)=>{
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return Object.values(val);
    return [];
  };
  let usuariosRaw = [];
  try {
    usuariosRaw = (typeof getUsuarios === 'function') ? getUsuarios() : getData('pecuario_usuarios');
  } catch (e) {
    usuariosRaw = getData('pecuario_usuarios');
  }
  return toArray(usuariosRaw).find(x=>x && x.nombre===nombre) || null;
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
      tipo: 'Continua',
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
    const tipo = (t.tipoTarea || t.tipo || 'Continua').trim();
    const estado = (t.estado || 'Pendiente').trim();
    const meta = [
      t.modulo ? `Módulo: ${t.modulo}` : '',
      tipo ? `Tipo: ${tipo}` : '',
      inicio ? `Inicio: ${inicio}` : '',
      (tipo === 'Eventual' && fin) ? `Fin: ${fin}` : '',
      (tipo !== 'Eventual' && t.periodicidad) ? `Periodicidad: ${t.periodicidad}` : '',
      (tipo === 'Eventual') ? `Estado: ${estado}` : '',
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

      if (tipo === 'Eventual' && estado !== 'Completada'){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-terciario';
        btn.style.marginTop = '8px';
        btn.textContent = (estado === 'En Proceso') ? 'En Proceso' : 'Marcar En Proceso';
        btn.disabled = (estado === 'En Proceso');
        btn.addEventListener('click', ()=>{
          const all = getTareas();
          const idx = all.findIndex(x=>x.id===t.id);
          if (idx>=0){
            all[idx].estado = 'En Proceso';
            setTareas(all);
            renderTareasUI();
            actualizarPanel();
            actualizarReportes();
          }
        });
        wrap.appendChild(btn);
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
      p.innerHTML = `<b>${escapeHtml(estado || 'Pendiente')}</b>`;
      wrap.appendChild(p);

      if (tipo === 'Eventual'){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-terciario';
        btn.style.marginTop = '8px';
        btn.textContent = (estado === 'En Proceso') ? 'En Proceso' : 'Marcar En Proceso';
        btn.disabled = (estado === 'En Proceso');
        btn.addEventListener('click', ()=>{
          const all = getTareas();
          const idx = all.findIndex(x=>x.id===t.id);
          if (idx>=0){
            all[idx].estado = 'En Proceso';
            setTareas(all);
            renderTareasUI();
            actualizarPanel();
            actualizarReportes();
          }
        });
        wrap.appendChild(btn);
      }
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
  const personas = getPersonasDisponibles();
  sel.innerHTML = '<option value="">Selecciona…</option>';
  personas.forEach(nombre=>{
    const o = document.createElement('option');
    o.value = nombre;
    o.textContent = nombre;
    sel.appendChild(o);
  });
}

function getPersonasDisponibles(){
  const toArray = (val)=>{
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return Object.values(val);
    return [];
  };
  let usuariosRaw = [];
  try {
    usuariosRaw = (typeof getUsuarios === 'function') ? getUsuarios() : getData('pecuario_usuarios');
  } catch (e) {
    usuariosRaw = getData('pecuario_usuarios');
  }
  const usuarios = toArray(usuariosRaw)
    .filter(u=> !u || u.activo === undefined || u.activo === 'Activo' || u.activo === 'Sí')
    .map(u=>u && (u.nombre || u.nombreCompleto || u.usuario))
    .filter(Boolean);

  let personalRaw = [];
  try {
    personalRaw = (typeof getPersonalRancho === 'function') ? getPersonalRancho() : getData('pecuario_personal_rancho');
  } catch (e) {
    personalRaw = getData('pecuario_personal_rancho');
  }
  const personal = toArray(personalRaw).map(p=> (p && (p.nombre || p.nombreCompleto || p.usuario)) || '').filter(Boolean);

  return Array.from(new Set([...usuarios, ...personal].map(n=>String(n||'').trim()).filter(Boolean)));
}

function initTareasActividades(){
  migrarActividadesATareas();
  poblarSelectUsuariosAsignacion();

  // Default: fecha inicio hoy
  const form = document.getElementById('form-actividades');
  if (form){
    const fi = form.querySelector('input[name="fechaInicio"]');
    if (fi && !fi.value) fi.value = ymd(new Date());
    const tipoSel = form.querySelector('#act-tipo');
    const periodicidadWrap = form.querySelector('.act-periodicidad-wrap');
    const fechaFinWrap = form.querySelector('.act-fecha-fin');

    const toggleTipo = ()=>{
      const tipo = (tipoSel && tipoSel.value) ? tipoSel.value : 'Continua';
      if (tipo === 'Eventual'){
        if (fechaFinWrap) fechaFinWrap.style.display = '';
        if (periodicidadWrap) periodicidadWrap.style.display = 'none';
      } else {
        if (fechaFinWrap) fechaFinWrap.style.display = 'none';
        if (periodicidadWrap) periodicidadWrap.style.display = '';
      }
    };
    if (tipoSel){
      tipoSel.addEventListener('change', toggleTipo);
      toggleTipo();
    }

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
      const tipoTarea = (obj.tipoTarea||'Continua').trim();
      const periodicidad = (obj.periodicidad||'').trim();
      const fechaTermino = (obj.fechaTermino||'').trim();
      const estadoInicial = (obj.estadoInicial||'Pendiente').trim();

      // Descripción (puede contener varias líneas = varias tareas)
      const descLibre = (obj.descripcionTarea||'').trim();
      const nuevos = descLibre.split(/\n+/).map(s=>s.trim()).filter(Boolean);

      if (!nuevos.length){
        alert('Escribe la descripción de la tarea.');
        return;
      }
      if (tipoTarea === 'Eventual' && (!inicio || !fechaTermino)){
        alert('Completa fecha de inicio y terminación para tareas eventuales.');
        return;
      }
      if (tipoTarea !== 'Eventual' && !periodicidad){
        alert('Selecciona la periodicidad para tareas continuas.');
        return;
      }

      const tareas = getTareas();
      const creador = (usuarioActualObj() && usuarioActualObj().nombre) ? usuarioActualObj().nombre : '';

      nuevos.forEach((desc, i)=>{
        const realizada = (obj.realizada||'No').trim();
        const estadoFinal = (realizada === 'Si') ? 'Completada' : (estadoInicial || 'Pendiente');
        tareas.push({
          id: `t_${Date.now()}_${Math.random().toString(16).slice(2)}_${i}`,
          modulo,
          descripcion: desc,
          asignadoA,
          tipo: tipoTarea,
          periodicidad: (tipoTarea === 'Eventual' ? '' : periodicidad),
          semaforo: '',
          notas: (obj.notas||'').trim(),
          herramientas: (obj.herramientas||'').trim(),
          realizada,
          fechaInicio: inicio,
          fechaTermino: (realizada==='Si' ? (fechaTermino || inicio) : fechaTermino),
          estado: estadoFinal,
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
      if (tipoSel){
        tipoSel.value = 'Continua';
        toggleTipo();
      }
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
const PERSONAL_RANCHO_KEY = 'pecuario_personal_rancho';
const RESPONS_KEY = 'pecuario_responsabilidades';
const ESPECIALES_KEY = 'pecuario_tareas_especiales';

function getPersonalRancho(){
  const raw = getData(PERSONAL_RANCHO_KEY);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return Object.values(raw);
  return [];
}
function setPersonalRancho(v){ setData(PERSONAL_RANCHO_KEY, v||[]); }

function actualizarPuestosSelect(selected){
  const sel = document.getElementById('personal-puesto');
  if (!sel) return;
  const puestos = puestosDisponibles();
  sel.innerHTML = '<option value="">Selecciona…</option>';
  puestos.forEach(p=>{
    const o = document.createElement('option');
    o.value = p;
    o.textContent = p;
    sel.appendChild(o);
  });
  if (selected) sel.value = selected;
}

function limpiarHijosUI(){
  const cont = document.getElementById('personal-hijos');
  if (cont) cont.innerHTML = '';
}

function agregarHijoUI(data){
  const cont = document.getElementById('personal-hijos');
  if (!cont) return;
  const row = document.createElement('div');
  row.className = 'fila-cuatro hijo-row';

  const nombre = document.createElement('input');
  nombre.placeholder = 'Nombre';
  nombre.setAttribute('aria-label', 'Nombre del hijo');
  nombre.value = data && data.nombre ? data.nombre : '';
  nombre.dataset.field = 'nombre';

  const sexo = document.createElement('select');
  sexo.dataset.field = 'sexo';
  sexo.innerHTML = '<option value="">Sexo</option><option>Femenino</option><option>Masculino</option>';
  sexo.setAttribute('aria-label', 'Sexo del hijo');
  sexo.value = data && data.sexo ? data.sexo : '';

  const fecha = document.createElement('input');
  fecha.type = 'date';
  fecha.dataset.field = 'fecha';
  fecha.setAttribute('aria-label', 'Fecha de nacimiento del hijo');
  fecha.value = data && data.fecha ? data.fecha : '';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-secundario';
  btn.textContent = 'Quitar';
  btn.addEventListener('click', ()=> row.remove());

  row.appendChild(nombre);
  row.appendChild(sexo);
  row.appendChild(fecha);
  row.appendChild(btn);
  cont.appendChild(row);
}

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
  const usuarios = getPersonasDisponibles();
  ids.forEach(id=>{
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecciona…</option>';
    usuarios.forEach(nombre=>{
      const o = document.createElement('option');
      o.value = nombre;
      o.textContent = nombre;
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

function renderResponsModulos(){
  const cont = document.getElementById('resp-modulos');
  if (!cont) return;
  const mods = listaModulosParaRoles();
  cont.innerHTML = '';
  mods.forEach(m=>{
    const lbl = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = m.id;
    cb.dataset.name = m.name;
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(` ${m.name}`));
    cont.appendChild(lbl);
  });
}

function renderPersonalUI(){
  const cont = document.getElementById('lista-personal');
  if (!cont) return;
  const pRaw = getPersonalRancho();
  let actualiza = false;
  const p = pRaw.map((item, idx)=>{
    if (item.id) return item;
    actualiza = true;
    return {...item, id: `per_${Date.now()}_${idx}`};
  });
  if (actualiza) setPersonalRancho(p);
  cont.innerHTML = '';
  if (!p.length){ cont.innerHTML = '<div>Sin personal registrado.</div>'; return; }
  p.forEach(x=>{
    const div = document.createElement('div');
    div.style.display='flex';
    div.style.justifyContent='space-between';
    div.style.gap='10px';
    div.style.alignItems='center';
    const nombre = x.nombre || x.usuario || 'Sin nombre';
    div.textContent = `${nombre} | ${x.movimiento || 'Alta'} | No. ${x.numeroTrabajador || x.identificacion || '-'} | Puesto: ${x.puesto || '-'}`;
    const acciones = document.createElement('div');
    acciones.style.display='flex'; acciones.style.gap='8px';
    const bE = document.createElement('button'); bE.type='button'; bE.className='btn-terciario'; bE.textContent='Editar'; bE.dataset.action='edit'; bE.dataset.id=x.id;
    const bD = document.createElement('button'); bD.type='button'; bD.className='btn-secundario'; bD.textContent='Borrar'; bD.dataset.action='del'; bD.dataset.id=x.id;
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
    const mods = (x.modulosNombres && x.modulosNombres.length) ? x.modulosNombres.join(', ') : (x.moduloNombre||x.moduloId||'');
    const rolTxt = x.rol ? ` | Rol: ${x.rol}` : '';
    const freqTxt = x.frecuencia ? ` | Frecuencia: ${x.frecuencia}` : (x.periodicidad ? ` | Frecuencia: ${x.periodicidad}` : '');
    div.textContent = `${x.usuario} | ${mods}${rolTxt}${freqTxt} | ${x.descripcion}`;
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
    const estado = x.estado ? ` | ${x.estado}` : '';
    const herr = x.herramientas ? ` | Herr: ${x.herramientas}` : '';
    div.textContent = `${x.usuario} | ${x.moduloNombre||x.moduloId} | ${x.inicio||'-'} → ${x.fin||'-'}${estado}${herr} | ${x.descripcion}`;
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
  poblarSelectUsuariosMulti(['resp-usuario','esp-usuario']);
  poblarSelectModulos(['esp-modulo']);
  renderResponsModulos();
  actualizarPuestosSelect();

  // Personal
  const fP = document.getElementById('form-personal');
  const movBtns = document.getElementById('personal-movimiento-btns');
  const movInput = document.getElementById('personal-movimiento');
  const estadoCivilSel = document.getElementById('personal-estado-civil');
  const solteroWrap = document.getElementById('personal-soltero');
  const parejaWrap = document.getElementById('personal-pareja');
  const estudiosGrado = document.getElementById('personal-estudios-grado');
  const estudiosCarrera = document.getElementById('personal-estudios-carrera');
  const estudiosOtroWrap = document.getElementById('personal-estudios-otro-wrap');
  const estudiosOtro = document.getElementById('personal-estudios-otro');

  const toggleEstadoCivil = ()=>{
    const estado = (estadoCivilSel && estadoCivilSel.value) ? estadoCivilSel.value : '';
    if (solteroWrap) solteroWrap.style.display = (estado === 'Soltero') ? '' : 'none';
    if (parejaWrap) parejaWrap.style.display = (estado === 'Casado' || estado === 'Concubinato') ? '' : 'none';
  };
  if (estadoCivilSel) estadoCivilSel.addEventListener('change', toggleEstadoCivil);
  toggleEstadoCivil();

  const toggleEstudiosOtro = ()=>{
    const grado = estudiosGrado ? estudiosGrado.value : '';
    const carreraSel = estudiosCarrera ? estudiosCarrera.value : '';
    const mostrar = grado === 'Carrera' || grado === 'Otros estudios' || carreraSel === 'Otro';
    if (estudiosOtroWrap) estudiosOtroWrap.style.display = mostrar ? '' : 'none';
    if (!mostrar && estudiosOtro) estudiosOtro.value = '';
  };
  if (estudiosGrado) estudiosGrado.addEventListener('change', toggleEstudiosOtro);
  if (estudiosCarrera) estudiosCarrera.addEventListener('change', toggleEstudiosOtro);
  toggleEstudiosOtro();

  const setMovimiento = (mov)=>{
    if (movInput) movInput.value = mov;
    if (!movBtns) return;
    movBtns.querySelectorAll('button').forEach(btn=>{
      btn.classList.toggle('activo', btn.dataset.mov === mov);
      btn.classList.toggle('btn-terciario', btn.dataset.mov === mov);
      btn.classList.toggle('btn-secundario', btn.dataset.mov !== mov);
    });
  };
  if (movBtns){
    movBtns.addEventListener('click', (ev)=>{
      const btn = ev.target.closest('button');
      if (!btn || !btn.dataset.mov) return;
      setMovimiento(btn.dataset.mov);
    });
  }
  setMovimiento((movInput && movInput.value) ? movInput.value : 'Alta');

  const btnAddHijo = document.getElementById('btn-personal-add-hijo');
  if (btnAddHijo) btnAddHijo.addEventListener('click', ()=> agregarHijoUI());

  const btnAddPuesto = document.getElementById('btn-personal-puesto-add');
  if (btnAddPuesto){
    btnAddPuesto.addEventListener('click', ()=>{
      const input = document.getElementById('personal-puesto-nuevo');
      const nuevo = (input && input.value) ? input.value.trim() : '';
      if (!nuevo){ alert('Escribe el nuevo puesto.'); return; }
      const actuales = puestosDisponibles();
      if (!actuales.includes(nuevo)){
        const extra = getPuestosPersonal();
        extra.push(nuevo);
        setPuestosPersonal(extra);
      }
      actualizarPuestosSelect(nuevo);
      if (input) input.value = '';
    });
  }

  const leerPermisosPersonal = ()=>{
    return Array.from(document.querySelectorAll('#chkPermisos input[type="checkbox"]'))
      .filter(chk=>chk.checked)
      .map(chk=>chk.value);
  };

  const aplicarPermisosPersonal = (permisos)=>{
    const permitidos = Array.isArray(permisos) ? permisos : [];
    document.querySelectorAll('#chkPermisos input[type="checkbox"]').forEach(chk=>{
      chk.checked = !permitidos.length ? true : permitidos.includes(chk.value);
    });
  };

  const setRolOtroVisible = ()=>{
    const sel = document.getElementById('personal-rol');
    const wrap = document.getElementById('personal-rol-otro-wrap');
    const inp = document.getElementById('personal-rol-otro');
    if (!sel) return;
    const show = sel.value === 'Otro';
    if (wrap) wrap.style.display = show ? '' : 'none';
    if (inp){
      inp.required = show;
      if (!show) inp.value = '';
    }
  };

  const completarAccesosDesdeUsuario = (nombre)=>{
    if (typeof getUsuarios !== 'function') return;
    const usuario = getUsuarios().find(u=>u.nombre===nombre);
    const rolSel = document.getElementById('personal-rol');
    const rolOtro = document.getElementById('personal-rol-otro');
    const estadoSel = document.getElementById('personal-estado');
    if (usuario){
      const rolBase = usuario.rolBase || usuario.rol || '';
      if (rolSel) rolSel.value = ['Propietario','Gerente','Supervisor','Vaquero','Auxiliar','Otro'].includes(rolBase) ? rolBase : 'Otro';
      if (rolOtro && (rolSel && rolSel.value === 'Otro')) rolOtro.value = usuario.rol || '';
      if (estadoSel) estadoSel.value = usuario.activo || 'Activo';
      aplicarPermisosPersonal(usuario.permisos || []);
    } else {
      if (rolSel) rolSel.value = '';
      if (rolOtro) rolOtro.value = '';
      if (estadoSel) estadoSel.value = 'Activo';
      aplicarPermisosPersonal([]);
    }
    setRolOtroVisible();
  };

  const rolPersonalSelect = document.getElementById('personal-rol');
  if (rolPersonalSelect){
    rolPersonalSelect.addEventListener('change', setRolOtroVisible);
    setRolOtroVisible();
  }

  if (fP){
    fP.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const nombre = (document.getElementById('personal-nombre').value||'').trim();
      if (!nombre){ alert('Ingresa el nombre del trabajador.'); return; }
      const recId = (document.getElementById('personal-reg-id').value||'').trim();
      const movimiento = (movInput && movInput.value) ? movInput.value : 'Alta';
      const numeroTrabajador = (document.getElementById('personal-numero').value||'').trim();
      const celular = (document.getElementById('personal-celular').value||'').trim();
      const domicilio = (document.getElementById('personal-domicilio').value||'').trim();
      const sexo = (document.getElementById('personal-sexo').value||'').trim();
      const fechaNacimiento = (document.getElementById('personal-fecha-nac').value||'').trim();
      const estadoCivil = (document.getElementById('personal-estado-civil').value||'').trim();
      const padreNombre = (document.getElementById('personal-padre').value||'').trim();
      const madreNombre = (document.getElementById('personal-madre').value||'').trim();
      const parejaNombre = (document.getElementById('personal-pareja-nombre').value||'').trim();
      const parejaNacimiento = (document.getElementById('personal-pareja-nac').value||'').trim();
      const estudiosGradoVal = (document.getElementById('personal-estudios-grado').value||'').trim();
      const estudiosEstadoVal = (document.getElementById('personal-estudios-estado').value||'').trim();
      const estudiosCarreraVal = (document.getElementById('personal-estudios-carrera').value||'').trim();
      const estudiosOtroVal = (document.getElementById('personal-estudios-otro').value||'').trim();
      const puesto = (document.getElementById('personal-puesto').value||'').trim();
      const rolSel = (document.getElementById('personal-rol').value||'').trim();
      const rolOtro = (document.getElementById('personal-rol-otro').value||'').trim();
      const estadoUsuario = (document.getElementById('personal-estado').value||'').trim() || 'Activo';
      const permisosUsuario = leerPermisosPersonal();
      if (!rolSel){ alert('Selecciona el rol del usuario.'); return; }
      if (rolSel === 'Otro' && !rolOtro){
        alert('Seleccionaste "Otro". Escribe el nombre del rol.');
        return;
      }
      if (!permisosUsuario.length){
        alert('Selecciona al menos un módulo para el usuario.');
        return;
      }
      const existentes = recId ? getPersonalRancho().find(x=>x.id===recId) : null;
      const ineFrente = (document.getElementById('personal-ine-frente').files[0] || {}).name || (existentes ? (existentes.ineFrente || '') : '');
      const ineReverso = (document.getElementById('personal-ine-reverso').files[0] || {}).name || (existentes ? (existentes.ineReverso || '') : '');
      const hijos = Array.from(document.querySelectorAll('#personal-hijos .hijo-row')).map(row=>{
        const nombreH = (row.querySelector('[data-field="nombre"]').value||'').trim();
        const sexoH = (row.querySelector('[data-field="sexo"]').value||'').trim();
        const fechaH = (row.querySelector('[data-field="fecha"]').value||'').trim();
        if (!nombreH && !sexoH && !fechaH) return null;
        return {nombre: nombreH, sexo: sexoH, fecha: fechaH};
      }).filter(Boolean);
      const trabajosPrevios = Array.from(document.querySelectorAll('.trabajo-previo')).map(row=>{
        const idx = row.dataset.index;
        const patron = (document.getElementById(`personal-trabajo-${idx}-patron`).value||'').trim();
        const celularT = (document.getElementById(`personal-trabajo-${idx}-celular`).value||'').trim();
        const municipio = (document.getElementById(`personal-trabajo-${idx}-municipio`).value||'').trim();
        const tiempo = (document.getElementById(`personal-trabajo-${idx}-tiempo`).value||'').trim();
        const puestoT = (document.getElementById(`personal-trabajo-${idx}-puesto`).value||'').trim();
        const ingreso = (document.getElementById(`personal-trabajo-${idx}-ingreso`).value||'').trim();
        if (!patron && !celularT && !municipio && !tiempo && !puestoT && !ingreso) return null;
        return {
          patron,
          celular: celularT,
          municipio,
          tiempoLaborado: tiempo,
          puesto: puestoT,
          ingresoSemanal: ingreso
        };
      }).filter(Boolean);

      const rec = {
        id: recId || `per_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        movimiento,
        nombre,
        usuario: nombre,
        numeroTrabajador,
        celular,
        domicilio,
        sexo,
        fechaNacimiento,
        estadoCivil,
        padreNombre,
        madreNombre,
        parejaNombre,
        parejaNacimiento,
        hijos,
        estudios: {
          grado: estudiosGradoVal,
          estado: estudiosEstadoVal,
          carrera: estudiosCarreraVal,
          especificacion: estudiosOtroVal
        },
        trabajosPrevios,
        ineFrente,
        ineReverso,
        puesto,
        updatedAt: new Date().toISOString()
      };

      const p = getPersonalRancho();
      const i = p.findIndex(x=>x.id===rec.id);
      if (i>=0) p[i]=rec; else p.push(rec);
      setPersonalRancho(p);
      if (typeof getUsuarios === 'function' && typeof setUsuarios === 'function'){
        const usuarios = getUsuarios();
        const rolFinal = (rolSel === 'Otro') ? rolOtro : rolSel;
        const rolBase = (rolSel === 'Otro') ? 'Otro' : rolSel;
        const usuarioRec = {
          nombre,
          rol: rolFinal,
          rolBase,
          activo: estadoUsuario,
          permisos: permisosUsuario,
          personalId: numeroTrabajador || '',
          puesto
        };
        const idx = usuarios.findIndex(u=>u.nombre===nombre);
        if (idx >= 0){
          usuarios[idx] = Object.assign({}, usuarios[idx], usuarioRec);
        } else {
          usuarios.push(usuarioRec);
        }
        setUsuarios(usuarios);
        if (typeof renderListaUsuarios === 'function') renderListaUsuarios();
        if (typeof llenarUsuariosHeader === 'function') llenarUsuariosHeader();
        if (typeof aplicarPermisos === 'function') aplicarPermisos();
      }
      renderPersonalUI();
      actualizarResumenDia();
      poblarSelectUsuariosMulti(['resp-usuario','esp-usuario']);
      poblarSelectUsuariosAsignacion();
      fP.reset();
      document.getElementById('personal-reg-id').value = '';
      setMovimiento('Alta');
      limpiarHijosUI();
      actualizarPuestosSelect();
      toggleEstadoCivil();
      toggleEstudiosOtro();
      completarAccesosDesdeUsuario('');
      alert('Personal guardado.');
    });
    const btnL = document.getElementById('btn-personal-limpiar');
    if (btnL) btnL.addEventListener('click', ()=>{
      fP.reset();
      document.getElementById('personal-reg-id').value = '';
      setMovimiento('Alta');
      limpiarHijosUI();
      actualizarPuestosSelect();
      toggleEstadoCivil();
      toggleEstudiosOtro();
      completarAccesosDesdeUsuario('');
    });
  }
  const lp = document.getElementById('lista-personal');
  if (lp){
    lp.addEventListener('click', (ev)=>{
      const btn = ev.target.closest('button');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (!id) return;
      if (action==='del'){
        if (!confirm('¿Borrar este trabajador del Personal?')) return;
        const p = getPersonalRancho().filter(x=>x.id!==id);
        setPersonalRancho(p);
        renderPersonalUI();
        poblarSelectUsuariosMulti(['resp-usuario','esp-usuario']);
        poblarSelectUsuariosAsignacion();
      } else if (action==='edit'){
        const rec = getPersonalRancho().find(x=>x.id===id);
        if (!rec) return;
        document.getElementById('personal-reg-id').value = rec.id;
        document.getElementById('personal-nombre').value = rec.nombre || rec.usuario || '';
        document.getElementById('personal-numero').value = rec.numeroTrabajador || '';
        document.getElementById('personal-celular').value = rec.celular || '';
        document.getElementById('personal-domicilio').value = rec.domicilio || '';
        document.getElementById('personal-sexo').value = rec.sexo || '';
        document.getElementById('personal-fecha-nac').value = rec.fechaNacimiento || '';
        document.getElementById('personal-estado-civil').value = rec.estadoCivil || '';
        document.getElementById('personal-padre').value = rec.padreNombre || '';
        document.getElementById('personal-madre').value = rec.madreNombre || '';
        document.getElementById('personal-pareja-nombre').value = rec.parejaNombre || '';
        document.getElementById('personal-pareja-nac').value = rec.parejaNacimiento || '';
        document.getElementById('personal-estudios-grado').value = (rec.estudios && rec.estudios.grado) || '';
        document.getElementById('personal-estudios-estado').value = (rec.estudios && rec.estudios.estado) || '';
        document.getElementById('personal-estudios-carrera').value = (rec.estudios && rec.estudios.carrera) || '';
        document.getElementById('personal-estudios-otro').value = (rec.estudios && rec.estudios.especificacion) || '';
        const trabajosPrevios = Array.isArray(rec.trabajosPrevios) ? rec.trabajosPrevios : [];
        document.querySelectorAll('.trabajo-previo').forEach(row=>{
          const idx = row.dataset.index;
          const trabajo = trabajosPrevios[idx] || {};
          document.getElementById(`personal-trabajo-${idx}-patron`).value = trabajo.patron || '';
          document.getElementById(`personal-trabajo-${idx}-celular`).value = trabajo.celular || '';
          document.getElementById(`personal-trabajo-${idx}-municipio`).value = trabajo.municipio || '';
          document.getElementById(`personal-trabajo-${idx}-tiempo`).value = trabajo.tiempoLaborado || '';
          document.getElementById(`personal-trabajo-${idx}-puesto`).value = trabajo.puesto || '';
          document.getElementById(`personal-trabajo-${idx}-ingreso`).value = trabajo.ingresoSemanal || '';
        });
        actualizarPuestosSelect(rec.puesto || '');
        limpiarHijosUI();
        if (rec.hijos && rec.hijos.length){
          rec.hijos.forEach(h=> agregarHijoUI(h));
        }
        setMovimiento(rec.movimiento || 'Alta');
        toggleEstadoCivil();
        toggleEstudiosOtro();
        completarAccesosDesdeUsuario(rec.nombre || rec.usuario || '');
      }
    });
  }

  // Responsabilidades
  const fR = document.getElementById('form-responsabilidades');
  if (fR){
    fR.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const usuario = (document.getElementById('resp-usuario').value||'').trim();
      const frecuencia = (document.getElementById('resp-frecuencia').value||'').trim();
      const rol = (document.getElementById('resp-rol').value||'').trim();
      const descripcion = (document.getElementById('resp-desc').value||'').trim();
      const checks = Array.from(document.querySelectorAll('#resp-modulos input[type="checkbox"]:checked'));
      const modulosIds = checks.map(c=>c.value);
      const modulosNombres = checks.map(c=>c.dataset.name || c.value);
      if (!usuario || !modulosIds.length || !rol || !descripcion){
        alert('Completa trabajador, módulos, rol y descripción.');
        return;
      }
      const r = getRespons();
      r.push({
        id: 'resp_' + Date.now() + '_' + Math.random().toString(16).slice(2),
        usuario,
        modulosIds,
        modulosNombres,
        frecuencia,
        rol,
        descripcion,
        createdAt: new Date().toISOString()
      });
      setRespons(r);
      renderResponsUI();
      actualizarResumenDia();
      fR.reset();
      renderResponsModulos();
      alert('Responsabilidad guardada.');
    });
    const btn = document.getElementById('btn-resp-limpiar');
    if (btn) btn.addEventListener('click', ()=>{
      fR.reset();
      renderResponsModulos();
    });
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
      const estado = (document.getElementById('esp-estado').value||'').trim();
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
        estado,
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
