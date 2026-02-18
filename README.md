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



## Autenticación Firebase en la app

Ahora la interfaz incluye un panel de autenticación Firebase en la parte superior:

- **Entrar** con correo y contraseña.
- **Crear cuenta** (email/password).
- **Entrar con Google** (popup).
- **Modo invitado** (sesión anónima).
- **Cerrar sesión**: ahora sí mantiene estado "sin sesión" hasta que elijas iniciar sesión o activar invitado.

### Requisitos en Firebase Console

1. Ir a **Authentication > Sign-in method**.
2. Activar los proveedores que usarás (Email/Password, Google y/o Anonymous).
3. En Google, agrega tu dominio de Hosting autorizado (por ejemplo `control-del-ganado.web.app`).
4. Si usarás reglas por rancho, asigna custom claims (`ranchoId` o `admin`) desde Admin SDK.

> Si en consola ves `auth/configuration-not-found`, Firebase Auth no está habilitado en ese proyecto. La app mostrará **Auth: no configurado**, deshabilitará botones de login y te dejará usar **Reintentar conexión Auth** después de habilitar Authentication en Firebase Console.

### Flujo recomendado

- En desarrollo puedes usar **modo invitado** para validar captura/sync.
- En producción usa usuarios autenticados y claims para restringir por rancho.

## Sincronización Fase 1 (híbrida)

Se agregó sincronización híbrida para trabajar offline con `localStorage` y replicar cambios a Firestore cuando hay internet.

### Configuración recomendada

1. Si usarás usuarios autenticados, crear/usar usuarios con claim `ranchoId` para aplicar reglas.
2. Si **no** tienes auth de usuario en UI, la app ahora abre sesión anónima automáticamente para permitir sync en `Rancho1`.
3. Definir en el navegador `localStorage.pecuario_rancho_id` (por defecto `Rancho1`).
4. Desplegar reglas e índices:

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

### ¿Tengo que crear una colección llamada `Rancho1`?

No. En Firestore de este proyecto, `Rancho1` se usa como **ID de documento de rancho**, no como nombre de colección.

La ruta que usa la app es:

- `ranchos/{ranchoId}/snapshots/{key}`

Ejemplo con valor por defecto:

- `ranchos/Rancho1/snapshots/pecuario_cabezas`

### ¿Los datos se suben solos o debo hacer algo manual?

Se suben automáticamente cuando la app guarda cambios en `localStorage`.

- La app escribe local primero (modo offline).
- Luego dispara sync a Firebase (`pushSnapshot`) para cada módulo legacy.

> Importante: para ver datos en Firestore Console sí necesitas tener Firestore creado y permisos válidos (auth).

### ¿En qué módulo están los cambios a Firebase?

- Inicialización de Firebase + Firestore + sincronización: `js/firebase-init.js`.
- Disparo automático al guardar datos (`setData`, `setCabezasMap`): `js/00_shared.js`.
- Arranque de sincronización al iniciar la app: `js/99_init.js`.

### No veo cambios en Firebase Console, ¿qué más tengo que hacer?

Si no aparece nada en la base de datos, normalmente falta uno de estos pasos:

1. **Crear Firestore Database** en el proyecto `control-del-ganado` (si aún no existe).
2. **Desplegar reglas e índices** del repo:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

3. **Autenticación**: las reglas actuales solo permiten leer/escribir con usuario autenticado que tenga claim `ranchoId` (o `admin=true`).
4. Verificar que `localStorage.pecuario_rancho_id` coincida con el rancho esperado (por defecto `Rancho1`).
5. En consola del navegador correr:

```js
window.firebaseSync?.getStatus?.()
```

Si sale `lastError` con `permission-denied`, el problema es de reglas/auth, no de guardado local.

### Error exacto: `FirebaseError: Missing or insufficient permissions`

Ese error confirma que la app sí intentó escribir, pero Firestore la bloqueó por reglas.

#### Opción recomendada (producción): autenticar y asignar claim `ranchoId`

1. Inicia sesión del usuario en Firebase Auth (correo, Google, etc.).
2. Asigna custom claim `ranchoId: "Rancho1"` (o el rancho que corresponda) usando Admin SDK.
3. Pídele al usuario cerrar/abrir sesión para refrescar el token con claims.

#### Modo sin usuarios en UI (sesión anónima automática)

Como este proyecto no tiene login de usuario en la interfaz, `firebase-init.js` inicia sesión **anónima** automáticamente y las reglas permiten ese caso **solo para `Rancho1`**.

```rules
match /ranchos/{ranchoId}/{document=**} {
  allow read, write: if sameRancho(ranchoId) || anonymousRanchoAccess(ranchoId);
}
```

Si vas a trabajar con más ranchos o multiusuario real, usa el camino recomendado de auth + custom claims y elimina el acceso anónimo.
