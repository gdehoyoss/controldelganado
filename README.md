# Control del Ganado

## Deploy en Firebase Hosting

Ya quedó lista la configuración para publicar este proyecto como sitio estático en Firebase Hosting.

### Primer deploy (solo una vez por máquina)

```bash
npm install -g firebase-tools
firebase login
firebase use control-del-ganado
firebase deploy --only hosting
```

### Deploys siguientes

```bash
firebase deploy --only hosting
```

Si prefieres no instalar nada globalmente, puedes usar `npx firebase-tools` en lugar de `firebase`.


## Sincronización Fase 1 (híbrida)

Se agregó sincronización híbrida para trabajar offline con `localStorage` y replicar cambios a Firestore cuando hay internet.

### Configuración recomendada

1. Crear/usar usuarios con claim `ranchoId` para aplicar reglas.
2. Definir en el navegador `localStorage.pecuario_rancho_id` (por defecto `Rancho1`).
3. Desplegar reglas e índices:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Archivos de Firestore en el repositorio

- Reglas: `firestore.rules`
- Índices: `firestore.indexes.json`
- Esquema y plan de evolución: `docs/firestore-schema.md`


### Diagnóstico rápido si no aparece nada en Firestore

1. Abre la app en tu navegador y ejecuta en **DevTools > Console** (no en la terminal del sistema):

```js
window.firebaseSync?.getStatus?.()
```

2. Si responde `available: false`, `firebase-init` no terminó de cargar (normalmente por error de red o script).
3. Revisa que `projectId` sea `control-del-ganado` y que `ranchoId` sea el esperado.
4. Captura o edita un registro y vuelve a ejecutar `getStatus()`:
   - `lastPushOkAt > 0` indica que sí se escribió.
   - `lastError` con `permission-denied` indica problema de reglas/auth.
5. Verifica en Firestore la ruta:
   - `ranchos/{ranchoId}/snapshots/{key}`


### Si ves `Unexpected token "<"` en `firebase-init.js` o `99_init.js`

Eso casi siempre significa que el navegador recibió HTML en lugar del JS (cache vieja, URL incorrecta o 404).

1. Abre la URL del deploy de Firebase (`https://<tu-proyecto>.web.app`) y no una versión vieja de GitHub Pages.
2. Haz recarga forzada (`Ctrl+F5` / `Cmd+Shift+R`).
3. Verifica directo en el navegador:
   - `/js/firebase-init.js?v=40.18`
   - `/js/99_init.js?v=40.18`

Si alguno abre una página HTML, ese es el origen del error.
