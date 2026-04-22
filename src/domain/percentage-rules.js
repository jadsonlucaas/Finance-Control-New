import { roundCurrency } from '../core/money.js';

export function getPercentageBaseValue(consolidated = {}, base = 'liquido') {
  if (base === 'base_total') return Number(consolidated.baseTotal || 0);
  if (base === 'bruta') return Number(consolidated.baseTotal || 0);
  if (base === 'salario') return Number(consolidated.salaryBase || consolidated.salarioBase || 0);
  if (base === 'extra') {
    return roundCurrency((Number(consolidated.hourExtra || 0)) + (Number(consolidated.outrosProventos || 0)));
  }
  return Number(consolidated.liquido || consolidated.liquidoFinal || 0);
}

export function getPercentageCycleBaseValue(consolidated = {}, base = 'liquido', cycle = 'INICIO_MES') {
  const normalizedCycle = cycle === 'QUINZENA' ? 'QUINZENA' : 'INICIO_MES';
  if (base === 'base_total') return Number(consolidated.baseTotal || 0);
  if (base === 'bruta') return Number(consolidated.baseTotal || 0);
  if (base === 'salario') return Number(consolidated.salaryBase || consolidated.salarioBase || 0);
  if (base === 'extra') {
    return normalizedCycle === 'QUINZENA'
      ? 0
      : roundCurrency((Number(consolidated.hourExtra || 0)) + (Number(consolidated.outrosProventos || 0)));
  }
  if (normalizedCycle === 'QUINZENA') {
    return Number(consolidated.adiantamentoQuinzena || 0);
  }
  return getPercentageBaseValue(consolidated, base);
}

export function isReserveOrInvestmentPercentageRule(rule = {}) {
  const text = [
    rule.macro,
    rule.category,
    rule.name
  ].map((value) => String(value || '').trim().toUpperCase()).join(' ');
  return text.includes('RESERVA') || text.includes('INVEST');
}

export function getPercentageRuleBaseValue(consolidated = {}, rule = {}) {
  const ruleCycle = rule.cycle === 'QUINZENA' ? 'QUINZENA' : 'INICIO_MES';
  if (rule.base === 'base_total') return Number(consolidated.baseTotal || 0);
  if (rule.base === 'bruta') return Number(consolidated.baseTotal || 0);
  if (rule.base === 'salario') return Number(consolidated.salaryBase || consolidated.salarioBase || 0);
  if (rule.base === 'extra') return getPercentageCycleBaseValue(consolidated, 'extra', ruleCycle);
  if (isReserveOrInvestmentPercentageRule(rule)) {
    return ruleCycle === 'QUINZENA'
      ? Number(consolidated.adiantamentoQuinzena || 0)
      : Number(consolidated.liquido || consolidated.liquidoFinal || 0);
  }
  return getPercentageCycleBaseValue(consolidated, rule.base || 'liquido', ruleCycle);
}

export function getPercentageRuleAmount(consolidated = {}, rule = {}) {
  const baseValue = getPercentageRuleBaseValue(consolidated, rule);
  return roundCurrency(baseValue * (Number(rule.percentage || 0) / 100));
}
