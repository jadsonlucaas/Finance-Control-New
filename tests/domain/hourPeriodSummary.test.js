import { describe, expect, it } from 'vitest';
import { buildHourPeriodSummary } from '../../src/domain/hourPeriodSummary.js';

describe('hour period summary', () => {
  it('summarizes overtime and bank hours inside the selected period', () => {
    const summary = buildHourPeriodSummary([
      {
        type: 'controle_horas',
        person: 'Jadson',
        competence: '2026-04',
        hour_control_type: 'Hora Extra',
        quantidadeHoras: 2.5,
        valorTotalCalculado: 120
      },
      {
        type: 'controle_horas',
        person: 'Jadson',
        competence: '2026-04',
        hour_control_type: 'Banco de Horas',
        bank_nature: 'Debito',
        quantidadeHoras: 1.25
      },
      {
        type: 'controle_horas',
        person: 'Luana',
        competence: '2026-04',
        hour_control_type: 'Banco de Horas',
        bank_nature: 'Credito',
        quantidadeHoras: 0.5
      },
      {
        type: 'controle_horas',
        person: 'Jadson',
        competence: '2026-05',
        hour_control_type: 'Hora Extra',
        quantidadeHoras: 10,
        valorTotalCalculado: 999
      }
    ], {
      start: '2026-04',
      end: '2026-04'
    });

    expect(summary).toMatchObject({
      overtimeHours: 2.5,
      overtimeAmount: 120,
      bankDebitHours: 0.5,
      bankCreditHours: 1.25,
      bankNetHours: -0.75,
      recordsCount: 3,
      peopleCount: 2
    });
    expect(summary.byPerson).toEqual([
      expect.objectContaining({ person: 'Jadson', overtimeHours: 2.5, bankNetHours: -1.25 }),
      expect.objectContaining({ person: 'Luana', overtimeHours: 0, bankNetHours: 0.5 })
    ]);
  });

  it('respects the selected person filter', () => {
    const summary = buildHourPeriodSummary([
      { type: 'controle_horas', person: 'Jadson', competence: '2026-04', hour_control_type: 'Hora Extra', quantidadeHoras: 2 },
      { type: 'controle_horas', person: 'Luana', competence: '2026-04', hour_control_type: 'Hora Extra', quantidadeHoras: 5 }
    ], {
      start: '2026-04',
      end: '2026-04',
      person: 'Luana'
    });

    expect(summary.overtimeHours).toBe(5);
    expect(summary.peopleCount).toBe(1);
    expect(summary.byPerson[0].person).toBe('Luana');
  });
});
