// ======================
  // Reproducción: autofill + proporciones de cruza
  // ======================
  const PROPS = [
    "1/32","3/32","5/32","7/32","9/32","11/32","13/32","15/32","31/32",
    "1/16","3/16","5/16","7/16","9/16","15/16",
    "1/8","3/8","5/8","7/8",
    "1/4","3/4",
    "1/3","2/3",
    "1/2",
    "1/1"
  ];
  function propToNum(s){
    const t = String(s||'').trim();
    if (!t) return 0;
    if (t.includes('/')){
      const [a,b] = t.split('/');
      const na = Number(a), nb = Number(b);
      if (!nb) return 0;
      return na/nb;
    }
    const n = Number(t);
    return isNaN(n) ? 0 : n;
  }
  function numToBestProp(n){
    // elige la opción más cercana
    let best = PROPS[PROPS.length-1], bestDiff = Infinity;
    PROPS.forEach(p=>{
      const d = Math.abs(propToNum(p) - n);
      if (d < bestDiff){ bestDiff = d; best = p; }
    });
    return best;
  }
  function ensurePropSelect(afterEl, name){
    if (!afterEl || afterEl.parentElement?.querySelector('select[data-prop="'+name+'"]')) return null;
    const sel = document.createElement('select');
    sel.dataset.prop = name;
    sel.className = 'selProp';
    sel.style.marginTop = '6px';
    sel.innerHTML = '<option value="">Proporción…</option>' + PROPS.map(p=>`<option>${p}</option>`).join('');
    afterEl.parentElement.appendChild(sel);
    return sel;
  }
  function initReproProporciones(){
    const form = document.getElementById('form-repro');
    if (!form) return;

    // crea selects de proporción debajo de cada select de raza/cruza
    const razaH = form.querySelector('select[name="razaH"]');
    const cruzaH1 = form.querySelector('select[name="cruzaH1"]');
    const cruzaH2 = form.querySelector('select[name="cruzaH2"]');
    const razaM = form.querySelector('select[name="razaM"]');
    const cruzaM1 = form.querySelector('select[name="cruzaM1"]');
    const cruzaM2 = form.querySelector('select[name="cruzaM2"]');

    const pH = ensurePropSelect(razaH, 'pHpre');
    const pH1 = ensurePropSelect(cruzaH1, 'pH1');
    const pH2 = ensurePropSelect(cruzaH2, 'pH2');
    const pM = ensurePropSelect(razaM, 'pMpre');
    const pM1 = ensurePropSelect(cruzaM1, 'pM1');
    const pM2 = ensurePropSelect(cruzaM2, 'pM2');

    function setDefaultProps(which){
      // which: 'H' or 'M'
      const selPre = which==='H' ? razaH : razaM;
      const sel1 = which==='H' ? cruzaH1 : cruzaM1;
      const sel2 = which==='H' ? cruzaH2 : cruzaM2;
      const pPre = which==='H' ? pH : pM;
      const pp1 = which==='H' ? pH1 : pM1;
      const pp2 = which==='H' ? pH2 : pM2;
      if (!pPre) return;
      const has1 = sel1 && sel1.value;
      const has2 = sel2 && sel2.value;
      if (!has1 && !has2){
        pPre.value = '1/1';
        if (pp1) pp1.value = '';
        if (pp2) pp2.value = '';
      } else if (has1 && !has2){
        pPre.value = '1/2';
        if (pp1) pp1.value = '1/2';
        if (pp2) pp2.value = '';
      } else {
        pPre.value = '1/2';
        if (pp1) pp1.value = '1/4';
        if (pp2) pp2.value = '1/4';
      }
    }

    function sumProps(selPre, sel1, sel2, pPre, p1, p2){
      const out = {};
      const add = (breed, prop)=>{
        const b = String(breed||'').trim();
        if (!b) return;
        out[b] = (out[b]||0) + prop;
      };
      const total = propToNum(pPre?.value) + propToNum(p1?.value) + propToNum(p2?.value);
      const falt = Math.max(0, 1 - total);
      add(selPre?.value, propToNum(pPre?.value));
      add(sel1?.value, propToNum(p1?.value));
      add(sel2?.value, propToNum(p2?.value));
      if (falt > 1e-6) add('Otras', falt);
      return out;
    }

    function calcCria(){
      const ph = sumProps(razaH, cruzaH1, cruzaH2, pH, pH1, pH2);
      const pm = sumProps(razaM, cruzaM1, cruzaM2, pM, pM1, pM2);

      // 50/50
      const all = {};
      Object.keys(ph).forEach(k=> all[k] = (all[k]||0) + ph[k]*0.5);
      Object.keys(pm).forEach(k=> all[k] = (all[k]||0) + pm[k]*0.5);

      const ranked = Object.entries(all).sort((a,b)=>b[1]-a[1]);
      const top = ranked.filter(x=>x[0] && x[0]!=='').slice(0,3);

      const setVal = (name, breed, propNum)=>{
        const sel = form.querySelector(`select[name="${name}"]`);
        if (sel && breed) sel.value = breed;
        const propSel = form.querySelector(`select[data-prop="${name}"]`);
        if (propSel) propSel.value = numToBestProp(propNum||0);
      };

      // añade campos de cría si no existen: crea al final del form
      let criaBox = document.getElementById('criaBoxProps');
      if (!criaBox){
        criaBox = document.createElement('div');
        criaBox.id = 'criaBoxProps';
        criaBox.className = 'tarjeta';
        criaBox.style.background='#fff';
        criaBox.style.border='1px solid #e5e7eb';
        criaBox.style.marginTop='12px';
        criaBox.innerHTML = `
          <h3 style="margin:0 0 8px;">Cría (estimación de cruza)</h3>
          <div class="fila-tres">
            <div>
              <label>Cruza preponderante</label>
              <select name="razaC" class="selRaza"></select>
              <select data-prop="razaC" class="selProp"></select>
            </div>
            <div>
              <label>Cruza 1</label>
              <select name="cruzaC1" class="selRaza"></select>
              <select data-prop="cruzaC1" class="selProp"></select>
            </div>
            <div>
              <label>Cruza 2</label>
              <select name="cruzaC2" class="selRaza"></select>
              <select data-prop="cruzaC2" class="selProp"></select>
            </div>
          </div>
          <p class="nota">La suma siempre se normaliza a 1. Si falta proporción, se asigna a “Otras”.</p>
        `;
        form.appendChild(criaBox);
        // llena razas
        refrescarRazasEnUI();
        // llena props
        criaBox.querySelectorAll('select.selProp').forEach(sel=>{
          sel.innerHTML = '<option value="">Proporción…</option>' + PROPS.map(p=>`<option>${p}</option>`).join('');
        });
      }

      // set values
      const b0 = top[0] ? top[0][0] : '';
      const p0 = top[0] ? top[0][1] : 0;
      const b1 = top[1] ? top[1][0] : '';
      const p1n = top[1] ? top[1][1] : 0;
      const b2 = top[2] ? top[2][0] : '';
      const p2n = top[2] ? top[2][1] : 0;

      const selC = criaBox.querySelector('select[name="razaC"]'); if (selC) selC.value = b0 || '';
      const selC1 = criaBox.querySelector('select[name="cruzaC1"]'); if (selC1) selC1.value = b1 || '';
      const selC2 = criaBox.querySelector('select[name="cruzaC2"]'); if (selC2) selC2.value = b2 || '';
      const pr0 = criaBox.querySelector('select[data-prop="razaC"]'); if (pr0) pr0.value = numToBestProp(p0);
      const pr1 = criaBox.querySelector('select[data-prop="cruzaC1"]'); if (pr1) pr1.value = numToBestProp(p1n);
      const pr2 = criaBox.querySelector('select[data-prop="cruzaC2"]'); if (pr2) pr2.value = numToBestProp(p2n);
    }

    // eventos para recalcular
    [razaH,cruzaH1,cruzaH2,razaM,cruzaM1,cruzaM2,pH,pH1,pH2,pM,pM1,pM2].filter(Boolean).forEach(el=>{
      el.addEventListener('change', ()=>{ calcCria(); });
    });

    // autofill desde Cabezas al escribir aretes
    const inpV = form.querySelector('input[name="vientre"]');
    const inpT = form.querySelector('input[name="toro"]');
    function fillFromArete(which){
      const a = which==='H' ? (inpV?.value||'').trim() : (inpT?.value||'').trim();
      const cab = getCabeza(a);
      if (!cab) return;
      if (which==='H'){
        if (razaH) razaH.value = cab.razaPre || '';
        if (cruzaH1) cruzaH1.value = cab.cruza1 || '';
        if (cruzaH2) cruzaH2.value = cab.cruza2 || '';
        setDefaultProps('H');
      } else {
        if (razaM) razaM.value = cab.razaPre || '';
        if (cruzaM1) cruzaM1.value = cab.cruza1 || '';
        if (cruzaM2) cruzaM2.value = cab.cruza2 || '';
        setDefaultProps('M');
      }
      calcCria();
    }
    if (inpV) inpV.addEventListener('change', ()=> fillFromArete('H'));
    if (inpT) inpT.addEventListener('change', ()=> fillFromArete('M'));

    // defaults iniciales
    setDefaultProps('H');
    setDefaultProps('M');
    calcCria();
  }

// (Cabezas) inicialización manejada por initCabezasModule()

  

// ======================
  // Reproducción: calcular cruza cría y fecha probable
  // ======================
  
  function calcCruzaCria(form) {
    if (!form) return;

    const take = (name) => {
      const el = form.querySelector(`[name="${name}"]`);
      return el ? (el.value||'').trim() : '';
    };
    const takeProp = (name) => {
      // selects inyectados por initReproProporciones: pHpre, pH1, pH2, pMpre, pM1, pM2
      const el = form.querySelector(`[name="${name}"]`);
      return el ? (el.value||'').trim() : '';
    };

    function buildMap(prefix){ // 'H' o 'M'
      const pre = take('raza'+prefix);
      const c1  = take(prefix==='H' ? 'cruzaH1' : 'cruzaM1');
      const c2  = take(prefix==='H' ? 'cruzaH2' : 'cruzaM2');
      const pPre = propToNum(takeProp('p'+prefix+'pre'));
      const p1   = propToNum(takeProp('p'+prefix+'1'));
      const p2   = propToNum(takeProp('p'+prefix+'2'));

      const m = {};
      const add = (raza, p)=>{
        const r = (raza||'').trim();
        if (!r || !p) return;
        m[r] = (m[r]||0) + p;
      };

      add(pre, pPre);
      add(c1, p1);
      add(c2, p2);

      let sum = Object.values(m).reduce((a,b)=>a+b,0);
      // asigna faltante a "Otras"
      if (sum < 0.999 && sum > 0){
        m['Otras'] = (m['Otras']||0) + (1 - sum);
        sum = 1;
      }
      // si excede 1, normaliza proporcionalmente
      if (sum > 1.001){
        const factor = 1/sum;
        Object.keys(m).forEach(k=> m[k] = m[k]*factor);
      }
      return m;
    }

    function top3(map){
      return Object.entries(map)
        .filter(([,v])=>v>0.0001)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,3);
    }

    const H = buildMap('H');
    const M = buildMap('M');

    // preponderantes (por proporción real, no solo el select)
    const hTop = top3(H);
    const mTop = top3(M);
    if (form.cruzaPreH) form.cruzaPreH.value = hTop[0] ? hTop[0][0] : (take('razaH')||'');
    if (form.cruzaPreM) form.cruzaPreM.value = mTop[0] ? mTop[0][0] : (take('razaM')||'');

    // Perfil de cría: 50% madre + 50% macho
    const C = {};
    const addHalf = (src)=>{
      Object.entries(src).forEach(([k,v])=>{
        C[k] = (C[k]||0) + 0.5*v;
      });
    };
    addHalf(H); addHalf(M);

    const cTop = top3(C);
    const parts = cTop.map(([k,v])=> `${k} ${numToBestProp(v)}`);
    // añade "Otras" si quedó residual y no entra en top3
    const sumTop = cTop.reduce((a,[,v])=>a+v,0);
    if (sumTop < 0.999){
      const other = 1 - sumTop;
      if (other > 0.02) parts.push(`Otras ${numToBestProp(other)}`);
    }

    // salida principal
    form.cruzaCria.value = parts.join(' + ');

    // también guardamos un JSON “oculto” por si se requiere en reportes
    form.dataset.perfilHembra = JSON.stringify(H);
    form.dataset.perfilMacho = JSON.stringify(M);
    form.dataset.perfilCria = JSON.stringify(C);
  }


  const formRepro = document.getElementById('form-repro');
  if (formRepro) {
    formRepro.addEventListener('change', ()=> calcCruzaCria(formRepro));
    formRepro.addEventListener('input', ()=> calcCruzaCria(formRepro));
  }
  const btnCalcularProb = document.getElementById('btnCalcularProb');
  if (btnCalcularProb && formRepro) {
    btnCalcularProb.addEventListener('click', ()=> {
      const fe = formRepro.fechaEmp.value;
      if (!fe) return alert('Primero captura la fecha de empadre.');
      const d = new Date(fe + 'T00:00:00');
      d.setDate(d.getDate() + 283);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      formRepro.fechaProb.value = `${yyyy}-${mm}-${dd}`;
    });
  }

  manejarFormulario(
    'form-repro',
    'pecuario_repro',
    'lista-repro',
    (r) => `Hembra ${r.vientre || '-'} (${r.razaH || '-'}) | Toro: ${r.toro || '-'} (${r.razaM || '-'}) | Empadre: ${r.fechaEmp || '-'} | Prob: ${r.fechaProb || '-'} | Parto: ${r.fechaParto || '-'} | Cría: ${r.sexoCria || '-'} ${r.pesoCria || ''} kg`,
    null
  );

  