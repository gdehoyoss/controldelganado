/**
 * INIT.JS - Inicialización de la aplicación
 * Este archivo debe cargarse DESPUÉS de dom-helpers.js
 * Archivo: js/init.js
 */

(function() {
  'use strict';

  // Esperar a que el DOM esté completamente cargado
  DOMHelpers.ready(() => {
    console.log('Inicializando aplicación Control de Ganado...');

    // ===================================================================
    // CONFIGURACIÓN DE EVENT DELEGATION GLOBAL
    // Para que todos los selectores funcionen incluso con elementos dinámicos
    // ===================================================================

    // Navigation/Tabs
    DOMHelpers.delegate('body', 'click', '[data-tab]', function(e) {
      e.preventDefault();
      const tabId = this.dataset.tab;
      activarTab(tabId);
    });

    // Botones de acción
    DOMHelpers.delegate('body', 'click', '[data-action]', function(e) {
      e.preventDefault();
      const action = this.dataset.action;
      ejecutarAccion(action, this);
    });

    // Formularios con data-form
    DOMHelpers.delegate('body', 'submit', '[data-form]', function(e) {
      e.preventDefault();
      const formType = this.dataset.form;
      manejarFormulario(formType, this);
    });

    // Botones de eliminar
    DOMHelpers.delegate('body', 'click', '.btn-eliminar, [data-delete]', function(e) {
      e.preventDefault();
      const id = this.dataset.id || this.dataset.delete;
      const tipo = this.dataset.tipo || 'registro';
      confirmarEliminacion(id, tipo);
    });

    // Botones de editar
    DOMHelpers.delegate('body', 'click', '.btn-editar, [data-edit]', function(e) {
      e.preventDefault();
      const id = this.dataset.id || this.dataset.edit;
      const tipo = this.dataset.tipo || 'registro';
      abrirEdicion(id, tipo);
    });

    // Selects que disparan acciones
    DOMHelpers.delegate('body', 'change', 'select[data-on-change]', function(e) {
      const action = this.dataset.onChange;
      const value = this.value;
      ejecutarAccionSelect(action, value, this);
    });

    // ===================================================================
    // INICIALIZACIÓN DE MÓDULOS
    // ===================================================================

    inicializarModulos();
    configurarEventosGenerales();
    cargarDatosIniciales();
  });

  // ===================================================================
  // FUNCIONES DE INICIALIZACIÓN
  // ===================================================================

  function inicializarModulos() {
    console.log('Inicializando módulos...');

    // Inicializar módulo de animales/ganado
    if (typeof initAnimales === 'function') {
      initAnimales();
    }

    // Inicializar módulo de contabilidad
    if (typeof initContabilidad === 'function') {
      initContabilidad();
    }

    // Inicializar módulo de reportes
    if (typeof initReportes === 'function') {
      initReportes();
    }

    // Verificar qué módulos están disponibles
    console.log('Módulos disponibles:', {
      animales: typeof initAnimales !== 'undefined',
      contabilidad: typeof initContabilidad !== 'undefined',
      reportes: typeof initReportes !== 'undefined'
    });
  }

  function configurarEventosGenerales() {
    // Cerrar modales al hacer click fuera
    DOMHelpers.delegate('body', 'click', '.modal', function(e) {
      if (e.target === this) {
        cerrarModal(this);
      }
    });

    // Botones de cerrar modal
    DOMHelpers.delegate('body', 'click', '.modal-close, [data-close-modal]', function(e) {
      e.preventDefault();
      const modal = this.closest('.modal');
      if (modal) cerrarModal(modal);
    });

    // Tecla ESC para cerrar modales
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modalActivo = $('.modal.active');
        if (modalActivo) cerrarModal(modalActivo);
      }
    });

    // Búsqueda en tablas
    DOMHelpers.delegate('body', 'input', '[data-search-table]', function(e) {
      const tableId = this.dataset.searchTable;
      const searchTerm = this.value.toLowerCase();
      filtrarTabla(tableId, searchTerm);
    });
  }

  function cargarDatosIniciales() {
    console.log('Cargando datos iniciales...');
    
    // Cargar datos del localStorage si existen
    cargarDatosLocalStorage();
    
    // Actualizar UI
    actualizarContadores();
    actualizarFechaHora();
    
    // Actualizar fecha/hora cada minuto
    setInterval(actualizarFechaHora, 60000);
  }

  // ===================================================================
  // FUNCIONES DE UTILIDAD
  // ===================================================================

  function activarTab(tabId) {
    // Desactivar todos los tabs
    $$('[data-tab]').forEach(tab => {
      tab.classList.remove('active');
    });

    // Ocultar todos los contenidos
    $$('.tab-content').forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none';
    });

    // Activar tab seleccionado
    const tabButton = $(`[data-tab="${tabId}"]`);
    if (tabButton) {
      tabButton.classList.add('active');
    }

    // Mostrar contenido
    const content = $(`#${tabId}`);
    if (content) {
      content.classList.add('active');
      content.style.display = 'block';
    }

    // Guardar tab activo
    localStorage.setItem('ultimoTab', tabId);

    console.log('Tab activado:', tabId);
  }

  function ejecutarAccion(action, element) {
    console.log('Ejecutando acción:', action);

    const acciones = {
      'nuevo-animal': () => abrirModalNuevoAnimal(),
      'nuevo-movimiento': () => abrirModalNuevoMovimiento(),
      'generar-reporte': () => generarReporte(),
      'exportar-datos': () => exportarDatos(),
      'importar-datos': () => importarDatos(),
      'configuracion': () => abrirConfiguracion()
    };

    if (acciones[action]) {
      acciones[action]();
    } else {
      console.warn('Acción no implementada:', action);
    }
  }

  function manejarFormulario(formType, form) {
    console.log('Manejando formulario:', formType);

    const data = DOMHelpers.getFormData(form);
    
    switch(formType) {
      case 'animal':
        guardarAnimal(data);
        break;
      case 'movimiento':
        guardarMovimiento(data);
        break;
      case 'contabilidad':
        guardarAsientoContable(data);
        break;
      default:
        console.warn('Tipo de formulario no reconocido:', formType);
    }
  }

  function confirmarEliminacion(id, tipo) {
    const mensaje = `¿Está seguro de eliminar este ${tipo}?`;
    
    if (confirm(mensaje)) {
      eliminarRegistro(id, tipo);
    }
  }

  function abrirEdicion(id, tipo) {
    console.log('Abriendo edición:', tipo, id);
    
    // Aquí se cargarían los datos del registro
    const datos = obtenerRegistro(id, tipo);
    
    if (datos) {
      // Llenar formulario con datos
      const form = $(`[data-form="${tipo}"]`);
      if (form) {
        DOMHelpers.setFormData(form, datos);
        
        // Abrir modal de edición
        const modal = form.closest('.modal');
        if (modal) abrirModal(modal);
      }
    }
  }

  function ejecutarAccionSelect(action, value, select) {
    console.log('Acción de select:', action, value);
    
    // Implementar acciones específicas según necesidad
    switch(action) {
      case 'filtrar-raza':
        filtrarPorRaza(value);
        break;
      case 'cambiar-periodo':
        cambiarPeriodoReporte(value);
        break;
      default:
        console.log('Acción de select no implementada:', action);
    }
  }

  function abrirModal(modal) {
    if (typeof modal === 'string') {
      modal = $(modal);
    }
    
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function cerrarModal(modal) {
    if (typeof modal === 'string') {
      modal = $(modal);
    }
    
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
      document.body.style.overflow = '';
      
      // Limpiar formularios dentro del modal
      const forms = $$('form', modal);
      forms.forEach(form => form.reset());
    }
  }

  function filtrarTabla(tableId, searchTerm) {
    const table = $(`#${tableId}`);
    if (!table) return;

    const rows = $$('tbody tr', table);
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  function actualizarContadores() {
    // Actualizar contadores en el dashboard
    const totalAnimales = $('#totalAnimales');
    const totalReproduccion = $('#totalReproduccion');
    const totalComercial = $('#totalComercial');

    // Aquí se obtendrían los datos reales
    if (totalAnimales) totalAnimales.textContent = '0';
    if (totalReproduccion) totalReproduccion.textContent = '0';
    if (totalComercial) totalComercial.textContent = '0';
  }

  function actualizarFechaHora() {
    const fechaElement = $('#fechaActual');
    if (fechaElement) {
      const ahora = new Date();
      fechaElement.textContent = ahora.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  function cargarDatosLocalStorage() {
    // Restaurar último tab activo
    const ultimoTab = localStorage.getItem('ultimoTab');
    if (ultimoTab) {
      activarTab(ultimoTab);
    }
  }

  // ===================================================================
  // FUNCIONES PLACEHOLDER (Para implementar según tu lógica)
  // ===================================================================

  function abrirModalNuevoAnimal() {
    console.log('Abrir modal nuevo animal');
    abrirModal('#modalAnimal');
  }

  function abrirModalNuevoMovimiento() {
    console.log('Abrir modal nuevo movimiento');
    abrirModal('#modalMovimiento');
  }

  function guardarAnimal(data) {
    console.log('Guardando animal:', data);
    // Implementar lógica de guardado
  }

  function guardarMovimiento(data) {
    console.log('Guardando movimiento:', data);
    // Implementar lógica de guardado
  }

  function guardarAsientoContable(data) {
    console.log('Guardando asiento contable:', data);
    // Implementar lógica de guardado
  }

  function eliminarRegistro(id, tipo) {
    console.log('Eliminando:', tipo, id);
    // Implementar lógica de eliminación
  }

  function obtenerRegistro(id, tipo) {
    console.log('Obteniendo registro:', tipo, id);
    // Implementar lógica de obtención
    return null;
  }

  function filtrarPorRaza(raza) {
    console.log('Filtrar por raza:', raza);
    // Implementar filtrado
  }

  function cambiarPeriodoReporte(periodo) {
    console.log('Cambiar periodo:', periodo);
    // Implementar cambio de periodo
  }

  function generarReporte() {
    console.log('Generar reporte');
    // Implementar generación de reporte
  }

  function exportarDatos() {
    console.log('Exportar datos');
    // Implementar exportación
  }

  function importarDatos() {
    console.log('Importar datos');
    // Implementar importación
  }

  function abrirConfiguracion() {
    console.log('Abrir configuración');
    // Implementar configuración
  }

})();
