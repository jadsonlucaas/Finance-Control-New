import { describe, expect, it } from 'vitest';
import { calcularINSS, calcularIRRF, calcularLiquido } from '../../src/domain/taxes.js';

describe('tax calculations', () => {
  it('calculates progressive INSS according to current table in the app', () => {
    expect(calcularINSS(0)).toBe(0);
    expect(calcularINSS(1621)).toBe(121.58);
    expect(calcularINSS(3000)).toBe(300.91);
    expect(calcularINSS(10000)).toBe(951.64);
  });

  it('calculates IRRF with simplified discount rules used by the app', () => {
    expect(calcularIRRF(4000, 360)).toBe(0);
    expect(calcularIRRF(6000, 600)).toBe(316.63);
  });

  it('calculates net income', () => {
    expect(calcularLiquido({
      salarioBase: 5000,
      horaExtra: 300,
      outrosProventos: 200,
      inss: 550,
      irrf: 120.5,
      outrosDescontos: 80
    })).toBe(4749.5);
  });
});
