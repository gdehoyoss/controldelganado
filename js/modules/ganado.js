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

    initBajasForm();
    renderCabezasUI();
  }
  
  // ======================
  // Reproducción: autofill + proporciones de cruza
  // ======================
  const PROPS = [
    "1/32","3/32","5/32","7/32","9/32","11/32","13/32","15/32","31/32",
    "1/16","3/16","5/16","7/16","9/16","15/16",
    "1/8","3/8","5/8","7/8",
    "1/4","3/4",
    "1/3","2/3",
    "1/2",
    "1/1"
  ];
  function propToNum(s){
    const t = String(s||'').trim();
    if (!t) return 0;
    if (t.includes('/')){
      const [a,b] = t.split('/');
      const na = Number(a), nb = Number(b);
      if (!nb) return 0;
      return na/nb;
    }
    const n = Number(t);
    return isNaN(n) ? 0 : n;
  }
  function numToBestProp(n){
    // elige la opción más cercana
    let best = PROPS[PROPS.length-1], bestDiff = Infinity;
    PROPS.forEach(p=>{
      const d = Math.abs(propToNum(p) - n);
      if (d < bestDiff){ bestDiff = d; best = p; }
    });
    return best;
  }
  function ensurePropSelect(afterEl, name){
    if (!afterEl || afterEl.parentElement?.querySelector('select[data-prop="'+name+'"]')) return null;
    const sel = document.createElement('select');
    sel.dataset.prop = name;
    sel.className = 'selProp';
    sel.style.marginTop = '6px';
    sel.innerHTML = '<option value="">Proporción…</option>' + PROPS.map(p=>`<option>${p}</option>`).join('');
    afterEl.parentElement.appendChild(sel);
    return sel;
  }
