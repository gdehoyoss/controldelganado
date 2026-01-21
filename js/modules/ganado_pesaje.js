  (function initPesajeAuto(){
    const form = document.getElementById('form-pesaje-ind');
    if (!form) return;
    const inArete = form.querySelector('input[name="areteOficial"]');
    const inAreteR = form.querySelector('input[name="areteRancho"]');
    const selSexo = document.getElementById('selSexoPesInd');

    const sync = ()=>{
      const a = buscarAnimalPorArete(inArete ? inArete.value : '');
      if (!a) return;
      if (inAreteR && !inAreteR.value) inAreteR.value = a.areteRancho || '';
      if (selSexo && a.sexo) selSexo.value = a.sexo;
    };

    if (inArete) {
      inArete.addEventListener('change', sync);
      inArete.addEventListener('blur', sync);
    }
  })();

  // --------- GPS Corrales ----------
  window.puntosCorral = [];
  function drawPolygonOn(canvas, points){
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (!points || points.length < 2) return;

    // bbox
    let minLat=Infinity,maxLat=-Infinity,minLon=Infinity,maxLon=-Infinity;
    points.forEach(p=>{
      minLat=Math.min(minLat,p.lat); maxLat=Math.max(maxLat,p.lat);
      minLon=Math.min(minLon,p.lon); maxLon=Math.max(maxLon,p.lon);
    });
    const pad=20;
    const w=canvas.width-2*pad, h=canvas.height-2*pad;
    const dx = (maxLon-minLon) || 1e-9;
    const dy = (maxLat-minLat) || 1e-9;

    const xy = (p)=>{
      const x = pad + ((p.lon - minLon)/dx)*w;
      const y = pad + (1-((p.lat - minLat)/dy))*h;
      return {x,y};
    };

    // poly
    ctx.beginPath();
    points.forEach((p,i)=>{
      const {x,y}=xy(p);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.lineWidth=3;
    ctx.strokeStyle='rgba(209,0,0,0.85)';
    ctx.stroke();
    ctx.fillStyle='rgba(209,0,0,0.08)';
    ctx.fill();

    // vertices
    points.forEach((p,i)=>{
      const {x,y}=xy(p);
      ctx.beginPath();
      ctx.arc(x,y,4,0,Math.PI*2);
      ctx.fillStyle='rgba(17,24,39,0.85)';
      ctx.fill();
      ctx.font='12px system-ui';
      ctx.fillText(String(i+1), x+6, y-6);
    });
  }

  function renderPuntosCorral(){
    const lista = document.getElementById('listaPuntosCorral');
    const areaEl = document.getElementById('areaCorralM2');
    const canvas = document.getElementById('canvasCorral');
    if (lista) {
      if (!window.puntosCorral.length) lista.textContent = 'Sin puntos aún.';
      else lista.textContent = window.puntosCorral.map((p,i)=>`${i+1}. ${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}`).join(' | ');
    }
    if (areaEl) {
      const area = window.puntosCorral.length >=3 ? areaPoligonoM2(window.puntosCorral) : 0;
      areaEl.value = area ? String(Math.round(area)) : '';
    }
    if (canvas) drawPolygonOn(canvas, window.puntosCorral);

    recalcularCorralForm();
  }

  function limpiarPuntosCorral(){
    window.puntosCorral = [];
    renderPuntosCorral();
  }

  function recalcularCorralForm(){
    const form = document.getElementById('form-corrales');
    if (!form) return;
    const area = parseFloat((form.areaM2 && form.areaM2.value) ? form.areaM2.value : '0') || 0;
    const cab  = parseFloat(form.cabezas ? form.cabezas.value : '0') || 0;

    const m2El = form.m2PorCabeza;
    const haEl = form.cabezasHa;
    const densEl = form.densidadAuto;

    if (area>0 && cab>0) {
      const m2 = area/cab;
      const ha = cab*10000/area;
      if (m2El) m2El.value = m2.toFixed(1);
      if (haEl) haEl.value = ha.toFixed(0);
      if (densEl) densEl.value = ha.toFixed(0);
    } else {
      if (m2El) m2El.value = '';
      if (haEl) haEl.value = '';
      if (densEl) densEl.value = '';
    }
  }

