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

  setCount('rep-animales',    cabezasArray({includeBajas:false}).length);
  setCount('rep-bajas',       getData('pecuario_animales_bajas').length);
  setCount('rep-pesajes',     getData('pecuario_pesaje_ind').length + getData('pecuario_pesaje_grupo').length);
  setCount('rep-repro',       getData('pecuario_repro').length);
  setCount('rep-empadres',    getData('pecuario_repro').filter(r => String(r.fechaEmp || '').trim() || String(r.toro || '').trim() || String(r.vientre || '').trim()).length);
  setCount('rep-sanidad',     getData('pecuario_sanidad').length);
  setCount('rep-conta',       (getData('pecuario_conta_ledger')||[]).length);
  setCount('rep-seguridad',   getData('pecuario_visitas').length + getData('pecuario_bitacora').length);
  setCount('rep-maquinaria',  getData('pecuario_maquinaria').length);
  setCount('rep-actividades', getTareas().length);
  setCount('rep-potreros',    getData('pecuario_potreros').length);
  setCount('rep-corrales',    getData('pecuario_corrales').length);
  setCount('rep-supl',        getData('pecuario_suplementos').length + getData('pecuario_supl_suministros').length);
}
