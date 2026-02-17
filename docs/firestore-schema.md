# Esquema Firestore (Fase 1 híbrida)

## Objetivo
Mantener `localStorage` como origen operativo inmediato y sincronizar snapshots de cada módulo a Firestore cuando haya conectividad.

## Colecciones

### `ranchos/{ranchoId}/snapshots/{key}`
Documento por cada llave legacy (`pecuario_cabezas`, `pecuario_sanidad`, etc.).

Campos:
- `key` (string): nombre de la llave legacy.
- `ranchoId` (string): id del rancho.
- `payload` (map|array): JSON con la data completa de la llave.
- `clientUpdatedAt` (number): timestamp en milisegundos del cliente que escribió.
- `updatedAt` (timestamp): timestamp del servidor.
- `updatedBy` (string): usuario que disparó el guardado.

## Evolución propuesta (Fase 2)

Migrar de snapshots a colecciones por dominio:
- `ranchos/{ranchoId}/cabezas/{areteOficial}`
- `ranchos/{ranchoId}/pesajes/{pesajeId}`
- `ranchos/{ranchoId}/sanidad/{eventoId}`
- `ranchos/{ranchoId}/contabilidad/{movimientoId}`
- `ranchos/{ranchoId}/actividades/{actividadId}`
- `ranchos/{ranchoId}/eventos/{eventoId}` (vista unificada para reportes)

## Índices incluidos
- `snapshots`: `key + clientUpdatedAt`
- `eventos`: `ranchoId + modulo + fecha`
- `movimientos`: `ranchoId + tipo + fecha`
