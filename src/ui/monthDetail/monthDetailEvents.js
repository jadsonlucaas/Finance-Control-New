import {
  installMonthDetailRenderer,
  nextMonthlyDetailRenderToken,
  renderMonthlyDetailSkeleton,
  renderMonthlyDetailTab,
  scheduleMonthlyDetailWork,
  setSelectedMonthlyDetailCompetence
} from './monthDetailRenderer.js';

export function openMonthlyDetailTab(competence, target = window) {
  if (!competence) return;
  setSelectedMonthlyDetailCompetence(competence);
  const renderToken = nextMonthlyDetailRenderToken();

  if (typeof target.switchTab === 'function') {
    target.switchTab('mes-detalhe', { skipRender: true });
  } else {
    target.currentTab = 'mes-detalhe';
    target.financeUI?.activateTab?.('mes-detalhe');
  }

  renderMonthlyDetailSkeleton(competence, target);
  scheduleMonthlyDetailWork(() => renderMonthlyDetailTab(renderToken, target), 120, target);
  const mainContent = target.document?.getElementById('main-content');
  if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'auto' });
  if (typeof target.scrollTo === 'function') target.scrollTo({ top: 0, behavior: 'auto' });
  if (target.document?.documentElement) target.document.documentElement.scrollTop = 0;
  if (target.document?.body) target.document.body.scrollTop = 0;
}

export function installMonthDetailEvents(target = window) {
  installMonthDetailRenderer(target);
  target.financeMonthDetail = {
    ...target.financeMonthDetailRenderer,
    openMonthlyDetailTab: (competence) => openMonthlyDetailTab(competence, target)
  };
  target.openMonthlyDetailTab = target.financeMonthDetail.openMonthlyDetailTab;
  target.renderMonthlyDetailTab = target.financeMonthDetail.renderMonthlyDetailTab;
  return target.financeMonthDetail;
}

if (typeof window !== 'undefined') {
  installMonthDetailEvents(window);
}
