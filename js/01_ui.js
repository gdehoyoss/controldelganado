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
  initSubtabs(document.getElementById('mod-repro'));

  // ======================
  // Guía rápida por módulo
  // ======================
  const GUIAS_MODULO = {
    panel: {
      titulo: 'Guía rápida: Panel general',
      subtitulo: 'Aquí ves el resumen del día sin meterte a cada pantalla.',
      pasos: [
        'Primero revisa tarjetas clave: cabezas, nacimientos, sanidad y dinero.',
        'Si te falta clima, toca "Permitir ubicación" y luego "Actualizar".',
        'Úsalo como tablero rápido para decidir qué atender hoy.'
      ]
    },
    animales: {
      titulo: 'Guía rápida: Ganado',
      subtitulo: 'Aquí das de alta, bajas y pesajes de tus animales.',
      pasos: [
        'En "Altas" captura arete, sexo, grupo y peso inicial.',
        'En "Bajas" registra cuándo y por qué salió el animal.',
        'En "Pesajes" guarda el peso para seguir el avance.'
      ]
    },
    potreros: {
      titulo: 'Guía rápida: Potreros y Corrales',
      subtitulo: 'Te ayuda a ubicar ganado y movimientos por área.',
      pasos: [
        'Registra potrero o corral con nombre claro para el equipo.',
        'Anota entradas y salidas para saber dónde está cada grupo.',
        'Revisa ocupación para evitar sobrecargar una zona.'
      ]
    },
    repro: {
      titulo: 'Guía rápida: Reproducción',
      subtitulo: 'Lleva control de celo, servicio, preñez y parto.',
      pasos: [
        'Empieza con el arete correcto para no confundir vacas.',
        'Registra fecha de servicio o inseminación al momento.',
        'Da seguimiento hasta confirmar preñez y luego parto.'
      ]
    },
    sanidad: {
      titulo: 'Guía rápida: Sanidad',
      subtitulo: 'Anota vacunas, tratamientos y cualquier evento de salud.',
      pasos: [
        'Captura qué se aplicó, a quién y en qué fecha.',
        'Escribe dosis y observaciones en palabras simples.',
        'Revisa historial antes de volver a medicar.'
      ]
    },
    conta: {
      titulo: 'Guía rápida: Contabilidad',
      subtitulo: 'Lleva dinero de forma simple: apertura, movimientos y cierre de año.',
      pasos: [
        'Primero define saldo inicial del año en "Apertura" para arrancar bien.',
        'Luego registra cada ingreso o egreso con su cuenta y monto real.',
        'Al final revisa el total y usa "Cerrar ejercicio" cuando todo esté cuadrado.'
      ]
    },
    seguridad: {
      titulo: 'Guía rápida: Registros del Velador',
      subtitulo: 'Sirve para dejar evidencia de rondines y novedades.',
      pasos: [
        'Anota hora, evento y observación de cada ronda.',
        'Si hubo visita o incidente, deja detalle corto y claro.',
        'Consulta registros para entregar turno sin perder información.'
      ]
    },
    maquinaria: {
      titulo: 'Guía rápida: Maquinaria y equipo',
      subtitulo: 'Lleva control básico de uso y mantenimiento.',
      pasos: [
        'Registra equipo con nombre que todos entiendan.',
        'Anota uso, fallas y servicio realizado.',
        'Programa mantenimientos para evitar paros inesperados.'
      ]
    },
    actividades: {
      titulo: 'Guía rápida: Responsabilidades y tareas',
      subtitulo: 'Organiza pendientes del día por persona.',
      pasos: [
        'Crea tareas cortas y directas, con responsable.',
        'Marca prioridad para saber qué se atiende primero.',
        'Cierra tareas al terminar para mantener orden real.'
      ]
    },
    reportes: {
      titulo: 'Guía rápida: Reportes',
      subtitulo: 'Aquí filtras datos y puedes exportar información.',
      pasos: [
        'Selecciona el reporte y usa filtros por módulo o fecha.',
        'Apóyate en búsqueda rápida para encontrar registros puntuales.',
        'Exporta CSV cuando necesites compartir o respaldar datos.'
      ]
    },
    config: {
      titulo: 'Guía rápida: Perfil del rancho',
      subtitulo: 'Configura datos generales y accesos de usuarios.',
      pasos: [
        'Actualiza datos del rancho para tener información vigente.',
        'Registra usuarios y define permisos por módulo.',
        'Revisa cambios antes de guardar para evitar errores de acceso.'
      ]
    }
  };

  const modalGuia = document.getElementById('modalGuiaModulo');
  const guiaTitulo = document.getElementById('guiaTitulo');
  const guiaSubtitulo = document.getElementById('guiaSubtitulo');
  const guiaLista = document.getElementById('guiaLista');
  const btnCerrarGuia = document.getElementById('btnCerrarGuiaModulo');

  function abrirGuiaModulo(modKey) {
    if (!modalGuia || !guiaTitulo || !guiaSubtitulo || !guiaLista) return;
    const data = GUIAS_MODULO[modKey];
    if (!data) return;
    guiaTitulo.textContent = data.titulo;
    guiaSubtitulo.textContent = data.subtitulo;
    guiaLista.innerHTML = '';
    data.pasos.forEach(paso => {
      const li = document.createElement('li');
      li.textContent = paso;
      guiaLista.appendChild(li);
    });
    modalGuia.classList.add('activo');
    modalGuia.setAttribute('aria-hidden', 'false');
  }

  function cerrarGuiaModulo() {
    if (!modalGuia) return;
    modalGuia.classList.remove('activo');
    modalGuia.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('section.modulo').forEach(sec => {
    const modKey = (sec.id || '').replace('mod-', '');
    if (!GUIAS_MODULO[modKey]) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-guia-modulo';
    btn.setAttribute('aria-label', 'Abrir guía rápida de este módulo');
    btn.title = 'Guía rápida';
    btn.textContent = '?';
    btn.addEventListener('click', () => abrirGuiaModulo(modKey));
    sec.appendChild(btn);
  });

  if (btnCerrarGuia) btnCerrarGuia.addEventListener('click', cerrarGuiaModulo);
  if (modalGuia) {
    modalGuia.addEventListener('click', (e) => {
      if (e.target === modalGuia) cerrarGuiaModulo();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalGuia && modalGuia.classList.contains('activo')) {
      cerrarGuiaModulo();
    }
  });

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

  
