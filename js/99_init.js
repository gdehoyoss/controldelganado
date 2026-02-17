// ======================
  // Init UI
  // ======================
  refrescarRazasEnUI();
  refrescarGruposEnUI();
  refrescarPotrerosEnUI();
  if (typeof initReproProporciones === 'function') initReproProporciones();

    // Extras
  refrescarSelectorAnimalesCambioGrupo();
  if (typeof initCabezasModule === 'function') initCabezasModule();
  renderPermReportesUI();
  aplicarPermisosReportes();
// Listas iniciales
  pintarLista('pecuario_pesaje_ind', 'lista-pesaje-ind', (p) => {
    const deltaObj = ultimoPesajeAnimal(p.areteOficial);
    const deltaTxt = deltaObj ? ` | Δ vs último: ${deltaObj.delta.toFixed(1)} kg` : '';
    return `Arete ${p.areteOficial || '-'} | Fecha: ${p.fecha || '-'} | Peso: ${p.peso || ''} kg | Ubicación: ${p.ubicacion || '-'}${deltaTxt}`;
  });
  pintarLista('pecuario_pesaje_grupo', 'lista-pesaje-grupo', (p) => {
    const prom = parseFloat(p.pesoProm||0) || 0;
    const delta = p.deltaProm ? ` | Δ prom: ${p.deltaProm} kg/cab` : '';
    return `Grupo ${p.grupo || '-'} | Fecha: ${p.fecha || '-'} | Potrero: ${p.potrero || '-'} | Corral: ${p.corral || '-'} | Cabezas: ${p.cabezas || ''} | Total: ${p.pesoTotal || ''} kg | Prom: ${prom.toFixed(1)} kg/cab${delta}`;
  });

  pintarSuplementos();
  renderPuntos();
  actualizarPanel();
  actualizarReportes();
  setupReportesModal();
  if (typeof initActividadesExtras === 'function') initActividadesExtras();


  if (window.firebaseSync?.startLegacySync) {
    window.firebaseSync.startLegacySync();
    window.addEventListener('pecuario:sync-updated', ()=>{
      if (typeof initCabezasModule === 'function') initCabezasModule();
      actualizarPanel();
      actualizarReportes();
    });
  }
