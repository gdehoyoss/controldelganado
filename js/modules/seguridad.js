// ======================
// Seguridad
// ======================

manejarFormulario(
  'form-visitas',
  'pecuario_visitas',
  null,
  null,
  null
);

manejarFormulario(
  'form-bitacora',
  'pecuario_bitacora',
  'lista-seguridad',
  (b) => `Fecha ${b.fecha || '-'} ${b.hora || ''} | Evento: ${b.evento || '-'}`,
  null
);
