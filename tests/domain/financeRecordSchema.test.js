import { describe, expect, it } from 'vitest';
import {
  FINANCE_RECORD_TYPES,
  getFinanceRecordSchema,
  isKnownFinanceRecordType,
  validateFinanceRecordShape
} from '../../src/domain/schemas/financeRecordSchema.js';

describe('finance record schema contracts', () => {
  it('declares the core record types used by the app', () => {
    expect(FINANCE_RECORD_TYPES).toMatchObject({
      SAIDA: 'saida',
      ENTRADA: 'entrada',
      PESSOA: 'pessoa',
      CATEGORIA: 'categoria',
      MACRO: 'macro',
      CONTROLE_HORAS: 'controle_horas',
      SALARIO_HISTORICO: 'salario_historico',
      PERCENTAGE_RULE: 'percentage_rule'
    });
    expect(isKnownFinanceRecordType('saida')).toBe(true);
    expect(isKnownFinanceRecordType('percentage_rule')).toBe(true);
  });

  it('returns field contracts for known record types', () => {
    expect(getFinanceRecordSchema('saida')?.fields).toMatchObject({
      amount: 'number',
      status: 'string',
      competence: 'competence',
      archived: 'boolean'
    });
    expect(getFinanceRecordSchema('controle_horas')?.fields).toMatchObject({
      hour_control_type: 'string',
      quantidadeHoras: 'number'
    });
    expect(getFinanceRecordSchema('percentage_rule')?.fields).toMatchObject({
      percentage: 'number',
      active: 'boolean',
      startCompetence: 'competence'
    });
  });

  it('validates required fields without blocking unknown legacy types', () => {
    expect(validateFinanceRecordShape({ type: 'macro', macro_category: '' })).toMatchObject({
      isValid: false,
      isKnownType: true
    });
    expect(validateFinanceRecordShape({ type: 'legacy_aux', any: 'field' })).toEqual({
      isValid: true,
      errors: [],
      isKnownType: false
    });
  });
});
