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
