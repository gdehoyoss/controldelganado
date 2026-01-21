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
    };

    // inicial
    refrescarCatalogo();
    refrescarCorralesSupl();
    refrescarCabezas();
    renderSuministros();
  })();

  // --------- Nacimientos: salud "Otro" ----------
  (function initNacimientos(){
    const sel = document.getElementById('selSaludNac');
    const wrap = document.getElementById('wrapSaludOtro');
    if (!sel || !wrap) return;
    const on = ()=>{ wrap.style.display = (sel.value==='Otro') ? 'block' : 'none'; };
    sel.addEventListener('change', on);
    on();
  })();

  // --------- Sanidad: Enfermedad "Otro" ----------
  (function initSanidadEnfermedad(){
    const sel = document.getElementById('selEnfSan');
    const wrap = document.getElementById('wrapEnfSanOtro');
    const form = document.getElementById('form-sanidad');
    if (!sel || !wrap) return;
    const on = ()=>{ wrap.style.display = (sel.value==='Otro') ? 'block' : 'none'; };
    sel.addEventListener('change', on);
    if (form) form.addEventListener('reset', ()=>setTimeout(on,0));
    on();
  })();


  
;

  
  // --------- Pronóstico 7 días (Panel) - Open-Meteo ----------
  (function initPronosticoPanel(){
    const btnPerm = document.getElementById('btnPermitirUbicacion');
    const btnUpd  = document.getElementById('btnActualizarPronostico');
    const grid    = document.getElementById('wx7');
    const status  = document.getElementById('wxStatus');
    let accumEl = document.getElementById("wxAccum");
    if (!btnPerm || !btnUpd || !grid) return;

    const W = {
      0:'Despejado', 1:'Mayormente despejado', 2:'Parcialmente nublado', 3:'Nublado',
      45:'Niebla', 48:'Niebla escarchada',
      51:'Llovizna ligera', 53:'Llovizna', 55:'Llovizna intensa',
      61:'Lluvia ligera', 63:'Lluvia', 65:'Lluvia intensa',
      71:'Nieve ligera', 73:'Nieve', 75:'Nieve intensa',
      80:'Chubascos ligeros', 81:'Chubascos', 82:'Chubascos intensos',
      95:'Tormenta', 96:'Tormenta con granizo', 99:'Tormenta con granizo'
    };
    const D = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

    const iconSvg = (kind) => {
      if (kind === 'sun') return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" stroke="#8b4513" stroke-width="2"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M19.8 4.2l-2.1 2.1M6.3 17.7l-2.1 2.1"
            stroke="#8b4513" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      if (kind === 'rain') return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7.5 18.5h9.2a4.3 4.3 0 0 0 0-8.6h-.4A5.6 5.6 0 0 0 6 10.6a3.9 3.9 0 0 0 1.5 7.9z"
            stroke="#4b3b2d" stroke-width="2" stroke-linejoin="round"/>
          <path d="M9 20.5l-1 2M13 20.5l-1 2M17 20.5l-1 2" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7.5 18.5h9.2a4.3 4.3 0 0 0 0-8.6h-.4A5.6 5.6 0 0 0 6 10.6a3.9 3.9 0 0 0 1.5 7.9z"
            stroke="#4b3b2d" stroke-width="2" stroke-linejoin="round"/>
        </svg>`;
    };

    const kindFromCode = (code) => {
      code = Number(code);
      if (code === 0 || code === 1) return 'sun';
      if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloud';
      if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return 'rain';
      return 'cloud';
    };

    const fmtYMD = (d)=>{
      const z=(n)=>String(n).padStart(2,'0');
      return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
    };

    let lastPos = null;

    // --- FIX: obtener temperatura actual (panel) con Open-Meteo "current"
    async function fetchTempActual(p){
      try{
        if (!p || p.lat===undefined || p.lon===undefined) return;
        const lat = p.lat, lon = p.lon;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`;
        const r = await fetch(url);
        if (!r.ok) return;
        const data = await r.json();
        if (data && data.current && data.current.temperature_2m !== undefined){
          const t = data.current.temperature_2m;
          localStorage.setItem('pecuario_temp_actual', String(t));
          const elTemp = document.getElementById('pnl-temp');
          if (elTemp) elTemp.textContent = String(t) + ' °C';
        }
      }catch(e){}
    }

    async function ensurePos(){
      try{
        if (status) status.textContent = 'Solicitando ubicación…';
        const p = await geoGetPoint();
        lastPos = p;
        if (status) status.textContent = `Ubicación OK (±${Math.round(p.acc||0)}m).`;
        fetchTempActual(p);
        return p;

      } catch (e) {
        if (status) status.textContent = 'Ubicación no disponible. Revisa permisos del navegador.';
        throw e;
      }
    }

    async function cargarAcumuladoAnual(p){
      if (!accumEl) return;
      try{
        const today = new Date();
        const year = today.getFullYear();
        const start = `${year}-01-01`;
        const end = fmtYMD(today);
        accumEl.textContent = 'Calculando acumulado anual…';
        const urlA = `https://archive-api.open-meteo.com/v1/archive?latitude=${p.lat}&longitude=${p.lon}&start_date=${start}&end_date=${end}&daily=precipitation_sum&timezone=auto`;
        const rA = await fetch(urlA);
        if (!rA.ok) throw new Error('Error acumulado');
        const dA = await rA.json();
        const ps = (dA.daily && dA.daily.precipitation_sum) ? dA.daily.precipitation_sum : [];
        const sum = (ps||[]).reduce((a,b)=>a + (Number(b)||0), 0);
        accumEl.textContent = `Acumulado lluvia ${year} (1 Ene – ${end}): ${sum.toFixed(1)} mm`;
      } catch(e){
        accumEl.textContent = 'Acumulado anual: —';
      }
    }

    async function cargar(){
      try{
        const p = lastPos || await ensurePos();
        grid.innerHTML = '<div class="nota">Cargando pronóstico…</div>';

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        const r = await fetch(url);
        if (!r.ok) throw new Error('Error al consultar clima');
        const data = await r.json();

        // guarda temperatura actual para Panel
        try{
          if (data.current && (data.current.temperature_2m !== undefined)){
            localStorage.setItem('pecuario_temp_actual', String(data.current.temperature_2m));
          }
        }catch(e){}

        const daily = data.daily || {};
        const fechas = (daily.time || []).slice(0, 7);
        const tmax = (daily.temperature_2m_max || []).slice(0, 7);
        const tmin = (daily.temperature_2m_min || []).slice(0, 7);
        const code = (daily.weathercode || []).slice(0, 7);
        const rain = (daily.precipitation_sum || []).slice(0, 7);

        if (!fechas.length) {
          grid.innerHTML = '<div class="nota">Sin datos de pronóstico.</div>';
          return;
        }

        grid.innerHTML = '';

        // Re-crear el acumulado anual (se borra al limpiar el grid)
        accumEl = document.createElement('div');
        accumEl.className = 'wx-accum';
        accumEl.id = 'wxAccum';
        accumEl.textContent = 'Acumulado anual: —';
        
        fechas.forEach((iso, i)=>{
          const d = new Date(String(iso) + 'T12:00:00');
          const dayName = D[d.getDay()] || String(iso);
          const dayNum = d.getDate();
          const day = `${dayName} ${dayNum}`;
          const kind = kindFromCode(code[i]);
          const desc = W[code[i]] || '';
          const mm = Number(rain[i] ?? 0);

          const card = document.createElement('div');
          card.className = 'wx-card';
          card.innerHTML = `
            <div class="wx-day">${day}</div>
            <div class="wx-icon" title="${desc}">${iconSvg(kind)}</div>
            <div class="wx-temp">${Math.round(tmax[i])}° <small>/ ${Math.round(tmin[i])}°</small></div>
            <div class="wx-rain">${mm.toFixed(1)} mm</div>
          `;
          grid.appendChild(card);
        });

                // Poner el acumulado al final de las tarjetas
        if (accumEl && !accumEl.isConnected) grid.appendChild(accumEl);

        await cargarAcumuladoAnual(p);

        if (status) status.textContent = `Actualizado: ${new Date().toLocaleString()}`;
      } catch (e) {
        grid.innerHTML = '<div class="nota">No se pudo cargar el pronóstico. Revisa internet y permisos de ubicación.</div>';
        if (accumEl) accumEl.textContent = 'Acumulado anual: —';
      }
    }

    btnPerm.addEventListener('click', async ()=>{ try { await ensurePos(); await cargar(); } catch(e){} });
    btnUpd.addEventListener('click', cargar);
  })();
// --------- Usuarios y permisos ----------
  const MODS = [
    {id:'panel', label:'Panel'},
    {id:'animales', label:'Animales'},
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
    return (arr||[]).map((u)=>{
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

  function getUsuarios(){ return normalizeUsuarios(getData('pecuario_usuarios') || []); }
  function setUsuarios(u){ setData('pecuario_usuarios', normalizeUsuarios(u)); }

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
      d.textContent = `${u.nombre} | ${u.rol} | Estado: ${u.activo} | Permisos: ${perms}`;
      cont.appendChild(d);
    });
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
      usuarios.push(obj);
      setUsuarios(usuarios);
      pintarToast('Usuario guardado');
      form.reset();
      renderPermisosCheckboxes();
      renderListaUsuarios();
      llenarUsuariosHeader();
      aplicarPermisos();
      if (typeof poblarSelectUsuariosAsignacion === 'function') poblarSelectUsuariosAsignacion();
      if (window.renderTareasUI) window.renderTareasUI();
    });
  })();


  
  // --- FIX (2026-01-20): al abrir la app, intenta mostrar temperatura actual (si ya hay permiso o coords cacheadas)
  (function(){
    const run = async ()=>{
      const elTemp = document.getElementById('pnl-temp');
      if (elTemp){
        const t = localStorage.getItem('pecuario_temp_actual');
        elTemp.textContent = t ? (t + ' °C') : '—';
      }
      try{
        const raw = localStorage.getItem('pecuario_geo_cache');
        if (raw){
          const p = JSON.parse(raw);
          if (p && p.lat && p.lon) fetchTempActual(p);
        }
      }catch(e){}
    };
    window.addEventListener('load', ()=>{ setTimeout(run, 200); });
  })();
