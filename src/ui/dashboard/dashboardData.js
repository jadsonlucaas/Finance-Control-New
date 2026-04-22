import {
  buildDashboardExpenseAggregations
} from '../../domain/dashboard.js';
import {
  selectDashboardTotals,
  selectPersonBalances
} from '../../application/selectors/financialSelectors.js';
import { roundCurrency } from '../../core/money.js';
import { normalizeCompetenceKey } from '../../core/dates.js';
import { queryFinanceRecordsForTarget } from '../../state/financeRecordIndex.js';
import {
  getCurrentMonthFallback,
  getDashboardFilterMonthRange,
  getDashboardMonthKeys,
  getDashboardRecordCompetence
} from './dashboardFilters.js';

const dashboardComputationCache = {
  saidas: { key: '', value: null },
  entradas: { key: '', value: null },
  totals: { key: '', value: null },
  entradasSummary: { key: '', value: null },
  personBalances: { key: '', value: null },
  aggregations: { key: '', value: null },
  trendData: { key: '', value: null }
};

function getDashboardDataVersion() {
  return window.__financeDataVersion || 0;
}

function getDashboardPercentageRules() {
  try {
    const rules = typeof window.getSyncedPercentageExitRules === 'function'
      ? window.getSyncedPercentageExitRules()
      : [];
    return Array.isArray(rules) ? rules.filter((rule) =>
      rule &&
      rule.active !== false &&
      Number(rule.percentage || 0) > 0
    ) : [];
  } catch {
    return [];
  }
}

function getDashboardRulesSignature() {
  return getDashboardPercentageRules()
    .map((rule) => [
      rule.id || '',
      rule.person || '',
      rule.macro || '',
      rule.category || '',
      rule.percentage || '',
      rule.base || '',
      rule.cycle || '',
      rule.status || '',
      rule.active !== false ? '1' : '0',
      rule.startCompetence || ''
    ].join(':'))
    .join('|');
}

function getDashboardSettingsSignature() {
  return [
    localStorage.getItem('finance-control-tax-settings-v1') || '',
    localStorage.getItem('finance-control-overtime-types-v1') || '',
    localStorage.getItem('finance-control-custom-holidays-v1') || '',
    localStorage.getItem('finance-control-planner-events-v1') || ''
  ].join('|');
}

function setDashboardCache(bucket, key, factory) {
  const entry = dashboardComputationCache[bucket];
  if (entry && entry.key === key && entry.value) return entry.value;
  const value = factory();
  if (entry) {
    entry.key = key;
    entry.value = value;
  }
  return value;
}

function getDashboardPercentageBaseAmount(consolidated = {}, base = 'liquido', cycle = 'INICIO_MES', rule = null) {
  if (rule && typeof window.getPercentageRuleBaseValue === 'function') {
    return window.getPercentageRuleBaseValue(consolidated, rule);
  }
  if (typeof window.getPercentageCycleBaseValue === 'function') {
    return window.getPercentageCycleBaseValue(consolidated, base, cycle);
  }
  if (base === 'base_total') return Number(consolidated.baseTotal || 0);
  if (base === 'extra') {
    return cycle === 'QUINZENA'
      ? 0
      : roundCurrency((Number(consolidated.hourExtra || 0)) + (Number(consolidated.outrosProventos || 0)));
  }
  if (cycle === 'QUINZENA') return Number(consolidated.adiantamentoQuinzena || 0);
  if (base === 'bruta') return Number(consolidated.baseTotal || 0);
  if (base === 'salario') return Number(consolidated.salaryBase || consolidated.salarioBase || 0);
  return Number(consolidated.liquido || consolidated.liquidoFinal || 0);
}

function getDashboardGeneratedPercentageSaidas(start = '', end = '') {
  if (typeof window.consolidarEntradaMensal !== 'function' || typeof window.getPeopleRecords !== 'function') return [];

  const months = getDashboardMonthKeys(start, end);
  const people = window.getPeopleRecords();
  const records = [];

  getDashboardPercentageRules().forEach((rule) => {
    const ruleStart = normalizeCompetenceKey(rule.startCompetence || getCurrentMonthFallback()) || getCurrentMonthFallback();
    const targetPeople = rule.person
      ? people.filter((personRecord) => personRecord.person === rule.person)
      : people;

    targetPeople.forEach((personRecord) => {
      const personName = personRecord.person || '';
      if (!personName) return;

      months.forEach((competence) => {
        if (ruleStart && competence < ruleStart) return;
        if (typeof window.hasPersistedPercentageExitRecord === 'function' && window.hasPersistedPercentageExitRecord(rule, personName, competence)) return;
        if (typeof window.buildPercentageExitRecord === 'function') {
          const record = window.buildPercentageExitRecord(rule, personName, competence, { virtual: true });
          if (record) records.push(record);
          return;
        }

        const consolidated = window.consolidarEntradaMensal(personName, competence);
        const baseAmount = getDashboardPercentageBaseAmount(consolidated, rule.base, rule.cycle, rule);
        const amount = roundCurrency(baseAmount * ((Number(rule.percentage) || 0) / 100));
        if (amount > 0) records.push({ ...rule, type: 'saida', person: personName, competence, amount, virtual: true });
      });
    });
  });

  return records;
}

export function getDashboardBaseSaidas() {
  const { start, end } = getDashboardFilterMonthRange();
  const person = document.getElementById('f-person')?.value || '';
  const macro = document.getElementById('f-macro')?.value || '';
  const cycle = document.getElementById('f-cycle')?.value || '';
  const cacheKey = JSON.stringify({
    v: getDashboardDataVersion(),
    start,
    end,
    person,
    macro,
    cycle,
    rules: getDashboardRulesSignature(),
    settings: getDashboardSettingsSignature()
  });

  return setDashboardCache('saidas', cacheKey, () => {
    const baseSaidas = [
      ...queryFinanceRecordsForTarget({ type: 'saida' }, window),
      ...getDashboardGeneratedPercentageSaidas(start, end)
    ];

    const visibleSaidas = typeof window.filterOrphanPercentageExitRecords === 'function'
      ? window.filterOrphanPercentageExitRecords(baseSaidas)
      : baseSaidas;
    const dedupedSaidas = typeof window.dedupePercentageExitRecords === 'function'
      ? window.dedupePercentageExitRecords(visibleSaidas)
      : visibleSaidas;

    return dedupedSaidas.filter((record) => {
      if (record.type !== 'saida') return false;
      if (record.archived === true) return false;
      if (record.status === 'Cancelado') return false;

      const competence = getDashboardRecordCompetence(record);
      if (!competence) return false;
      if (start && competence < start) return false;
      if (end && competence > end) return false;
      if (person && record.person !== person) return false;
      if (macro && record.macro_category !== macro) return false;
      if (cycle && record.cycle !== cycle) return false;
      return true;
    });
  });
}

export function getDashboardBaseEntradas() {
  const { start, end } = getDashboardFilterMonthRange();
  const person = document.getElementById('f-person')?.value || '';
  const cycle = document.getElementById('f-cycle')?.value || '';

  if (typeof window.consolidarEntradaMensal !== 'function' || typeof window.mapEntradaToCycleView !== 'function') {
    return [];
  }

  const months = getDashboardMonthKeys(start, end);
  const cacheKey = JSON.stringify({
    v: getDashboardDataVersion(),
    start,
    end,
    person,
    cycle,
    months: months.join('|'),
    settings: getDashboardSettingsSignature()
  });

  return setDashboardCache('entradas', cacheKey, () => {
    const keys = new Set();
    const people = typeof window.getPeopleRecords === 'function'
      ? window.getPeopleRecords()
      : queryFinanceRecordsForTarget({ type: 'pessoa' }, window);

    people.forEach((personRecord) => {
      const personName = personRecord.person || '';
      if (!personName || (person && personName !== person)) return;
      months.forEach((competence) => {
        const salaryInfo = typeof window.getSalarioVigente === 'function' ? window.getSalarioVigente(personName, competence) : null;
        const salary = Number(salaryInfo?.salario ?? salaryInfo?.salary_base ?? salaryInfo?.amount ?? 0);
        if (salary > 0) keys.add(`${personName}|${competence}`);
      });
    });

    [
      ...queryFinanceRecordsForTarget({
        type: 'entrada',
        archiveMode: 'active',
        person,
        competenceStart: start,
        competenceEnd: end
      }, window),
      ...queryFinanceRecordsForTarget({
        type: 'controle_horas',
        archiveMode: 'active',
        person,
        competenceStart: start,
        competenceEnd: end
      }, window)
    ].forEach((record) => {
      const personName = record.person || '';
      const competence = normalizeCompetenceKey(record.competence || record.due_date || record.occurred_date || '');
      if (personName && competence) keys.add(`${personName}|${competence}`);
    });

    return [...keys]
      .map((key) => {
        const [personName, competence] = key.split('|');
        return window.consolidarEntradaMensal(personName, competence);
      })
      .filter((entry) => entry && (entry.salaryBase > 0 || entry.hourExtra > 0 || entry.outrosProventos > 0 || entry.outrosDescontos > 0 || entry.inss > 0 || entry.irrf > 0))
      .flatMap((entry) => [
        window.mapEntradaToCycleView(entry, 'INICIO_MES'),
        window.mapEntradaToCycleView(entry, 'QUINZENA')
      ])
      .filter(Boolean)
      .filter((entry) => !cycle || entry.cycle === cycle);
  });
}

export function getDashboardEntradasSummary() {
  const { start, end } = getDashboardFilterMonthRange();
  const person = document.getElementById('f-person')?.value || '';
  const cacheKey = JSON.stringify({
    v: getDashboardDataVersion(),
    start,
    end,
    person,
    settings: getDashboardSettingsSignature()
  });

  return setDashboardCache('entradasSummary', cacheKey, () => getDashboardTotals().entradasSummary);
}

export function getDashboardTotals() {
  const { start, end } = getDashboardFilterMonthRange();
  const person = document.getElementById('f-person')?.value || '';
  const macro = document.getElementById('f-macro')?.value || '';
  const cycle = document.getElementById('f-cycle')?.value || '';
  const cacheKey = JSON.stringify({
    v: getDashboardDataVersion(),
    start,
    end,
    person,
    macro,
    cycle,
    rules: getDashboardRulesSignature(),
    settings: getDashboardSettingsSignature()
  });

  return setDashboardCache('totals', cacheKey, () =>
    selectDashboardTotals({
      baseEntradas: getDashboardBaseEntradas(),
      baseSaidas: getDashboardBaseSaidas()
    })
  );
}

export function getDashboardPersonBalances() {
  const { start, end } = getDashboardFilterMonthRange();
  const person = document.getElementById('f-person')?.value || '';
  const macro = document.getElementById('f-macro')?.value || '';
  const cycle = document.getElementById('f-cycle')?.value || '';
  const cacheKey = JSON.stringify({
    v: getDashboardDataVersion(),
    start,
    end,
    person,
    macro,
    cycle,
    rules: getDashboardRulesSignature(),
    settings: getDashboardSettingsSignature()
  });

  return setDashboardCache('personBalances', cacheKey, () =>
    selectPersonBalances({
      baseEntradas: getDashboardTotals().entradasSummary.baseEntradas,
      baseSaidas: getDashboardBaseSaidas()
    })
  );
}

export function getDashboardAggregations() {
  const { start, end } = getDashboardFilterMonthRange();
  const person = document.getElementById('f-person')?.value || '';
  const macro = document.getElementById('f-macro')?.value || '';
  const cycle = document.getElementById('f-cycle')?.value || '';
  const cacheKey = JSON.stringify({
    v: getDashboardDataVersion(),
    start,
    end,
    person,
    macro,
    cycle,
    rules: getDashboardRulesSignature(),
    settings: getDashboardSettingsSignature()
  });

  return setDashboardCache('aggregations', cacheKey, () =>
    buildDashboardExpenseAggregations(getDashboardBaseSaidas())
  );
}

function getDaysInCompetenceMonth(competence = '') {
  const [year, month] = String(competence || '').split('-').map(Number);
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

function getSaidaTrendDate(record = {}, targetMonth = '') {
  const candidates = [
    record.status === 'Pago' ? record.paid_at : '',
    record.due_date,
    record.occurred_date,
    record.competence ? `${record.competence}-01` : ''
  ].filter(Boolean);

  if (targetMonth) {
    const inTargetMonth = candidates.find((dateValue) => String(dateValue).startsWith(`${targetMonth}-`));
    if (inTargetMonth) return inTargetMonth;
  }

  return candidates[0] || '';
}

function isDashboardFinancialEntrada(record = {}) {
  if (typeof window.isFinancialEntradaRecord === 'function') return window.isFinancialEntradaRecord(record);
  return record?.type === 'entrada' && record?.macro_category !== 'Referência Salarial' && record?.macro_category !== 'Referência Salarial';
}

export function buildDashboardDailyExpenseTrend(records = [], month = '') {
  const daysInMonth = getDaysInCompetenceMonth(month);
  const dailyData = {};
  const recordsByDate = {};

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${month}-${String(day).padStart(2, '0')}`;
    dailyData[dateKey] = 0;
    recordsByDate[dateKey] = [];
  }

  records.forEach((record) => {
    if (record.type !== 'saida' || (record.status !== 'Pago' && record.status !== 'Em aberto')) return;
    const trendDate = getSaidaTrendDate(record, month);
    if (dailyData[trendDate] === undefined) return;
    dailyData[trendDate] += Number(record.amount) || 0;
    recordsByDate[trendDate].push(record);
  });

  const detailKeys = Object.keys(dailyData);
  const labels = detailKeys.map((dateKey) => dateKey.slice(-2));
  const values = Object.values(dailyData);
  const activeValues = values.filter((value) => value > 0);
  let peakDayIndex = 0;
  values.forEach((value, index) => {
    if (value > values[peakDayIndex]) peakDayIndex = index;
  });

  const weeklyTotals = Array.from({ length: Math.ceil(daysInMonth / 7) }, (_, weekIndex) => {
    const startIndex = weekIndex * 7;
    const endIndex = Math.min(daysInMonth - 1, startIndex + 6);
    return {
      label: `Sem ${weekIndex + 1}`,
      total: values.slice(startIndex, endIndex + 1).reduce((sum, value) => sum + value, 0)
    };
  });
  const peakWeek = weeklyTotals.reduce((best, item) => item.total > best.total ? item : best, weeklyTotals[0] || { label: 'Sem 1', total: 0 });

  return {
    month,
    labels,
    detailKeys,
    values,
    recordsByDate,
    insights: {
      total: values.reduce((sum, value) => sum + value, 0),
      peakLabel: labels[peakDayIndex] || '-',
      peakValue: values[peakDayIndex] || 0,
      averageActive: activeValues.length ? activeValues.reduce((sum, value) => sum + value, 0) / activeValues.length : 0,
      activeDays: activeValues.length,
      peakWeekLabel: peakWeek.label,
      peakWeekValue: peakWeek.total
    }
  };
}

function getDashboardEntradaTrendValue(record = {}) {
  if (record.type === 'entrada' && isDashboardFinancialEntrada(record)) {
    const value = Number(record.amount) || 0;
    return String(record.macro_category || '').toUpperCase().includes('DEDU') ? -value : value;
  }

  return Number(record.cardLiquido ?? record.liquido ?? record.amount ?? 0) || 0;
}

function normalizeDashboardTrendSources(source = []) {
  if (Array.isArray(source)) {
    return {
      entradas: source.filter((record) => record?.type === 'entrada'),
      saidas: source.filter((record) => record?.type === 'saida')
    };
  }

  return {
    entradas: Array.isArray(source?.entradas) ? source.entradas : [],
    saidas: Array.isArray(source?.saidas) ? source.saidas : []
  };
}

export function buildDashboardMonthlyFinancialTrend(source = [], months = []) {
  const { entradas, saidas } = normalizeDashboardTrendSources(source);
  const monthlyData = Object.fromEntries(months.map((month) => [month, { entrada: 0, saida: 0 }]));

  entradas.forEach((record) => {
    const competence = getDashboardRecordCompetence(record);
    if (monthlyData[competence] === undefined) return;
    monthlyData[competence].entrada = roundCurrency(monthlyData[competence].entrada + getDashboardEntradaTrendValue(record));
  });

  saidas.forEach((record) => {
    const competence = getDashboardRecordCompetence(record);
    if (monthlyData[competence] === undefined) return;
    if (record.type === 'saida' && (record.status === 'Pago' || record.status === 'Em aberto')) {
      monthlyData[competence].saida = roundCurrency(monthlyData[competence].saida + (Number(record.amount) || 0));
    }
  });

  const labels = months.map((month) => typeof window.formatCompetence === 'function' ? window.formatCompetence(month) : month);
  const entradasValues = months.map((month) => roundCurrency(monthlyData[month].entrada));
  const saidasValues = months.map((month) => roundCurrency(monthlyData[month].saida));
  const balance = months.map((month) => roundCurrency(monthlyData[month].entrada - monthlyData[month].saida));
  const average = balance.length ? roundCurrency(balance.reduce((sum, value) => sum + value, 0) / balance.length) : 0;
  let bestIndex = 0;
  let worstIndex = 0;
  balance.forEach((value, index) => {
    if (value > balance[bestIndex]) bestIndex = index;
    if (value < balance[worstIndex]) worstIndex = index;
  });

  return {
    months,
    labels,
    entradas: entradasValues,
    saidas: saidasValues,
    balance,
    insights: {
      average,
      bestLabel: labels[bestIndex] || '-',
      bestValue: balance[bestIndex] || 0,
      worstLabel: labels[worstIndex] || '-',
      worstValue: balance[worstIndex] || 0,
      currentLabel: labels[labels.length - 1] || '-',
      currentValue: balance[balance.length - 1] || 0
    }
  };
}

export function getDashboardTrendData() {
  const { start, end } = getDashboardFilterMonthRange();
  const months = getDashboardMonthKeys(start, end);
  const person = document.getElementById('f-person')?.value || '';
  const macro = document.getElementById('f-macro')?.value || '';
  const cycle = document.getElementById('f-cycle')?.value || '';
  const isSingleMonth = start === end;
  const cacheKey = JSON.stringify({
    v: getDashboardDataVersion(),
    start,
    end,
    person,
    macro,
    cycle,
    months: months.join('|'),
    rules: getDashboardRulesSignature(),
    settings: getDashboardSettingsSignature(),
    mode: isSingleMonth ? 'daily' : 'monthly'
  });

  return setDashboardCache('trendData', cacheKey, () => {
    const baseSaidas = getDashboardBaseSaidas();
    const baseEntradas = getDashboardBaseEntradas();

    if (isSingleMonth) {
      return {
        mode: 'daily',
        start,
        end,
        months,
        daily: buildDashboardDailyExpenseTrend(baseSaidas, start)
      };
    }

    return {
      mode: 'monthly',
      start,
      end,
      months,
      monthly: buildDashboardMonthlyFinancialTrend({ entradas: baseEntradas, saidas: baseSaidas }, months)
    };
  });
}

export function installDashboardDataGlobals(target = window) {
  Object.assign(target, {
    getDashboardBaseSaidas,
    getDashboardBaseEntradas,
    getDashboardTotals,
    getDashboardEntradasSummary,
    getDashboardPersonBalances,
    getDashboardAggregations,
    buildDashboardDailyExpenseTrend,
    buildDashboardMonthlyFinancialTrend,
    getDashboardTrendData
  });
}
