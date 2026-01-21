  (function initPronosticoPanel(){
    const btnPerm = document.getElementById('btnPermitirUbicacion');
    const btnUpd  = document.getElementById('btnActualizarPronostico');
    const grid    = document.getElementById('wx7');
    const status  = document.getElementById('wxStatus');
    let accumEl = document.getElementById("wxAccum");
    if (!btnPerm || !btnUpd || !grid) return;

    const W = {
      0:'Despejado', 1:'Mayormente despejado', 2:'Parcialmente nublado', 3:'Nublado',
      45:'Niebla', 48:'Niebla escarchada',
      51:'Llovizna ligera', 53:'Llovizna', 55:'Llovizna intensa',
      61:'Lluvia ligera', 63:'Lluvia', 65:'Lluvia intensa',
      71:'Nieve ligera', 73:'Nieve', 75:'Nieve intensa',
      80:'Chubascos ligeros', 81:'Chubascos', 82:'Chubascos intensos',
      95:'Tormenta', 96:'Tormenta con granizo', 99:'Tormenta con granizo'
    };
    const D = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

    const iconSvg = (kind) => {
      if (kind === 'sun') return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" stroke="#8b4513" stroke-width="2"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M19.8 4.2l-2.1 2.1M6.3 17.7l-2.1 2.1"
            stroke="#8b4513" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      if (kind === 'rain') return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7.5 18.5h9.2a4.3 4.3 0 0 0 0-8.6h-.4A5.6 5.6 0 0 0 6 10.6a3.9 3.9 0 0 0 1.5 7.9z"
            stroke="#4b3b2d" stroke-width="2" stroke-linejoin="round"/>
          <path d="M9 20.5l-1 2M13 20.5l-1 2M17 20.5l-1 2" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7.5 18.5h9.2a4.3 4.3 0 0 0 0-8.6h-.4A5.6 5.6 0 0 0 6 10.6a3.9 3.9 0 0 0 1.5 7.9z"
            stroke="#4b3b2d" stroke-width="2" stroke-linejoin="round"/>
        </svg>`;
    };

    const kindFromCode = (code) => {
      code = Number(code);
      if (code === 0 || code === 1) return 'sun';
      if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloud';
      if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return 'rain';
      return 'cloud';
    };

    const fmtYMD = (d)=>{
      const z=(n)=>String(n).padStart(2,'0');
      return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
    };

    let lastPos = null;

    async function ensurePos(){
      try{
        if (status) status.textContent = 'Solicitando ubicación…';
        const p = await geoGetPoint();
        lastPos = p;
        if (status) status.textContent = `Ubicación OK (±${Math.round(p.acc||0)}m).`;
        return p;
      } catch (e) {
        if (status) status.textContent = 'Ubicación no disponible. Revisa permisos del navegador.';
        throw e;
      }
    }

    async function cargarAcumuladoAnual(p){
      if (!accumEl) return;
      try{
        const today = new Date();
        const year = today.getFullYear();
        const start = `${year}-01-01`;
        const end = fmtYMD(today);
        accumEl.textContent = 'Calculando acumulado anual…';
        const urlA = `https://archive-api.open-meteo.com/v1/archive?latitude=${p.lat}&longitude=${p.lon}&start_date=${start}&end_date=${end}&daily=precipitation_sum&timezone=auto`;
        const rA = await fetch(urlA);
        if (!rA.ok) throw new Error('Error acumulado');
        const dA = await rA.json();
        const ps = (dA.daily && dA.daily.precipitation_sum) ? dA.daily.precipitation_sum : [];
        const sum = (ps||[]).reduce((a,b)=>a + (Number(b)||0), 0);
        accumEl.textContent = `Acumulado lluvia ${year} (1 Ene – ${end}): ${sum.toFixed(1)} mm`;
      } catch(e){
        accumEl.textContent = 'Acumulado anual: —';
      }
    }

    async function cargar(){
      try{
        const p = lastPos || await ensurePos();
        grid.innerHTML = '<div class="nota">Cargando pronóstico…</div>';

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        const r = await fetch(url);
        if (!r.ok) throw new Error('Error al consultar clima');
        const data = await r.json();

        // guarda temperatura actual para Panel
        try{
          if (data.current && (data.current.temperature_2m !== undefined)){
            localStorage.setItem('pecuario_temp_actual', String(data.current.temperature_2m));
          }
        }catch(e){}

        const daily = data.daily || {};
        const fechas = (daily.time || []).slice(0, 7);
        const tmax = (daily.temperature_2m_max || []).slice(0, 7);
        const tmin = (daily.temperature_2m_min || []).slice(0, 7);
        const code = (daily.weathercode || []).slice(0, 7);
        const rain = (daily.precipitation_sum || []).slice(0, 7);

        if (!fechas.length) {
          grid.innerHTML = '<div class="nota">Sin datos de pronóstico.</div>';
          return;
        }

        grid.innerHTML = '';

        // Re-crear el acumulado anual (se borra al limpiar el grid)
        accumEl = document.createElement('div');
        accumEl.className = 'wx-accum';
        accumEl.id = 'wxAccum';
        accumEl.textContent = 'Acumulado anual: —';
        
        fechas.forEach((iso, i)=>{
          const d = new Date(String(iso) + 'T12:00:00');
          const dayName = D[d.getDay()] || String(iso);
          const dayNum = d.getDate();
          const day = `${dayName} ${dayNum}`;
          const kind = kindFromCode(code[i]);
          const desc = W[code[i]] || '';
          const mm = Number(rain[i] ?? 0);

          const card = document.createElement('div');
          card.className = 'wx-card';
          card.innerHTML = `
            <div class="wx-day">${day}</div>
            <div class="wx-icon" title="${desc}">${iconSvg(kind)}</div>
            <div class="wx-temp">${Math.round(tmax[i])}° <small>/ ${Math.round(tmin[i])}°</small></div>
            <div class="wx-rain">${mm.toFixed(1)} mm</div>
          `;
          grid.appendChild(card);
        });

                // Poner el acumulado al final de las tarjetas
        if (accumEl && !accumEl.isConnected) grid.appendChild(accumEl);

        await cargarAcumuladoAnual(p);

        if (status) status.textContent = `Actualizado: ${new Date().toLocaleString()}`;
      } catch (e) {
        grid.innerHTML = '<div class="nota">No se pudo cargar el pronóstico. Revisa internet y permisos de ubicación.</div>';
        if (accumEl) accumEl.textContent = 'Acumulado anual: —';
      }
    }

    btnPerm.addEventListener('click', async ()=>{ try { await ensurePos(); await cargar(); } catch(e){} });
    btnUpd.addEventListener('click', cargar);
  })();
// --------- Usuarios y permisos ----------
  const MODS = [
    {id:'panel', label:'Panel'},
    {id:'animales', label:'Animales'},
    {id:'potreros', label:'Potreros y Corrales'},
    {id:'repro', label:'Reproducción y partos'},
    {id:'sanidad', label:'Sanidad'},    {id:'conta', label:'Contabilidad'},
    {id:'seguridad', label:'Registros del Velador'},
    {id:'maquinaria', label:'Maquinaria y equipo'},
    {id:'actividades', label:'Actividades'},
    {id:'reportes', label:'Reportes'},
    {id:'config', label:'Perfil del rancho'}
  ];

  function normalizeUsuarios(arr){
    const baseRoles = new Set(["Propietario","Gerente","Supervisor","Vaquero","Auxiliar","Otro"]);
    return (arr||[]).map((u)=>{
      const uu = Object.assign({}, u||{});
      let r = String(uu.rol||'').trim();
      // Migración: "Consulta" se trata como "Otro"
      if (r === 'Consulta') r = 'Otro';

      if (!uu.rolBase){
        uu.rolBase = baseRoles.has(r) ? r : 'Otro';
      }

      // Si rolBase no es "Otro", el rol visible = rolBase
      if (uu.rolBase !== 'Otro'){
        uu.rol = uu.rolBase;
      } else {
        // "Otro": conserva nombre personalizado si existe; si no, usa "Otro"
        const custom = String(uu.rol||'').trim();
        uu.rol = (custom && custom !== 'Consulta') ? custom : 'Otro';
      }

      return uu;
    });
  }

  function getUsuarios(){ return normalizeUsuarios(getData('pecuario_usuarios') || []); }
  function setUsuarios(u){ setData('pecuario_usuarios', normalizeUsuarios(u)); }

  function renderPermisosCheckboxes(){
    const cont = document.getElementById('chkPermisos');
    if (!cont) return;
    cont.innerHTML = '';
    MODS.forEach(m=>{
      const row = document.createElement('div');
      row.style.display='inline-flex';
      row.style.alignItems='center';
      row.style.gap='8px';
      row.style.margin='6px 12px 6px 0';
      row.innerHTML = `<input type="checkbox" id="perm_${m.id}" value="${m.id}" checked> <label for="perm_${m.id}">${m.label}</label>`;
      cont.appendChild(row);
    });
  }

  function renderListaUsuarios(){
    const cont = document.getElementById('lista-usuarios');
    if (!cont) return;
    const usuarios = getUsuarios();
    if (!usuarios.length) { cont.innerHTML = '<div>Sin usuarios.</div>'; return; }
    cont.innerHTML = '';
    usuarios.slice().reverse().forEach(u=>{
      const d = document.createElement('div');
      const perms = (u.permisos||[]).join(', ');
      d.textContent = `${u.nombre} | ${u.rol} | Estado: ${u.activo} | Permisos: ${perms}`;
      cont.appendChild(d);
    });
  }

  function asegurarUsuarioDefault(){
    const u = getUsuarios();
    if (u.length) return;
    const all = MODS.map(m=>m.id);
    setUsuarios([{nombre:'Gilberto', rol:'Propietario', activo:'Activo', permisos: all}]);
    localStorage.setItem('pecuario_usuario_actual', 'Gilberto');
  }

  function llenarUsuariosHeader(){
    const sel = document.getElementById('selUsuario');
    const lbl = document.getElementById('lblRol');
    if (!sel || !lbl) return;
    const usuarios = getUsuarios().filter(u=> (u.activo==='Activo' || u.activo==='Sí'));
    sel.innerHTML = '';
    usuarios.forEach(u=>{
      const o=document.createElement('option');
      o.value=u.nombre;
      o.textContent=u.nombre;
      sel.appendChild(o);
    });
    const actual = localStorage.getItem('pecuario_usuario_actual') || (usuarios[0]?.nombre||'');
    if (actual) sel.value = actual;
    const uAct = usuarios.find(x=>x.nombre===sel.value) || usuarios[0];
    lbl.textContent = uAct ? uAct.rol : '—';

    sel.addEventListener('change', ()=>{
      localStorage.setItem('pecuario_usuario_actual', sel.value);
      const uu = getUsuarios().find(x=>x.nombre===sel.value);
      lbl.textContent = uu ? uu.rol : '—';
      aplicarPermisos();
      if (typeof poblarSelectUsuariosAsignacion === 'function') poblarSelectUsuariosAsignacion();
      if (window.renderTareasUI) window.renderTareasUI();
    });
  }

  
  function aplicarPermisosPanel(permisos){
    // Oculta tarjetas del panel si el usuario no tiene permiso del módulo asociado
    document.querySelectorAll('#mod-panel .tarjetas-grid .tarjeta[data-perm]').forEach(card=>{
      const need = card.getAttribute('data-perm');
      card.style.display = permisos.includes(need) ? '' : 'none';
    });
  }

  function aplicarPermisos(){
    const nombre = localStorage.getItem('pecuario_usuario_actual') || '';
    const u = getUsuarios().find(x=>x.nombre===nombre) || null;
    const permisos = u ? (u.permisos||[]) : MODS.map(m=>m.id);

    document.querySelectorAll('nav button[data-modulo]').forEach(b=>{
      const id = b.getAttribute('data-modulo');
      const allow = (id === 'panel') || permisos.includes(id);
      b.style.display = allow ? '' : 'none';
    });

    aplicarPermisosPanel(permisos);
    aplicarPermisosReportes();
  }

