import { roundCurrency } from '../core/money.js';

export function parseTimeToMinutes(value) {
  if (!value || !value.includes(':')) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return (hours * 60) + minutes;
}

export function formatHoursDecimal(hoursDecimal) {
  const totalMinutes = Math.round((Number(hoursDecimal) || 0) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function calcularHoras(horaInicial = '', horaFinal = '') {
  const inicio = parseTimeToMinutes(horaInicial);
  const fim = parseTimeToMinutes(horaFinal);
  if (inicio === null || fim === null || fim <= inicio) {
    return {
      quantidade: 0,
      quantidadeFormatada: '00:00',
      minutos: 0
    };
  }

  const minutos = fim - inicio;
  const quantidade = roundCurrency(minutos / 60);
  return {
    quantidade,
    quantidadeFormatada: formatHoursDecimal(quantidade),
    minutos
  };
}

export function parseOvertimePercent(value) {
  const numeric = Number(value) || 0;
  if (numeric <= 0) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
}

export function calcularHoraExtra({ salaryBase = 0, quantityHours = 0, percentage = 0 } = {}) {
  const valorHoraNormal = salaryBase > 0 ? roundCurrency(salaryBase / 220) : 0;
  const percentualAplicado = parseOvertimePercent(percentage);
  const adicional = roundCurrency(valorHoraNormal * percentualAplicado);
  const valorHoraExtra = roundCurrency(valorHoraNormal + adicional);
  const totalHoraExtra = roundCurrency((Number(quantityHours) || 0) * valorHoraExtra);

  return {
    valorHoraNormal,
    percentualAplicado,
    adicional,
    valorHoraExtra,
    totalHoraExtra
  };
}

export function calcularBancoHoras({ quantityHours = 0, natureza = 'Debito' } = {}) {
  const horas = Number(quantityHours) || 0;
  const isDebito = String(natureza || '').trim().toLowerCase().startsWith('d');
  return {
    debito: isDebito ? horas : 0,
    credito: isDebito ? 0 : horas,
    saldo: roundCurrency(isDebito ? horas : -horas)
  };
}
