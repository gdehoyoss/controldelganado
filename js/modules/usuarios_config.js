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

