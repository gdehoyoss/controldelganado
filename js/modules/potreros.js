  (function initGPSCorral(){
    const b1 = document.getElementById('btnPuntoGPSCorral');
    const b2 = document.getElementById('btnLimpiarGPSCorral');
    if (b1) b1.addEventListener('click', async ()=>{
      const p = await geoGetPoint();
      if (!p) return;
      window.puntosCorral.push(p);
      renderPuntosCorral();
    });
    if (b2) b2.addEventListener('click', limpiarPuntosCorral);

    const form = document.getElementById('form-corrales');
    if (form && form.cabezas) {
      form.cabezas.addEventListener('input', recalcularCorralForm);
    }
    renderPuntosCorral();
  })();

  // --------- Mapa de corrales dentro del potrero ----------
  (function initMapaCorrales(){
    const btn = document.getElementById('btnMapaCorrales');
    const info = document.getElementById('mapaCorralesInfo');
    const canvas = document.getElementById('canvasPotrero');
    const form = document.getElementById('form-potreros');
    if (!btn || !canvas || !form) return;

    btn.addEventListener('click', ()=>{
      const letra = (form.letra && form.letra.value) ? form.letra.value : '';
      if (!letra) { if (info) info.textContent = 'Selecciona primero el potrero.'; return; }
      const potPts = (window.puntos||[]).slice();
      if (potPts.length < 3) { if (info) info.textContent = 'Captura el polígono del potrero (GPS) para poder generar el mapa.'; return; }
      const corr = getData('pecuario_corrales').filter(c => (c.potrero||'')===letra && c.puntos && c.puntos.length>=3);

      // dibujar potrero base
      drawPolygonOn(canvas, potPts);

      // dibujar corrales encima, mismo bbox conjunto (recalcular bbox global)
      const allPts = potPts.concat(...corr.map(c=>c.puntos));
      let minLat=Infinity,maxLat=-Infinity,minLon=Infinity,maxLon=-Infinity;
      allPts.forEach(p=>{
        minLat=Math.min(minLat,p.lat); maxLat=Math.max(maxLat,p.lat);
        minLon=Math.min(minLon,p.lon); maxLon=Math.max(maxLon,p.lon);
      });
      const ctx = canvas.getContext('2d');
      const pad=20;
      const w=canvas.width-2*pad, h=canvas.height-2*pad;
      const dx=(maxLon-minLon)||1e-9, dy=(maxLat-minLat)||1e-9;
      const xy=(p)=>({x: pad + ((p.lon-minLon)/dx)*w, y: pad + (1-((p.lat-minLat)/dy))*h});

      corr.forEach((c,idx)=>{
        const pts=c.puntos;
        ctx.beginPath();
        pts.forEach((p,i)=>{
          const {x,y}=xy(p);
          if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.closePath();
        ctx.lineWidth=2;
        ctx.strokeStyle='rgba(17,24,39,0.8)';
        ctx.stroke();
        ctx.fillStyle='rgba(17,24,39,0.05)';
        ctx.fill();

        // etiqueta
        const c0=xy(pts[0]);
        ctx.font='12px system-ui';
        ctx.fillStyle='rgba(17,24,39,0.85)';
        ctx.fillText(`C${c.corralId||idx+1}`, c0.x+6, c0.y+12);
      });

      // guardar imagen dentro del registro del potrero (último por letra)
      try{
        const img = canvas.toDataURL('image/png');
        const potreros = getData('pecuario_potreros');
        for (let i=potreros.length-1; i>=0; i--){
          if ((potreros[i].letra||'')===letra){
            potreros[i].mapaCorralesImg = img;
            setData('pecuario_potreros', potreros);
            break;
          }
        }
      }catch(e){}

      const cabezas = corr.reduce((s,c)=> s + (parseFloat(c.cabezas||'0')||0), 0);
      if (info) info.textContent = `Mapa generado. Corrales con polígono: ${corr.length}. Cabezas (suma): ${cabezas}.`;
    });
  })();

  // --------- Suplementos: ingredientes en tabla + suministro por corral ----------
