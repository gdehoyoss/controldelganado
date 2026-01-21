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
