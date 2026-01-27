// ======================
  // Portada
  // ======================
  document.addEventListener('DOMContentLoaded', () => {
    const portada = document.getElementById('portada');
    if (!portada) return;
    const btnEntrar = document.getElementById('btnEntrar');
    const btnCerrarMarca = document.getElementById('btnCerrarMarca');
    const wm = portada.querySelector('.watermark');

    if (btnEntrar) {
      btnEntrar.addEventListener('click', (e) => { if(e) e.preventDefault();
        portada.style.display = 'none';
      });
    }
    if (btnCerrarMarca) {
      btnCerrarMarca.addEventListener('click', () => {
        if (wm) wm.style.display = (wm.style.display === 'none') ? 'grid' : 'none';
      });
    }
  });
// ======================
  // Navegación principal
  // ======================
  const navBtns = document.querySelectorAll('nav button');
  const modulos = document.querySelectorAll('section.modulo');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-modulo');
      navBtns.forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      modulos.forEach(sec => sec.classList.remove('activo'));
      const destino = document.getElementById('mod-' + target);
      if (destino) destino.classList.add('activo');
      actualizarPanel();
      actualizarReportes();
    });
  });

  // ======================
  // Subtabs (Animales / Potreros)
  // ======================
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
      datos.forEach((val, key) => {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
          obj[key].push(val);
          return;
        }
        obj[key] = val;
      });
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

  
