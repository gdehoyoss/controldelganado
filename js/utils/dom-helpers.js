/**
 * DOM HELPERS - Utilidades para manejo robusto del DOM
 * Soluciona problemas comunes con selectores y event listeners
 * Archivo: js/utils/dom-helpers.js
 */

const DOMHelpers = {
  /**
   * Espera a que el DOM esté completamente cargado
   */
  ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  },

  /**
   * Selecciona un elemento de forma segura
   * Retorna null si no existe en lugar de lanzar error
   */
  $(selector, context = document) {
    try {
      if (typeof selector === 'string') {
        return context.querySelector(selector);
      }
      return selector; // Ya es un elemento
    } catch (e) {
      console.warn(`Selector inválido: ${selector}`, e);
      return null;
    }
  },

  /**
   * Selecciona múltiples elementos de forma segura
   */
  $$(selector, context = document) {
    try {
      return Array.from(context.querySelectorAll(selector));
    } catch (e) {
      console.warn(`Selector inválido: ${selector}`, e);
      return [];
    }
  },

  /**
   * Selecciona elemento por ID de forma segura
   */
  byId(id) {
    return document.getElementById(id);
  },

  /**
   * Event delegation - Útil para elementos dinámicos
   * Ejemplo: on('click', '.btn-delete', (e) => { ... })
   */
  on(eventType, selector, callback, parent = document) {
    parent.addEventListener(eventType, function(e) {
      const target = e.target.closest(selector);
      if (target) {
        callback.call(target, e);
      }
    });
  },

  /**
   * Agrega event listener con verificación de existencia
   */
  addEvent(selector, eventType, callback) {
    const element = this.$(selector);
    if (element) {
      element.addEventListener(eventType, callback);
      return true;
    }
    console.warn(`No se encontró el elemento: ${selector}`);
    return false;
  },

  /**
   * Espera a que un elemento exista en el DOM
   * Útil para elementos que se crean dinámicamente
   */
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = this.$(selector);
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(() => {
        const element = this.$(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout esperando elemento: ${selector}`));
      }, timeout);
    });
  },

  /**
   * Crea un elemento HTML de forma segura
   */
  create(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Agregar atributos
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'innerHTML') {
        element.innerHTML = attributes[key];
      } else if (key === 'textContent') {
        element.textContent = attributes[key];
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, attributes[key]);
      } else {
        element[key] = attributes[key];
      }
    });

    // Agregar hijos
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });

    return element;
  },

  /**
   * Muestra/oculta elementos
   */
  show(selector) {
    const elements = typeof selector === 'string' ? this.$$(selector) : [selector];
    elements.forEach(el => {
      if (el) el.style.display = '';
    });
  },

  hide(selector) {
    const elements = typeof selector === 'string' ? this.$$(selector) : [selector];
    elements.forEach(el => {
      if (el) el.style.display = 'none';
    });
  },

  toggle(selector) {
    const elements = typeof selector === 'string' ? this.$$(selector) : [selector];
    elements.forEach(el => {
      if (el) {
        el.style.display = el.style.display === 'none' ? '' : 'none';
      }
    });
  },

  /**
   * Agrega/remueve clases de forma segura
   */
  addClass(selector, className) {
    const elements = typeof selector === 'string' ? this.$$(selector) : [selector];
    elements.forEach(el => {
      if (el) el.classList.add(className);
    });
  },

  removeClass(selector, className) {
    const elements = typeof selector === 'string' ? this.$$(selector) : [selector];
    elements.forEach(el => {
      if (el) el.classList.remove(className);
    });
  },

  toggleClass(selector, className) {
    const elements = typeof selector === 'string' ? this.$$(selector) : [selector];
    elements.forEach(el => {
      if (el) el.classList.toggle(className);
    });
  },

  /**
   * Obtiene/establece valores de inputs de forma segura
   */
  getValue(selector) {
    const element = this.$(selector);
    if (!element) return null;
    
    if (element.type === 'checkbox') {
      return element.checked;
    } else if (element.type === 'radio') {
      const checked = this.$(`${selector}:checked`);
      return checked ? checked.value : null;
    } else if (element.tagName === 'SELECT' && element.multiple) {
      return Array.from(element.selectedOptions).map(opt => opt.value);
    }
    return element.value;
  },

  setValue(selector, value) {
    const element = this.$(selector);
    if (!element) return false;

    if (element.type === 'checkbox') {
      element.checked = Boolean(value);
    } else if (element.type === 'radio') {
      const radio = this.$(`${selector}[value="${value}"]`);
      if (radio) radio.checked = true;
    } else {
      element.value = value;
    }
    
    // Disparar evento change
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  },

  /**
   * Limpia un formulario
   */
  clearForm(formSelector) {
    const form = this.$(formSelector);
    if (form) {
      form.reset();
      // Disparar evento change en todos los campos
      this.$$('input, select, textarea', form).forEach(field => {
        field.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  },

  /**
   * Obtiene datos de un formulario como objeto
   */
  getFormData(formSelector) {
    const form = this.$(formSelector);
    if (!form) return {};

    const data = {};
    const formData = new FormData(form);
    
    for (let [key, value] of formData.entries()) {
      // Manejar múltiples valores (checkboxes con mismo name)
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    return data;
  },

  /**
   * Establece datos en un formulario desde un objeto
   */
  setFormData(formSelector, data) {
    const form = this.$(formSelector);
    if (!form) return false;

    Object.keys(data).forEach(key => {
      const field = this.$(`[name="${key}"]`, form);
      if (field) {
        this.setValue(`[name="${key}"]`, data[key]);
      }
    });

    return true;
  },

  /**
   * Delega eventos a elementos de un contenedor
   * Útil cuando se agregan/eliminan elementos dinámicamente
   */
  delegate(containerSelector, eventType, childSelector, callback) {
    const container = this.$(containerSelector);
    if (!container) {
      console.warn(`Contenedor no encontrado: ${containerSelector}`);
      return;
    }

    container.addEventListener(eventType, function(e) {
      const target = e.target.closest(childSelector);
      if (target && container.contains(target)) {
        callback.call(target, e);
      }
    });
  }
};

// Alias para facilitar el uso
const $ = DOMHelpers.$.bind(DOMHelpers);
const $$ = DOMHelpers.$$.bind(DOMHelpers);

// Exportar para usar en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMHelpers;
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.DOMHelpers = DOMHelpers;
  window.$ = $;
  window.$$ = $$;
}

/**
 * EJEMPLO DE USO PARA TU APLICACIÓN
 */

// Inicializar cuando el DOM esté listo
DOMHelpers.ready(() => {
  console.log('DOM cargado y listo');
  
  // EJEMPLO 1: Event listeners seguros
  DOMHelpers.addEvent('#btnGuardar', 'click', (e) => {
    e.preventDefault();
    console.log('Guardar clickeado');
  });

  // EJEMPLO 2: Event delegation para elementos dinámicos
  // Esto funciona incluso si los botones se crean después
  DOMHelpers.delegate('#tablaAnimales', 'click', '.btn-eliminar', function(e) {
    const animalId = this.dataset.id;
    console.log('Eliminar animal:', animalId);
  });

  // EJEMPLO 3: Esperar elementos dinámicos
  DOMHelpers.waitForElement('#modalEditar')
    .then(modal => {
      console.log('Modal encontrado:', modal);
      // Agregar event listeners
    })
    .catch(err => console.error(err));

  // EJEMPLO 4: Manejar formularios
  DOMHelpers.addEvent('#formAnimal', 'submit', (e) => {
    e.preventDefault();
    const data = DOMHelpers.getFormData('#formAnimal');
    console.log('Datos del formulario:', data);
  });

  // EJEMPLO 5: Selección segura con verificación
  const selectRaza = $('#selectRaza');
  if (selectRaza) {
    selectRaza.addEventListener('change', (e) => {
      console.log('Raza seleccionada:', e.target.value);
    });
  }
});

/**
 * SOLUCIÓN ESPECÍFICA PARA SELECTORES QUE NO FUNCIONAN
 * 
 * Si tienes selectores que no funcionan, probablemente sea por:
 * 1. Elementos creados dinámicamente
 * 2. Scripts cargando antes del DOM
 * 
 * REEMPLAZA esto:
 * document.getElementById('miBoton').addEventListener('click', ...);
 * 
 * POR esto:
 * DOMHelpers.ready(() => {
 *   DOMHelpers.addEvent('#miBoton', 'click', ...);
 * });
 * 
 * O para elementos dinámicos, usa delegation:
 * DOMHelpers.delegate('#contenedor', 'click', '.miBoton', ...);
 */
