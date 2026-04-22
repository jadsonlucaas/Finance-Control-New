import { roundCurrency } from '../core/money.js';

export function calcularINSS(baseTotal = 0) {
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

export function calcularIRRF(baseTotal = 0, inss = 0) {
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

export function calcularLiquido({
  salarioBase = 0,
  horaExtra = 0,
  outrosProventos = 0,
  inss = 0,
  irrf = 0,
  outrosDescontos = 0
} = {}) {
  return roundCurrency(
    (Number(salarioBase) || 0) +
    (Number(horaExtra) || 0) +
    (Number(outrosProventos) || 0) -
    (Number(inss) || 0) -
    (Number(irrf) || 0) -
    (Number(outrosDescontos) || 0)
  );
}
