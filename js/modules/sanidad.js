// ======================
// Sanidad
// ======================

manejarFormulario(
  'form-sanidad',
  'pecuario_sanidad',
  'lista-sanidad',
  (s) => `Arete ${s.arete || '-'} | ${s.tipo || ''} | Enf: ${s.enfermedad || '-'} | Tratamiento: ${s.tratamiento || '-'}`,
  null,
  (obj, form) => {
    // Enfermedad / motivo: mismo catálogo que en Nacimientos (con "Otro" editable)
    const cat = (obj.enfermedadCat || '').trim();
    const otro = (obj.enfermedadOtro || '').trim();

    if (cat === 'Otro') {
      if (!otro) {
        alert('Seleccionaste "Otro". Especifica la enfermedad/motivo.');
        return false;
      }
      obj.enfermedad = otro;
    } else if (cat) {
      obj.enfermedad = cat;
    } else {
      // Si no selecciona, se deja vacío (compatible con registros anteriores)
      obj.enfermedad = (obj.enfermedad || '').trim();
    }
    return true;
  }
);

// --------- Sanidad: Enfermedad "Otro" ----------
(function initSanidadEnfermedad(){
  const sel = document.getElementById('selEnfSan');
  const wrap = document.getElementById('wrapEnfSanOtro');
  const form = document.getElementById('form-sanidad');
  if (!sel || !wrap) return;
  const on = ()=>{ wrap.style.display = (sel.value==='Otro') ? 'block' : 'none'; };
  sel.addEventListener('change', on);
  if (form) form.addEventListener('reset', ()=>setTimeout(on,0));
  on();
})();
