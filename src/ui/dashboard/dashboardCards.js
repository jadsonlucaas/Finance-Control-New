import { roundCurrency } from '../../core/money.js';
import { appState } from '../../state/appState.js';
import { createActionButton } from '../components/actionButton.js';
import { createMetricCard } from '../components/metricCard.js';
import { ensureModalShell } from '../components/modal.js';
import { createElement } from '../dom/createElement.js';
import { renderRecordRowsProgressively } from '../components/recordRow.js';
import { scheduleIconRender } from '../icons.js';
import {
  getDashboardAggregations,
  getDashboardBaseSaidas,
  getDashboardTotals
} from './dashboardData.js';

function createDashboardSummaryCard({ key, label, value, detail, valueClassName, activeClassName }) {
  const card = createElement('div', {
    className: `glass rounded-xl p-3 card-hover transition-colors ${appState.focusedDashboardCard === key ? activeClassName : 'border-surfaceLight'}`,
    dataset: { dashboardCard: key }
  });
  if (!card) return null;

  card.append(
    createElement('p', { className: 'text-xs text-textSecondary', text: label }),
    createElement('p', { className: `text-lg font-bold ${valueClassName}`, text: value }),
    createActionButton({
      label: detail === 'entradas' || detail === 'saidas-pagas' ? 'Abrir lista' : detail === 'saidas-abertas' ? 'Ver pendencias' : 'Ver detalhes',
      className: `mt-3 text-xs font-semibold hover:underline ${valueClassName}`,
      dataset: { dashboardDetail: detail }
    })
  );

  return card;
}

function renderEmptyMessage(container, message, className = 'text-xs text-textSecondary text-center py-4') {
  container.replaceChildren(createElement('p', { className, text: message }));
}

export function renderDashboardSummaryFromBase(aggregations = getDashboardAggregations()) {
  const {
    totalEntradas,
    totalSaidasPagas,
    totalAberto,
    saldoProjetado
  } = getDashboardTotals();
  const summary = document.getElementById('summary-cards');
  if (!summary) return;
  summary.replaceChildren(
    createDashboardSummaryCard({
      key: 'entradas',
      label: 'Entradas',
      value: window.fmt(totalEntradas),
      detail: 'entradas',
      valueClassName: 'text-success',
      activeClassName: 'border-success shadow-[0_0_15px_rgba(52,211,153,0.3)]'
    }),
    createDashboardSummaryCard({
      key: 'saidas',
      label: 'Saidas pagas',
      value: window.fmt(totalSaidasPagas),
      detail: 'saidas-pagas',
      valueClassName: 'text-danger',
      activeClassName: 'border-danger shadow-[0_0_15px_rgba(244,63,94,0.3)]'
    }),
    createDashboardSummaryCard({
      key: 'aberto',
      label: 'Em aberto',
      value: window.fmt(totalAberto),
      detail: 'saidas-abertas',
      valueClassName: 'text-warn',
      activeClassName: 'border-warn shadow-[0_0_15px_rgba(251,191,36,0.3)]'
    }),
    createDashboardSummaryCard({
      key: 'saldo',
      label: 'Saldo',
      value: window.fmt(saldoProjetado),
      detail: 'saidas-filtro',
      valueClassName: saldoProjetado >= 0 ? 'text-success' : 'text-danger',
      activeClassName: 'border-accent shadow-[0_0_15px_rgba(56,189,248,0.3)]'
    })
  );
}

export function renderDashboardPersonBalanceCards() {
  if (typeof window.__legacyRenderDashboardPersonBalanceCards === 'function') {
    window.__legacyRenderDashboardPersonBalanceCards();
  } else if (typeof window.renderDashboardPersonBalanceCards === 'function' && window.renderDashboardPersonBalanceCards !== renderDashboardPersonBalanceCards) {
    window.renderDashboardPersonBalanceCards();
  }
}

export function renderDashboardRecentListFromBase(aggregations = getDashboardAggregations()) {
  const title = document.getElementById('recent-title');
  const list = document.getElementById('recent-list');
  if (!title || !list) return;
  let records = aggregations.base;
  let label = 'Saidas no filtro atual';
  if (appState.focusedDashboardCard === 'aberto') {
    records = records.filter((record) => record.status === 'Em aberto');
    label = 'Saidas em aberto no filtro atual';
  } else if (appState.focusedDashboardCard === 'saidas') {
    records = records.filter((record) => record.status === 'Pago');
    label = 'Saidas pagas no filtro atual';
  }
  title.textContent = label;
  const sorted = window.sortRecordsNewestFirst(records).slice(0, appState.focusedDashboardCard ? 50 : 10);
  if (sorted.length) {
    renderRecordRowsProgressively(list, sorted, {
      fmt: window.fmt,
      formatCompetence: window.formatCompetence,
      isArchivedRecord: window.isArchivedRecord,
      isReferenceSalaryRecord: window.isReferenceSalaryRecord,
      initialCount: 12,
      chunkSize: 24,
      onProgress: () => scheduleIconRender(list, window.lucide),
      onComplete: () => scheduleIconRender(list, window.lucide)
    });
  } else {
    renderEmptyMessage(list, 'Sem saidas correspondentes');
  }
  const clear = document.getElementById('btn-clear-card');
  if (clear) clear.classList.toggle('hidden', !appState.focusedDashboardCard);
}

export function ensureDashboardExpenseCategoryModal() {
  const modal = ensureModalShell({
    id: 'dashboard-expense-category-modal',
    titleId: 'dashboard-expense-category-title',
    subtitleId: 'dashboard-expense-category-subtitle',
    rootClassName: 'hidden fixed inset-0 bg-black/60 flex items-center justify-center z-[300] p-4 dashboard-detail-modal',
    panelClassName: 'dashboard-detail-modal-panel bg-surface rounded-xl p-5 border border-surfaceLight max-w-4xl mx-4 w-full max-h-[90vh] overflow-y-auto',
    title: 'Despesas',
    closeButtonId: 'btn-close-expense-modal',
    summaryId: 'dashboard-expense-category-summary',
    listId: 'dashboard-expense-category-list'
  });
  if (!modal) return;

  document.getElementById('btn-close-expense-modal')?.addEventListener('click', () => {
    window.closeDashboardExpenseCategoryModal?.();
  });
}

export function closeDashboardExpenseCategoryModal() {
  document.getElementById('dashboard-expense-category-modal')?.classList.add('hidden');
}

export function openDashboardSaidasDetail(title, records = []) {
  ensureDashboardExpenseCategoryModal();
  const modal = document.getElementById('dashboard-expense-category-modal');
  const titleEl = document.getElementById('dashboard-expense-category-title');
  const subtitleEl = document.getElementById('dashboard-expense-category-subtitle');
  const summaryEl = document.getElementById('dashboard-expense-category-summary');
  const listEl = document.getElementById('dashboard-expense-category-list');
  if (!modal || !titleEl || !subtitleEl || !summaryEl || !listEl) return;
  window.setDashboardDetailContext?.(title, records);

  const sorted = window.sortRecordsNewestFirst(records);
  const total = roundCurrency(sorted.reduce((sum, record) => sum + (Number(record.amount) || 0), 0));
  const paidCount = sorted.filter((record) => record.status === 'Pago').length;
  const openCount = sorted.filter((record) => record.status === 'Em aberto').length;

  titleEl.textContent = title;
  subtitleEl.textContent = `${sorted.length} saida(s) no filtro atual`;
  summaryEl.replaceChildren(
    createMetricCard({ label: 'Total', value: window.fmt(total), valueClassName: 'text-lg font-semibold text-danger mt-1' }),
    createMetricCard({ label: 'Pagas', value: String(paidCount), valueClassName: 'text-lg font-semibold text-success mt-1' }),
    createMetricCard({ label: 'Em aberto', value: String(openCount), valueClassName: 'text-lg font-semibold text-warn mt-1' })
  );
  if (sorted.length) {
    renderRecordRowsProgressively(listEl, sorted, {
      fmt: window.fmt,
      formatCompetence: window.formatCompetence,
      isArchivedRecord: window.isArchivedRecord,
      isReferenceSalaryRecord: window.isReferenceSalaryRecord,
      initialCount: 20,
      chunkSize: 40,
      onProgress: () => scheduleIconRender(listEl, window.lucide),
      onComplete: () => scheduleIconRender(listEl, window.lucide)
    });
  } else {
    renderEmptyMessage(listEl, 'Nenhuma saida encontrada para esse filtro.', 'text-sm text-textSecondary text-center py-6');
  }
  modal.classList.remove('hidden');
  scheduleIconRender(modal, window.lucide);
}

export function openDashboardExpenseRecordsModal(title = 'Detalhes', subtitle = '', records = []) {
  openDashboardSaidasDetail(title, records);
  const subtitleEl = document.getElementById('dashboard-expense-category-subtitle');
  if (subtitleEl && subtitle) subtitleEl.textContent = subtitle;
}

export function openDashboardExpenseCategoryModal(mode = 'subcategory', label = '') {
  const aggregations = getDashboardAggregations();
  const map = mode === 'person'
    ? aggregations.registrosPorPessoa
    : mode === 'macro'
      ? aggregations.registrosPorCategoria
      : aggregations.registrosPorSubcategoria;
  const title = mode === 'person'
    ? `Pessoa: ${label}`
    : mode === 'macro'
      ? `Categoria: ${label}`
      : `Subcategoria: ${label}`;
  openDashboardSaidasDetail(title, map[String(label || '').trim()] || []);
}

export function openDashboardSummaryDetail(kind) {
  if (kind === 'entradas') {
    window.openDashboardDetail?.('entradas');
    return;
  }
  if (kind === 'saidas-pagas') {
    openDashboardSaidasDetail('Saidas pagas', getDashboardBaseSaidas().filter((record) => record.status === 'Pago'));
    return;
  }
  if (kind === 'saidas-abertas') {
    openDashboardSaidasDetail('Saidas em aberto', getDashboardBaseSaidas().filter((record) => record.status === 'Em aberto'));
    return;
  }
  openDashboardSaidasDetail('Saidas do filtro', getDashboardBaseSaidas());
}

export function installDashboardCardGlobals(target = window) {
  Object.assign(target, {
    renderDashboardSummaryFromBase,
    renderDashboardPersonBalanceCards,
    renderDashboardRecentListFromBase,
    openDashboardSaidasDetail,
    openDashboardExpenseRecordsModal,
    openDashboardExpenseCategoryModal,
    ensureDashboardExpenseCategoryModal,
    closeDashboardExpenseCategoryModal
  });
}
