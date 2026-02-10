// ======================
// Contabilidad (Ingresos/Egresos contra Caja y Bancos)
// ======================

const CONTA_LEDGER_KEY = 'pecuario_conta_ledger';
const CONTA_OPEN_KEY = 'pecuario_conta_opening';
const CONTA_CLOSED_KEY = 'pecuario_conta_closed';
const CONTA_CASH_SUB_KEY = 'pecuario_conta_cash_subs';

const DEFAULT_CASH_SUBS = [
  { code: 'B-01.1', name: 'Caja' },
  { code: 'B-01.2', name: 'Banco 1' },
  { code: 'B-01.3', name: 'Banco 2' }
];

const CONTA_CATALOG = {
  ingresos: {
    balance: [
      { code: 'BGR-01', name: 'Ganado Reproducción (venta)', concept: 'Registro de ventas de ganado.', balanceClass: 'Asset' },
      { code: 'BGC-01', name: 'Ganado Comercial (venta)', concept: 'Registro de ventas de ganado.', balanceClass: 'Asset' },
      { code: 'BRD-01', name: 'Desechos (venta)', concept: 'Registro de venta de desechos.', balanceClass: 'Asset' },
      { code: 'BP-01', name: 'Patrimonio (aportaciones en efectivo)', concept: 'Registro de aportaciones de dinero al Patrimonio.', balanceClass: 'Equity' },
      { code: 'BPB-01', name: 'Préstamos Bancarios', concept: 'Ingreso por préstamos bancarios.', balanceClass: 'Liability' },
      { code: 'BPT-01', name: 'Préstamos de Terceros', concept: 'Ingreso por préstamos de terceros.', balanceClass: 'Liability' },
      { code: 'BAV-01', name: 'Venta de Activos (varios)', concept: 'Venta de activos fijos diversos.', balanceClass: 'Asset' }
    ],
    resultados: [
      { code: 'RIG-01', name: 'Intereses Ganados', concept: 'Intereses generados por inversiones o cobros por plazo.' },
      { code: 'RI-01', name: 'Insumos', concept: 'Venta de insumos varios del rancho.' },
      { code: 'RAS-01', name: 'Apoyos y Subsidios', concept: 'Apoyos y subsidios recibidos.' },
      { code: 'RIV-01', name: 'Ingresos Varios', concept: 'Ingresos diversos.' }
    ]
  },
  egresos: {
    resultados: [
      { code: 'RGP-01', name: 'Gastos Nóminas', concept: 'Pagos a trabajadores y empleados.' },
      { code: 'RGP-02', name: 'Prestaciones a Trabajadores', concept: 'Registro de prestaciones a trabajadores y empleados.' },
      { code: 'RGP-03', name: 'Gastos de traslado personal', concept: 'Pagos por traslados de personal.' },
      { code: 'RGP-04', name: 'Alimentos al personal', concept: 'Apoyos a la alimentación del personal.' },
      { code: 'RGP-05', name: 'Otros - Personal', concept: 'Otros gastos relacionados con el personal.' },
      { code: 'RGV-01', name: 'Gastos de viaje', concept: 'Traslado, habitación y alimentos de viajes.' },
      { code: 'RGM-01', name: 'Mantenimiento: Maquinaria y equipo', concept: 'Refacciones, mano de obra e insumos.' },
      { code: 'RGM-02', name: 'Mantenimiento: Corrales y cercas', concept: 'Materiales, mano de obra e insumos.' },
      { code: 'RGM-03', name: 'Mantenimiento: Bodegas y casas', concept: 'Materiales, mano de obra e insumos.' },
      { code: 'RGM-04', name: 'Mantenimiento: Equipo de riego y bombas', concept: 'Refacciones, servicios y mano de obra.' },
      { code: 'RGM-05', name: 'Mantenimiento: Gastos varios', concept: 'Gastos diversos de mantenimiento del rancho.' },
      { code: 'RGAG-01', name: 'Gastos alimento Ganado', concept: 'Compras de insumos para alimentación del ganado.' },
      { code: 'RGMD-01', name: 'Gastos Medicamentos', concept: 'Medicinas, vacunas y complementos de sanidad.' },
      { code: 'RGH-01', name: 'Gastos Herramientas', concept: 'Adquisición de herramientas de todo tipo.' },
      { code: 'RH-01', name: 'Honorarios', concept: 'Pagos a profesionistas por servicios diversos.' },
      { code: 'RME-01', name: 'Mermas', concept: 'Mermas por materiales e insumos inservibles.' },
      { code: 'RCL-01', name: 'Combustibles y Lub.', concept: 'Combustibles y lubricantes de vehículos y maquinaria.' },
      { code: 'RE-01', name: 'Electricidad Riego', concept: 'Recibos CFE o gastos por generación.' },
      { code: 'RE-02', name: 'Electricidad general', concept: 'Recibos CFE.' },
      { code: 'RS-01', name: 'Servicios en general', concept: 'Servicios varios prestados por terceros.' },
      { code: 'RDI-01', name: 'Derechos e impuestos', concept: 'Pagos a instituciones del gobierno.' },
      { code: 'RGI-01', name: 'Gastos por intereses', concept: 'Intereses pagados a instituciones o terceros.' },
      { code: 'RFG-01', name: 'Fletes Ganado', concept: 'Fletes y gastos relacionados.' },
      { code: 'RFA-01', name: 'Fletes Alimento', concept: 'Fletes y gastos relacionados.' },
      { code: 'ROG-01', name: 'Otros Gastos', concept: 'Gastos varios.' }
    ],
    balance: [
      { code: 'BP-01', name: 'Devoluciones Patrimonio', concept: 'Disminución de aportaciones al patrimonio.', balanceClass: 'Equity' },
      { code: 'BPB-02', name: 'Pagos préstamos Bancarios', concept: 'Pago de préstamos bancarios.', balanceClass: 'Liability' },
      { code: 'BPT-02', name: 'Pagos préstamos de Terceros', concept: 'Pago de préstamos de terceros.', balanceClass: 'Liability' },
      { code: 'BOG-01', name: 'Otros Pagos', concept: 'Otros pagos de balance.', balanceClass: 'Liability' },
      { code: 'BME-01', name: 'Maquinaria y Equipo (adquisición)', concept: 'Compra de maquinaria y equipo.', balanceClass: 'Asset' },
      { code: 'BCI-01', name: 'Corrales e Instalaciones (adquisición)', concept: 'Construcciones y remodelaciones.', balanceClass: 'Asset' },
      { code: 'BTE-01', name: 'Terrenos y Edificios (adquisición)', concept: 'Adquisiciones y construcciones.', balanceClass: 'Asset' },
      { code: 'BGR-01', name: 'Ganado Reproducción (compra)', concept: 'Compra de ganado para inventario.', balanceClass: 'Asset' },
      { code: 'BGC-01', name: 'Ganado Comercial (compra)', concept: 'Compra de ganado para comercialización.', balanceClass: 'Asset' },
      { code: 'BOA-01', name: 'Otros Activos', concept: 'Compra de activos fijos diversos.', balanceClass: 'Asset' }
    ]
  },
  balanceSinEfectivo: [
    { code: 'BP-01', name: 'Patrimonio (ajuste +)', concept: 'Aportaciones o revaluaciones sin efectivo.', balanceClass: 'Equity', balanceEffect: 1 },
    { code: 'BP-01', name: 'Patrimonio (ajuste -)', concept: 'Disminución por pérdidas o ajustes.', balanceClass: 'Equity', balanceEffect: -1 },
    { code: 'BGR-01', name: 'Ganado Reproducción (ajuste +)', concept: 'Nacimientos o revaluación de inventario.', balanceClass: 'Asset', balanceEffect: 1 },
    { code: 'BGR-01', name: 'Ganado Reproducción (ajuste -)', concept: 'Muertes o ajuste de inventario.', balanceClass: 'Asset', balanceEffect: -1 },
    { code: 'BGC-01', name: 'Ganado Comercial (ajuste +)', concept: 'Revaluación o altas sin efectivo.', balanceClass: 'Asset', balanceEffect: 1 },
    { code: 'BGC-01', name: 'Ganado Comercial (ajuste -)', concept: 'Bajas o ajustes sin efectivo.', balanceClass: 'Asset', balanceEffect: -1 },
    { code: 'BME-01', name: 'Maquinaria y Equipo (aporte)', concept: 'Aportación en especie.', balanceClass: 'Asset', balanceEffect: 1 },
    { code: 'BCI-01', name: 'Corrales e Instalaciones (aporte)', concept: 'Aportación en especie.', balanceClass: 'Asset', balanceEffect: 1 },
    { code: 'BTE-01', name: 'Terrenos y Edificios (aporte)', concept: 'Aportación en especie.', balanceClass: 'Asset', balanceEffect: 1 },
    { code: 'BOA-01', name: 'Otros Activos (aporte)', concept: 'Aportación en especie.', balanceClass: 'Asset', balanceEffect: 1 },
    { code: 'BPB-01', name: 'Préstamos Bancarios (registro)', concept: 'Registro de pasivos sin efectivo.', balanceClass: 'Liability', balanceEffect: 1 },
    { code: 'BPT-01', name: 'Préstamos de Terceros (registro)', concept: 'Registro de pasivos sin efectivo.', balanceClass: 'Liability', balanceEffect: 1 }
  ]
};

const CONTA_ACCOUNTS_ADV = [
  ...CONTA_CATALOG.ingresos.resultados.map(a => ({ ...a, tipo: 'Ingreso', grupo: 'Resultados', cashImpact: true })),
  ...CONTA_CATALOG.ingresos.balance.map(a => ({ ...a, tipo: 'Ingreso', grupo: 'Balance', cashImpact: true })),
  ...CONTA_CATALOG.egresos.resultados.map(a => ({ ...a, tipo: 'Egreso', grupo: 'Resultados', cashImpact: true })),
  ...CONTA_CATALOG.egresos.balance.map(a => ({ ...a, tipo: 'Egreso', grupo: 'Balance', cashImpact: true })),
  ...CONTA_CATALOG.balanceSinEfectivo.map(a => ({ ...a, tipo: 'Sin efectivo', grupo: 'Balance', cashImpact: false }))
].map(a => ({ ...a, key: `${a.code}||${a.name}||${a.tipo}||${a.grupo}` }));

const CONTA_CATALOG_BASICO = {
  ingresos: [
    { code: 'RVG-01', name: 'Ventas de Ganado', concept: 'Ingreso por venta de ganado.' },
    { code: 'RV-07', name: 'Venta de insumos', concept: 'Ingreso por venta de insumos.' },
    { code: 'RV-10', name: 'Ingresos Varios', concept: 'Ingreso de efectivo por conceptos diversos.' },
    { code: 'RV-12', name: 'Ingresos por intereses', concept: 'Intereses cobrados en efectivo.' },
    { code: 'RV-13', name: 'Apoyos y subsidios', concept: 'Apoyos y subsidios recibidos en efectivo.' },
    { code: 'RAE-01', name: 'Aportaciones de Efectivo', concept: 'Aportaciones en efectivo al rancho.' },
    { code: 'BVB-01', name: 'Venta de Activos', concept: 'Venta de activos con entrada de efectivo.' },
    { code: 'BPT-01', name: 'Préstamos de terceros', concept: 'Préstamos recibidos de terceros.' }
  ],
  egresos: [
    { code: 'RGP-01', name: 'Gastos Nóminas', concept: 'Pagos al personal.' },
    { code: 'RGP-02', name: 'Prestaciones a Trabajadores', concept: 'Prestaciones y compensaciones al personal.' },
    { code: 'RGP-03', name: 'Gastos de traslado personal', concept: 'Traslados del personal.' },
    { code: 'RGP-04', name: 'Alimentos al personal', concept: 'Alimentos para el personal.' },
    { code: 'RGP-05', name: 'Otros - Personal', concept: 'Otros gastos de personal.' },
    { code: 'RGV-01', name: 'Gastos de viaje', concept: 'Gastos de viaje.' },
    { code: 'RGM-01', name: 'Mantenimiento: Maquinaria y equipo', concept: 'Mantenimiento de maquinaria y equipo.' },
    { code: 'RGM-02', name: 'Mantenimiento: Corrales y cercas', concept: 'Mantenimiento de corrales y cercas.' },
    { code: 'RGM-03', name: 'Mantenimiento: Bodegas y casas', concept: 'Mantenimiento de bodegas y casas.' },
    { code: 'RGM-04', name: 'Mantenimiento: Equipo de riego y bombas', concept: 'Mantenimiento de riego y bombas.' },
    { code: 'RGM-05', name: 'Mantenimiento: Otros', concept: 'Otros gastos de mantenimiento.' },
    { code: 'RGAG-01', name: 'Gastos alimento Ganado', concept: 'Gastos de alimento para ganado.' },
    { code: 'RGMD-01', name: 'Gastos Medicamentos', concept: 'Gastos de medicamentos y sanidad.' },
    { code: 'RGH-01', name: 'Gastos Herramientas', concept: 'Compra de herramientas.' },
    { code: 'RH-01', name: 'Honorarios', concept: 'Pago de honorarios.' },
    { code: 'RM-01', name: 'Mermas', concept: 'Registro de mermas.' },
    { code: 'RMD-01', name: 'Muertes y desechos', concept: 'Pérdidas por muertes y desechos.' },
    { code: 'RCL-01', name: 'Combustibles y Lub.', concept: 'Combustibles y lubricantes.' },
    { code: 'RE-01', name: 'Electricidad Riego', concept: 'Pago de electricidad para riego.' },
    { code: 'RE-02', name: 'Electricidad general', concept: 'Pago de electricidad general.' },
    { code: 'RS-01', name: 'Servicios en general', concept: 'Pago de servicios generales.' },
    { code: 'RDI-01', name: 'Derechos e impuestos', concept: 'Pago de derechos e impuestos.' },
    { code: 'RFG-01', name: 'Fletes Ganado', concept: 'Pago de fletes de ganado.' },
    { code: 'RFA-01', name: 'Fletes Alimento', concept: 'Pago de fletes de alimento.' },
    { code: 'RRE-01', name: 'Retiros de Efectivo', concept: 'Retiros de efectivo.' },
    { code: 'BCA-01', name: 'Compra de Activos', concept: 'Compra de activos.' },
    { code: 'BPT-02', name: 'Pagos préstamos de terceros', concept: 'Pago de préstamos a terceros.' }
  ]
};

const CONTA_ACCOUNTS_BASIC = [
  ...CONTA_CATALOG_BASICO.ingresos.map(a => ({ ...a, tipo: 'Ingreso', grupo: 'Resultados', cashImpact: true })),
  ...CONTA_CATALOG_BASICO.egresos.map(a => ({ ...a, tipo: 'Egreso', grupo: 'Resultados', cashImpact: true }))
].map(a => ({ ...a, key: `${a.code}||${a.name}||${a.tipo}||${a.grupo}` }));

function getContaConfig(){
  const saved = getData('pecuario_config') || [];
  return saved.length ? saved[saved.length - 1] : {};
}

function contaModoAvanzado(){
  const cfg = getContaConfig();
  if (!cfg || typeof cfg !== 'object') return true;
  if (!Object.prototype.hasOwnProperty.call(cfg, 'contabilidadAvanzada')) return true;
  return String(cfg.contabilidadAvanzada) === '1';
}

function contaAccounts(){
  return contaModoAvanzado() ? CONTA_ACCOUNTS_ADV : CONTA_ACCOUNTS_BASIC;
}

function fmtMXN(n){
  const v = Number(n || 0);
  try { return v.toLocaleString('es-MX', { style:'currency', currency:'MXN' }); }
  catch(e){ return '$' + v.toFixed(2); }
}

function getContaLedger(){ return getData(CONTA_LEDGER_KEY) || []; }
function setContaLedger(arr){ setData(CONTA_LEDGER_KEY, arr || []); }

function getContaOpening(){ return getData(CONTA_OPEN_KEY) || {}; }
function setContaOpening(o){ setData(CONTA_OPEN_KEY, o || {}); }

function getContaClosed(){ return getData(CONTA_CLOSED_KEY) || {}; }
function setContaClosed(o){ setData(CONTA_CLOSED_KEY, o || {}); }

function getContaCashSubs(){
  const raw = getData(CONTA_CASH_SUB_KEY);
  if (!Array.isArray(raw) || !raw.length) return DEFAULT_CASH_SUBS.slice();
  return raw.filter(s => s && s.code && s.name);
}

function setContaCashSubs(list){
  const clean = Array.isArray(list) ? list.filter(s => s && s.code && s.name) : [];
  setData(CONTA_CASH_SUB_KEY, clean.length ? clean : DEFAULT_CASH_SUBS.slice());
}

function contaDefaultCashSub(){
  const list = getContaCashSubs();
  return list.length ? list[0].code : 'B-01.1';
}

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

function contaGetAccountByKey(key){
  const acc = contaAccounts().find(a=>a.key===key);
  if (acc) return acc;
  const parts = String(key||'').split('||');
  return { key, code: parts[0] || '', name: parts[1] || 'Cuenta', tipo: parts[2] || 'Egreso', grupo: parts[3] || '' };
}

function contaGetAccountByCode(code, tipo){
  if (!code) return null;
  const clean = String(code).trim();
  if (!clean) return null;
  const byCode = contaAccounts().filter(a => a.code === clean);
  if (!byCode.length) return null;
  if (tipo){
    const found = byCode.find(a => a.tipo === tipo);
    if (found) return found;
  }
  return byCode[0];
}

function contaGetBalanceAccounts(){
  const map = new Map();
  contaAccounts().forEach(a=>{
    if (a.grupo !== 'Balance') return;
    const baseName = String(a.name || '').replace(/\s*\(.*\)$/, '').trim() || a.name;
    if (!map.has(a.code)) map.set(a.code, { code: a.code, name: baseName, balanceClass: a.balanceClass });
  });
  return Array.from(map.values()).sort((a,b)=> (a.code + a.name).localeCompare(b.code + b.name));
}

function contaAccountImpactsCash(acc){
  return !!acc && acc.cashImpact !== false && (acc.tipo === 'Ingreso' || acc.tipo === 'Egreso');
}

function contaContraRequired(acc){
  if (!acc) return false;
  if (!contaAccountImpactsCash(acc) && acc.grupo === 'Balance') return true;
  return false;
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

function contaNormalizeOpeningEntry(entry){
  if (!entry) return { total: 0, subs: {} };
  if (typeof entry === 'number') return { total: Number(entry||0), subs: {} };
  if (typeof entry === 'object'){
    const subs = entry.subs && typeof entry.subs === 'object' ? entry.subs : {};
    const total = Number(entry.total || 0) || Object.values(subs).reduce((s,v)=>s+Number(v||0),0);
    return { total, subs };
  }
  return { total: 0, subs: {} };
}

function contaGetOpening(year){
  const o = getContaOpening();
  return contaNormalizeOpeningEntry(o[String(year)]);
}

function contaSetOpening(year, val){
  const o = getContaOpening();
  o[String(year)] = contaNormalizeOpeningEntry(val);
  setContaOpening(o);
}

function contaSumOpeningSubs(opening){
  const subs = opening && opening.subs ? opening.subs : {};
  return Object.values(subs).reduce((s,v)=> s + Number(v||0), 0);
}

function contaNormalizeLedger(){
  const ledger = getContaLedger();
  if (!Array.isArray(ledger) || !ledger.length) return;
  const defaultSub = contaDefaultCashSub();
  let changed = false;
  ledger.forEach(m=>{
    if (!m) return;
    if (!m.cuentaCode && m.cuentaCodigo) m.cuentaCode = m.cuentaCodigo;
    if (!m.cuentaName && m.cuentaNombre) m.cuentaName = m.cuentaNombre;
    let acc = null;
    if (m.cuentaKey) acc = contaGetAccountByKey(m.cuentaKey);
    if (!acc && m.cuentaCode) acc = contaGetAccountByCode(m.cuentaCode);
    if (acc && !m.cuentaKey){
      m.cuentaKey = acc.key;
      changed = true;
    }
    if (acc && contaAccountImpactsCash(acc) && !m.cajaSubcuenta){
      m.cajaSubcuenta = defaultSub;
      changed = true;
    }
  });
  if (changed) setContaLedger(ledger);
}

function contaTotalsForYear(year){
  const ledger = getContaLedger().filter(m => contaYearOf(m.fecha) === Number(year));
  const opening = contaGetOpening(year);
  let tin = 0, tout = 0;
  const cashSubs = {};
  ledger.forEach(m=>{
    const acc = contaGetAccountByKey(m.cuentaKey);
    const amt = Number(m.monto||0);
    if (!contaAccountImpactsCash(acc)) return;
    if (acc.tipo === 'Ingreso') tin += amt;
    else tout += amt;
    const sub = m.cajaSubcuenta || contaDefaultCashSub();
    cashSubs[sub] = (cashSubs[sub] || 0) + (acc.tipo === 'Ingreso' ? amt : -amt);
  });

  const openingTotal = opening.total || contaSumOpeningSubs(opening);
  const cash = openingTotal + tin - tout;
  return { ledger, opening, tin, tout, cash, cashSubs, net: tin - tout };
}

function contaBalanceDelta(acc, amt){
  if (!acc) return 0;
  if (typeof acc.balanceEffect === 'number') return acc.balanceEffect * amt;
  if (acc.balanceClass === 'Asset'){
    if (acc.tipo === 'Ingreso') return -amt;
    if (acc.tipo === 'Egreso') return amt;
  }
  if (acc.balanceClass === 'Liability' || acc.balanceClass === 'Equity'){
    if (acc.tipo === 'Ingreso') return amt;
    if (acc.tipo === 'Egreso') return -amt;
  }
  return 0;
}

function contaFillAccountSelect(sel, opts){
  if (!sel) return;
  const includeAll = opts && opts.includeAll;
  sel.innerHTML = '';

  if (includeAll){
    const o = document.createElement('option');
    o.value = '';
    o.textContent = 'Todas…';
    sel.appendChild(o);
  }

  const groups = contaModoAvanzado()
    ? [
      { tipo:'Ingreso', grupo:'Resultados', label:'Ingresos — Resultados' },
      { tipo:'Ingreso', grupo:'Balance', label:'Ingresos — Balance' },
      { tipo:'Egreso', grupo:'Resultados', label:'Egresos — Resultados' },
      { tipo:'Egreso', grupo:'Balance', label:'Egresos — Balance' },
      { tipo:'Sin efectivo', grupo:'Balance', label:'Balance sin efectivo' }
    ]
    : [
      { tipo:'Ingreso', grupo:'Resultados', label:'Ingresos de dinero' },
      { tipo:'Egreso', grupo:'Resultados', label:'Egresos de dinero' }
    ];

  groups.forEach(g=>{
    const og = document.createElement('optgroup');
    og.label = g.label;
    contaAccounts()
      .filter(a=>a.tipo===g.tipo && a.grupo===g.grupo)
      .forEach(a=>{
        const o = document.createElement('option');
        o.value = a.key;
        o.textContent = `${a.code} — ${a.name}`;
        og.appendChild(o);
      });
    if (og.children.length) sel.appendChild(og);
  });
}

function contaFillCashSelect(sel, currentValue){
  if (!sel) return;
  const subs = getContaCashSubs();
  sel.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '(Selecciona)';
  sel.appendChild(placeholder);

  subs.forEach(s=>{
    const o = document.createElement('option');
    o.value = s.code;
    o.textContent = `${s.code} — ${s.name}`;
    sel.appendChild(o);
  });

  if (currentValue && subs.some(s=>s.code === currentValue)){
    sel.value = currentValue;
  } else if (subs.length === 1){
    sel.value = subs[0].code;
  } else {
    sel.value = '';
  }
}

function contaFillContraSelect(sel, currentValue){
  if (!sel) return;
  sel.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '(Selecciona)';
  sel.appendChild(placeholder);

  contaGetBalanceAccounts().forEach(a=>{
    const o = document.createElement('option');
    o.value = a.code;
    o.textContent = `${a.code} — ${a.name}`;
    sel.appendChild(o);
  });

  const found = Array.from(sel.options).some(opt => opt.value === currentValue);
  if (found) sel.value = currentValue;
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

function contaRenderCatalog(){
  const body = document.getElementById('conta-catalog-tbody');
  if (!body) return;

  const rows = [];
  if (contaModoAvanzado()){
    rows.push('<tr><td colspan="3"><b>Resultados — Ingresos</b></td></tr>');
    CONTA_CATALOG.ingresos.resultados.forEach(a=>{
      rows.push(`<tr><td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.concept||'')}</td></tr>`);
    });
    rows.push('<tr><td colspan="3"><b>Resultados — Egresos</b></td></tr>');
    CONTA_CATALOG.egresos.resultados.forEach(a=>{
      rows.push(`<tr><td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.concept||'')}</td></tr>`);
    });
    rows.push('<tr><td colspan="3"><b>Balance con impacto en Caja y Bancos — Ingresos</b></td></tr>');
    CONTA_CATALOG.ingresos.balance.forEach(a=>{
      rows.push(`<tr><td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.concept||'')}</td></tr>`);
    });
    rows.push('<tr><td colspan="3"><b>Balance con impacto en Caja y Bancos — Egresos</b></td></tr>');
    CONTA_CATALOG.egresos.balance.forEach(a=>{
      rows.push(`<tr><td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.concept||'')}</td></tr>`);
    });
    rows.push('<tr><td colspan="3"><b>Balance sin impacto en Caja y Bancos</b></td></tr>');
    CONTA_CATALOG.balanceSinEfectivo.forEach(a=>{
      rows.push(`<tr><td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.concept||'')}</td></tr>`);
    });
  } else {
    rows.push('<tr><td colspan="3"><b>Ingresos de dinero</b></td></tr>');
    CONTA_CATALOG_BASICO.ingresos.forEach(a=>{
      rows.push(`<tr><td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.concept||'')}</td></tr>`);
    });
    rows.push('<tr><td colspan="3"><b>Egresos de dinero</b></td></tr>');
    CONTA_CATALOG_BASICO.egresos.forEach(a=>{
      rows.push(`<tr><td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.concept||'')}</td></tr>`);
    });
  }
  body.innerHTML = rows.join('');
}

function contaRender(){
  const yearSel = document.getElementById('conta-year');
  const year = Number(yearSel?.value || new Date().getFullYear());

  const canEdit = contaCanEdit();
  const isClosed = contaIsClosed(year);

  const openingWrap = document.getElementById('conta-opening-wrap');
  const alertBox = document.getElementById('conta-alert');
  const editorNote = document.getElementById('conta-editor-only');
  const form = document.getElementById('form-conta2');
  const advanced = contaModoAvanzado();

  const titleEl = document.getElementById('conta-main-title');
  const legendEl = document.getElementById('conta-main-legend');
  if (titleEl) titleEl.textContent = advanced ? 'Contabilidad: Ingresos y Egresos de efectivo' : 'Contabilidad básica: Ingresos y Egresos de efectivo';
  if (legendEl) legendEl.textContent = advanced
    ? 'Ingresos y egresos de efectivo para conocer al día el impacto en el flujo de efectivo y en el Patrimonio. Las transacciones con efectivo se registran contra Caja y Bancos (B-01); las operaciones sin efectivo se capturan en cuentas de balance para reflejar movimientos entre cuentas (aportaciones, revaluaciones o pérdidas de activos). No se manejan cuentas por cobrar o por pagar: solo se registra cuando se cobra o se paga.'
    : 'Registro de todas las operaciones del Rancho que involucren el Efectivo, tales como; ventas de ganado, de activos varios, de préstamos recibidos de bancos o de terceros, apoyos de instituciones, retiros de efectivo, etc.';

  const guide = document.querySelector('#mod-conta .conta-guidelines');
  if (guide) guide.style.display = advanced ? '' : 'none';
  const openingCardBtn = document.getElementById('btn-conta-opening-toggle')?.closest('.conta-card');
  if (openingCardBtn) openingCardBtn.style.display = advanced ? '' : 'none';
  const openingPanel = document.getElementById('conta-opening-panel');
  if (openingPanel && !advanced) openingPanel.classList.remove('activo');
  const openingYearWrap = document.getElementById('conta-opening-wrap')?.closest('div');
  if (openingYearWrap) openingYearWrap.style.display = advanced ? '' : 'none';
  const estadoSel = document.getElementById('conta-filter-estado');
  if (estadoSel){
    const sinOpt = Array.from(estadoSel.options || []).find(o => o.value === 'sin-efectivo');
    if (sinOpt) sinOpt.style.display = advanced ? '' : 'none';
    if (!advanced && estadoSel.value === 'sin-efectivo') estadoSel.value = 'all';
  }
  const contraHeader = document.querySelector('#mod-conta .conta-table thead th:nth-child(5)');
  if (contraHeader) contraHeader.style.display = advanced ? '' : 'none';
  const bgTitle = Array.from(document.querySelectorAll('#mod-conta h3')).find(h=>h.textContent.includes('Balance General'));
  if (bgTitle){
    const bgWrap = bgTitle.nextElementSibling;
    if (bgWrap) bgWrap.style.display = advanced ? '' : 'none';
    bgTitle.style.display = advanced ? '' : 'none';
  }

  if (openingWrap){
    const opening = contaGetOpening(year);
    const subs = getContaCashSubs();
    openingWrap.innerHTML = '';
    subs.forEach(sub=>{
      const row = document.createElement('div');
      row.className = 'conta-opening-row';
      const label = document.createElement('label');
      label.textContent = `${sub.code} — ${sub.name}`;
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.01';
      input.value = String((opening.subs && opening.subs[sub.code]) || 0);
      input.disabled = !canEdit || isClosed;
      input.addEventListener('change', ()=>{
        if (!contaCanEdit() || contaIsClosed(year)) return;
        const current = contaGetOpening(year);
        current.subs = current.subs || {};
        current.subs[sub.code] = Number(input.value||0);
        current.total = contaSumOpeningSubs(current);
        contaSetOpening(year, current);
        contaRender();
        actualizarPanel();
        actualizarReportes();
      });
      row.appendChild(label);
      row.appendChild(input);
      openingWrap.appendChild(row);
    });
  }

  if (form){
    form.style.display = canEdit ? '' : 'none';
    form.querySelectorAll('input,select,textarea,button').forEach(el=>{
      if (el.id === 'btn-conta-limpiar') return;
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

  const cashEl = document.getElementById('conta-cash');
  const cashHint = document.getElementById('conta-cash-hint');
  const cashSubsEl = document.getElementById('conta-cash-subtotals');
  if (cashEl) cashEl.textContent = fmtMXN(t.cash);
  if (cashHint){
    cashHint.textContent = (t.cash >= 0)
      ? 'Saldo deudor: utilidad / sobrante de efectivo.'
      : 'Saldo acreedor: faltante / sobregiro en Caja y Bancos.';
  }
  if (cashSubsEl){
    const subs = getContaCashSubs();
    const opening = t.opening || { subs: {} };
    const openingSubs = (opening.subs && Object.keys(opening.subs).length) ? opening.subs : (() => {
      const fallback = {};
      if (opening.total && subs.length) fallback[subs[0].code] = opening.total;
      return fallback;
    })();
    const rows = subs.map(sub=>{
      const base = Number(openingSubs[sub.code] || 0);
      const mov = Number(t.cashSubs[sub.code] || 0);
      const total = base + mov;
      return `${sub.code}: ${fmtMXN(total)}`;
    });
    cashSubsEl.textContent = rows.join(' · ') || 'Sin subcuentas.';
  }

  const kIn = document.getElementById('conta-kpi-in');
  const kOut = document.getElementById('conta-kpi-out');
  const kNet = document.getElementById('conta-kpi-net');
  if (kIn) kIn.textContent = fmtMXN(t.tin);
  if (kOut) kOut.textContent = fmtMXN(t.tout);
  if (kNet) kNet.textContent = fmtMXN(t.net);

  if (alertBox){
    if (isClosed) {
      alertBox.textContent = `Ejercicio ${year} cerrado. El saldo se arrastra como saldo inicial al siguiente ejercicio.`;
    } else {
      alertBox.textContent = '';
    }
    alertBox.style.display = alertBox.textContent ? '' : 'none';
  }

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
      const acc = contaGetAccountByKey(m.cuentaKey);
      const s = [
        m.tercero, m.factura, m.tipoProducto, m.areteOficial, m.refPago, m.descripcion, m.contraCuenta,
        m.cajaSubcuenta, acc.name, acc.code
      ].join(' ').toLowerCase();
      return s.includes(q);
    });
  }

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
      const impactsCash = contaAccountImpactsCash(a);
      const caja = impactsCash ? (m.cajaSubcuenta || '') : '';
      const contra = impactsCash ? '' : (m.contraCuenta || '');
      return `<tr>
        <td>${escapeHtml(m.fecha||'')}</td>
        <td>${escapeHtml((a.code? a.code+' — ':'') + a.name)}</td>
        <td>${escapeHtml(a.tipo||'')}</td>
        <td>${escapeHtml(caja)}</td>
        <td style="display:${advanced ? '' : 'none'};">${escapeHtml(contra)}</td>
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
    }).join('') || `<tr><td colspan="14" class="muted">Sin movimientos en este ejercicio.</td></tr>`;
  }

  const resumenBody = document.getElementById('conta-resumen-tbody');
  if (resumenBody){
    const map = new Map();
    t.ledger.forEach(m=>{
      const a = contaGetAccountByKey(m.cuentaKey);
      const k = m.cuentaKey;
      if (!map.has(k)) map.set(k, { a, in:0, out:0, adj:0 });
      const obj = map.get(k);
      const amt = Number(m.monto||0);
      if (a.tipo==='Ingreso') obj.in += amt;
      else if (a.tipo==='Egreso') obj.out += amt;
      else obj.adj += contaBalanceDelta(a, amt);
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
  // Estado de Movimientos de Flujo
  const flujoIngBody = document.getElementById('conta-flujo-ing-tbody');
  const flujoEgrBody = document.getElementById('conta-flujo-egr-tbody');
  const flujoNet = document.getElementById('conta-flujo-net');
  const flujoNetV = document.getElementById('conta-flujo-net-v');

  const activos = cabezasArray ? cabezasArray({includeBajas:false}) : [];
  const totalVientres = (activos||[]).filter(a => clasificarGrupoCodigo(a.grupo) === 'BGR-01').length || 0;

  const sumByKey = new Map();
  t.ledger.forEach(m=>{
    const acc = contaGetAccountByKey(m.cuentaKey);
    if (!contaAccountImpactsCash(acc)) return;
    const k = m.cuentaKey;
    const amt = Number(m.monto||0);
    if (!sumByKey.has(k)) sumByKey.set(k, {acc, sum:0});
    sumByKey.get(k).sum += amt;
  });

  const flujoIng = contaAccounts().filter(a=>a.tipo==='Ingreso' && contaAccountImpactsCash(a));
  const flujoEgr = contaAccounts().filter(a=>a.tipo==='Egreso' && contaAccountImpactsCash(a));
  const getSum = (a)=> (sumByKey.get(a.key)?.sum || 0);
  const totalIng = flujoIng.reduce((s,a)=> s + getSum(a), 0);
  const totalEgr = flujoEgr.reduce((s,a)=> s + getSum(a), 0);
  const neto = totalIng - totalEgr;

  const pct = (v)=> totalIng ? ((v/totalIng)*100).toFixed(1)+'%' : '';
  const perV = (v)=> totalVientres ? fmtMXN(v / totalVientres) : '';

  if (flujoIngBody){
    const rows = [];
    rows.push('<tr><td colspan="4"><b>Ingresos</b></td></tr>');
    flujoIng.forEach(a=>{
      const v = getSum(a);
      rows.push(`<tr>
        <td>${escapeHtml(a.code+' — '+a.name)}</td>
        <td style="text-align:right;">${escapeHtml(fmtMXN(v))}</td>
        <td style="text-align:right;">${escapeHtml(pct(v))}</td>
        <td style="text-align:right;">${escapeHtml(perV(v))}</td>
      </tr>`);
    });
    rows.push(`<tr>
      <td><b>Total Ingresos</b></td>
      <td style="text-align:right;"><b>${escapeHtml(fmtMXN(totalIng))}</b></td>
      <td></td>
      <td style="text-align:right;"><b>${escapeHtml(totalVientres ? fmtMXN(totalIng/totalVientres) : '')}</b></td>
    </tr>`);
    flujoIngBody.innerHTML = rows.join('');
  }

  if (flujoEgrBody){
    const rows = [];
    rows.push('<tr><td colspan="4"><b>Egresos</b></td></tr>');
    flujoEgr.forEach(a=>{
      const v = getSum(a);
      rows.push(`<tr>
        <td>${escapeHtml(a.code+' — '+a.name)}</td>
        <td style="text-align:right;">${escapeHtml(fmtMXN(v))}</td>
        <td style="text-align:right;">${escapeHtml(pct(v))}</td>
        <td style="text-align:right;">${escapeHtml(perV(v))}</td>
      </tr>`);
    });
    rows.push(`<tr>
      <td><b>Total Egresos</b></td>
      <td style="text-align:right;"><b>${escapeHtml(fmtMXN(totalEgr))}</b></td>
      <td></td>
      <td style="text-align:right;"><b>${escapeHtml(totalVientres ? fmtMXN(totalEgr/totalVientres) : '')}</b></td>
    </tr>`);
    flujoEgrBody.innerHTML = rows.join('');
  }

  if (flujoNet) flujoNet.textContent = fmtMXN(neto);
  if (flujoNetV) flujoNetV.textContent = totalVientres ? fmtMXN(neto/totalVientres) : '';

  // =====================
  // Balance General
  const bgBody = document.getElementById('conta-bg-tbody');
  const bgTotAct = document.getElementById('conta-bg-total-act');
  const bgPasivo = document.getElementById('conta-bg-pasivo');
  const bgPatr = document.getElementById('conta-bg-patrimonio');

  const bal = {
    assets: { 'BGR-01':0, 'BGC-01':0, 'BME-01':0, 'BCI-01':0, 'BTE-01':0, 'BOA-01':0, 'BAV-01':0 },
    loan: 0,
    equity: 0
  };

  const nameByCode = {};
  contaAccounts().forEach(a=>{
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
    const delta = contaBalanceDelta(acc, amt);

    if (acc.balanceClass === 'Asset' && bal.assets.hasOwnProperty(code)){
      bal.assets[code] += delta;
    } else if (acc.balanceClass === 'Liability'){
      if (code === 'BPB-01' || code === 'BPB-02' || code === 'BPT-01' || code === 'BPT-02'){
        bal.loan += delta;
      }
    } else if (acc.balanceClass === 'Equity'){
      if (code === 'BP-01'){
        bal.equity += delta;
      }
    }

    if (acc.tipo === 'Sin efectivo' && m.contraCuenta){
      const contraAcc = contaGetAccountByCode(m.contraCuenta);
      const contraDelta = -delta;
      if (contraAcc){
        const contraCode = String(contraAcc.code||'').trim();
        if (contraAcc.balanceClass === 'Asset' && bal.assets.hasOwnProperty(contraCode)){
          bal.assets[contraCode] += contraDelta;
        } else if (contraAcc.balanceClass === 'Liability'){
          if (contraCode === 'BPB-01' || contraCode === 'BPB-02' || contraCode === 'BPT-01' || contraCode === 'BPT-02'){
            bal.loan += contraDelta;
          }
        } else if (contraAcc.balanceClass === 'Equity'){
          if (contraCode === 'BP-01') bal.equity += contraDelta;
        }
      }
    }
  });

  const cash = Number(t.cash||0);
  const totalAssets = cash + Object.values(bal.assets).reduce((s,v)=>s+Number(v||0),0);
  const patrimonioCalc = totalAssets - bal.loan;

  if (bgBody){
    const rows = [];
    rows.push('<tr><td><b>Activos</b></td><td></td></tr>');
    rows.push(`<tr><td>B-01 — Caja y Bancos</td><td style="text-align:right;">${escapeHtml(fmtMXN(cash))}</td></tr>`);
    const order = ['BGR-01','BGC-01','BME-01','BCI-01','BTE-01','BOA-01','BAV-01'];
    order.forEach(code=>{
      if (!bal.assets.hasOwnProperty(code)) return;
      const nm = nameByCode[code] || code;
      rows.push(`<tr><td>${escapeHtml(code+' — '+nm)}</td><td style="text-align:right;">${escapeHtml(fmtMXN(bal.assets[code]||0))}</td></tr>`);
    });
    bgBody.innerHTML = rows.join('');
  }
  if (bgTotAct) bgTotAct.textContent = fmtMXN(totalAssets);
  if (bgPasivo) bgPasivo.textContent = fmtMXN(bal.loan);
  if (bgPatr) bgPatr.textContent = fmtMXN(patrimonioCalc);

  const repSel = document.getElementById('conta-rep-cuenta');
  const repDesde = document.getElementById('conta-rep-desde')?.value || '';
  const repHasta = document.getElementById('conta-rep-hasta')?.value || '';
  const repKey = repSel?.value || '';
  const repBody = document.getElementById('conta-rep-tbody');
  const repCajaResumen = document.getElementById('conta-rep-caja-resumen');
  if (repBody){
    let repRows = repKey ? t.ledger.filter(m=>m.cuentaKey===repKey) : [];
    if (repDesde) repRows = repRows.filter(m => String(m.fecha||'') >= repDesde);
    if (repHasta) repRows = repRows.filter(m => String(m.fecha||'') <= repHasta);
    repRows = repRows.sort((a,b)=> (a.fecha||'').localeCompare(b.fecha||''));
    repBody.innerHTML = repKey
      ? (repRows.map(m=>{
          const amt = Number(m.monto||0);
          const acc = contaGetAccountByKey(m.cuentaKey);
          return `<tr>
            <td>${escapeHtml(m.fecha||'')}</td>
            <td>${escapeHtml(m.tercero||'')}</td>
            <td>${escapeHtml(m.factura||'')}</td>
            <td>${escapeHtml(m.areteOficial||'')}</td>
            <td>${escapeHtml(m.tipoProducto||'')}</td>
            <td>${escapeHtml(m.refPago||'')}</td>
            <td>${escapeHtml(contaAccountImpactsCash(acc) ? (m.cajaSubcuenta||'') : (m.contraCuenta||''))}</td>
            <td style="text-align:right;">${escapeHtml(fmtMXN(amt))}</td>
            <td>${escapeHtml(m.descripcion||'')}</td>
          </tr>`;
        }).join('') || `<tr><td colspan="9" class="muted">Sin movimientos para esta cuenta en el rango seleccionado.</td></tr>`)
      : `<tr><td colspan="9" class="muted">Selecciona una cuenta para ver su reporte.</td></tr>`;

    if (repCajaResumen){
      if (repKey){
        const repAcc = contaGetAccountByKey(repKey);
        const totalIng = repRows.filter(m=>contaGetAccountByKey(m.cuentaKey).tipo==='Ingreso').reduce((sum,m)=>sum+Number(m.monto||0),0);
        const totalEgr = repRows.filter(m=>contaGetAccountByKey(m.cuentaKey).tipo==='Egreso').reduce((sum,m)=>sum+Number(m.monto||0),0);
        const saldo = totalIng - totalEgr;
        repCajaResumen.style.display = '';
        repCajaResumen.innerHTML = `<b>Resumen (${escapeHtml(repAcc.code || '')} — ${escapeHtml(repAcc.name || '')})</b><br>Ingresos: <b>${escapeHtml(fmtMXN(totalIng))}</b> · Egresos: <b>${escapeHtml(fmtMXN(totalEgr))}</b> · Saldo: <b>${escapeHtml(fmtMXN(saldo))}</b>`;
      } else {
        repCajaResumen.style.display = 'none';
      }
    }
  }

  contaRenderCatalog();
}

function initContabilidad(){
  contaNormalizeLedger();

  const yearSel = document.getElementById('conta-year');
  const form = document.getElementById('form-conta2');
  const btnLimpiar = document.getElementById('btn-conta-limpiar');
  const tbody = document.getElementById('conta-tbody');

  const selCuenta = document.getElementById('conta-cuenta');
  const selCaja = document.getElementById('conta-caja');
  const selContra = document.getElementById('conta-contra');
  const cajaWrap = document.getElementById('conta-caja-wrap');
  const contraWrap = document.getElementById('conta-contra-wrap');

  const editModal = document.getElementById('modalContaEdit');
  const editForm = document.getElementById('form-conta-edit');
  const editCuenta = document.getElementById('conta-edit-cuenta');
  const editCaja = document.getElementById('conta-edit-caja');
  const editContra = document.getElementById('conta-edit-contra');
  const editCerrar = document.getElementById('btn-conta-edit-cerrar');
  const editDelete = document.getElementById('btn-conta-edit-delete');
  const editAreteWrap = document.getElementById('conta-edit-arete-wrap');
  const editAreteInp = editAreteWrap ? editAreteWrap.querySelector('input[name="areteOficial"]') : null;

  const areteWrap = document.getElementById('conta-arete-wrap');
  const areteInp = areteWrap ? areteWrap.querySelector('input[name="areteOficial"]') : null;

  function contaIsVentaAnimal(acc){
    const code = String(acc?.code || '').trim();
    return acc?.tipo === 'Ingreso' && ['BGR-01','BGC-01'].includes(code);
  }

  function contaToggleArete(){
    if (!areteWrap || !selCuenta) return;
    const acc = contaGetAccountByKey(selCuenta.value || '');
    const show = !!acc && contaIsVentaAnimal(acc);
    areteWrap.style.display = show ? '' : 'none';
    if (!show && areteInp) areteInp.value = '';
  }

  function contaToggleAreteEdit(){
    if (!editAreteWrap || !editCuenta) return;
    const acc = contaGetAccountByKey(editCuenta.value || '');
    const show = !!acc && contaIsVentaAnimal(acc);
    editAreteWrap.style.display = show ? '' : 'none';
    if (!show && editAreteInp) editAreteInp.value = '';
  }

  function contaToggleCashFields(){
    if (!selCuenta) return;
    const acc = contaGetAccountByKey(selCuenta.value || '');
    const needsCash = !contaModoAvanzado() ? true : contaAccountImpactsCash(acc);
    if (cajaWrap) cajaWrap.style.display = needsCash ? '' : 'none';
    if (contraWrap) contraWrap.style.display = (!contaModoAvanzado() || needsCash) ? 'none' : '';
  }

  function contaToggleCashFieldsEdit(){
    if (!editCuenta) return;
    const acc = contaGetAccountByKey(editCuenta.value || '');
    const needsCash = !contaModoAvanzado() ? true : contaAccountImpactsCash(acc);
    const editCajaWrap = document.getElementById('conta-edit-caja-wrap');
    const editContraWrap = document.getElementById('conta-edit-contra-wrap');
    if (editCajaWrap) editCajaWrap.style.display = needsCash ? '' : 'none';
    if (editContraWrap) editContraWrap.style.display = (!contaModoAvanzado() || needsCash) ? 'none' : '';
  }

  const selFiltro = document.getElementById('conta-filter-cuenta');
  const selRep = document.getElementById('conta-rep-cuenta');

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
      contaFillAccountSelect(selFiltro, { includeAll:true });
      contaFillAccountSelect(selRep, { includeAll:true });
      contaRender();
    });
  }

  contaFillAccountSelect(selCuenta, { includeAll:false });
  contaFillCashSelect(selCaja, selCaja?.value || '');
  contaFillContraSelect(selContra, selContra?.value || '');
  contaFillAccountSelect(editCuenta, { includeAll:false });
  contaFillCashSelect(editCaja, editCaja?.value || '');
  contaFillContraSelect(editContra, editContra?.value || '');
  contaFillAccountSelect(selFiltro, { includeAll:true });
  contaFillAccountSelect(selRep, { includeAll:true });

  if (selCuenta) selCuenta.addEventListener('change', ()=>{
    contaToggleArete();
    contaToggleCashFields();
  });
  if (editCuenta) editCuenta.addEventListener('change', ()=>{
    contaToggleAreteEdit();
    contaToggleCashFieldsEdit();
  });

  contaToggleArete();
  contaToggleCashFields();
  contaToggleAreteEdit();
  contaToggleCashFieldsEdit();

  if (selFiltro) selFiltro.addEventListener('change', contaRender);
  const s = document.getElementById('conta-search'); if (s) s.addEventListener('input', contaRender);
  const e = document.getElementById('conta-filter-estado'); if (e) e.addEventListener('change', contaRender);
  if (selRep) selRep.addEventListener('change', contaRender);
  const repDesde = document.getElementById('conta-rep-desde'); if (repDesde) repDesde.addEventListener('change', contaRender);
  const repHasta = document.getElementById('conta-rep-hasta'); if (repHasta) repHasta.addEventListener('change', contaRender);

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
    if (editCaja) editCaja.value = mov.cajaSubcuenta || '';
    if (editContra) editContra.value = mov.contraCuenta || '';
    editForm.querySelector('input[name="tercero"]').value = mov.tercero || '';
    editForm.querySelector('input[name="factura"]').value = mov.factura || '';
    editForm.querySelector('input[name="tipoProducto"]').value = mov.tipoProducto || '';
    editForm.querySelector('select[name="refPago"]').value = mov.refPago || '';
    editForm.querySelector('textarea[name="descripcion"]').value = mov.descripcion || '';
    if (editAreteInp) editAreteInp.value = mov.areteOficial || '';
    contaToggleAreteEdit();
    contaToggleCashFieldsEdit();
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

  if (form){
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
      const cajaSub = String(fd.get('cajaSubcuenta')||'').trim();
      const contraCuenta = String(fd.get('contraCuenta')||'').trim();

      if (!fechaVal || !cuentaKey || !Number.isFinite(monto)){
        alert('Completa fecha, cuenta y monto.');
        return;
      }

      const acc = contaGetAccountByKey(cuentaKey);
      if (contaAccountImpactsCash(acc)){
        if (!cajaSub){
          alert('Selecciona la subcuenta de Caja/Bancos.');
          return;
        }
      } else if (contaModoAvanzado() && contaContraRequired(acc) && !contraCuenta){
        alert('Selecciona la contra cuenta.');
        return;
      }

      const mov = {
        id: 'C-' + Date.now() + '-' + Math.random().toString(16).slice(2),
        fecha: fechaVal,
        cuentaKey,
        cuentaCode: acc.code || '',
        cuentaName: acc.name || '',
        tipo: acc.tipo || 'Egreso',
        contraCuenta: contraCuenta,
        cajaSubcuenta: cajaSub,
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

      const accCode = String(acc.code||'').trim();
      const esVentaAnimal = contaIsVentaAnimal(acc);
      if (esVentaAnimal && mov.areteOficial){
        const moved = moverAnimalABajas(mov.areteOficial, {
          fecha: mov.fecha,
          motivo: 'Venta',
          movId: mov.id,
          cuentaCode: accCode,
          cuentaName: String(acc.name||'').trim(),
          monto: mov.monto,
          usuario: mov.usuario
        });
        if (moved && typeof pintarToast === 'function') pintarToast(`Ganado ${mov.areteOficial} movido a Bajas`);
      }

      form.reset();
      if (selCaja) selCaja.value = '';
      if (selContra) selContra.value = '';
      const f2 = form.querySelector('input[name="fecha"]');
      if (f2){
        const d = new Date();
        f2.value = d.toISOString().slice(0,10);
      }
      contaToggleCashFields();
      contaToggleArete();

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
      const cajaSub = String(fd.get('cajaSubcuenta')||'').trim();
      const contraCuenta = String(fd.get('contraCuenta')||'').trim();

      if (!id || !fechaVal || !cuentaKey || !Number.isFinite(monto)){
        alert('Completa fecha, cuenta y monto.');
        return;
      }

      const { ledger, idx } = contaFindLedgerIndex(id);
      if (idx < 0) return;

      const acc = contaGetAccountByKey(cuentaKey);
      if (contaAccountImpactsCash(acc)){
        if (!cajaSub){
          alert('Selecciona la subcuenta de Caja/Bancos.');
          return;
        }
      } else if (contaModoAvanzado() && contaContraRequired(acc) && !contraCuenta){
        alert('Selecciona la contra cuenta.');
        return;
      }

      ledger[idx] = {
        ...ledger[idx],
        fecha: fechaVal,
        cuentaKey,
        cuentaCode: acc.code || '',
        cuentaName: acc.name || '',
        tipo: acc.tipo || 'Egreso',
        contraCuenta,
        cajaSubcuenta: cajaSub,
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

  const btnCerrar = document.getElementById('btn-conta-cerrar');
  if (btnCerrar){
    btnCerrar.addEventListener('click', ()=>{
      if (!contaCanEdit()) return;
      const year = Number(yearSel?.value || new Date().getFullYear());
      const t = contaTotalsForYear(year);
      const next = year + 1;

      const ok = confirm(`Cerrar ejercicio ${year}?\n\nSaldo Caja y Bancos (B-01) al cierre: ${fmtMXN(t.cash)}\nSe registrará como saldo inicial de ${next}.`);
      if (!ok) return;

      contaSetOpening(next, { total: t.cash, subs: {} });
      contaSetClosed(year, true);
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

  const btnExportYear = document.getElementById('btn-conta-export-global');
  if (btnExportYear){
    btnExportYear.addEventListener('click', ()=>{
      const year = Number(yearSel?.value || new Date().getFullYear());
      const t = contaTotalsForYear(year);
      const rows = [
        ['Fecha','Tipo','Cuenta','Caja/Bancos','Contra Cuenta','Proveedor/Cliente','Factura','Arete Oficial','Tipo producto','Ref pago','Monto','Descripción','Usuario'],
        ...t.ledger
          .slice().sort((a,b)=> (a.fecha||'').localeCompare(b.fecha||''))
          .map(m=>{
            const a = contaGetAccountByKey(m.cuentaKey);
            const impactsCash = contaAccountImpactsCash(a);
            return [
              m.fecha||'',
              a.tipo||'',
              (a.code? a.code+' — ':'') + a.name,
              impactsCash ? (m.cajaSubcuenta||'') : '',
              impactsCash ? '' : (m.contraCuenta||''),
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
      const desde = document.getElementById('conta-rep-desde')?.value || '';
      const hasta = document.getElementById('conta-rep-hasta')?.value || '';
      const rows = [
        ['Fecha','Cuenta','Caja/Bancos','Contra Cuenta','Proveedor/Cliente','Factura','Arete Oficial','Tipo producto','Ref pago','Monto','Descripción','Usuario'],
        ...t.ledger
          .filter(m=>m.cuentaKey===key)
          .filter(m=> !desde || String(m.fecha||'') >= desde)
          .filter(m=> !hasta || String(m.fecha||'') <= hasta)
          .slice().sort((a,b)=> (a.fecha||'').localeCompare(b.fecha||''))
          .map(m=>[
            m.fecha||'',
            (acc.code? acc.code+' — ':'') + acc.name,
            contaAccountImpactsCash(acc) ? (m.cajaSubcuenta||'') : '',
            contaAccountImpactsCash(acc) ? '' : (m.contraCuenta||''),
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

  const btnCashAdd = document.getElementById('btn-conta-caja-add');
  if (btnCashAdd){
    btnCashAdd.addEventListener('click', ()=>{
      if (!contaCanEdit()) return;
      const code = String(document.getElementById('conta-caja-code')?.value || '').trim();
      const name = String(document.getElementById('conta-caja-name')?.value || '').trim();
      if (!code || !name){
        alert('Indica código y nombre para la subcuenta.');
        return;
      }
      const list = getContaCashSubs();
      if (list.some(s => s.code === code)){
        alert('Ya existe una subcuenta con ese código.');
        return;
      }
      list.push({ code, name });
      setContaCashSubs(list);
      document.getElementById('conta-caja-code').value = '';
      document.getElementById('conta-caja-name').value = '';
      contaFillCashSelect(selCaja, '');
      contaFillCashSelect(editCaja, '');
      contaRender();
    });
  }

  const btnOpeningToggle = document.getElementById('btn-conta-opening-toggle');
  const openingPanel = document.getElementById('conta-opening-panel');
  if (btnOpeningToggle && openingPanel){
    btnOpeningToggle.addEventListener('click', ()=>{
      openingPanel.classList.toggle('activo');
    });
  }

  const formOpening = document.getElementById('form-conta-opening');
  if (formOpening){
    formOpening.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      if (!contaCanEdit()) return;
      const year = Number(yearSel?.value || new Date().getFullYear());
      if (contaIsClosed(year)){
        alert('Este ejercicio está cerrado.');
        return;
      }

      const fd = new FormData(formOpening);
      const entries = [];
      const addEntry = (code, amount, tipo) => {
        const acc = contaGetAccountByCode(code, tipo);
        if (!acc || !amount) return;
        const mov = {
          id: 'OPEN-' + Date.now() + '-' + Math.random().toString(16).slice(2),
          fecha: String(fd.get('fecha')||'').trim() || new Date().toISOString().slice(0,10),
          cuentaKey: acc.key,
          cuentaCode: acc.code,
          cuentaName: acc.name,
          tipo: acc.tipo,
          contraCuenta: 'BP-01',
          cajaSubcuenta: '',
          tercero: '',
          factura: '',
          tipoProducto: '',
          areteOficial: '',
          refPago: '',
          descripcion: 'Asiento inicial de operaciones.',
          monto: Number(amount||0),
          usuario: localStorage.getItem('pecuario_usuario_actual') || ''
        };
        entries.push(mov);
      };

      const fields = [
        { code: 'BGR-01', field: 'open-bgr', tipo: 'Sin efectivo' },
        { code: 'BGC-01', field: 'open-bgc', tipo: 'Sin efectivo' },
        { code: 'BME-01', field: 'open-bme', tipo: 'Sin efectivo' },
        { code: 'BCI-01', field: 'open-bci', tipo: 'Sin efectivo' },
        { code: 'BTE-01', field: 'open-bte', tipo: 'Sin efectivo' },
        { code: 'BOA-01', field: 'open-boa', tipo: 'Sin efectivo' },
        { code: 'BPB-01', field: 'open-bpb', tipo: 'Sin efectivo' },
        { code: 'BPT-01', field: 'open-bpt', tipo: 'Sin efectivo' }
      ];

      fields.forEach(f=>{
        const amt = Number(fd.get(f.field) || 0);
        if (amt) addEntry(f.code, amt, f.tipo);
      });

      const ledger = getContaLedger();
      entries.forEach(e=> ledger.push(e));
      if (entries.length) setContaLedger(ledger);

      const subs = getContaCashSubs();
      const opening = { total: 0, subs: {} };
      subs.forEach(sub=>{
        const key = `open-cash-${sub.code}`;
        const amt = Number(fd.get(key) || 0);
        if (amt) opening.subs[sub.code] = amt;
      });
      opening.total = contaSumOpeningSubs(opening);
      contaSetOpening(year, opening);

      formOpening.reset();
      contaRender();
      actualizarPanel();
      actualizarReportes();
      if (openingPanel) openingPanel.classList.remove('activo');
      alert('Asiento inicial registrado.');
    });
  }

  // Render cash inputs in opening form
  const openingCashWrap = document.getElementById('conta-opening-cash-wrap');
  if (openingCashWrap){
    const subs = getContaCashSubs();
    openingCashWrap.innerHTML = '';
    subs.forEach(sub=>{
      const row = document.createElement('div');
      row.className = 'conta-opening-row';
      const label = document.createElement('label');
      label.textContent = `${sub.code} — ${sub.name}`;
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.01';
      input.name = `open-cash-${sub.code}`;
      row.appendChild(label);
      row.appendChild(input);
      openingCashWrap.appendChild(row);
    });
  }

  document.addEventListener('pecuario:contabilidad-modo-cambio', ()=>{
    contaFillAccountSelect(selCuenta, { includeAll:false });
    contaFillAccountSelect(editCuenta, { includeAll:false });
    contaFillAccountSelect(selFiltro, { includeAll:true });
    contaFillAccountSelect(selRep, { includeAll:true });
    contaToggleArete();
    contaToggleCashFields();
    contaToggleAreteEdit();
    contaToggleCashFieldsEdit();
    contaRender();
  });

  // Primera render
  contaRender();
}

initContabilidad();
