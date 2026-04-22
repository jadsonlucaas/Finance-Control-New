import {
  FINANCE_RECORD_TYPES,
  getFinanceRecordSchema,
  isKnownFinanceRecordType,
  validateFinanceRecordShape
} from '../schemas/financeRecordSchema.js';

function toStringValue(value) {
  return value === null || value === undefined ? '' : String(value);
}

function toNumberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIntegerValue(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBooleanValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return Boolean(value);
}

function normalizeByKind(value, kind) {
  if (value === undefined) return undefined;
  if (kind === 'number') return toNumberValue(value);
  if (kind === 'integer') return toIntegerValue(value);
  if (kind === 'boolean') return toBooleanValue(value);
  if (kind === 'string' || kind === 'dateString' || kind === 'competence') return toStringValue(value);
  return value;
}

function applyKnownSchema(record = {}) {
  const schema = getFinanceRecordSchema(record.type);
  if (!schema) return { ...record };

  const normalized = { ...record };
  Object.entries(schema.fields).forEach(([field, kind]) => {
    if (normalized[field] === undefined) return;
    normalized[field] = normalizeByKind(normalized[field], kind);
  });

  return normalized;
}

function normalizeSaidaRecord(record = {}) {
  const normalized = applyKnownSchema({
    status: 'Em aberto',
    installment_no: 0,
    total_installments: 0,
    archived: false,
    ...record,
    type: FINANCE_RECORD_TYPES.SAIDA
  });
  if (normalized.status !== 'Pago') normalized.paid_at = '';
  return normalized;
}

function normalizeEntradaRecord(record = {}) {
  return applyKnownSchema({
    status: 'Pago',
    installment_no: 0,
    total_installments: 0,
    archived: false,
    ...record,
    type: FINANCE_RECORD_TYPES.ENTRADA
  });
}

function normalizePessoaRecord(record = {}) {
  return applyKnownSchema({
    amount: 0,
    salary_base: 0,
    ...record,
    type: FINANCE_RECORD_TYPES.PESSOA
  });
}

function normalizeCategoriaRecord(record = {}) {
  return applyKnownSchema({
    amount: 0,
    category_color: '',
    category_icon: '',
    ...record,
    type: FINANCE_RECORD_TYPES.CATEGORIA
  });
}

function normalizeMacroRecord(record = {}) {
  return applyKnownSchema({
    amount: 0,
    ...record,
    type: FINANCE_RECORD_TYPES.MACRO
  });
}

function normalizeControleHorasRecord(record = {}) {
  return applyKnownSchema({
    amount: 0,
    quantidadeHoras: 0,
    valorTotalCalculado: 0,
    archived: false,
    ...record,
    type: FINANCE_RECORD_TYPES.CONTROLE_HORAS
  });
}

function normalizeSalarioHistoricoRecord(record = {}) {
  return applyKnownSchema({
    amount: record.salary_base ?? record.amount ?? 0,
    salary_base: record.salary_base ?? record.amount ?? 0,
    ...record,
    type: FINANCE_RECORD_TYPES.SALARIO_HISTORICO
  });
}

function normalizePercentageRuleRecord(record = {}) {
  return applyKnownSchema({
    percentage: 0,
    active: true,
    ...record,
    type: FINANCE_RECORD_TYPES.PERCENTAGE_RULE
  });
}

export function normalizeFinanceRecord(record = {}, options = {}) {
  const { strict = false } = options;
  const validation = validateFinanceRecordShape(record);
  if (strict && !validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  if (!isKnownFinanceRecordType(record?.type)) {
    return { ...record };
  }

  if (record.type === FINANCE_RECORD_TYPES.SAIDA) return normalizeSaidaRecord(record);
  if (record.type === FINANCE_RECORD_TYPES.ENTRADA) return normalizeEntradaRecord(record);
  if (record.type === FINANCE_RECORD_TYPES.PESSOA) return normalizePessoaRecord(record);
  if (record.type === FINANCE_RECORD_TYPES.CATEGORIA) return normalizeCategoriaRecord(record);
  if (record.type === FINANCE_RECORD_TYPES.MACRO) return normalizeMacroRecord(record);
  if (record.type === FINANCE_RECORD_TYPES.CONTROLE_HORAS) return normalizeControleHorasRecord(record);
  if (record.type === FINANCE_RECORD_TYPES.SALARIO_HISTORICO) return normalizeSalarioHistoricoRecord(record);
  if (record.type === FINANCE_RECORD_TYPES.PERCENTAGE_RULE) return normalizePercentageRuleRecord(record);

  return applyKnownSchema(record);
}

export function normalizeFinanceRecords(records = [], options = {}) {
  return Array.isArray(records)
    ? records.map((record) => normalizeFinanceRecord(record, options))
    : [];
}
