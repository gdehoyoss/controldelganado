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


  
;

  
  // --------- Pronóstico 7 días (Panel) - Open-Meteo ----------
