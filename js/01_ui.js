  function initSubtabs(scopeEl) {
    if (!scopeEl) return;
    const btns = scopeEl.querySelectorAll('.subtabs button');
    btns.forEach(b => {
      b.addEventListener('click', () => {
        const sub = b.getAttribute('data-sub');
        btns.forEach(x => x.classList.remove('activo'));
        b.classList.add('activo');

        scopeEl.querySelectorAll('.submodulo').forEach(sm => sm.classList.remove('activo'));
        const target = scopeEl.querySelector('#sub-' + sub);
        if (target) target.classList.add('activo');
      });
    });
  }
  initSubtabs(document.getElementById('mod-animales'));
  initSubtabs(document.getElementById('mod-potreros'));

  // ======================
  // Formularios base
  // ======================
  function limpiarFormulario(idForm) {
    const form = document.getElementById(idForm);
    if (form) form.reset();
  }

  function manejarFormulario(idForm, storageKey, idLista, formatearLinea, extraCallback, validateCallback) {
    const form = document.getElementById(idForm);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const datos = new FormData(form);
      const obj = {};
      datos.forEach((val, key) => { obj[key] = val; });
      if (typeof validateCallback === 'function') { if (validateCallback(obj, form) === false) return; }

      const lista = getData(storageKey);
      obj._fechaRegistro = new Date().toISOString();
      lista.push(obj);
      setData(storageKey, lista);
      if (idLista) pintarLista(storageKey, idLista, formatearLinea);
      form.reset();
      actualizarPanel();
      actualizarReportes();
      if (extraCallback) extraCallback(obj, lista);
      alert('Registro guardado.');
    });
    if (idLista) pintarLista(storageKey, idLista, formatearLinea);
  }

  function pintarLista(storageKey, idLista, formatearLinea) {
    const cont = document.getElementById(idLista);
    if (!cont) return;
    const lista = getData(storageKey);
    cont.innerHTML = '';
    if (!lista.length) {
      cont.innerHTML = '<div>Sin registros.</div>';
      return;
    }
    lista.slice().reverse().forEach(item => {
      const div = document.createElement('div');
      div.textContent = formatearLinea ? formatearLinea(item) : JSON.stringify(item);
      cont.appendChild(div);
    });
  }

  // ======================
  // Migración simple v39 -> v40 (no borra datos, solo copia si no hay nuevos)
  // ======================
  (function migracion(){
    const oldPesos = getData('pecuario_pesos'); // v38
    const newInd = getData('pecuario_pesaje_ind');
    if (oldPesos.length && !newInd.length) {
      const conv = oldPesos.map(p => ({
        areteOficial: p.areteOficial || '',
        areteRancho: '',
        sexo: '',
        fecha: p.fecha || '',
        peso: p.peso || '',
        ubicacion: p.lote || '',
        obs: p.obs || '',
        _fechaRegistro: p._fechaRegistro || new Date().toISOString()
      }));
      setData('pecuario_pesaje_ind', conv);
    }
  })();

  // ======================
  // Animales
  // ======================
  
  // ======================
  // Animales: Inventario de bajas (ventas/salidas)
  // ======================
  const ANIMALES_BAJAS_KEY = 'pecuario_animales_bajas';

  function fmtAnimalLinea(a){
    return `Arete ${a.areteOficial || '-'} | Sexo: ${a.sexo || '-'} | Raza: ${a.razaPre || '-'} | Cruza: ${[a.cruza1,a.cruza2].filter(Boolean).join(' / ') || '-'} | Grupo: ${a.grupo || '-'}`;
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
      obs: cab.obs || ''
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
    // Inventario activo
    const cont = document.getElementById('lista-animales');
    if (cont){
      const arr = cabezasArray({includeBajas:false}).slice().sort((a,b)=> (a.areteOficial||'').localeCompare(b.areteOficial||''));
      cont.innerHTML = '';
      if (!arr.length){
        cont.innerHTML = '<div>Sin registros.</div>';
      } else {
        arr.forEach(c=>{
          const div = document.createElement('div');
          div.style.display='flex';
          div.style.justifyContent='space-between';
          div.style.gap='10px';
          div.style.alignItems='center';

          const left = document.createElement('div');
          const raz = [c.razaPre, c.cruza1, c.cruza2].filter(Boolean).join(' / ') || '-';
          left.textContent = `Arete ${c.areteOficial} | Sexo: ${c.sexo||'-'} | Raza: ${raz} | Grupo: ${c.grupo||'-'}`;

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
      }
    }

    // Bajas
    const contB = document.getElementById('lista-animales-bajas');
    if (contB){
      const bajas = getAnimalesBajas() || [];
      contB.innerHTML='';
      if (!bajas.length){
        contB.innerHTML = '<div>Sin registros.</div>';
      } else {
        bajas.slice().reverse().forEach(b=>{
          const div = document.createElement('div');
          const info = b._baja || {};
          const motivo = info.motivo || b.motivo || '-';
          const fecha = info.fecha || b.fecha || '';
          const monto = (info.monto !== undefined && info.monto !== null && String(info.monto).trim()!=='') ? ` | Monto: ${fmtMXN(Number(info.monto)||0)}` : '';
          div.textContent = `Arete ${b.areteOficial||'-'} | Motivo: ${motivo} | Fecha: ${fecha||'-'}${monto}`;
          contB.appendChild(div);
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
          div.textContent = `${d} | Arete ${x.areteOficial} | ${x.de||'-'} → ${x.a||'-'}${x.usuario?(' | '+x.usuario):''}`;
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

