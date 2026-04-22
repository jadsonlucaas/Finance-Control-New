import { describe, expect, it } from 'vitest';
import { readEntradaFormValues, readSaidaFormValues } from '../../src/ui/records/recordFormReader.js';

function fakeDocument(values = {}, checked = {}) {
  return {
    getElementById(id) {
      if (Object.hasOwn(values, id)) return { value: values[id], checked: Boolean(checked[id]) };
      if (Object.hasOwn(checked, id)) return { value: '', checked: Boolean(checked[id]) };
      return null;
    }
  };
}

describe('record form reader', () => {
  it('reads entrada hour extra values and calculates the snapshot', () => {
    const doc = fakeDocument({
      'form-person': 'Jadson',
      'form-earning-type': 'Hora Extra',
      'form-he-type': 'he-1',
      'form-he-start-time': '08:00',
      'form-he-end-time': '10:00',
      'form-he-hours': '2',
      'form-he-hours-formatted': '',
      'form-he-base-hour': '20',
      'form-he-base-salary': '4400',
      'form-he-monthly-hours': '',
      'form-earning-comp': '2026-04',
      'form-earning-desc': ''
    });

    const values = readEntradaFormValues(doc, {
      formCycle: 'INICIO_MES',
      getHourExtraRecordDefaults: () => ({ defaultFlag: true }),
      findOvertimeTypeById: () => ({ name: 'HE 50%', percentage: 1.5, financialType: true, active: true }),
      formatHoursDecimal: (value) => `${value}:00`,
      roundCurrency: (value) => Math.round(value * 100) / 100
    });

    expect(values.amount).toBe(60);
    expect(values.payloadInput).toMatchObject({
      person: 'Jadson',
      earningType: 'Hora Extra',
      amount: 60,
      competence: '2026-04',
      cycle: 'INICIO_MES'
    });
    expect(values.hourExtraSnapshot).toMatchObject({
      nomeTipo: 'HE 50%',
      quantidadeHoras: 2,
      quantidadeHorasFormatada: '2:00',
      valorHoraCalculado: 30,
      valorTotalCalculado: 60,
      salary_base_reference: 4400,
      monthly_hours_reference: 220,
      tipoFinanceiroUsado: true
    });
  });

  it('reads saida values for installments and fallback due date', () => {
    const doc = fakeDocument({
      'form-person': 'Luana',
      'form-macro': 'FIXO',
      'form-category': 'Moradia',
      'form-desc': 'Aluguel',
      'form-amount': '100',
      'form-status': 'Em aberto',
      'form-payment': 'Pix',
      'form-occurred': '2026-04-01',
      'form-due': '',
      'form-competence': '2026-04',
      'form-paid-at': '',
      'form-recurrence': '',
      'form-installments': '3',
      'form-total-amount': '300'
    }, {
      'form-installment-check': true
    });

    const values = readSaidaFormValues(doc, {
      formCycle: 'QUINZENA',
      getHourExtraRecordDefaults: () => ({ quantidadeHoras: 0 }),
      today: '2026-04-17'
    });

    expect(values).toMatchObject({
      amount: 100,
      status: 'Em aberto',
      selectedMacro: 'FIXO',
      selectedCategory: 'Moradia',
      isInstallment: true,
      installments: 3,
      totalAmount: 300,
      baseDueDate: '2026-04-17'
    });
    expect(values.payloadInput).toMatchObject({
      person: 'Luana',
      macro: 'FIXO',
      subcategory: 'Moradia',
      cycle: 'QUINZENA'
    });
  });
});
