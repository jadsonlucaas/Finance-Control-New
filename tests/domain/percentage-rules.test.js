import { describe, expect, it } from 'vitest';
import {
  getPercentageBaseValue,
  getPercentageCycleBaseValue,
  getPercentageRuleAmount,
  getPercentageRuleBaseValue,
  isReserveOrInvestmentPercentageRule
} from '../../src/domain/percentage-rules.js';

const consolidated = {
  baseTotal: 6000,
  salaryBase: 5000,
  salarioBase: 4900,
  hourExtra: 300,
  outrosProventos: 200,
  liquido: 4200,
  liquidoFinal: 4100,
  adiantamentoQuinzena: 1800
};

describe('percentage rule calculations', () => {
  it('selects base values by configured base', () => {
    expect(getPercentageBaseValue(consolidated, 'base_total')).toBe(6000);
    expect(getPercentageBaseValue(consolidated, 'bruta')).toBe(6000);
    expect(getPercentageBaseValue(consolidated, 'salario')).toBe(5000);
    expect(getPercentageBaseValue(consolidated, 'extra')).toBe(500);
    expect(getPercentageBaseValue(consolidated, 'liquido')).toBe(4200);
  });

  it('uses quinzena base for liquid cycle and suppresses extra in quinzena', () => {
    expect(getPercentageCycleBaseValue(consolidated, 'liquido', 'QUINZENA')).toBe(1800);
    expect(getPercentageCycleBaseValue(consolidated, 'extra', 'QUINZENA')).toBe(0);
    expect(getPercentageCycleBaseValue(consolidated, 'extra', 'INICIO_MES')).toBe(500);
  });

  it('detects reserve and investment rules', () => {
    expect(isReserveOrInvestmentPercentageRule({ macro: 'RESERVA' })).toBe(true);
    expect(isReserveOrInvestmentPercentageRule({ category: 'Investimentos' })).toBe(true);
    expect(isReserveOrInvestmentPercentageRule({ name: 'Mercado' })).toBe(false);
  });

  it('calculates rule base and amount', () => {
    expect(getPercentageRuleBaseValue(consolidated, {
      macro: 'RESERVA',
      percentage: 10,
      cycle: 'QUINZENA'
    })).toBe(1800);

    expect(getPercentageRuleAmount(consolidated, {
      macro: 'RESERVA',
      percentage: 10,
      cycle: 'QUINZENA'
    })).toBe(180);

    expect(getPercentageRuleAmount(consolidated, {
      base: 'extra',
      percentage: 12.5,
      cycle: 'INICIO_MES'
    })).toBe(62.5);
  });
});
