import { describe, expect, it } from 'vitest';
import {
  calcularBancoHoras,
  calcularHoraExtra,
  calcularHoras,
  formatHoursDecimal,
  parseOvertimePercent,
  parseTimeToMinutes
} from '../../src/domain/hours.js';

describe('hour calculations', () => {
  it('parses and formats time values', () => {
    expect(parseTimeToMinutes('08:30')).toBe(510);
    expect(parseTimeToMinutes('invalid')).toBeNull();
    expect(formatHoursDecimal(1.5)).toBe('01:30');
    expect(formatHoursDecimal(2.25)).toBe('02:15');
  });

  it('calculates worked hours between valid times', () => {
    expect(calcularHoras('08:00', '17:30')).toEqual({
      quantidade: 9.5,
      quantidadeFormatada: '09:30',
      minutos: 570
    });
  });

  it('returns zeroed hours for invalid ranges', () => {
    expect(calcularHoras('17:00', '08:00')).toEqual({
      quantidade: 0,
      quantidadeFormatada: '00:00',
      minutos: 0
    });
  });

  it('normalizes overtime percentages', () => {
    expect(parseOvertimePercent(50)).toBe(0.5);
    expect(parseOvertimePercent(0.5)).toBe(0.5);
    expect(parseOvertimePercent(-10)).toBe(0);
  });

  it('calculates overtime financial values', () => {
    expect(calcularHoraExtra({ salaryBase: 2200, quantityHours: 2, percentage: 50 })).toEqual({
      valorHoraNormal: 10,
      percentualAplicado: 0.5,
      adicional: 5,
      valorHoraExtra: 15,
      totalHoraExtra: 30
    });
  });

  it('calculates time bank debit and credit movements', () => {
    expect(calcularBancoHoras({ quantityHours: 2.5, natureza: 'Debito' })).toEqual({
      debito: 2.5,
      credito: 0,
      saldo: 2.5
    });
    expect(calcularBancoHoras({ quantityHours: 1.25, natureza: 'Credito' })).toEqual({
      debito: 0,
      credito: 1.25,
      saldo: -1.25
    });
  });
});
