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
2. Definir en el navegador `localStorage.pecuario_rancho_id` (por defecto `rancho-demo`).
3. Desplegar reglas e índices:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Archivos de Firestore en el repositorio

- Reglas: `firestore.rules`
- Índices: `firestore.indexes.json`
- Esquema y plan de evolución: `docs/firestore-schema.md`
