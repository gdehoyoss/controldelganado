  (function initNacimientos(){
    const sel = document.getElementById('selSaludNac');
    const wrap = document.getElementById('wrapSaludOtro');
    if (!sel || !wrap) return;
    const on = ()=>{ wrap.style.display = (sel.value==='Otro') ? 'block' : 'none'; };
    sel.addEventListener('change', on);
    on();
  })();

  // --------- Sanidad: Enfermedad "Otro" ----------
