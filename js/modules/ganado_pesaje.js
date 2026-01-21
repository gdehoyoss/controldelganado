// ======================
  // Pesajes: Individual
  // ======================
  function ultimoPesajeAnimal(arete) {
    const lista = getData('pecuario_pesaje_ind');
    const matches = lista.filter(x => (x.areteOficial||'') === (arete||'') && x.peso);
    if (matches.length < 2) return null;
    // último previo (antes del último)
    const last = matches[matches.length - 1];
    const prev = matches[matches.length - 2];
    const delta = (parseFloat(last.peso||0) - parseFloat(prev.peso||0));
    return { last, prev, delta };
  }

  manejarFormulario(
    'form-pesaje-ind',
    'pecuario_pesaje_ind',
    'lista-pesaje-ind',
    (p) => {
      const w = parseFloat(p.peso||0);
      const arete = p.areteOficial || '-';
      const deltaObj = ultimoPesajeAnimal(p.areteOficial);
      const deltaTxt = deltaObj ? ` | Δ vs último: ${deltaObj.delta.toFixed(1)} kg` : '';
      return `Arete ${arete} | Fecha: ${p.fecha || '-'} | Peso: ${w ? w.toFixed(1) : ''} kg | Ubicación: ${p.ubicacion || '-'}${deltaTxt}`;
    },
    (obj) => {
      const el = document.getElementById('notaDeltaInd');
      const info = ultimoPesajeAnimal(obj.areteOficial);
      if (el) {
        if (info) el.textContent = `Ganancia/Pérdida vs último pesaje: ${info.delta.toFixed(1)} kg (Arete ${obj.areteOficial}).`;
        else el.textContent = 'Primer pesaje de este arete (no hay comparación aún).';
      }
    }
  );

  // ======================
  // Pesajes: Grupo
  // ======================
  const formPesGrupo = document.getElementById('form-pesaje-grupo');
  if (formPesGrupo) {
    formPesGrupo.addEventListener('input', () => {
      const cabezas = parseFloat(formPesGrupo.cabezas.value || '0') || 0;
      const total = parseFloat(formPesGrupo.pesoTotal.value || '0') || 0;
      const prom = (cabezas > 0) ? (total / cabezas) : 0;
      formPesGrupo.pesoProm.value = prom ? prom.toFixed(1) : '';

      // delta promedio vs último del mismo "grupo"
      const g = formPesGrupo.grupo.value || '';
      const lista = getData('pecuario_pesaje_grupo').filter(x => (x.grupo||'') === g && x.pesoProm);
      if (lista.length) {
        const last = lista[lista.length - 1];
        const lastProm = parseFloat(last.pesoProm||0) || 0;
        const delta = prom - lastProm;
        formPesGrupo.deltaProm.value = (cabezas>0 && total>0 && g) ? delta.toFixed(1) : '';
      } else {
        formPesGrupo.deltaProm.value = '';
      }
    });
  }

  manejarFormulario(
    'form-pesaje-grupo',
    'pecuario_pesaje_grupo',
    'lista-pesaje-grupo',
    (p) => {
      const prom = parseFloat(p.pesoProm||0) || ((parseFloat(p.pesoTotal||0) || 0) / (parseFloat(p.cabezas||0) || 1));
      const delta = parseFloat(p.deltaProm||0);
      const deltaTxt = (p.deltaProm !== '' && !isNaN(delta)) ? ` | Δ prom: ${delta.toFixed(1)} kg/cab` : '';
      return `Grupo ${p.grupo || '-'} | Fecha: ${p.fecha || '-'} | Potrero: ${p.potrero || '-'} | Corral: ${p.corral || '-'} | Cabezas: ${p.cabezas || ''} | Total: ${p.pesoTotal || ''} kg | Prom: ${prom.toFixed(1)} kg/cab${deltaTxt}`;
    },
    (obj) => {
      const el = document.getElementById('notaDeltaGrupo');
      if (!el) return;
      if (obj.deltaProm) el.textContent = `Ganancia/Pérdida promedio vs último del grupo: ${obj.deltaProm} kg/cabeza.`;
      else el.textContent = 'Primer pesaje de este grupo (no hay comparación aún).';
    }
  );

  
