// ======================
// Contabilidad (Ingresos/Egresos contra Caja y Bancos)
// ======================

const CONTA_LEDGER_KEY  = 'pecuario_conta_ledger';
const CONTA_OPEN_KEY    = 'pecuario_conta_opening';
const CONTA_CLOSED_KEY  = 'pecuario_conta_closed';

const CONTA_ACCOUNTS = [
  // ===================== CUENTAS DE RESULTADOS — INGRESOS (con efectivo)
  { tipo:'Ingreso', grupo:'Resultados', code:'RI-01',  name:'Insumos' },
  { tipo:'Ingreso', grupo:'Resultados', code:'RIG-01', name:'Intereses ganados' },
  { tipo:'Ingreso', grupo:'Resultados', code:'RAS-01', name:'Apoyos y subsidios' },
  { tipo:'Ingreso', grupo:'Resultados', code:'RIV-01', name:'Ingresos varios' },

  // ===================== CUENTAS DE BALANCE — INGRESOS (con efectivo)
  { tipo:'Ingreso', grupo:'Balance', code:'BP-01',  name:'Patrimonio (aportaciones en efectivo)', balanceClass:'Equity' },
  { tipo:'Ingreso', grupo:'Balance', code:'BPB-01', name:'Préstamos Bancarios', balanceClass:'Liability' },
  { tipo:'Ingreso', grupo:'Balance', code:'BGR-01', name:'Ganado Reproducción (venta)', balanceClass:'Asset' },
  { tipo:'Ingreso', grupo:'Balance', code:'BGC-01', name:'Ganado Comercial (venta)', balanceClass:'Asset' },

  // ===================== CUENTAS DE RESULTADOS — EGRESOS (con efectivo)
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
  { tipo:'Egreso', grupo:'Resultados', code:'RGI-01',  name:'Gastos por intereses' },
  { tipo:'Egreso', grupo:'Resultados', code:'RFG-01',  name:'Fletes Ganado' },
  { tipo:'Egreso', grupo:'Resultados', code:'RFA-01',  name:'Fletes Alimento' },
  { tipo:'Egreso', grupo:'Resultados', code:'ROG-01',  name:'Otros Gastos' },

  // ===================== CUENTAS DE BALANCE — EGRESOS (con efectivo)
  { tipo:'Egreso', grupo:'Balance', code:'BP-01',  name:'Devoluciones Patrimonio', balanceClass:'Equity' },
  { tipo:'Egreso', grupo:'Balance', code:'BPB-02', name:'Pagos préstamos Bancarios', balanceClass:'Liability' },
  { tipo:'Egreso', grupo:'Balance', code:'BOG-01', name:'Otros Pagos', balanceClass:'Liability' },

  // Adquisición de Activos (erogación de efectivo, incrementa activos)
  { tipo:'Egreso', grupo:'Balance', code:'BME-01', name:'Maquinaria y Equipo (adquisición)', balanceClass:'Asset' },
  { tipo:'Egreso', grupo:'Balance', code:'BCI-01', name:'Corrales e Instalaciones (adquisición)', balanceClass:'Asset' },
  { tipo:'Egreso', grupo:'Balance', code:'BTE-01', name:'Terrenos y Edificios (adquisición)', balanceClass:'Asset' },
  { tipo:'Egreso', grupo:'Balance', code:'BGR-01', name:'Ganado Reproducción (adquisición)', balanceClass:'Asset' },

  // ===================== CUENTAS DE BALANCE — SIN EFECTIVO
  { tipo:'Sin efectivo', grupo:'Balance', code:'BGR-01', name:'Ganado Reproducción (ajuste + sin efectivo)', balanceClass:'Asset', balanceEffect: 1, impactoCaja:false },
  { tipo:'Sin efectivo', grupo:'Balance', code:'BGR-01', name:'Ganado Reproducción (ajuste - sin efectivo)', balanceClass:'Asset', balanceEffect:-1, impactoCaja:false },
  { tipo:'Sin efectivo', grupo:'Balance', code:'BGC-01', name:'Ganado Comercial (ajuste + sin efectivo)', balanceClass:'Asset', balanceEffect: 1, impactoCaja:false },
  { tipo:'Sin efectivo', grupo:'Balance', code:'BGC-01', name:'Ganado Comercial (ajuste - sin efectivo)', balanceClass:'Asset', balanceEffect:-1, impactoCaja:false },
  { tipo:'Sin efectivo', grupo:'Balance', code:'BME-01', name:'Maquinaria y Equipo (aportación sin efectivo)', balanceClass:'Asset', balanceEffect: 1, impactoCaja:false },
  { tipo:'Sin efectivo', grupo:'Balance', code:'BCI-01', name:'Corrales e Instalaciones (aportación sin efectivo)', balanceClass:'Asset', balanceEffect: 1, impactoCaja:false },
  { tipo:'Sin efectivo', grupo:'Balance', code:'BTE-01', name:'Terrenos y Edificios (aportación sin efectivo)', balanceClass:'Asset', balanceEffect: 1, impactoCaja:false },
  { tipo:'Sin efectivo', grupo:'Balance', code:'BOA-01', name:'Otros Activos (aportación sin efectivo)', balanceClass:'Asset', balanceEffect: 1, impactoCaja:false },
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

function contaFindLedgerIndex(id){
  const ledger = getContaLedger();
  const idx = ledger.findIndex(m=>m.id===id);
  return { ledger, idx };
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
    const impactaCaja = acc && acc.impactoCaja !== false && (acc.tipo === 'Ingreso' || acc.tipo === 'Egreso');
    if (!impactaCaja) return;
    if (acc.tipo === 'Ingreso') tin += amt;
    else tout += amt;
  });
  const opening = contaGetOpening(year);
  const cash = opening + tin - tout;
  return { ledger, opening, tin, tout, cash, net: tin - tout };
}

function contaAssetEffect(acc){
  if (!acc) return 0;
  if (typeof acc.balanceEffect === 'number') return acc.balanceEffect;
  if (acc.tipo === 'Egreso') return 1;
  if (acc.tipo === 'Ingreso') return -1;
  return 0;
}

function contaLiabilityEffect(acc){
  if (!acc) return 0;
  if (typeof acc.balanceEffect === 'number') return acc.balanceEffect;
  if (acc.tipo === 'Ingreso') return 1;
  if (acc.tipo === 'Egreso') return -1;
  return 0;
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
    { tipo:'Sin efectivo', grupo:'Balance', label:'Sin efectivo — Balance' },
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
  if (estado==='sin-efectivo') rows = rows.filter(m=>contaGetAccountByKey(m.cuentaKey).tipo==='Sin efectivo');
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
      const canActions = canEdit && !isClosed;
      const actionBtn = canActions
        ? `<button type="button" class="btn-terciario conta-row-action conta-edit-btn" data-id="${escapeHtml(m.id||'')}">⋮</button>`
        : '';
      return `<tr>
        <td>${escapeHtml(m.fecha||'')}</td>
        <td>${escapeHtml((a.code? a.code+' — ':'') + a.name)}</td>
        <td>${escapeHtml(a.tipo||'')}</td>
        <td>${escapeHtml(m.areteOficial||'')}</td>
        <td>${escapeHtml(m.tercero||'')}</td>
        <td>${escapeHtml(m.factura||'')}</td>
        <td>${escapeHtml(m.tipoProducto||'')}</td>
        <td>${escapeHtml(m.refPago||'')}</td>
        <td style="text-align:right;">${escapeHtml(inCol)}</td>
        <td style="text-align:right;">${escapeHtml(outCol)}</td>
        <td>${escapeHtml(m.descripcion||'')}</td>
        <td>${actionBtn}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="12" class="muted">Sin movimientos en este ejercicio.</td></tr>`;
  }

  // Resumen por cuenta
  const resumenBody = document.getElementById('conta-resumen-tbody');
  if (resumenBody){
    const map = new Map(); // key -> {in,out,adj}
    t.ledger.forEach(m=>{
      const a = contaGetAccountByKey(m.cuentaKey);
      const k = m.cuentaKey;
      if (!map.has(k)) map.set(k, { a, in:0, out:0, adj:0 });
      const obj = map.get(k);
      const amt = Number(m.monto||0);
      if (a.tipo==='Ingreso') obj.in += amt;
      else if (a.tipo==='Egreso') obj.out += amt;
      else obj.adj += (typeof a.balanceEffect === 'number' ? a.balanceEffect * amt : amt);
    });

    const arr = Array.from(map.values()).sort((x,y)=> (x.a.tipo + x.a.code + x.a.name).localeCompare(y.a.tipo + y.a.code + y.a.name));
    resumenBody.innerHTML = arr.map(x=>{
      const net = x.in - x.out + x.adj;
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
    assets: {'BGR-01':0,'BGC-01':0,'BME-01':0,'BCI-01':0,'BTE-01':0,'BOA-01':0},
    loan: 0,
    equity: 0
  };

  const nameByCode = {};
  CONTA_ACCOUNTS.forEach(a=>{
    if (a.grupo==='Balance'){
      const baseName = String(a.name || '').replace(/\s*\(.*\)$/, '').trim() || a.name;
      nameByCode[a.code] = nameByCode[a.code] || baseName;
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
        bal.assets[code] += contaAssetEffect(acc) * amt;
      }
    } else if (cls==='Liability'){
      if (code === 'BPB-01' || code === 'BPB-02'){
        bal.loan += contaLiabilityEffect(acc) * amt;
      }
    } else if (cls==='Equity'){
      if (code==='BP-01'){
        bal.equity += contaLiabilityEffect(acc) * amt;
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
    const order = ['BGR-01','BGC-01','BME-01','BCI-01','BTE-01','BOA-01'];
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
  const tbody = document.getElementById('conta-tbody');

  const selCuenta = document.getElementById('conta-cuenta');
  const editModal = document.getElementById('modalContaEdit');
  const editForm = document.getElementById('form-conta-edit');
  const editCuenta = document.getElementById('conta-edit-cuenta');
  const editCerrar = document.getElementById('btn-conta-edit-cerrar');
  const editDelete = document.getElementById('btn-conta-edit-delete');
  const editAreteWrap = document.getElementById('conta-edit-arete-wrap');
  const editAreteInp = editAreteWrap ? editAreteWrap.querySelector('input[name="areteOficial"]') : null;

  // Arete oficial (solo ventas de animal)
  const areteWrap = document.getElementById('conta-arete-wrap');
  const areteInp = areteWrap ? areteWrap.querySelector('input[name="areteOficial"]') : null;

  function contaIsVentaAnimal(acc){
    const code = String(acc?.code || '').trim();
    return acc?.tipo === 'Ingreso' && ['BGR-01','BGC-01'].includes(code);
  }
  function contaToggleArete(){
    if (!areteWrap || !selCuenta) return;
    const acc = contaGetAccountByKey(selCuenta.value || '');
    const code = String(acc?.code || '').trim();
    const show = !!acc && (contaIsVentaAnimal(acc) || code === 'RMD-01');
    areteWrap.style.display = show ? '' : 'none';
    if (!show && areteInp) areteInp.value = '';
  }
  function contaToggleAreteEdit(){
    if (!editAreteWrap || !editCuenta) return;
    const acc = contaGetAccountByKey(editCuenta.value || '');
    const code = String(acc?.code || '').trim();
    const show = !!acc && (contaIsVentaAnimal(acc) || code === 'RMD-01');
    editAreteWrap.style.display = show ? '' : 'none';
    if (!show && editAreteInp) editAreteInp.value = '';
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
  contaFillAccountSelect(editCuenta, { includeAll:false, includeLegacy:true });
  if (editCuenta) editCuenta.addEventListener('change', contaToggleAreteEdit);
  contaToggleAreteEdit();
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

  function contaOpenEditModal(mov){
    if (!editModal || !editForm || !mov) return;
    editForm.reset();
    editForm.querySelector('input[name="id"]').value = mov.id || '';
    editForm.querySelector('input[name="fecha"]').value = mov.fecha || '';
    editForm.querySelector('select[name="cuentaKey"]').value = mov.cuentaKey || '';
    editForm.querySelector('input[name="monto"]').value = String(mov.monto ?? '');
    editForm.querySelector('input[name="tercero"]').value = mov.tercero || '';
    editForm.querySelector('input[name="factura"]').value = mov.factura || '';
    editForm.querySelector('input[name="tipoProducto"]').value = mov.tipoProducto || '';
    editForm.querySelector('select[name="refPago"]').value = mov.refPago || '';
    editForm.querySelector('textarea[name="descripcion"]').value = mov.descripcion || '';
    if (editAreteInp) editAreteInp.value = mov.areteOficial || '';
    contaToggleAreteEdit();
    editModal.classList.add('activo');
  }
  function contaCloseEditModal(){
    if (!editModal) return;
    editModal.classList.remove('activo');
  }

  if (tbody){
    tbody.addEventListener('click', (e)=>{
      const btn = e.target?.closest('.conta-edit-btn');
      if (!btn) return;
      if (!contaCanEdit()) return;
      const year = Number(yearSel?.value || new Date().getFullYear());
      if (contaIsClosed(year)){
        alert('Este ejercicio está cerrado. Reabre para editar.');
        return;
      }
      const id = btn.dataset.id || '';
      const { ledger, idx } = contaFindLedgerIndex(id);
      if (idx < 0) return;
      contaOpenEditModal(ledger[idx]);
    });
  }

  if (editCerrar) editCerrar.addEventListener('click', contaCloseEditModal);
  if (editModal){
    editModal.addEventListener('click', (e)=>{
      if (e.target === editModal) contaCloseEditModal();
    });
  }
  if (editDelete){
    editDelete.addEventListener('click', ()=>{
      if (!contaCanEdit()) return;
      const year = Number(yearSel?.value || new Date().getFullYear());
      if (contaIsClosed(year)){
        alert('Este ejercicio está cerrado. Reabre para eliminar.');
        return;
      }
      const id = editForm?.querySelector('input[name="id"]')?.value || '';
      if (!id) return;
      if (!confirm('¿Eliminar este movimiento?')) return;
      const { ledger, idx } = contaFindLedgerIndex(id);
      if (idx < 0) return;
      ledger.splice(idx, 1);
      setContaLedger(ledger);
      contaCloseEditModal();
      contaRender();
      actualizarPanel();
      actualizarReportes();
    });
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

      // Si es venta de animal (BGR-01/BGC-01) o baja por RMD-01, y el arete existe en inventario, muévelo a Bajas
      const accCode = String(acc.code||'').trim();
      const esVentaAnimal = contaIsVentaAnimal(acc);
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

  if (editForm){
    editForm.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      if (!contaCanEdit()) return;
      const year = Number(yearSel?.value || new Date().getFullYear());
      if (contaIsClosed(year)){
        alert('Este ejercicio está cerrado. Reabre para editar movimientos.');
        return;
      }

      const fd = new FormData(editForm);
      const id = String(fd.get('id')||'').trim();
      const fechaVal = String(fd.get('fecha')||'').trim();
      const cuentaKey = String(fd.get('cuentaKey')||'').trim();
      const monto = Number(fd.get('monto')||0);

      if (!id || !fechaVal || !cuentaKey || !Number.isFinite(monto)){
        alert('Completa fecha, cuenta y monto.');
        return;
      }

      const { ledger, idx } = contaFindLedgerIndex(id);
      if (idx < 0) return;

      const acc = contaGetAccountByKey(cuentaKey);
      ledger[idx] = {
        ...ledger[idx],
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
        monto: monto
      };

      setContaLedger(ledger);
      contaCloseEditModal();
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

initContabilidad();
