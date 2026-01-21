  function initContabilidad(){
    contaMigrateLegacy();

    const yearSel = document.getElementById('conta-year');
    const openingInp = document.getElementById('conta-opening');
    const form = document.getElementById('form-conta2');
    const btnLimpiar = document.getElementById('btn-conta-limpiar');

    const selCuenta = document.getElementById('conta-cuenta');

    // Arete oficial (solo ventas de animal)
    const areteWrap = document.getElementById('conta-arete-wrap');
    const areteInp = areteWrap ? areteWrap.querySelector('input[name="areteOficial"]') : null;

    function contaIsVentaAnimal(code){
      return ['RV-01','RV-02','RV-03','RV-04','RV-05','RV-06'].includes(String(code||'').trim());
    }
    function contaToggleArete(){
      if (!areteWrap || !selCuenta) return;
      const acc = contaGetAccountByKey(selCuenta.value || '');
      const code = String(acc?.code || '').trim();
      const show = !!acc && (contaIsVentaAnimal(code) || code === 'RMD-01');
      areteWrap.style.display = show ? '' : 'none';
      if (!show && areteInp) areteInp.value = '';
    }
    const selFiltro = document.getElementById('conta-filter-cuenta');
    const selRep = document.getElementById('conta-rep-cuenta');

    // years
    if (yearSel){
      yearSel.innerHTML = '';
      contaYears().forEach(y=>{
        const o = document.createElement('option');
        o.value = String(y);
        o.textContent = String(y);
        yearSel.appendChild(o);
      });
      yearSel.value = String(new Date().getFullYear());
      yearSel.addEventListener('change', ()=>{
        // refrescar selects legacy por si cambió
        contaFillAccountSelect(selFiltro, { includeAll:true, includeLegacy:true });
        contaFillAccountSelect(selRep, { includeAll:true, includeLegacy:true });
        contaRender();
      });
    }

    // cuentas
    contaFillAccountSelect(selCuenta, { includeAll:false, includeLegacy:true });
    if (selCuenta) selCuenta.addEventListener('change', contaToggleArete);
    contaToggleArete();
    contaFillAccountSelect(selFiltro, { includeAll:true, includeLegacy:true });
    contaFillAccountSelect(selRep, { includeAll:true, includeLegacy:true });

    if (selFiltro) selFiltro.addEventListener('change', contaRender);
    const s = document.getElementById('conta-search'); if (s) s.addEventListener('input', contaRender);
    const e = document.getElementById('conta-filter-estado'); if (e) e.addEventListener('change', contaRender);
    if (selRep) selRep.addEventListener('change', contaRender);

    // opening balance
    if (openingInp){
      openingInp.addEventListener('change', ()=>{
        const y = Number(yearSel?.value || new Date().getFullYear());
        if (!contaCanEdit()) return;
        if (contaIsClosed(y)) return;
        contaSetOpening(y, openingInp.value);
        contaRender();
        actualizarPanel();
        actualizarReportes();
      });
    }

    // limpiar
    if (btnLimpiar && form){
      btnLimpiar.addEventListener('click', ()=> form.reset());
    }

    // submit
    if (form){
      // defaults
      const fecha = form.querySelector('input[name="fecha"]');
      if (fecha){
        const d = new Date();
        fecha.value = d.toISOString().slice(0,10);
      }

      form.addEventListener('submit', (ev)=>{
        ev.preventDefault();
        if (!contaCanEdit()) return;

        const y = Number(yearSel?.value || new Date().getFullYear());
        if (contaIsClosed(y)){
          alert('Este ejercicio está cerrado. Reabre para capturar movimientos.');
          return;
        }

        const fd = new FormData(form);
        const fechaVal = String(fd.get('fecha')||'').trim();
        const cuentaKey = String(fd.get('cuentaKey')||'').trim();
        const monto = Number(fd.get('monto')||0);

        if (!fechaVal || !cuentaKey || !Number.isFinite(monto)){
          alert('Completa fecha, cuenta y monto.');
          return;
        }

        const acc = contaGetAccountByKey(cuentaKey);

        const mov = {
          id: 'C-' + Date.now() + '-' + Math.random().toString(16).slice(2),
          fecha: fechaVal,
          cuentaKey,
          cuentaCode: acc.code || '',
          cuentaName: acc.name || '',
          tipo: acc.tipo || 'Egreso',
          tercero: String(fd.get('tercero')||'').trim(),
          factura: String(fd.get('factura')||'').trim(),
          tipoProducto: String(fd.get('tipoProducto')||'').trim(),
          areteOficial: String(fd.get('areteOficial')||'').trim(),
          refPago: String(fd.get('refPago')||'').trim(),
          descripcion: String(fd.get('descripcion')||'').trim(),
          monto: monto,
          usuario: localStorage.getItem('pecuario_usuario_actual') || ''
        };

        const ledger = getContaLedger();
        ledger.push(mov);
        setContaLedger(ledger);

        // Si es venta de animal (RV-01..RV-06) o baja por RMD-01, y el arete existe en inventario, muévelo a Bajas
        const accCode = String(acc.code||'').trim();
        const esVentaAnimal = ['RV-01','RV-02','RV-03','RV-04','RV-05','RV-06'].includes(accCode);
        const esBajaMD = (accCode === 'RMD-01');
        if ((esVentaAnimal || esBajaMD) && mov.areteOficial){
          const moved = moverAnimalABajas(mov.areteOficial, {
            fecha: mov.fecha,
            motivo: esVentaAnimal ? 'Venta' : 'Muerte/Desecho',
            movId: mov.id,
            cuentaCode: accCode,
            cuentaName: String(acc.name||'').trim(),
            monto: mov.monto,
            usuario: mov.usuario
          });
          if (moved) {
            if (typeof pintarToast === 'function') pintarToast(`Animal ${mov.areteOficial} movido a Bajas`);
          } else {
            // si no se encontró en inventario, no detiene contabilidad
          }
        }

        // refrescar selects legacy si aplica
        contaFillAccountSelect(document.getElementById('conta-filter-cuenta'), { includeAll:true, includeLegacy:true });
        contaFillAccountSelect(document.getElementById('conta-rep-cuenta'), { includeAll:true, includeLegacy:true });

        form.reset();
        // set date again
        const f2 = form.querySelector('input[name="fecha"]');
        if (f2){
          const d = new Date();
          f2.value = d.toISOString().slice(0,10);
        }

        contaRender();
        actualizarPanel();
        actualizarReportes();
      });
    }

    // cierre de ejercicio
    const btnCerrar = document.getElementById('btn-conta-cerrar');
    if (btnCerrar){
      btnCerrar.addEventListener('click', ()=>{
        if (!contaCanEdit()) return;
        const year = Number(yearSel?.value || new Date().getFullYear());
        const t = contaTotalsForYear(year);
        const next = year + 1;

        const ok = confirm(`Cerrar ejercicio ${year}?\n\nSaldo Caja y Bancos (B-01) al cierre: ${fmtMXN(t.cash)}\nSe registrará como saldo inicial de ${next}.`);
        if (!ok) return;

        contaSetOpening(next, t.cash);
        contaSetClosed(year, true);
        // asegúrate que el siguiente año exista en el selector
        if (yearSel && !Array.from(yearSel.options).some(o=>Number(o.value)===next)){
          const o = document.createElement('option');
          o.value = String(next);
          o.textContent = String(next);
          yearSel.insertBefore(o, yearSel.firstChild);
        }

        contaRender();
        actualizarPanel();
        actualizarReportes();
      });
    }

    const btnReabrir = document.getElementById('btn-conta-reabrir');
    if (btnReabrir){
      btnReabrir.addEventListener('click', ()=>{
        if (!contaCanEdit()) return;
        const year = Number(yearSel?.value || new Date().getFullYear());
        const ok = confirm(`Reabrir ejercicio ${year}?`);
        if (!ok) return;
        contaSetClosed(year, false);
        contaRender();
      });
    }

    // export CSV
    const btnExportYear = document.getElementById('btn-conta-export-global');
    if (btnExportYear){
      btnExportYear.addEventListener('click', ()=>{
        const year = Number(yearSel?.value || new Date().getFullYear());
        const t = contaTotalsForYear(year);
        const rows = [
          ['Fecha','Tipo','Cuenta','Proveedor/Cliente','Factura','Arete Oficial','Tipo producto','Ref pago','Monto','Descripción','Usuario'],
          ...t.ledger
            .slice().sort((a,b)=> (a.fecha||'').localeCompare(b.fecha||''))
            .map(m=>{
              const a = contaGetAccountByKey(m.cuentaKey);
              return [
                m.fecha||'',
                a.tipo||'',
                (a.code? a.code+' — ':'') + a.name,
                m.tercero||'',
                m.factura||'',
                m.areteOficial||'',
                m.tipoProducto||'',
                m.refPago||'',
                Number(m.monto||0).toFixed(2),
                m.descripcion||'',
                m.usuario||''
              ];
            })
        ];
        contaDownloadCsv(`contabilidad_${year}.csv`, rows);
      });
    }

    const btnExportCuenta = document.getElementById('btn-conta-export-cuenta');
    if (btnExportCuenta){
      btnExportCuenta.addEventListener('click', ()=>{
        const year = Number(yearSel?.value || new Date().getFullYear());
        const key = document.getElementById('conta-rep-cuenta')?.value || '';
        if (!key){ alert('Selecciona una cuenta para exportar.'); return; }
        const acc = contaGetAccountByKey(key);
        const t = contaTotalsForYear(year);
        const rows = [
          ['Fecha','Cuenta','Proveedor/Cliente','Factura','Arete Oficial','Tipo producto','Ref pago','Monto','Descripción','Usuario'],
          ...t.ledger
            .filter(m=>m.cuentaKey===key)
            .slice().sort((a,b)=> (a.fecha||'').localeCompare(b.fecha||''))
            .map(m=>[
              m.fecha||'',
              (acc.code? acc.code+' — ':'') + acc.name,
              m.tercero||'',
              m.factura||'',
              m.areteOficial||'',
              m.tipoProducto||'',
              m.refPago||'',
              Number(m.monto||0).toFixed(2),
              m.descripcion||'',
              m.usuario||''
            ])
        ];
        const safeName = (acc.code || 'cuenta') + '_' + acc.name.replace(/\s+/g,'_').replace(/[^\w\-]/g,'');
        contaDownloadCsv(`conta_${year}_${safeName}.csv`, rows);
      });
    }

    // primera render
    contaRender();
  }
  // ===== /CONTABILIDAD =====


initContabilidad();
  manejarFormulario(
    'form-visitas',
    'pecuario_visitas',
    null,
    null,
    null
  );
  manejarFormulario(
    'form-bitacora',
    'pecuario_bitacora',
    'lista-seguridad',
    (b) => `Fecha ${b.fecha || '-'} ${b.hora || ''} | Evento: ${b.evento || '-'}`,
    null
  );

  manejarFormulario(
    'form-maquinaria',
    'pecuario_maquinaria',
    'lista-maquinaria',
    (m) => `${m.tipo || '-'} | ${m.desc || '-'} | Cant: ${m.cantidad || ''} | Últ. mantto: ${m.fechaMant || '-'}`,
    null
  );

  
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

