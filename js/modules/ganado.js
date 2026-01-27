// ======================
  // Animales
  // ======================
  
  // ======================
  // Animales: Inventario de bajas (ventas/salidas)
  // ======================
  const ANIMALES_BAJAS_KEY = 'pecuario_animales_bajas';

  function fmtAnimalLinea(a){
    const inv = (typeof resolverInventarioTipo === 'function') ? resolverInventarioTipo(a.inventarioTipo, '', a.grupo) : (a.inventarioTipo || '');
    return `Arete ${a.areteOficial || '-'} | Inventario: ${inv || '-'} | Sexo: ${a.sexo || '-'} | Raza: ${a.razaPre || '-'} | Cruza: ${[a.cruza1,a.cruza2].filter(Boolean).join(' / ') || '-'} | Grupo: ${a.grupo || '-'}`;
  }

  function fmtAnimalBajaLinea(a){
    const f = a._fechaBaja || '';
    const mot = a._motivoBaja || '';
    const cta = a._cuentaVenta || '';
    const m = (a._montoVenta !== undefined && a._montoVenta !== null && a._montoVenta !== '') ? a._montoVenta : '';
    const mt = (m !== '') ? ` | Monto: ${m}` : '';
    return `${fmtAnimalLinea(a)} | Baja: ${f || '-'}${mot ? ' | Motivo: ' + mot : ''}${cta ? ' | Cuenta: ' + cta : ''}${mt}`;
  }

  function getAnimalesBajas(){ return getData(ANIMALES_BAJAS_KEY) || []; }
  function setAnimalesBajas(arr){ setData(ANIMALES_BAJAS_KEY, arr || []); }


  // --- FIX (2026-01-20): limpiar lista de bajas corrupta (si alguien guardó inventario completo por error)
  function sanitizeBajas(){
    try{
      const bajas = getAnimalesBajas() || [];
      if (!bajas.length) return;
      const clean = bajas.filter(b=>{
        const a = String(b.areteOficial||'').trim();
        if (!a) return false;
        const info = b._baja || b.baja || null;
        const hasDecision = info && (String(info.motivo||info.causa||'').trim() || String(info.fecha||'').trim() || String(info.monto||'').trim());
        const cab = getCabeza(a);
        const isBaja = cab && cab.status === 'Baja';
        return hasDecision || isBaja;
      });
      if (clean.length !== bajas.length) setAnimalesBajas(clean);
    }catch(e){}
  }


  function animalEstaEnBajas(areteOficial){
    const a = (areteOficial||'').trim();
    if (!a) return false;
    return getAnimalesBajas().some(x => (x.areteOficial||'').trim() === a);
  }

  function reactivarAnimalDeBajas(areteOficial){
    const a = (areteOficial||'').trim();
    if (!a) return false;
    const bajas = getAnimalesBajas();
    const idx = bajas.findIndex(x => (x.areteOficial||'').trim() === a);
    if (idx < 0) return false;
    bajas.splice(idx, 1);
    setAnimalesBajas(bajas);
    pintarLista(ANIMALES_BAJAS_KEY,'lista-animales-bajas', fmtAnimalBajaLinea);
    return true;
  }

  function moverAnimalABajas(areteOficial, info){
    const a = (areteOficial||'').trim();
    if (!a) return false;

    // idempotencia: si ya está en bajas, solo actualiza metadata
    const bajas = getAnimalesBajas();
    const iExist = bajas.findIndex(x => (x.areteOficial||'').trim() === a);

    // toma datos desde Cabezas (si existe)
    const cab = getCabeza(a);
    const base = cab ? {
      areteOficial: cab.areteOficial,
      areteRancho: cab.areteRancho || '',
      sexo: cab.sexo || '',
      razaPre: cab.razaPre || '',
      cruza1: cab.cruza1 || '',
      cruza2: cab.cruza2 || '',
      fechaNac: cab.fechaNac || '',
      grupo: cab.grupo || '',
      obs: cab.obs || '',
      inventarioTipo: cab.inventarioTipo || ''
    } : { areteOficial: a };

    const rec = {
      ...base,
      _fechaRegistro: new Date().toISOString(),
      ...((typeof info === 'object' && info) ? { _baja: info } : {})
    };

    if (iExist >= 0) bajas[iExist] = rec;
    else bajas.push(rec);
    setAnimalesBajas(bajas);

    // marca cabeza como Baja y guarda detalle
    if (cab){
      const map = getCabezasMap();
      map[a] = { ...cab, status:'Baja', baja: { ...(info||{}), fecha: (info&&info.fecha)||'', motivo: (info&&info.motivo)||'' }, _updatedAt: new Date().toISOString() };
      if (!Array.isArray(map[a]._hist)) map[a]._hist = [];
      map[a]._hist.push({fecha:new Date().toISOString(), tipo:'Baja', reason:(info&&info.motivo)||'', cambios:{status:{de:'Activa',a:'Baja'}}, usuario: localStorage.getItem('pecuario_usuario_actual')||''});
      setCabezasMap(map);
    }

    // repintar UI
    if (typeof renderCabezasUI === 'function') renderCabezasUI();
    actualizarPanel();
    actualizarReportes();
    return true;
  }

  
  // ======================
  // Cabezas UI (Altas/Bajas/Pesajes/Cambios)
  // ======================
  let _cabezaEditando = null;

  function renderCabezasUI(){
    const obtenerTipoInventario = (c) => {
      if (typeof resolverInventarioTipo === 'function') return resolverInventarioTipo(c.inventarioTipo, '', c.grupo);
      return c.inventarioTipo || '';
    };
    // Inventario activo
    const cont = document.getElementById('lista-animales');
    if (cont){
      const filtro = (document.getElementById('selInventarioCabezas')?.value || 'Todos').trim();
      const arr = cabezasArray({includeBajas:false}).map(c=>({ ...c, inventarioTipo: obtenerTipoInventario(c) }))
        .slice().sort((a,b)=> (a.areteOficial||'').localeCompare(b.areteOficial||''));
      cont.innerHTML = '';
      const inventariosOrden = ['Ganado Reproducción','Ganado Comercial',''];
      const filtrar = (lista, tipo) => lista.filter(c => (obtenerTipoInventario(c) || '') === tipo);
      const renderLista = (lista) => {
        lista.forEach(c=>{
          const div = document.createElement('div');
          div.style.display='flex';
          div.style.justifyContent='space-between';
          div.style.gap='10px';
          div.style.alignItems='center';

          const left = document.createElement('div');
          const raz = [c.razaPre, c.cruza1, c.cruza2].filter(Boolean).join(' / ') || '-';
          const inv = obtenerTipoInventario(c);
          left.textContent = `Arete ${c.areteOficial} | Inventario: ${inv || '-'} | Sexo: ${c.sexo||'-'} | Raza: ${raz} | Grupo: ${c.grupo||'-'}`;

          const right = document.createElement('div');
          right.style.display='flex';
          right.style.gap='8px';

          const bEdit = document.createElement('button');
          bEdit.type='button';
          bEdit.className='btn-terciario';
          bEdit.textContent='Editar';
          bEdit.dataset.arete = c.areteOficial;
          bEdit.dataset.action = 'edit';

          const bBaja = document.createElement('button');
          bBaja.type='button';
          bBaja.className='btn-secundario';
          bBaja.textContent='Baja';
          bBaja.dataset.arete = c.areteOficial;
          bBaja.dataset.action = 'baja';

          right.appendChild(bEdit);
          right.appendChild(bBaja);

          div.appendChild(left);
          div.appendChild(right);
          cont.appendChild(div);
        });
      };
      if (!arr.length){
        cont.innerHTML = '<div>Sin registros.</div>';
      } else {
        if (filtro !== 'Todos') {
          const lista = filtrar(arr, filtro);
          if (!lista.length) cont.innerHTML = '<div>Sin registros.</div>';
          else renderLista(lista);
        } else {
          inventariosOrden.forEach(tipo=>{
            const lista = filtrar(arr, tipo);
            if (!lista.length) return;
            const titulo = document.createElement('div');
            titulo.style.marginTop = '6px';
            titulo.style.fontWeight = '600';
            titulo.textContent = tipo || 'Sin tipo';
            cont.appendChild(titulo);
            renderLista(lista);
          });
        }
      }
    }

    // Bajas
    const contB = document.getElementById('lista-animales-bajas');
    if (contB){
      const bajas = (getAnimalesBajas() || []).filter(b => String(b.areteOficial||'').trim());
      contB.innerHTML='';
      if (!bajas.length){
        contB.innerHTML = '<div>Sin registros.</div>';
      } else {
        const grupos = {
          'Ventas': [],
          'Muertes y desechos': [],
          'Extraviados': [],
          'Otros': []
        };
        bajas.slice().reverse().forEach(b=>{
          const info = b._baja || {};
          const motivoRaw = info.motivo || b.motivo || '';
          const categoria = (typeof normalizarMotivoBaja === 'function') ? normalizarMotivoBaja(motivoRaw) : 'Otros';
          grupos[categoria] = grupos[categoria] || [];
          grupos[categoria].push({ b, info, motivoRaw });
        });
        Object.keys(grupos).forEach(cat=>{
          const items = grupos[cat];
          if (!items || !items.length) return;
          const head = document.createElement('div');
          head.style.marginTop = '6px';
          head.style.fontWeight = '600';
          head.textContent = cat;
          contB.appendChild(head);
          items.forEach(({b, info, motivoRaw})=>{
            const div = document.createElement('div');
            const motivo = motivoRaw || '-';
            const fecha = info.fecha || b.fecha || '';
            const monto = (info.monto !== undefined && info.monto !== null && String(info.monto).trim()!=='') ? ` | Monto: ${fmtMXN(Number(info.monto)||0)}` : '';
            div.textContent = `Arete ${b.areteOficial||'-'} | Motivo: ${motivo} | Fecha: ${fecha||'-'}${monto}`;
            contB.appendChild(div);
          });
        });
      }
    }

    // Editados
    const contE = document.getElementById('lista-animales-editados');
    if (contE){
      const map = getCabezasMap();
      const editados = Object.values(map || {}).filter(c => Array.isArray(c._hist) && c._hist.some(h=>h.tipo === 'Edición'));
      contE.innerHTML = '';
      if (!editados.length){
        contE.innerHTML = '<div>Sin registros.</div>';
      } else {
        editados
          .slice()
          .sort((a,b)=> (a.areteOficial||'').localeCompare(b.areteOficial||''))
          .forEach(c=>{
            const edits = (c._hist||[]).filter(h=>h.tipo === 'Edición');
            const last = edits[edits.length - 1] || {};
            const fecha = (last.fecha||'').slice(0,10);
            const cambios = last.cambios ? Object.keys(last.cambios).filter(k=>k!=='_nuevo') : [];
            const div = document.createElement('div');
            div.textContent = `Arete ${c.areteOficial||'-'} | Última edición: ${fecha||'-'} | Cambios: ${cambios.join(', ') || '-'}`;
            contE.appendChild(div);
          });
      }
    }

    // Cambios de grupo
    const contC = document.getElementById('lista-cambios-grupo');
    if (contC){
      const cg = (getCambiosGrupo()||[]).slice().reverse();
      contC.innerHTML='';
      if (!cg.length){
        contC.innerHTML = '<div>Sin cambios.</div>';
      } else {
        cg.forEach(x=>{
          const d = (x.fecha||'').slice(0,10);
          const div = document.createElement('div');
          div.textContent = `${d} | Arete ${x.areteOficial} | De Grupo ${x.de||'-'} al Grupo ${x.a||'-'}${x.usuario?(' | '+x.usuario):''}`;
          contC.appendChild(div);
        });
      }
    }

    // refrescar selects
    if (typeof refrescarSelectorAnimalesCambioGrupo === 'function') refrescarSelectorAnimalesCambioGrupo();
  }

  function cargarCabezaEnFormulario(arete){
    const cab = getCabeza(arete);
    if (!cab) return;
    const form = document.getElementById('form-animales');
    if (!form) return;
    _cabezaEditando = cab.areteOficial;

    form.querySelector('[name="areteOficial"]').value = cab.areteOficial || '';
    form.querySelector('[name="areteRancho"]').value = cab.areteRancho || '';
    const invSel = form.querySelector('[name="inventarioTipo"]');
    if (invSel) invSel.value = (typeof resolverInventarioTipo === 'function') ? resolverInventarioTipo(cab.inventarioTipo, '', cab.grupo) : (cab.inventarioTipo || '');
    form.querySelector('[name="sexo"]').value = cab.sexo || '';
    const selPre = form.querySelector('[name="razaPre"]') || document.getElementById('selRazaPre');
    if (selPre) selPre.value = cab.razaPre || '';
    const selC1 = form.querySelector('[name="cruza1"]') || document.getElementById('selCruza1');
    if (selC1) selC1.value = cab.cruza1 || '';
    const selC2 = form.querySelector('[name="cruza2"]') || document.getElementById('selCruza2');
    if (selC2) selC2.value = cab.cruza2 || '';
    const fn = form.querySelector('[name="fechaNac"]'); if (fn) fn.value = cab.fechaNac || '';
    const g = form.querySelector('[name="grupo"]'); if (g) g.value = cab.grupo || '';
    const obs = form.querySelector('[name="obs"]'); if (obs) obs.value = cab.obs || '';

    pintarToast('Editando arete ' + cab.areteOficial);
  }

  function initBajasForm(){
    const f = document.getElementById('form-baja-cabeza');
    if (!f) return;
    const inpArete = document.getElementById('baja-arete');
    const inpFecha = document.getElementById('baja-fecha');
    if (inpFecha) inpFecha.value = new Date().toISOString().slice(0,10);

    function llenarDetalle(){
      const a = (inpArete?.value||'').trim();
      const cab = getCabeza(a);
      document.getElementById('baja-grupo').value = cab ? (cab.grupo||'') : '';
      document.getElementById('baja-sexo').value = cab ? (cab.sexo||'') : '';
      const raz = cab ? ([cab.razaPre, cab.cruza1, cab.cruza2].filter(Boolean).join(' / ')) : '';
      document.getElementById('baja-raza').value = raz || '';
    }
    if (inpArete) inpArete.addEventListener('change', llenarDetalle);

    const btnLim = document.getElementById('btn-baja-limpiar');
    if (btnLim) btnLim.addEventListener('click', ()=>{
      f.reset();
      if (inpFecha) inpFecha.value = new Date().toISOString().slice(0,10);
      ['baja-grupo','baja-sexo','baja-raza'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    });

    f.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const a = (inpArete?.value||'').trim();
      const causa = (document.getElementById('baja-causa').value||'').trim();
      const fecha = (document.getElementById('baja-fecha').value||'').trim() || new Date().toISOString().slice(0,10);
      const monto = (document.getElementById('baja-monto').value||'').trim();
      const cuenta = (document.getElementById('baja-cuenta').value||'').trim();
      const obs = (document.getElementById('baja-obs').value||'').trim();

      const cab = getCabeza(a);
      if (!cab || cab.status === 'Baja'){
        alert('Ese arete no existe en inventario activo.');
        return;
      }
      if (!causa){
        alert('Selecciona la causa.');
        return;
      }

      // mover a bajas (y marca en cabezas)
      moverAnimalABajas(a, {
        fecha,
        motivo: causa,
        monto: monto,
        obs,
        cuentaCode: cuenta
      });

      // si se capturó monto y cuenta, registra movimiento contable
      if (monto && cuenta){
        try{
          const acc = CONTA_ACCOUNTS.find(x=>x.code===cuenta);
          const mov = {
            id: 'AUTO-' + Math.random().toString(36).slice(2,10).toUpperCase(),
            fecha,
            tipo: acc ? acc.tipo : '',
            cuentaCodigo: cuenta,
            cuentaNombre: acc ? acc.name : '',
            tercero: '',
            factura: '',
            tipoProducto: '',
            areteOficial: a,
            refPago: '',
            descripcion: `Baja de cabeza (${causa}). ${obs||''}`.trim(),
            monto: Number(monto)||0,
            usuario: localStorage.getItem('pecuario_usuario_actual') || ''
          };
          const ledger = getContaLedger();
          ledger.push(mov);
          setContaLedger(ledger);
        } catch(e){}
      }

      renderCabezasUI();
      actualizarPanel();
      actualizarReportes();
      alert('Baja guardada.');
      f.reset();
      if (inpFecha) inpFecha.value = new Date().toISOString().slice(0,10);
      ['baja-grupo','baja-sexo','baja-raza'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    });
  }

  function initCabezasModule(){
    
    sanitizeBajas();
migrarCabezasLegacy();

    const form = document.getElementById('form-animales');
    if (form){
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const fd = new FormData(form);
        const obj = {};
        fd.forEach((v,k)=> obj[k]=v);
        if (!obj.grupo){
          alert('Selecciona un grupo (obligatorio). Puedes usar "En espera" si aún no defines el grupo.');
          return;
        }
        if (!obj.inventarioTipo){
          alert('Selecciona el tipo de inventario.');
          return;
        }
        const arete = String(obj.areteOficial||'').trim();
        if (!arete){
          alert('Arete oficial requerido.');
          return;
        }
        const reason = (_cabezaEditando && _cabezaEditando === arete) ? 'Edición' : 'Alta';
        const res = upsertCabeza(obj, {mode:'upsert', reason});
        if (!res.ok){
          alert(res.msg||'No se pudo guardar');
          return;
        }
        _cabezaEditando = null;
        form.reset();
        const notaUlt = document.getElementById('notaUltimoArete');
        if (notaUlt) {
          const txt = `Último arete registrado: ${arete}`;
          notaUlt.textContent = txt;
          localStorage.setItem('pecuario_ultimo_arete', arete);
        }
        renderCabezasUI();
        actualizarPanel();
        actualizarReportes();
        alert('Registro guardado.');
      });
    }

    // acciones en inventario
    const cont = document.getElementById('lista-animales');
    if (cont){
      cont.addEventListener('click', (ev)=>{
        const btn = ev.target.closest('button');
        if (!btn) return;
        const arete = btn.dataset.arete;
        const act = btn.dataset.action;
        if (!arete || !act) return;
        if (act === 'edit'){
          cargarCabezaEnFormulario(arete);
          // cambia al subtab de altas
          const mod = document.getElementById('mod-animales');
          const b = mod?.querySelector('.subtabs button[data-sub="anim-altas"]');
          if (b) b.click();
        } else if (act === 'baja'){
          const mod = document.getElementById('mod-animales');
          const b = mod?.querySelector('.subtabs button[data-sub="anim-bajas"]');
          if (b) b.click();
          const inp = document.getElementById('baja-arete');
          if (inp){ inp.value = arete; inp.dispatchEvent(new Event('change')); inp.focus(); }
        }
      });
    }

    // Cambios de grupo
    const btnCG = document.getElementById('btnCambiarGrupoAnimal');
    if (btnCG){
      btnCG.addEventListener('click', ()=>{
        const selA = document.getElementById('selAnimalCambioGrupo');
        const selG = document.getElementById('selNuevoGrupoAnimal');
        if (!selA || !selG) return;
        const r = registrarCambioGrupo(selA.value, '', selG.value);
        if (!r.ok){
          alert(r.msg || 'No se pudo guardar el cambio.');
          return;
        }
        // actualiza selector texto
        renderCabezasUI();
        actualizarPanel();
        actualizarReportes();
        alert('Cambio de grupo guardado.');
      });
    }

    const selInv = document.getElementById('selInventarioCabezas');
    if (selInv) selInv.addEventListener('change', renderCabezasUI);

    const notaUlt = document.getElementById('notaUltimoArete');
    if (notaUlt) {
      const ultimo = localStorage.getItem('pecuario_ultimo_arete') || '';
      notaUlt.textContent = ultimo ? `Último arete registrado: ${ultimo}` : '';
    }

    initBajasForm();
    renderCabezasUI();
  }
  
  
