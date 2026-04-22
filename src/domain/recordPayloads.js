import { roundCurrency } from '../core/money.js';

function nowIso(now = new Date()) {
  return now instanceof Date ? now.toISOString() : new Date(now).toISOString();
}

function addMonthsToIsoDate(dateValue = '', monthsToAdd = 0) {
  const base = dateValue || new Date().toISOString().slice(0, 10);
  const dueDate = new Date(`${base}T00:00:00`);
  dueDate.setMonth(dueDate.getMonth() + monthsToAdd);
  return dueDate.toISOString().slice(0, 10);
}

export function buildEmptyHourExtraDefaults() {
  return {
    nomeTipo: '',
    percentualUsado: 0,
    valorHoraCalculado: 0,
    valorTotalCalculado: 0,
    quantidadeHoras: 0,
    quantidadeHorasFormatada: '',
    valorBaseHora: 0,
    tipoFinanceiroUsado: false,
    horaInicial: '',
    horaFinal: ''
  };
}

export function resolveEntradaClassification(earningType = '', hourExtraSnapshot = {}) {
  const isHourExtra = earningType === 'Hora Extra';
  const isHourBank = isHourExtra && !hourExtraSnapshot.tipoFinanceiroUsado;
  const isDeduction = earningType.includes('dedução') || earningType.includes('INSS') || earningType.includes('IRPF');
  const macro = isHourBank
    ? 'Banco de Horas'
    : (isDeduction ? 'Dedução' : (earningType.includes('Alimentação') || earningType.includes('Café') || earningType.includes('Benefício') ? 'Benefício' : 'Rendimento'));

  return {
    isHourExtra,
    isHourBank,
    isDeduction,
    macro,
    subcategory: isHourExtra && hourExtraSnapshot.nomeTipo ? hourExtraSnapshot.nomeTipo : earningType
  };
}

export function buildEntradaPayload(input = {}) {
  const {
    person = '',
    earningType = '',
    amount = 0,
    competence = '',
    cycle = '',
    description = '',
    editingRecord = null,
    hourExtraSnapshot = buildEmptyHourExtraDefaults(),
    now = new Date()
  } = input;
  const classification = resolveEntradaClassification(earningType, hourExtraSnapshot);
  const resolvedDescription = classification.isHourExtra
    ? (description || `${hourExtraSnapshot.nomeTipo} • ${hourExtraSnapshot.quantidadeHorasFormatada || `${hourExtraSnapshot.quantidadeHoras}h`}`)
    : (description || '');

  return {
    type: 'entrada',
    person,
    macro_category: classification.macro,
    subcategory: classification.subcategory,
    description: resolvedDescription,
    amount,
    status: 'Pago',
    payment_method: '',
    occurred_date: '',
    due_date: '',
    competence,
    paid_at: '',
    installment_no: 0,
    total_installments: 0,
    parent_id: '',
    earning_type: earningType,
    cycle,
    recurrence: '',
    created_at: nowIso(now),
    category_id: '',
    category_name: '',
    category_color: '',
    category_icon: '',
    archived: editingRecord?.archived || false,
    archived_at: editingRecord?.archived_at || '',
    ...hourExtraSnapshot
  };
}

export function buildSaidaPayload(input = {}) {
  const {
    person = '',
    macro = '',
    subcategory = '',
    description = '',
    amount = 0,
    status = 'Em aberto',
    paymentMethod = '',
    occurredDate = '',
    dueDate = '',
    competence = '',
    paidAt = '',
    cycle = '',
    recurrence = '',
    installmentNo = 0,
    totalInstallments = 0,
    parentId = '',
    now = new Date(),
    hourExtraDefaults = buildEmptyHourExtraDefaults()
  } = input;

  return {
    type: 'saida',
    person,
    macro_category: macro,
    subcategory,
    description: description || '',
    amount,
    status,
    payment_method: paymentMethod || '',
    occurred_date: occurredDate || '',
    due_date: dueDate || '',
    competence: competence || '',
    paid_at: status === 'Pago' ? paidAt : '',
    installment_no: installmentNo,
    total_installments: totalInstallments,
    parent_id: parentId,
    earning_type: '',
    cycle,
    recurrence,
    created_at: nowIso(now),
    category_id: '',
    category_name: '',
    category_color: '',
    category_icon: '',
    ...hourExtraDefaults
  };
}

export function buildEditedEntradaPayload(editingRecord = {}, payload = {}) {
  return {
    ...editingRecord,
    ...payload,
    id: editingRecord.id,
    created_at: editingRecord.created_at || payload.created_at
  };
}

export function buildEditedSaidaPayload(editingRecord = {}, input = {}) {
  return {
    ...editingRecord,
    type: 'saida',
    person: input.person || '',
    macro_category: input.macro || '',
    subcategory: input.subcategory || '',
    description: input.description || '',
    amount: input.amount || 0,
    status: input.status || 'Em aberto',
    payment_method: input.paymentMethod || '',
    occurred_date: input.occurredDate || '',
    due_date: input.dueDate || '',
    competence: input.competence || '',
    paid_at: input.status === 'Pago' ? input.paidAt || '' : '',
    cycle: input.cycle || '',
    recurrence: input.recurrence || '',
    id: editingRecord.id,
    created_at: editingRecord.created_at
  };
}

export function buildInstallmentSaidaPayloads(input = {}) {
  const {
    installments = 2,
    totalAmount = 0,
    amount = 0,
    baseDueDate = '',
    parentId = '',
    status = 'Em aberto',
    paidAt = '',
    now = new Date()
  } = input;
  const count = Number.parseInt(installments, 10) || 2;
  const total = Number(totalAmount) || (Number(amount) * count);
  const perInstallment = roundCurrency(total / count);

  return Array.from({ length: count }, (_, index) => {
    const dueDate = addMonthsToIsoDate(baseDueDate, index);
    return buildSaidaPayload({
      ...input,
      amount: perInstallment,
      status: index === 0 ? status : 'Em aberto',
      dueDate,
      competence: dueDate.slice(0, 7),
      paidAt: index === 0 && status === 'Pago' ? paidAt : '',
      installmentNo: index + 1,
      totalInstallments: count,
      parentId,
      recurrence: '',
      description: `${input.description || ''} (${index + 1}/${count})`,
      now
    });
  });
}

export function buildRecurringSaidaPayloads(input = {}) {
  const {
    recurrence = '',
    baseDueDate = '',
    parentId = '',
    status = 'Em aberto',
    paidAt = '',
    count = 12,
    now = new Date()
  } = input;
  const monthStep = recurrence === 'anual' ? 12 : 1;

  return Array.from({ length: count }, (_, index) => {
    const dueDate = addMonthsToIsoDate(baseDueDate, index * monthStep);
    return buildSaidaPayload({
      ...input,
      status: index === 0 ? status : 'Em aberto',
      occurredDate: '',
      dueDate,
      competence: dueDate.slice(0, 7),
      paidAt: index === 0 && status === 'Pago' ? paidAt : '',
      installmentNo: 0,
      totalInstallments: 0,
      parentId,
      recurrence,
      now
    });
  });
}

export function installRecordPayloadBuilderGlobals(target = globalThis) {
  const api = {
    buildEmptyHourExtraDefaults,
    resolveEntradaClassification,
    buildEntradaPayload,
    buildSaidaPayload,
    buildEditedEntradaPayload,
    buildEditedSaidaPayload,
    buildInstallmentSaidaPayloads,
    buildRecurringSaidaPayloads
  };
  target.financeRecordPayloadBuilders = api;
  return api;
}
