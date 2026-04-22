import { describe, expect, it } from 'vitest';
import {
  consolidateMonthlyEntry,
  getMonthlyDiscountRecords,
  getMonthlyEntryRecords,
  getMonthlyHourExtraRecords
} from '../../src/domain/entries.js';

const records = [
  { id: 'salary-reference', type: 'entrada', person: 'Ana', competence: '2026-04', macro_category: 'Salário', subcategory: 'Salário Base', amount: 5000, reference_salary: true },
  { id: 'bonus', type: 'entrada', person: 'Ana', competence: '2026-04', macro_category: 'Receita', subcategory: 'Bônus', amount: 300 },
  { id: 'discount', type: 'entrada', person: 'Ana', competence: '2026-04', macro_category: 'Dedução', subcategory: 'Plano', amount: 100 },
  { id: 'inss', type: 'entrada', person: 'Ana', competence: '2026-04', macro_category: 'Dedução', subcategory: 'INSS', amount: 550 },
  { id: 'he', type: 'controle_horas', person: 'Ana', competence: '2026-04', hour_entry_type: 'Hora Extra', financial_total: 150 },
  { id: 'other-person', type: 'entrada', person: 'Bruno', competence: '2026-04', macro_category: 'Receita', amount: 999 }
];

describe('monthly entry consolidation', () => {
  it('selects monthly records by person and competence', () => {
    expect(getMonthlyDiscountRecords(records, 'Ana', '2026-04').map((item) => item.id)).toEqual(['discount', 'inss']);
    expect(getMonthlyHourExtraRecords(records, 'Ana', '2026-04').map((item) => item.id)).toEqual(['he']);
    expect(getMonthlyEntryRecords(records, 'Ana', '2026-04', (record) => record.reference_salary).map((item) => item.id)).toEqual(['bonus', 'discount', 'inss']);
  });

  it('consolidates salary, overtime, earnings, deductions and taxes', () => {
    const result = consolidateMonthlyEntry({
      records,
      person: 'Ana',
      competencia: '2026-04',
      salaryInfo: { salario: 5000 },
      banco: { saldoAtual: 0 },
      isReferenceSalaryRecord: (record) => record.reference_salary,
      calculateIrrf: () => 120
    });

    expect(result).toMatchObject({
      person: 'Ana',
      competencia: '2026-04',
      salaryBase: 5000,
      hourExtra: 150,
      outrosProventos: 300,
      baseTotal: 5450,
      inss: 550,
      irrf: 120,
      outrosDescontos: 100,
      liquido: 4780,
      banco: { saldoAtual: 0 }
    });
    expect(result.hourEntries.map((item) => item.id)).toEqual(['he']);
    expect(result.descontoRecords.map((item) => item.id)).toEqual(['discount', 'inss']);
  });

  it('uses manual salary entry when salary info is empty', () => {
    const result = consolidateMonthlyEntry({
      records,
      person: 'Ana',
      competencia: '2026-04',
      salaryInfo: { salario: 0 },
      isReferenceSalaryRecord: () => false,
      calculateInss: () => 0,
      calculateIrrf: () => 0
    });

    expect(result.salaryBase).toBe(5000);
    expect(result.outrosProventos).toBe(300);
  });
});
