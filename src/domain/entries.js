import { roundCurrency } from '../core/money.js';
import { calcularINSS, calcularIRRF, calcularLiquido } from './taxes.js';

export function getMonthlyDiscountRecords(records = [], person = '', competencia = '') {
  return records.filter((record) =>
    record?.type === 'entrada' &&
    record.person === person &&
    record.competence === competencia &&
    String(record.macro_category || '') === 'Dedução'
  );
}

export function getMonthlyEntryRecords(records = [], person = '', competencia = '', isReferenceSalaryRecord = () => false) {
  return records.filter((record) =>
    record?.type === 'entrada' &&
    record.person === person &&
    record.competence === competencia &&
    !isReferenceSalaryRecord(record)
  );
}

export function getMonthlyHourExtraRecords(records = [], person = '', competencia = '') {
  return records.filter((record) =>
    record?.type === 'controle_horas' &&
    record.person === person &&
    record.competence === competencia &&
    record.hour_entry_type === 'Hora Extra'
  );
}

export function consolidateMonthlyEntry({
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
  const hourEntries = getMonthlyHourExtraRecords(records, person, competencia);
  const monthlyEntries = getMonthlyEntryRecords(records, person, competencia, isReferenceSalaryRecord);
  const horaExtra = roundCurrency(hourEntries.reduce((sum, item) => sum + (Number(item.financial_total || 0)), 0));
  const descontoRecords = getMonthlyDiscountRecords(records, person, competencia);
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
