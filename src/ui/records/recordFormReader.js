function byId(doc, id) {
  return doc?.getElementById?.(id) || null;
}

function valueOf(doc, id) {
  return byId(doc, id)?.value || '';
}

function checkedOf(doc, id) {
  return Boolean(byId(doc, id)?.checked);
}

export function readEntradaFormValues(doc = document, options = {}) {
  const {
    formCycle = '',
    getHourExtraRecordDefaults = () => ({}),
    findOvertimeTypeById = () => null,
    formatHoursDecimal = (value) => `${value}h`,
    roundCurrency = (value) => Math.round((Number(value) || 0) * 100) / 100
  } = options;

  const earningType = valueOf(doc, 'form-earning-type');
  const isHourExtra = earningType === 'Hora Extra';
  let amount = Number.parseFloat(valueOf(doc, 'form-earning-amount'));
  let hourExtraSnapshot = getHourExtraRecordDefaults();
  const hourExtraInput = {
    selectedType: null,
    horaInicial: '',
    horaFinal: '',
    quantidadeHoras: 0,
    quantidadeHorasFormatada: '',
    valorBaseHora: 0
  };

  if (isHourExtra) {
    hourExtraInput.selectedType = findOvertimeTypeById(valueOf(doc, 'form-he-type'));
    hourExtraInput.horaInicial = valueOf(doc, 'form-he-start-time');
    hourExtraInput.horaFinal = valueOf(doc, 'form-he-end-time');
    hourExtraInput.quantidadeHoras = Number(valueOf(doc, 'form-he-hours'));
    hourExtraInput.quantidadeHorasFormatada = valueOf(doc, 'form-he-hours-formatted') ||
      (hourExtraInput.quantidadeHoras ? formatHoursDecimal(hourExtraInput.quantidadeHoras) : '');
    hourExtraInput.valorBaseHora = Number(valueOf(doc, 'form-he-base-hour'));
    const salaryBaseReference = Number(valueOf(doc, 'form-he-base-salary')) || 0;
    const monthlyHoursReference = Number(valueOf(doc, 'form-he-monthly-hours')) || 220;
    const percentualUsado = Number(hourExtraInput.selectedType?.percentage) || 0;
    const valorHoraCalculado = roundCurrency(hourExtraInput.valorBaseHora * percentualUsado);
    const valorTotalCalculado = roundCurrency(hourExtraInput.quantidadeHoras * valorHoraCalculado);

    hourExtraSnapshot = {
      nomeTipo: hourExtraInput.selectedType?.name || '',
      percentualUsado,
      valorHoraCalculado,
      valorTotalCalculado,
      quantidadeHoras: hourExtraInput.quantidadeHoras,
      quantidadeHorasFormatada: hourExtraInput.quantidadeHorasFormatada,
      valorBaseHora: hourExtraInput.valorBaseHora,
      salary_base_reference: salaryBaseReference,
      monthly_hours_reference: monthlyHoursReference,
      tipoFinanceiroUsado: Boolean(hourExtraInput.selectedType?.financialType),
      horaInicial: hourExtraInput.horaInicial,
      horaFinal: hourExtraInput.horaFinal
    };

    amount = hourExtraInput.selectedType?.financialType ? valorTotalCalculado : 0;
  }

  return {
    formCycle,
    earningType,
    isHourExtra,
    amount,
    hourExtraSnapshot,
    hourExtraInput,
    payloadInput: {
      person: valueOf(doc, 'form-person'),
      earningType,
      amount,
      competence: valueOf(doc, 'form-earning-comp'),
      cycle: formCycle,
      description: valueOf(doc, 'form-earning-desc'),
      hourExtraSnapshot
    }
  };
}

export function readSaidaFormValues(doc = document, options = {}) {
  const {
    formCycle = '',
    getHourExtraRecordDefaults = () => ({}),
    today = new Date().toISOString().slice(0, 10)
  } = options;

  const amount = Number.parseFloat(valueOf(doc, 'form-amount'));
  const status = valueOf(doc, 'form-status');
  const selectedMacro = valueOf(doc, 'form-macro');
  const selectedCategory = String(valueOf(doc, 'form-category') || '').trim();
  const recurrence = valueOf(doc, 'form-recurrence');
  const dueDate = valueOf(doc, 'form-due');

  return {
    amount,
    status,
    selectedMacro,
    selectedCategory,
    isInstallment: checkedOf(doc, 'form-installment-check'),
    recurrence,
    installments: Number.parseInt(valueOf(doc, 'form-installments'), 10) || 2,
    totalAmount: Number.parseFloat(valueOf(doc, 'form-total-amount')) || (amount * (Number.parseInt(valueOf(doc, 'form-installments'), 10) || 2)),
    baseDueDate: dueDate || today,
    payloadInput: {
      person: valueOf(doc, 'form-person'),
      macro: selectedMacro,
      subcategory: selectedCategory,
      description: valueOf(doc, 'form-desc') || '',
      amount,
      status,
      paymentMethod: valueOf(doc, 'form-payment') || '',
      occurredDate: valueOf(doc, 'form-occurred') || '',
      dueDate: dueDate || '',
      competence: valueOf(doc, 'form-competence') || '',
      paidAt: valueOf(doc, 'form-paid-at'),
      cycle: formCycle,
      recurrence,
      hourExtraDefaults: getHourExtraRecordDefaults()
    }
  };
}

export function installRecordFormReaderGlobals(target = globalThis) {
  const api = {
    readEntradaFormValues: (doc = target.document, options = {}) => readEntradaFormValues(doc, options),
    readSaidaFormValues: (doc = target.document, options = {}) => readSaidaFormValues(doc, options)
  };
  target.financeRecordFormReader = api;
  return api;
}
