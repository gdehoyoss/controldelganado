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
  const elVientres = document.getElementById('pnl-vientres');
  if (elVientres) elVientres.textContent = totalBGR;

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
  setCount('rep-valor-ganado',getData('pecuario_valor_cabezas').length);
  setCount('rep-bajas',       getData('pecuario_animales_bajas').length);
  setCount('rep-pesajes',     getData('pecuario_pesaje_ind').length + getData('pecuario_pesaje_grupo').length);
  setCount('rep-repro',       getData('pecuario_repro').length);
  setCount('rep-crias',       getData('pecuario_repro_crias').length);
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


const INFO_OFICIAL_KEY = 'pecuario_info_oficial_docs';
const INFO_OFICIAL_CATEGORIAS = [
  {
    id: 'Agropecuaria',
    titulos: [
      'Registro de la UPP',
      'Historial de Reemos',
      'Inventario de ganado oficial ante Siniiga (altas y bajas)',
      'Pruebas anuales de sangre',
      'Autorización de “Fierro”',
      'Afiliación a la Unión Ganadera Regional de la Zona',
      'Credenciales de afiliación a la Unión',
      'Apoyos de Gobierno',
      'Ejido',
      'Propiedad Privada',
      'Afiliaciones a diversas Asociaciones o Clubes de Ganadería',
      'Registro de Marca(s) del Rancho',
      'Página Web',
      'Otros'
    ]
  },
  {
    id: 'Propiedad',
    titulos: [
      'Certificados Parcelarios',
      'Documentación Ejidal',
      'Escritura(s) de propiedad de la tierra',
      'Derechos de paso',
      'Recibos del o los Prediales',
      'Títulos de Concesión de agua',
      'Declaraciones a Conagua; Altas de los pozos',
      'Contratos con CFE y números de Servicios',
      'Recibos de pago de Luz',
      'Otros'
    ]
  },
  {
    id: 'Fiscal',
    titulos: [
      'Escritura constitutiva de la Sociedad',
      'Poderes de los Representantes',
      'INE del propietario(s) o de los Representantes legales',
      'Curp del propietario(s) o de los Representantes legales',
      'Acta(s) de nacimiento y matrimonio de los propietarios',
      'Régimen Fiscal y Alta en el Sat',
      'Declaraciones de Impuestos y notificaciones del Sat',
      'Otros'
    ]
  },
  {
    id: 'Administración',
    titulos: [
      'Bancos - Préstamos',
      'Bancos - Cuentas de Cheques',
      'Bancos - Tarjetas de Crédito y Débito',
      'Bancos - Estados de cuenta',
      'Bancos - Seguros contra riesgos',
      'Asesores - Contador',
      'Asesores - Abogado',
      'Asesores - Tecnología',
      'Asesores - Sanidad',
      'Otros'
    ]
  }
];

function getInfoOficialDocs(){
  const data = getData(INFO_OFICIAL_KEY);
  return Array.isArray(data) ? data : [];
}

function setInfoOficialDocs(rows){
  setData(INFO_OFICIAL_KEY, Array.isArray(rows) ? rows : []);
}

function infoOficialResumen(item){
  const cuando = item.fecha ? new Date(item.fecha).toLocaleString('es-MX') : 'Sin fecha';
  const titulos = (item.titulos || []).join(', ') || 'Sin títulos seleccionados';
  return `${item.archivo || 'Archivo'} | ${titulos} | ${cuando}`;
}

function renderInfoOficialList(categoriaId){
  const lista = getInfoOficialDocs().filter(r => r.categoria === categoriaId);
  const cont = document.getElementById(`panelInfoFiles_${categoriaId}`);
  if (!cont) return;
  if (!lista.length){
    cont.innerHTML = '<div class="nota">Sin documentos cargados.</div>';
    return;
  }
  cont.innerHTML = '';
  lista.slice().reverse().forEach(it => {
    const div = document.createElement('div');
    div.className = 'item';
    div.textContent = infoOficialResumen(it);
    cont.appendChild(div);
  });
}

function initPanelInformacionOficial(){
  const btn = document.getElementById('btnInfoOficialToggle');
  const wrap = document.getElementById('panelInfoOficialWrap');
  const grid = document.getElementById('panelInfoOficialGrid');
  if (!btn || !wrap || !grid) return;

  btn.addEventListener('click', ()=>{
    const abierto = !wrap.hasAttribute('hidden');
    if (abierto) {
      wrap.setAttribute('hidden', 'hidden');
      btn.textContent = 'Abrir Información Oficial';
    } else {
      wrap.removeAttribute('hidden');
      btn.textContent = 'Ocultar Información Oficial';
    }
  });

  grid.innerHTML = '';
  INFO_OFICIAL_CATEGORIAS.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'panel-info-card';
    const checks = cat.titulos.map((tit, idx)=>
      `<label><input type="checkbox" name="io_${cat.id}" value="${tit.replaceAll('"','&quot;')}"> <span>${tit}</span></label>`
    ).join('');
    card.innerHTML = `
      <h4 style="margin:0 0 8px 0;">${cat.id}</h4>
      <div class="panel-info-checklist">${checks}</div>
      <div style="margin-top:8px;">
        <input type="file" id="panelInfoInput_${cat.id}" multiple />
        <button type="button" class="btn-secundario" id="panelInfoBtn_${cat.id}" style="margin-top:8px;">Subir copia(s)</button>
      </div>
      <div class="panel-info-files" id="panelInfoFiles_${cat.id}"></div>
    `;
    grid.appendChild(card);

    const fileInput = card.querySelector(`#panelInfoInput_${cat.id}`);
    const saveBtn = card.querySelector(`#panelInfoBtn_${cat.id}`);
    if (saveBtn && fileInput){
      saveBtn.addEventListener('click', ()=>{
        const files = Array.from(fileInput.files || []);
        if (!files.length) return alert('Selecciona al menos un archivo.');
        const selectedTitulos = Array.from(card.querySelectorAll(`input[name="io_${cat.id}"]:checked`)).map(x=>x.value);
        const rows = getInfoOficialDocs();
        files.forEach(f => {
          rows.push({
            categoria: cat.id,
            titulos: selectedTitulos,
            archivo: f.name,
            tipo: f.type || '',
            tamanio: Number(f.size || 0),
            usuario: localStorage.getItem('pecuario_usuario_actual') || '',
            fecha: new Date().toISOString()
          });
        });
        setInfoOficialDocs(rows);
        fileInput.value = '';
        renderInfoOficialList(cat.id);
        alert('Documento(s) registrado(s).');
      });
    }
    renderInfoOficialList(cat.id);
  });
}

document.addEventListener('DOMContentLoaded', initPanelInformacionOficial);
