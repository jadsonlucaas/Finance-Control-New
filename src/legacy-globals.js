(function () {
  function roundCurrency(value) {
    return Math.round(((Number(value) || 0) + 1e-8) * 100) / 100;
  }

  function parseCurrencyValue(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return roundCurrency(value);

    const normalized = String(value)
      .replace(/\s/g, '')
      .replace(/R\$/gi, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? roundCurrency(numeric) : 0;
  }

  function normalizeCompetenceKey(value = '') {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}$/.test(raw)) return raw;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
    return '';
  }

  function parseTimeToMinutes(value) {
    if (!value || !value.includes(':')) return null;
    const [hours, minutes] = value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return (hours * 60) + minutes;
  }

  function formatHoursDecimal(hoursDecimal) {
    const totalMinutes = Math.round((Number(hoursDecimal) || 0) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  function normalizeImportText(value) {
    return String(value ?? '').trim();
  }

  function normalizeCycleValue(value) {
    const base = normalizeImportText(value).toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!base) return '';
    if (base.includes('QUINZENA')) return 'QUINZENA';
    if (base.includes('INICIO')) return 'INICIO_MES';
    return '';
  }

  function normalizeStatusValue(value) {
    const base = normalizeImportText(value).toLowerCase();
    if (!base) return 'Em aberto';
    if (base.includes('cancel')) return 'Cancelado';
    if (base.includes('pago')) return 'Pago';
    return 'Em aberto';
  }

  function parseOvertimePercent(value) {
    const numeric = Number(value) || 0;
    if (numeric <= 0) return 0;
    return numeric > 1 ? numeric / 100 : numeric;
  }

  function calcularHoras(horaInicial = '', horaFinal = '') {
    const inicio = parseTimeToMinutes(horaInicial);
    const fim = parseTimeToMinutes(horaFinal);
    if (inicio === null || fim === null || fim <= inicio) {
      return {
        quantidade: 0,
        quantidadeFormatada: '00:00',
        minutos: 0
      };
    }

    const minutos = fim - inicio;
    const quantidade = roundCurrency(minutos / 60);
    return {
      quantidade,
      quantidadeFormatada: formatHoursDecimal(quantidade),
      minutos
    };
  }

  function calcularHoraExtra({ salaryBase = 0, quantityHours = 0, percentage = 0 } = {}) {
    const valorHoraNormal = salaryBase > 0 ? roundCurrency(salaryBase / 220) : 0;
    const percentualAplicado = parseOvertimePercent(percentage);
    const adicional = roundCurrency(valorHoraNormal * percentualAplicado);
    const valorHoraExtra = roundCurrency(valorHoraNormal + adicional);
    const totalHoraExtra = roundCurrency((Number(quantityHours) || 0) * valorHoraExtra);

    return {
      valorHoraNormal,
      percentualAplicado,
      adicional,
      valorHoraExtra,
      totalHoraExtra
    };
  }

  function calcularBancoHoras({ quantityHours = 0, natureza = 'Debito' } = {}) {
    const horas = Number(quantityHours) || 0;
    const isDebito = String(natureza || '').trim().toLowerCase().startsWith('d');
    return {
      debito: isDebito ? horas : 0,
      credito: isDebito ? 0 : horas,
      saldo: roundCurrency(isDebito ? horas : -horas)
    };
  }

  function calcularINSS(baseTotal = 0) {
    const base = Number(baseTotal) || 0;
    if (base <= 0) return 0;

    const faixas = [
      { limite: 1621.00, aliquota: 0.075, deducao: 0 },
      { limite: 2902.84, aliquota: 0.09, deducao: 24.32 },
      { limite: 4354.27, aliquota: 0.12, deducao: 59.09 },
      { limite: 8475.55, aliquota: 0.14, deducao: 234.94 }
    ];

    const faixa = faixas.find((item) => base <= item.limite) || faixas[faixas.length - 1];
    const baseCalculo = Math.min(base, faixas[faixas.length - 1].limite);
    return roundCurrency(Math.max(0, (baseCalculo * faixa.aliquota) - faixa.deducao));
  }

  function calcularIRRF(baseTotal = 0, inss = 0) {
    const baseBruta = Number(baseTotal) || 0;
    const taxableBase = Math.max(0, roundCurrency((Number(baseTotal) || 0) - (Number(inss) || 0)));

    const faixas = [
      { limit: 2428.80, rate: 0, deduction: 0 },
      { limit: 2826.65, rate: 0.075, deduction: 182.16 },
      { limit: 3751.05, rate: 0.15, deduction: 394.16 },
      { limit: 4664.68, rate: 0.225, deduction: 675.49 },
      { limit: Infinity, rate: 0.275, deduction: 908.73 }
    ];

    const faixa = faixas.find((item) => taxableBase <= item.limit) || faixas[faixas.length - 1];
    const irrfTradicional = roundCurrency(Math.max(0, (taxableBase * faixa.rate) - faixa.deduction));

    let reducao = 0;
    if (taxableBase > 5000 && taxableBase < 7350) {
      reducao = Math.max(0, roundCurrency(978.62 - (0.133145 * taxableBase)));
    } else if (taxableBase <= 5000) {
      reducao = irrfTradicional;
    }

    if (baseBruta <= 5000) {
      return 0;
    }
    if (baseBruta <= 7350) {
      return roundCurrency(Math.max(0, irrfTradicional - reducao));
    }
    return irrfTradicional;
  }

  function calcularLiquido({ salarioBase = 0, horaExtra = 0, outrosProventos = 0, inss = 0, irrf = 0, outrosDescontos = 0 } = {}) {
    return roundCurrency(
      (Number(salarioBase) || 0) +
      (Number(horaExtra) || 0) +
      (Number(outrosProventos) || 0) -
      (Number(inss) || 0) -
      (Number(irrf) || 0) -
      (Number(outrosDescontos) || 0)
    );
  }

  function fmt(value) {
    return `R$ ${(Number(value) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }

  function fmtCompactCurrency(value) {
    const amount = Number(value) || 0;
    const abs = Math.abs(amount);
    if (abs >= 1000000) return `R$ ${(amount / 1000000).toFixed(1).replace('.', ',')} mi`;
    if (abs >= 1000) return `R$ ${(amount / 1000).toFixed(1).replace('.', ',')} mil`;
    return `R$ ${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }

  function addDashboardAggregationItem(map, recordsMap, key, record, value) {
    const label = String(key || '').trim() || 'Sem informação';
    map[label] = roundCurrency((map[label] || 0) + value);
    if (!recordsMap[label]) recordsMap[label] = [];
    recordsMap[label].push(record);
  }

  function dashboardAggregationItems(valuesMap, recordsMap) {
    return Object.entries(valuesMap)
      .map(([label, value]) => ({
        label,
        value: roundCurrency(value),
        records: recordsMap[label] || []
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  function getMonthlyDiscountRecordsFromRecords(records = [], person = '', competencia = '') {
    return records.filter((record) =>
      record?.type === 'entrada' &&
      record.person === person &&
      record.competence === competencia &&
      String(record.macro_category || '').toUpperCase().includes('DEDU')
    );
  }

  function getMonthlyEntryRecordsFromRecords(records = [], person = '', competencia = '', isReferenceSalaryRecord = () => false) {
    return records.filter((record) =>
      record?.type === 'entrada' &&
      record.person === person &&
      record.competence === competencia &&
      !isReferenceSalaryRecord(record)
    );
  }

  function getMonthlyHourExtraRecordsFromRecords(records = [], person = '', competencia = '') {
    return records.filter((record) =>
      record?.type === 'controle_horas' &&
      record.person === person &&
      record.competence === competencia &&
      record.hour_entry_type === 'Hora Extra'
    );
  }

  function consolidateMonthlyEntry({
    records = [],
    person = '',
    competencia = '',
    salaryInfo = {},
    banco = null,
    isReferenceSalaryRecord = () => false,
    calculateInss = calcularINSS,
    calculateIrrf = calcularIRRF
  } = {}) {
    const salaryBase = roundCurrency(salaryInfo?.salario || salaryInfo?.salary_base || salaryInfo?.amount || 0);
    const hourEntries = getMonthlyHourExtraRecordsFromRecords(records, person, competencia);
    const monthlyEntries = getMonthlyEntryRecordsFromRecords(records, person, competencia, isReferenceSalaryRecord);
    const horaExtra = roundCurrency(hourEntries.reduce((sum, item) => sum + (Number(item.financial_total || 0)), 0));
    const descontoRecords = getMonthlyDiscountRecordsFromRecords(records, person, competencia);
    const proventoRecords = monthlyEntries.filter((item) => {
      const label = String(item.subcategory || item.earning_type || '').toUpperCase();
      const macro = String(item.macro_category || '').toUpperCase();
      if (label.includes('HORA EXTRA')) return false;
      if (label.includes('INSS') || label.includes('IRRF') || label.includes('IRPF')) return false;
      if (macro.includes('DEDU')) return false;
      return true;
    });
    const salarioManual = salaryBase > 0 ? 0 : roundCurrency(proventoRecords
      .filter((item) => String(item.subcategory || item.earning_type || '').toUpperCase().includes('SAL'))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
    const outrosProventos = roundCurrency(proventoRecords
      .filter((item) => !String(item.subcategory || item.earning_type || '').toUpperCase().includes('SAL'))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
    const outrosDescontos = roundCurrency(descontoRecords
      .filter((item) => {
        const label = String(item.subcategory || item.earning_type || '').toUpperCase();
        return !label.includes('INSS') && !label.includes('IRRF') && !label.includes('IRPF');
      })
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
    const salarioBaseFinal = roundCurrency(salaryBase + salarioManual);
    const baseTotal = roundCurrency(salarioBaseFinal + horaExtra + outrosProventos);
    const inssRegistrado = descontoRecords.find((item) => String(item.subcategory || item.earning_type || '').toUpperCase().includes('INSS'));
    const irrfRegistrado = descontoRecords.find((item) => {
      const label = String(item.subcategory || item.earning_type || '').toUpperCase();
      return label.includes('IRRF') || label.includes('IRPF');
    });
    const inss = roundCurrency(inssRegistrado ? Number(inssRegistrado.amount || 0) : calculateInss(baseTotal));
    const irrf = roundCurrency(irrfRegistrado ? Number(irrfRegistrado.amount || 0) : calculateIrrf(baseTotal, inss));
    const liquido = calcularLiquido({ salarioBase: salarioBaseFinal, horaExtra, outrosProventos, inss, irrf });

    return {
      person,
      competencia,
      salaryBase: salarioBaseFinal,
      hourExtra: horaExtra,
      outrosProventos,
      baseTotal,
      inss,
      irrf,
      outrosDescontos,
      liquido,
      banco,
      salaryInfo,
      hourEntries,
      descontoRecords
    };
  }

  Object.assign(window, {
    roundCurrency,
    parseCurrencyValue,
    normalizeCompetenceKey,
    parseTimeToMinutes,
    formatHoursDecimal,
    normalizeImportText,
    normalizeCycleValue,
    normalizeStatusValue,
    parseOvertimePercent,
    calcularHoras,
    calcularHoraExtra,
    calcularBancoHoras,
    calcularINSS,
    calcularIRRF,
    calcularLiquido,
    fmt,
    fmtCompactCurrency,
    addDashboardAggregationItem,
    dashboardAggregationItems,
    financeDomain: {
      consolidateMonthlyEntry,
      getMonthlyDiscountRecords: getMonthlyDiscountRecordsFromRecords,
      getMonthlyEntryRecords: getMonthlyEntryRecordsFromRecords,
      getMonthlyHourExtraRecords: getMonthlyHourExtraRecordsFromRecords
    }
  });
})();
