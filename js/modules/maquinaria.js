// ======================
// Maquinaria y equipo
// ======================

manejarFormulario(
  'form-maquinaria',
  'pecuario_maquinaria',
  'lista-maquinaria',
  (m) => {
    const valor = (m.valor !== undefined && m.valor !== null && String(m.valor).trim() !== '')
      ? ` | Valor: ${fmtMXN(Number(m.valor) || 0)}`
      : '';
    return `${m.tipo || '-'} | ${m.desc || '-'}${valor} | Cant: ${m.cantidad || ''} | Últ. mantto: ${m.fechaMant || '-'}`;
  },
  null
);
