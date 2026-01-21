/**
 * MÓDULO DE CONTABILIDAD - SISTEMA DE CONTROL DE RANCHO
 * Sistema de partida doble para registro de ingresos y egresos
 * Fecha: 2026-01-20
 */

// ============================================================================
// CATÁLOGO DE CUENTAS
// ============================================================================

const CATALOGO_CUENTAS = {
  // CUENTAS DE BALANCE
  balance: {
    // Caja y Bancos
    'B-01': { nombre: 'Caja y Bancos (Total)', tipo: 'balance', naturaleza: 'deudora', esCuentaPrincipal: true },
    'B-02': { nombre: 'Caja', tipo: 'balance', naturaleza: 'deudora', cuentaPadre: 'B-01' },
    'B-03': { nombre: 'Banco 1', tipo: 'balance', naturaleza: 'deudora', cuentaPadre: 'B-01' },
    'B-04': { nombre: 'Banco 2', tipo: 'balance', naturaleza: 'deudora', cuentaPadre: 'B-01' },
    'B-05': { nombre: 'Banco 3', tipo: 'balance', naturaleza: 'deudora', cuentaPadre: 'B-01' },
    
    // Ganado
    'BGR-01': { nombre: 'Ganado Reproducción', tipo: 'balance', naturaleza: 'deudora' },
    'BGC-01': { nombre: 'Ganado Comercial', tipo: 'balance', naturaleza: 'deudora' },
    
    // Activos Fijos
    'BME-01': { nombre: 'Maquinaria y Equipo', tipo: 'balance', naturaleza: 'deudora' },
    'BCI-01': { nombre: 'Corrales e Instalaciones', tipo: 'balance', naturaleza: 'deudora' },
    'BTE-01': { nombre: 'Terrenos y Edificios', tipo: 'balance', naturaleza: 'deudora' },
    'BOA-01': { nombre: 'Otros Activos', tipo: 'balance', naturaleza: 'deudora' },
    
    // Pasivos
    'BPB-01': { nombre: 'Préstamos Bancarios', tipo: 'balance', naturaleza: 'acreedora' },
    'BPB-02': { nombre: 'Pagos Préstamos Bancarios', tipo: 'balance', naturaleza: 'deudora' },
    
    // Patrimonio
    'BP-01': { nombre: 'Patrimonio', tipo: 'balance', naturaleza: 'acreedora' },
    
    // Otros
    'BOG-01': { nombre: 'Otros Pagos', tipo: 'balance', naturaleza: 'deudora' }
  },
  
  // CUENTAS DE RESULTADOS (INGRESOS)
  ingresos: {
    'RI-01': { nombre: 'Insumos', tipo: 'resultados', naturaleza: 'acreedora' },
    'RIG-01': { nombre: 'Intereses Ganados', tipo: 'resultados', naturaleza: 'acreedora' },
    'RAS-01': { nombre: 'Apoyos y Subsidios', tipo: 'resultados', naturaleza: 'acreedora' },
    'RIV-01': { nombre: 'Ingresos Varios', tipo: 'resultados', naturaleza: 'acreedora' }
  },
  
  // CUENTAS DE RESULTADOS (EGRESOS)
  egresos: {
    // Gastos de Personal
    'RGP-01': { nombre: 'Gastos Nóminas', tipo: 'resultados', naturaleza: 'deudora' },
    'RGP-02': { nombre: 'Prestaciones a Trabajadores', tipo: 'resultados', naturaleza: 'deudora' },
    'RGP-03': { nombre: 'Gastos de Traslado Personal', tipo: 'resultados', naturaleza: 'deudora' },
    'RGP-04': { nombre: 'Alimentos al Personal', tipo: 'resultados', naturaleza: 'deudora' },
    'RGP-05': { nombre: 'Otros - Personal', tipo: 'resultados', naturaleza: 'deudora' },
    
    // Gastos de Viaje
    'RGV-01': { nombre: 'Gastos de Viaje', tipo: 'resultados', naturaleza: 'deudora' },
    
    // Gastos de Mantenimiento
    'RGM-01': { nombre: 'Gastos Mantenimiento Maquinaria y Equipo', tipo: 'resultados', naturaleza: 'deudora' },
    'RGM-02': { nombre: 'Gastos Mantenimiento Corrales y Cercas', tipo: 'resultados', naturaleza: 'deudora' },
    'RGM-03': { nombre: 'Gastos Mantenimiento Bodegas y Casas', tipo: 'resultados', naturaleza: 'deudora' },
    'RGM-04': { nombre: 'Gastos Mantenimiento Equipo de Riego y Bombas', tipo: 'resultados', naturaleza: 'deudora' },
    'RGM-05': { nombre: 'Gastos Mantenimiento Otros', tipo: 'resultados', naturaleza: 'deudora' },
    
    // Gastos de Ganado
    'RGAG-01': { nombre: 'Gastos Alimento Ganado', tipo: 'resultados', naturaleza: 'deudora' },
    'RGMD-01': { nombre: 'Gastos Medicamentos', tipo: 'resultados', naturaleza: 'deudora' },
    
    // Otros Gastos Operativos
    'RGH-01': { nombre: 'Gastos Herramientas', tipo: 'resultados', naturaleza: 'deudora' },
    'RH-01': { nombre: 'Honorarios', tipo: 'resultados', naturaleza: 'deudora' },
    'RM-01': { nombre: 'Mermas', tipo: 'resultados', naturaleza: 'deudora' },
    'RMD-01': { nombre: 'Muertes y Desechos', tipo: 'resultados', naturaleza: 'deudora' },
    'RCL-01': { nombre: 'Combustibles y Lubricantes', tipo: 'resultados', naturaleza: 'deudora' },
    
    // Servicios
    'RE-01': { nombre: 'Electricidad Riego', tipo: 'resultados', naturaleza: 'deudora' },
    'RE-02': { nombre: 'Electricidad General', tipo: 'resultados', naturaleza: 'deudora' },
    'RS-01': { nombre: 'Servicios en General', tipo: 'resultados', naturaleza: 'deudora' },
    
    // Impuestos y Fletes
    'RDI-01': { nombre: 'Derechos e Impuestos', tipo: 'resultados', naturaleza: 'deudora' },
    'RGI-01': { nombre: 'Gastos por Intereses', tipo: 'resultados', naturaleza: 'deudora' },
    'RFG-01': { nombre: 'Fletes Ganado', tipo: 'resultados', naturaleza: 'deudora' },
    'RFA-01': { nombre: 'Fletes Alimento', tipo: 'resultados', naturaleza: 'deudora' },
    'ROG-01': { nombre: 'Otros Gastos', tipo: 'resultados', naturaleza: 'deudora' }
  }
};

// ============================================================================
// CLASE PRINCIPAL DE CONTABILIDAD
// ============================================================================

class SistemaContabilidad {
  constructor() {
    this.asientos = [];
    this.saldos = {};
    this.inicializarSaldos();
  }

  /**
   * Inicializa todos los saldos en cero
   */
  inicializarSaldos() {
    Object.keys(CATALOGO_CUENTAS.balance).forEach(cuenta => {
      this.saldos[cuenta] = 0;
    });
    Object.keys(CATALOGO_CUENTAS.ingresos).forEach(cuenta => {
      this.saldos[cuenta] = 0;
    });
    Object.keys(CATALOGO_CUENTAS.egresos).forEach(cuenta => {
      this.saldos[cuenta] = 0;
    });
  }

  /**
   * Agrega una subcuenta de banco
   */
  agregarSubcuentaBanco(numero, nombre) {
    const siguienteNumero = `B-${String(numero).padStart(2, '0')}`;
    CATALOGO_CUENTAS.balance[siguienteNumero] = {
      nombre: nombre,
      tipo: 'balance',
      naturaleza: 'deudora',
      cuentaPadre: 'B-01'
    };
    this.saldos[siguienteNumero] = 0;
    return siguienteNumero;
  }

  /**
   * Registra un asiento contable
   */
  registrarAsiento(descripcion, movimientos, fecha = new Date()) {
    const asiento = {
      numero: this.asientos.length + 1,
      fecha: fecha,
      descripcion: descripcion,
      movimientos: movimientos
    };

    // Validar partida doble
    const totalCargos = movimientos
      .filter(m => m.tipo === 'cargo')
      .reduce((sum, m) => sum + m.monto, 0);
    
    const totalAbonos = movimientos
      .filter(m => m.tipo === 'abono')
      .reduce((sum, m) => sum + m.monto, 0);

    if (Math.abs(totalCargos - totalAbonos) > 0.01) {
      throw new Error(`Asiento no cuadra. Cargos: ${totalCargos}, Abonos: ${totalAbonos}`);
    }

    // Aplicar movimientos a saldos
    movimientos.forEach(mov => {
      const cuenta = this.obtenerCuenta(mov.cuenta);
      if (!cuenta) {
        throw new Error(`Cuenta ${mov.cuenta} no existe en el catálogo`);
      }

      if (mov.tipo === 'cargo') {
        if (cuenta.naturaleza === 'deudora') {
          this.saldos[mov.cuenta] += mov.monto;
        } else {
          this.saldos[mov.cuenta] -= mov.monto;
        }
      } else if (mov.tipo === 'abono') {
        if (cuenta.naturaleza === 'acreedora') {
          this.saldos[mov.cuenta] += mov.monto;
        } else {
          this.saldos[mov.cuenta] -= mov.monto;
        }
      }
    });

    // Actualizar B-01 con la suma de subcuentas
    this.actualizarCajaBancos();

    this.asientos.push(asiento);
    return asiento;
  }

  /**
   * Actualiza el saldo de B-01 sumando todas las subcuentas
   */
  actualizarCajaBancos() {
    let total = 0;
    Object.keys(CATALOGO_CUENTAS.balance).forEach(cuentaId => {
      const cuenta = CATALOGO_CUENTAS.balance[cuentaId];
      if (cuenta.cuentaPadre === 'B-01') {
        total += this.saldos[cuentaId] || 0;
      }
    });
    this.saldos['B-01'] = total;
  }

  /**
   * Obtiene información de una cuenta del catálogo
   */
  obtenerCuenta(cuentaId) {
    return CATALOGO_CUENTAS.balance[cuentaId] ||
           CATALOGO_CUENTAS.ingresos[cuentaId] ||
           CATALOGO_CUENTAS.egresos[cuentaId];
  }

  // ============================================================================
  // ASIENTOS ESPECÍFICOS DEL RANCHO
  // ============================================================================

  /**
   * 1. ASIENTO DE APERTURA
   * Registra las aportaciones iniciales en efectivo y en especie
   */
  asientoApertura(aportaciones) {
    const movimientos = [];

    // Cargos a activos
    if (aportaciones.efectivo) {
      movimientos.push({ cuenta: 'B-01', tipo: 'cargo', monto: aportaciones.efectivo });
    }
    if (aportaciones.ganadoReproduccion) {
      movimientos.push({ cuenta: 'BGR-01', tipo: 'cargo', monto: aportaciones.ganadoReproduccion });
    }
    if (aportaciones.ganadoComercial) {
      movimientos.push({ cuenta: 'BGC-01', tipo: 'cargo', monto: aportaciones.ganadoComercial });
    }
    if (aportaciones.maquinaria) {
      movimientos.push({ cuenta: 'BME-01', tipo: 'cargo', monto: aportaciones.maquinaria });
    }
    if (aportaciones.corrales) {
      movimientos.push({ cuenta: 'BCI-01', tipo: 'cargo', monto: aportaciones.corrales });
    }
    if (aportaciones.otrosActivos) {
      movimientos.push({ cuenta: 'BOA-01', tipo: 'cargo', monto: aportaciones.otrosActivos });
    }

    // Abono a patrimonio (suma total)
    const totalAportaciones = Object.values(aportaciones).reduce((sum, val) => sum + (val || 0), 0);
    movimientos.push({ cuenta: 'BP-01', tipo: 'abono', monto: totalAportaciones });

    return this.registrarAsiento('Asiento de Apertura - Aportaciones Iniciales', movimientos);
  }

  /**
   * 2. VENTA DE GANADO REPRODUCCIÓN
   */
  ventaGanadoReproduccion(valorVenta, subcuentaBanco = 'B-02') {
    return this.registrarAsiento('Venta de Ganado Reproducción', [
      { cuenta: subcuentaBanco, tipo: 'cargo', monto: valorVenta },
      { cuenta: 'BGR-01', tipo: 'abono', monto: valorVenta }
    ]);
  }

  /**
   * 3. VENTA DE GANADO COMERCIAL
   */
  ventaGanadoComercial(valorVenta, subcuentaBanco = 'B-02') {
    return this.registrarAsiento('Venta de Ganado Comercial', [
      { cuenta: subcuentaBanco, tipo: 'cargo', monto: valorVenta },
      { cuenta: 'BGC-01', tipo: 'abono', monto: valorVenta }
    ]);
  }

  /**
   * 4. COMPRA DE GANADO REPRODUCCIÓN
   */
  compraGanadoReproduccion(valorCompra, subcuentaBanco = 'B-02') {
    return this.registrarAsiento('Compra de Ganado Reproducción', [
      { cuenta: 'BGR-01', tipo: 'cargo', monto: valorCompra },
      { cuenta: subcuentaBanco, tipo: 'abono', monto: valorCompra }
    ]);
  }

  /**
   * 5. COMPRA DE GANADO COMERCIAL
   */
  compraGanadoComercial(valorCompra, subcuentaBanco = 'B-02') {
    return this.registrarAsiento('Compra de Ganado Comercial', [
      { cuenta: 'BGC-01', tipo: 'cargo', monto: valorCompra },
      { cuenta: subcuentaBanco, tipo: 'abono', monto: valorCompra }
    ]);
  }

  /**
   * 6. NACIMIENTO DE GANADO (REPRODUCCIÓN)
   */
  nacimientoGanado(valorMercado) {
    return this.registrarAsiento('Nacimiento de Ganado - Alta a Reproducción', [
      { cuenta: 'BGR-01', tipo: 'cargo', monto: valorMercado },
      { cuenta: 'BP-01', tipo: 'abono', monto: valorMercado }
    ]);
  }

  /**
   * 7. MUERTE O DESECHO DE GANADO REPRODUCCIÓN
   */
  muerteGanadoReproduccion(valorMercado) {
    return this.registrarAsiento('Muerte o Desecho de Ganado Reproducción', [
      { cuenta: 'RMD-01', tipo: 'cargo', monto: valorMercado },
      { cuenta: 'BGR-01', tipo: 'abono', monto: valorMercado }
    ]);
  }

  /**
   * 8. MUERTE O DESECHO DE GANADO COMERCIAL
   */
  muerteGanadoComercial(valorMercado) {
    return this.registrarAsiento('Muerte o Desecho de Ganado Comercial', [
      { cuenta: 'RMD-01', tipo: 'cargo', monto: valorMercado },
      { cuenta: 'BGC-01', tipo: 'abono', monto: valorMercado }
    ]);
  }

  /**
   * 9. TRANSFERENCIA DE COMERCIAL A REPRODUCCIÓN
   */
  transferenciaComercialAReproduccion(valor) {
    return this.registrarAsiento('Transferencia de Ganado Comercial a Reproducción', [
      { cuenta: 'BGR-01', tipo: 'cargo', monto: valor },
      { cuenta: 'BGC-01', tipo: 'abono', monto: valor }
    ]);
  }

  /**
   * 10. TRANSFERENCIA DE REPRODUCCIÓN A COMERCIAL
   */
  transferenciaReproduccionAComercial(valor) {
    return this.registrarAsiento('Transferencia de Ganado Reproducción a Comercial', [
      { cuenta: 'BGC-01', tipo: 'cargo', monto: valor },
      { cuenta: 'BGR-01', tipo: 'abono', monto: valor }
    ]);
  }

  /**
   * 11. REVALUACIÓN DE GANADO REPRODUCCIÓN
   */
  revaluacionGanadoReproduccion(nuevoValor) {
    const saldoActual = this.saldos['BGR-01'];
    
    // Cancelar saldo actual
    const asiento1 = this.registrarAsiento('Revaluación - Cancelación Ganado Reproducción', [
      { cuenta: 'BP-01', tipo: 'cargo', monto: saldoActual },
      { cuenta: 'BGR-01', tipo: 'abono', monto: saldoActual }
    ]);

    // Registrar nuevo valor
    const asiento2 = this.registrarAsiento('Revaluación - Nuevo Valor Ganado Reproducción', [
      { cuenta: 'BGR-01', tipo: 'cargo', monto: nuevoValor },
      { cuenta: 'BP-01', tipo: 'abono', monto: nuevoValor }
    ]);

    return [asiento1, asiento2];
  }

  /**
   * 12. REVALUACIÓN DE GANADO COMERCIAL
   */
  revaluacionGanadoComercial(nuevoValor) {
    const saldoActual = this.saldos['BGC-01'];
    
    // Cancelar saldo actual
    const asiento1 = this.registrarAsiento('Revaluación - Cancelación Ganado Comercial', [
      { cuenta: 'BP-01', tipo: 'cargo', monto: saldoActual },
      { cuenta: 'BGC-01', tipo: 'abono', monto: saldoActual }
    ]);

    // Registrar nuevo valor
    const asiento2 = this.registrarAsiento('Revaluación - Nuevo Valor Ganado Comercial', [
      { cuenta: 'BGC-01', tipo: 'cargo', monto: nuevoValor },
      { cuenta: 'BP-01', tipo: 'abono', monto: nuevoValor }
    ]);

    return [asiento1, asiento2];
  }

  /**
   * 13. PRÉSTAMO BANCARIO (INGRESO)
   */
  prestamoRecibido(monto, subcuentaBanco = 'B-03') {
    return this.registrarAsiento('Préstamo Bancario Recibido', [
      { cuenta: subcuentaBanco, tipo: 'cargo', monto: monto },
      { cuenta: 'BPB-01', tipo: 'abono', monto: monto }
    ]);
  }

  /**
   * 14. PAGO DE PRÉSTAMO BANCARIO
   */
  pagoPrestamo(monto, subcuentaBanco = 'B-03') {
    return this.registrarAsiento('Pago de Préstamo Bancario', [
      { cuenta: 'BPB-02', tipo: 'cargo', monto: monto },
      { cuenta: subcuentaBanco, tipo: 'abono', monto: monto }
    ]);
  }

  /**
   * 15. REGISTRO DE INGRESO (Resultados)
   */
  registrarIngreso(cuentaIngreso, monto, descripcion, subcuentaBanco = 'B-02') {
    return this.registrarAsiento(descripcion || `Ingreso - ${this.obtenerCuenta(cuentaIngreso).nombre}`, [
      { cuenta: subcuentaBanco, tipo: 'cargo', monto: monto },
      { cuenta: cuentaIngreso, tipo: 'abono', monto: monto }
    ]);
  }

  /**
   * 16. REGISTRO DE EGRESO (Resultados)
   */
  registrarEgreso(cuentaEgreso, monto, descripcion, subcuentaBanco = 'B-02') {
    return this.registrarAsiento(descripcion || `Egreso - ${this.obtenerCuenta(cuentaEgreso).nombre}`, [
      { cuenta: cuentaEgreso, tipo: 'cargo', monto: monto },
      { cuenta: subcuentaBanco, tipo: 'abono', monto: monto }
    ]);
  }

  /**
   * 17. ADQUISICIÓN DE ACTIVOS
   */
  adquisicionActivo(cuentaActivo, monto, descripcion, subcuentaBanco = 'B-02') {
    return this.registrarAsiento(descripcion || `Adquisición - ${this.obtenerCuenta(cuentaActivo).nombre}`, [
      { cuenta: cuentaActivo, tipo: 'cargo', monto: monto },
      { cuenta: subcuentaBanco, tipo: 'abono', monto: monto }
    ]);
  }

  /**
   * 18. DEVOLUCIÓN DE PATRIMONIO
   */
  devolucionPatrimonio(monto, subcuentaBanco = 'B-02') {
    return this.registrarAsiento('Devolución de Patrimonio', [
      { cuenta: 'BP-01', tipo: 'cargo', monto: monto },
      { cuenta: subcuentaBanco, tipo: 'abono', monto: monto }
    ]);
  }

  // ============================================================================
  // REPORTES
  // ============================================================================

  /**
   * Genera el Estado de Movimientos de Flujo
   */
  generarEstadoFlujo(año, numeroVientres = 0) {
    const reporte = {
      año: año,
      ingresos: {},
      egresos: {},
      totalIngresos: 0,
      totalEgresos: 0,
      utilidadPerdida: 0
    };

    // Calcular ingresos de efectivo
    const ingresosEfectivo = [
      { cuenta: 'BGR-01', nombre: 'Venta Ganado Reproducción' },
      { cuenta: 'BGC-01', nombre: 'Venta Ganado Comercial' }
    ];

    Object.keys(CATALOGO_CUENTAS.ingresos).forEach(cuenta => {
      ingresosEfectivo.push({ 
        cuenta: cuenta, 
        nombre: CATALOGO_CUENTAS.ingresos[cuenta].nombre 
      });
    });

    ingresosEfectivo.forEach(ing => {
      const saldo = Math.abs(this.saldos[ing.cuenta] || 0);
      if (saldo > 0) {
        reporte.ingresos[ing.cuenta] = {
          nombre: ing.nombre,
          monto: saldo,
          porcentaje: 0, // Se calcula después
          porVientre: numeroVientres > 0 ? saldo / numeroVientres : 0
        };
        reporte.totalIngresos += saldo;
      }
    });

    // Calcular porcentajes de ingresos
    Object.keys(reporte.ingresos).forEach(cuenta => {
      reporte.ingresos[cuenta].porcentaje = 
        reporte.totalIngresos > 0 
          ? (reporte.ingresos[cuenta].monto / reporte.totalIngresos * 100).toFixed(2)
          : 0;
    });

    // Calcular egresos
    Object.keys(CATALOGO_CUENTAS.egresos).forEach(cuenta => {
      const saldo = Math.abs(this.saldos[cuenta] || 0);
      if (saldo > 0) {
        reporte.egresos[cuenta] = {
          nombre: CATALOGO_CUENTAS.egresos[cuenta].nombre,
          monto: saldo,
          porcentaje: 0, // Se calcula con base a ingresos
          porVientre: numeroVientres > 0 ? saldo / numeroVientres : 0
        };
        reporte.totalEgresos += saldo;
      }
    });

    // Calcular porcentajes de egresos (respecto a ingresos totales)
    Object.keys(reporte.egresos).forEach(cuenta => {
      reporte.egresos[cuenta].porcentaje = 
        reporte.totalIngresos > 0 
          ? (reporte.egresos[cuenta].monto / reporte.totalIngresos * 100).toFixed(2)
          : 0;
    });

    reporte.utilidadPerdida = reporte.totalIngresos - reporte.totalEgresos;

    return reporte;
  }

  /**
   * Genera el Balance General
   */
  generarBalanceGeneral(fecha = new Date()) {
    const balance = {
      fecha: fecha,
      activos: {},
      pasivos: {},
      patrimonio: {},
      totalActivos: 0,
      totalPasivos: 0,
      totalPatrimonio: 0
    };

    // Activos
    const cuentasActivos = ['B-01', 'BGR-01', 'BGC-01', 'BME-01', 'BCI-01', 'BTE-01'];
    cuentasActivos.forEach(cuenta => {
      const saldo = this.saldos[cuenta] || 0;
      if (saldo !== 0) {
        const info = this.obtenerCuenta(cuenta);
        balance.activos[cuenta] = {
          nombre: info.nombre,
          monto: saldo
        };
        balance.totalActivos += saldo;
      }
    });

    // Pasivos
    const cuentasPasivos = ['BPB-01'];
    cuentasPasivos.forEach(cuenta => {
      const saldo = this.saldos[cuenta] || 0;
      if (saldo !== 0) {
        const info = this.obtenerCuenta(cuenta);
        balance.pasivos[cuenta] = {
          nombre: info.nombre,
          monto: saldo
        };
        balance.totalPasivos += saldo;
      }
    });

    // Patrimonio
    const saldoPatrimonio = this.saldos['BP-01'] || 0;
    balance.patrimonio['BP-01'] = {
      nombre: 'Patrimonio',
      monto: saldoPatrimonio
    };
    balance.totalPatrimonio = saldoPatrimonio;

    // Verificación de cuadre
    balance.cuadra = Math.abs(balance.totalActivos - (balance.totalPasivos + balance.totalPatrimonio)) < 0.01;

    return balance;
  }

  /**
   * Obtiene el libro mayor de una cuenta específica
   */
  obtenerLibroMayor(cuentaId) {
    const cuenta = this.obtenerCuenta(cuentaId);
    if (!cuenta) {
      throw new Error(`Cuenta ${cuentaId} no encontrada`);
    }

    const movimientos = [];
    let saldo = 0;

    this.asientos.forEach(asiento => {
      asiento.movimientos.forEach(mov => {
        if (mov.cuenta === cuentaId) {
          if (mov.tipo === 'cargo') {
            if (cuenta.naturaleza === 'deudora') {
              saldo += mov.monto;
            } else {
              saldo -= mov.monto;
            }
          } else {
            if (cuenta.naturaleza === 'acreedora') {
              saldo += mov.monto;
            } else {
              saldo -= mov.monto;
            }
          }

          movimientos.push({
            fecha: asiento.fecha,
            asiento: asiento.numero,
            descripcion: asiento.descripcion,
            tipo: mov.tipo,
            monto: mov.monto,
            saldo: saldo
          });
        }
      });
    });

    return {
      cuenta: cuentaId,
      nombre: cuenta.nombre,
      movimientos: movimientos,
      saldoFinal: saldo
    };
  }

  /**
   * Exporta todos los asientos
   */
  exportarAsientos() {
    return this.asientos.map(asiento => ({
      ...asiento,
      fecha: asiento.fecha.toISOString().split('T')[0]
    }));
  }

  /**
   * Obtiene el catálogo de cuentas completo
   */
  obtenerCatalogo() {
    const catalogo = {
      balance: [],
      resultados: {
        ingresos: [],
        egresos: []
      }
    };

    Object.keys(CATALOGO_CUENTAS.balance).forEach(id => {
      catalogo.balance.push({
        id: id,
        ...CATALOGO_CUENTAS.balance[id],
        saldo: this.saldos[id] || 0
      });
    });

    Object.keys(CATALOGO_CUENTAS.ingresos).forEach(id => {
      catalogo.resultados.ingresos.push({
        id: id,
        ...CATALOGO_CUENTAS.ingresos[id],
        saldo: this.saldos[id] || 0
      });
    });

    Object.keys(CATALOGO_CUENTAS.egresos).forEach(id => {
      catalogo.resultados.egresos.push({
        id: id,
        ...CATALOGO_CUENTAS.egresos[id],
        saldo: this.saldos[id] || 0
      });
    });

    return catalogo;
  }

  /**
   * Genera criterios de registro contable
   */
  obtenerCriteriosRegistro() {
    return {
      'BGR-01': {
        altas: [
          'Nacimientos: Cargo a BGR-01, Abono a BP-01 (valor de mercado al aretarse)',
          'Compra: Cargo a BGR-01, Abono a Caja y Bancos B-01',
          'Transferencia desde Comercial: Cargo a BGR-01, Abono a BGC-01'
        ],
        bajas: [
          'Venta: Cargo a Caja y Bancos B-01, Abono a BGR-01 (valor de mercado)',
          'Muerte o desecho: Cargo a RMD-01, Abono a BGR-01 (valor de mercado)',
          'Transferencia a Comercial: Cargo a BGC-01, Abono a BGR-01'
        ],
        revaluacion: [
          'Anualmente: Cancelar saldo actual (Cargo BP-01, Abono BGR-01)',
          'Registrar nuevo valor (Cargo BGR-01, Abono BP-01)'
        ]
      },
      'BGC-01': {
        altas: [
          'Compra: Cargo a BGC-01, Abono a Caja y Bancos B-01',
          'Transferencia desde Reproducción: Cargo a BGC-01, Abono a BGR-01'
        ],
        bajas: [
          'Venta: Cargo a Caja y Bancos B-01, Abono a BGC-01 (valor de mercado)',
          'Muerte o desecho: Cargo a RMD-01, Abono a BGC-01 (valor de mercado)',
          'Transferencia a Reproducción: Cargo a BGR-01, Abono a BGC-01'
        ],
        revaluacion: [
          'Anualmente: Cancelar saldo actual (Cargo BP-01, Abono BGC-01)',
          'Registrar nuevo valor (Cargo BGC-01, Abono BP-01)'
        ]
      },
      'B-01': {
        notas: [
          'Cuenta principal que concentra todas las subcuentas de efectivo',
          'Se actualiza automáticamente al registrar movimientos en B-02, B-03, B-04, B-05',
          'No se registran movimientos directos, solo a través de subcuentas'
        ]
      },
      ingresos: {
        criterio: 'Cargo a Caja y Bancos (subcuenta), Abono a cuenta de ingreso correspondiente',
        cuentas: [
          'RI-01: Insumos vendidos o recuperados',
          'RIG-01: Intereses ganados de inversiones',
          'RAS-01: Apoyos gubernamentales y subsidios',
          'RIV-01: Otros ingresos no clasificados'
        ]
      },
      egresos: {
        criterio: 'Cargo a cuenta de egreso correspondiente, Abono a Caja y Bancos (subcuenta)',
        grupos: {
          personal: 'RGP-01 a RGP-05: Todos los gastos relacionados con personal',
          mantenimiento: 'RGM-01 a RGM-05: Mantenimiento de maquinaria, corrales, bodegas, riego',
          ganado: 'RGAG-01, RGMD-01: Alimento y medicamentos para el ganado',
          servicios: 'RE-01, RE-02, RS-01: Electricidad y servicios generales',
          operativos: 'RCL-01, RFG-01, RFA-01: Combustibles, fletes'
        ]
      },
      activosFijos: {
        criterio: 'Cargo a cuenta de activo (BME-01, BCI-01, BTE-01), Abono a Caja y Bancos',
        notas: [
          'No se deprecian, se mantiene el valor histórico',
          'Se actualizan solo por nuevas adquisiciones o ventas'
        ]
      },
      prestamos: {
        recepcion: 'Cargo a Caja y Bancos, Abono a BPB-01',
        pago: 'Cargo a BPB-02, Abono a Caja y Bancos',
        intereses: 'Se registran como RGI-01 (gasto) al momento de pago'
      }
    };
  }

  /**
   * Valida la integridad contable
   */
  validarIntegridad() {
    const errores = [];
    
    // Verificar que todos los asientos cuadren
    this.asientos.forEach((asiento, index) => {
      const totalCargos = asiento.movimientos
        .filter(m => m.tipo === 'cargo')
        .reduce((sum, m) => sum + m.monto, 0);
      
      const totalAbonos = asiento.movimientos
        .filter(m => m.tipo === 'abono')
        .reduce((sum, m) => sum + m.monto, 0);

      if (Math.abs(totalCargos - totalAbonos) > 0.01) {
        errores.push(`Asiento ${index + 1} no cuadra. Cargos: ${totalCargos}, Abonos: ${totalAbonos}`);
      }
    });

    // Verificar que el balance cuadre
    const balance = this.generarBalanceGeneral();
    if (!balance.cuadra) {
      errores.push(`Balance no cuadra. Activos: ${balance.totalActivos}, Pasivos + Patrimonio: ${balance.totalPasivos + balance.totalPatrimonio}`);
    }

    return {
      valido: errores.length === 0,
      errores: errores
    };
  }

  /**
   * Exporta datos para persistencia
   */
  exportarDatos() {
    return {
      asientos: this.asientos,
      saldos: this.saldos,
      catalogoPersonalizado: this.obtenerCuentasPersonalizadas()
    };
  }

  /**
   * Importa datos desde persistencia
   */
  importarDatos(datos) {
    this.asientos = datos.asientos || [];
    this.saldos = datos.saldos || {};
    
    // Restaurar cuentas personalizadas (bancos adicionales)
    if (datos.catalogoPersonalizado) {
      datos.catalogoPersonalizado.forEach(cuenta => {
        if (!CATALOGO_CUENTAS.balance[cuenta.id]) {
          CATALOGO_CUENTAS.balance[cuenta.id] = cuenta.info;
        }
      });
    }
  }

  /**
   * Obtiene cuentas personalizadas (bancos adicionales)
   */
  obtenerCuentasPersonalizadas() {
    const personalizadas = [];
    Object.keys(CATALOGO_CUENTAS.balance).forEach(id => {
      const cuenta = CATALOGO_CUENTAS.balance[id];
      if (cuenta.cuentaPadre === 'B-01' && !['B-02', 'B-03', 'B-04', 'B-05'].includes(id)) {
        personalizadas.push({ id: id, info: cuenta });
      }
    });
    return personalizadas;
  }

  /**
   * Genera reporte de movimientos por período
   */
  generarReporteMovimientos(fechaInicio, fechaFin) {
    const movimientos = this.asientos.filter(asiento => {
      const fecha = new Date(asiento.fecha);
      return fecha >= fechaInicio && fecha <= fechaFin;
    });

    return {
      periodo: {
        inicio: fechaInicio.toISOString().split('T')[0],
        fin: fechaFin.toISOString().split('T')[0]
      },
      totalAsientos: movimientos.length,
      asientos: movimientos
    };
  }

  /**
   * Obtiene resumen de caja y bancos
   */
  obtenerResumenCajaBancos() {
    const resumen = {
      total: this.saldos['B-01'] || 0,
      detalles: []
    };

    Object.keys(CATALOGO_CUENTAS.balance).forEach(id => {
      const cuenta = CATALOGO_CUENTAS.balance[id];
      if (cuenta.cuentaPadre === 'B-01') {
        resumen.detalles.push({
          cuenta: id,
          nombre: cuenta.nombre,
          saldo: this.saldos[id] || 0
        });
      }
    });

    return resumen;
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD PARA REPORTES
// ============================================================================

/**
 * Formatea un número como moneda
 */
function formatearMoneda(monto) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(monto);
}

/**
 * Formatea un porcentaje
 */
function formatearPorcentaje(valor) {
  return `${parseFloat(valor).toFixed(2)}%`;
}

/**
 * Genera HTML para el Estado de Flujo
 */
function generarHTMLEstadoFlujo(reporte) {
  let html = `
    <div class="reporte-flujo">
      <h2>Estado de Movimientos de Flujo</h2>
      <h3>Año ${reporte.año}</h3>
      
      <table class="tabla-reporte">
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Valor</th>
            <th>% del Ingreso</th>
            <th>Por Vientre</th>
          </tr>
        </thead>
        <tbody>
          <tr class="seccion-header">
            <td colspan="4"><strong>INGRESOS DE EFECTIVO</strong></td>
          </tr>
  `;

  Object.keys(reporte.ingresos).forEach(cuenta => {
    const ing = reporte.ingresos[cuenta];
    html += `
          <tr>
            <td>${ing.nombre}</td>
            <td>${formatearMoneda(ing.monto)}</td>
            <td>${formatearPorcentaje(ing.porcentaje)}</td>
            <td>${formatearMoneda(ing.porVientre)}</td>
          </tr>
    `;
  });

  html += `
          <tr class="total-row">
            <td><strong>TOTAL INGRESOS</strong></td>
            <td><strong>${formatearMoneda(reporte.totalIngresos)}</strong></td>
            <td><strong>100.00%</strong></td>
            <td></td>
          </tr>
          <tr class="seccion-header">
            <td colspan="4"><strong>EGRESOS</strong></td>
          </tr>
  `;

  Object.keys(reporte.egresos).forEach(cuenta => {
    const egr = reporte.egresos[cuenta];
    html += `
          <tr>
            <td>${egr.nombre}</td>
            <td>${formatearMoneda(egr.monto)}</td>
            <td>${formatearPorcentaje(egr.porcentaje)}</td>
            <td>${formatearMoneda(egr.porVientre)}</td>
          </tr>
    `;
  });

  html += `
          <tr class="total-row">
            <td><strong>TOTAL EGRESOS</strong></td>
            <td><strong>${formatearMoneda(reporte.totalEgresos)}</strong></td>
            <td><strong>${formatearPorcentaje((reporte.totalEgresos / reporte.totalIngresos * 100).toFixed(2))}</strong></td>
            <td></td>
          </tr>
          <tr class="utilidad-row ${reporte.utilidadPerdida >= 0 ? 'positivo' : 'negativo'}">
            <td><strong>${reporte.utilidadPerdida >= 0 ? 'UTILIDAD' : 'PÉRDIDA'} DEL PERÍODO</strong></td>
            <td><strong>${formatearMoneda(Math.abs(reporte.utilidadPerdida))}</strong></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  return html;
}

/**
 * Genera HTML para el Balance General
 */
function generarHTMLBalanceGeneral(balance) {
  let html = `
    <div class="reporte-balance">
      <h2>Balance General</h2>
      <h3>Al ${new Date(balance.fecha).toLocaleDateString('es-MX')}</h3>
      
      <table class="tabla-reporte">
        <thead>
          <tr>
            <th>Cuenta</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr class="seccion-header">
            <td colspan="2"><strong>ACTIVOS</strong></td>
          </tr>
  `;

  Object.keys(balance.activos).forEach(cuenta => {
    const act = balance.activos[cuenta];
    html += `
          <tr>
            <td>${act.nombre}</td>
            <td>${formatearMoneda(act.monto)}</td>
          </tr>
    `;
  });

  html += `
          <tr class="total-row">
            <td><strong>TOTAL ACTIVOS</strong></td>
            <td><strong>${formatearMoneda(balance.totalActivos)}</strong></td>
          </tr>
          <tr class="seccion-header">
            <td colspan="2"><strong>PASIVOS</strong></td>
          </tr>
  `;

  if (Object.keys(balance.pasivos).length > 0) {
    Object.keys(balance.pasivos).forEach(cuenta => {
      const pas = balance.pasivos[cuenta];
      html += `
          <tr>
            <td>${pas.nombre}</td>
            <td>${formatearMoneda(pas.monto)}</td>
          </tr>
      `;
    });
  } else {
    html += `
          <tr>
            <td colspan="2" style="text-align: center; font-style: italic;">Sin pasivos registrados</td>
          </tr>
    `;
  }

  html += `
          <tr class="total-row">
            <td><strong>TOTAL PASIVOS</strong></td>
            <td><strong>${formatearMoneda(balance.totalPasivos)}</strong></td>
          </tr>
          <tr class="seccion-header">
            <td colspan="2"><strong>PATRIMONIO</strong></td>
          </tr>
  `;

  Object.keys(balance.patrimonio).forEach(cuenta => {
    const pat = balance.patrimonio[cuenta];
    html += `
          <tr>
            <td>${pat.nombre}</td>
            <td>${formatearMoneda(pat.monto)}</td>
          </tr>
    `;
  });

  html += `
          <tr class="total-row">
            <td><strong>TOTAL PATRIMONIO</strong></td>
            <td><strong>${formatearMoneda(balance.totalPatrimonio)}</strong></td>
          </tr>
          <tr class="verificacion-row ${balance.cuadra ? 'cuadra' : 'no-cuadra'}">
            <td><strong>VERIFICACIÓN (Pasivos + Patrimonio)</strong></td>
            <td><strong>${formatearMoneda(balance.totalPasivos + balance.totalPatrimonio)}</strong></td>
          </tr>
          ${!balance.cuadra ? '<tr class="error-row"><td colspan="2">⚠️ El balance no cuadra. Revisar asientos contables.</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `;

  return html;
}

// ============================================================================
// EXPORTAR MÓDULO
// ============================================================================

// Para uso en Node.js o módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SistemaContabilidad,
    CATALOGO_CUENTAS,
    formatearMoneda,
    formatearPorcentaje,
    generarHTMLEstadoFlujo,
    generarHTMLBalanceGeneral
  };
}

// Para uso en navegador
if (typeof window !== 'undefined') {
  window.SistemaContabilidad = SistemaContabilidad;
  window.CATALOGO_CUENTAS = CATALOGO_CUENTAS;
  window.formatearMoneda = formatearMoneda;
  window.formatearPorcentaje = formatearPorcentaje;
  window.generarHTMLEstadoFlujo = generarHTMLEstadoFlujo;
  window.generarHTMLBalanceGeneral = generarHTMLBalanceGeneral;
}
