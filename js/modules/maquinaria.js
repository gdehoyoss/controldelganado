// ======================
// Maquinaria y equipo
// ======================

manejarFormulario(
  'form-maquinaria',
  'pecuario_maquinaria',
  'lista-maquinaria',
  (m) => `${m.tipo || '-'} | ${m.desc || '-'} | Cant: ${m.cantidad || ''} | Últ. mantto: ${m.fechaMant || '-'}`,
  null
);
