export const FINANCE_RECORD_TYPES = Object.freeze({
  SAIDA: 'saida',
  ENTRADA: 'entrada',
  PESSOA: 'pessoa',
  CATEGORIA: 'categoria',
  MACRO: 'macro',
  CONTROLE_HORAS: 'controle_horas',
  SALARIO_HISTORICO: 'salario_historico',
  PERCENTAGE_RULE: 'percentage_rule'
});

export const KNOWN_FINANCE_RECORD_TYPES = Object.freeze(Object.values(FINANCE_RECORD_TYPES));

export const COMMON_FINANCE_RECORD_FIELDS = Object.freeze({
  id: 'string',
  type: 'string',
  person: 'string',
  macro_category: 'string',
  subcategory: 'string',
  description: 'string',
  amount: 'number',
  status: 'string',
  payment_method: 'string',
  occurred_date: 'dateString',
  due_date: 'dateString',
  competence: 'competence',
  paid_at: 'dateString',
  installment_no: 'integer',
  total_installments: 'integer',
  parent_id: 'string',
  earning_type: 'string',
  recurrence: 'string',
  cycle: 'string',
  created_at: 'string',
  archived: 'boolean',
  archived_at: 'string',
  owner_uid: 'string',
  owner_email: 'string'
});

export const FINANCE_RECORD_SCHEMAS = Object.freeze({
  [FINANCE_RECORD_TYPES.SAIDA]: Object.freeze({
    required: ['type'],
    fields: Object.freeze({
      ...COMMON_FINANCE_RECORD_FIELDS,
      category_id: 'string',
      category_name: 'string',
      category_color: 'string',
      category_icon: 'string',
      generated_percentage_rule: 'boolean',
      percentage_rule_id: 'string',
      percentage_rate: 'number',
      percentage_base: 'string',
      percentage_base_amount: 'number',
      virtual_record: 'boolean',
      import_source: 'string',
      import_signature: 'string',
      import_core_signature: 'string'
    })
  }),
  [FINANCE_RECORD_TYPES.ENTRADA]: Object.freeze({
    required: ['type'],
    fields: Object.freeze({
      ...COMMON_FINANCE_RECORD_FIELDS,
      category_id: 'string',
      category_name: 'string',
      category_color: 'string',
      category_icon: 'string',
      nomeTipo: 'string',
      percentualUsado: 'number',
      valorHoraCalculado: 'number',
      valorTotalCalculado: 'number',
      quantidadeHoras: 'number',
      quantidadeHorasFormatada: 'string',
      valorBaseHora: 'number',
      salary_base_reference: 'number',
      monthly_hours_reference: 'number',
      tipoFinanceiroUsado: 'boolean',
      horaInicial: 'string',
      horaFinal: 'string',
      import_source: 'string',
      import_signature: 'string',
      import_core_signature: 'string'
    })
  }),
  [FINANCE_RECORD_TYPES.PESSOA]: Object.freeze({
    required: ['type', 'person'],
    fields: Object.freeze({
      ...COMMON_FINANCE_RECORD_FIELDS,
      salary_base: 'number'
    })
  }),
  [FINANCE_RECORD_TYPES.CATEGORIA]: Object.freeze({
    required: ['type'],
    fields: Object.freeze({
      ...COMMON_FINANCE_RECORD_FIELDS,
      category_id: 'string',
      category_name: 'string',
      category_color: 'string',
      category_icon: 'string',
      shared_scope: 'string'
    })
  }),
  [FINANCE_RECORD_TYPES.MACRO]: Object.freeze({
    required: ['type', 'macro_category'],
    fields: Object.freeze({
      ...COMMON_FINANCE_RECORD_FIELDS,
      shared_scope: 'string'
    })
  }),
  [FINANCE_RECORD_TYPES.CONTROLE_HORAS]: Object.freeze({
    required: ['type'],
    fields: Object.freeze({
      id: 'string',
      type: 'string',
      person: 'string',
      competence: 'competence',
      occurred_date: 'dateString',
      description: 'string',
      hour_control_type: 'string',
      bank_nature: 'string',
      quantidadeHoras: 'number',
      quantidadeHorasFormatada: 'string',
      percentualUsado: 'number',
      valorBaseHora: 'number',
      valorHoraCalculado: 'number',
      valorTotalCalculado: 'number',
      amount: 'number',
      created_at: 'string',
      archived: 'boolean',
      archived_at: 'string',
      owner_uid: 'string',
      owner_email: 'string'
    })
  }),
  [FINANCE_RECORD_TYPES.SALARIO_HISTORICO]: Object.freeze({
    required: ['type', 'person'],
    fields: Object.freeze({
      id: 'string',
      type: 'string',
      person: 'string',
      salary_base: 'number',
      amount: 'number',
      start_date: 'dateString',
      end_date: 'dateString',
      vigencia_inicio: 'competence',
      vigencia_fim: 'competence',
      competence: 'competence',
      observation: 'string',
      description: 'string',
      created_at: 'string',
      owner_uid: 'string',
      owner_email: 'string'
    })
  }),
  [FINANCE_RECORD_TYPES.PERCENTAGE_RULE]: Object.freeze({
    required: ['type'],
    fields: Object.freeze({
      id: 'string',
      type: 'string',
      name: 'string',
      person: 'string',
      percentage: 'number',
      base: 'string',
      macro: 'string',
      category: 'string',
      cycle: 'string',
      status: 'string',
      startCompetence: 'competence',
      active: 'boolean',
      created_at: 'string',
      updated_at: 'string',
      owner_uid: 'string',
      owner_email: 'string'
    })
  })
});

export function isKnownFinanceRecordType(type = '') {
  return KNOWN_FINANCE_RECORD_TYPES.includes(type);
}

export function getFinanceRecordSchema(type = '') {
  return FINANCE_RECORD_SCHEMAS[type] || null;
}

export function validateFinanceRecordShape(record = {}) {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { isValid: false, errors: ['Registro deve ser um objeto.'] };
  }

  if (!record.type) errors.push('Campo type e obrigatorio.');
  const schema = getFinanceRecordSchema(record.type);
  if (!schema) {
    return {
      isValid: errors.length === 0,
      errors,
      isKnownType: false
    };
  }

  schema.required.forEach((field) => {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      errors.push(`Campo ${field} e obrigatorio para ${record.type}.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    isKnownType: true
  };
}
