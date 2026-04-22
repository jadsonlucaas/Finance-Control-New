(function installLegacyUiBridge(target) {
  const TAB_BUTTON_ACTIVE_CLASS = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-accent/10 text-accent';
  const TAB_BUTTON_IDLE_CLASS = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-textSecondary hover:bg-surfaceLight hover:text-textPrimary';
  const DEFAULT_VIEWS = ['dashboard', 'mes-detalhe', 'saidas', 'entradas', 'controle-horas', 'novo', 'configuracoes'];

  let toastHideTimer = null;
  let sidebarAnimationTimer = null;

  function byId(id) {
    return target.document.getElementById(id);
  }

  function showElement(id) {
    const element = byId(id);
    if (element) element.classList.remove('hidden');
    return element;
  }

  function hideElement(id) {
    const element = byId(id);
    if (element) element.classList.add('hidden');
    return element;
  }

  function showToast(message, isError = false) {
    const toast = byId('toast');
    if (!toast) return;

    if (toastHideTimer) target.clearTimeout(toastHideTimer);
    toast.textContent = String(message || '');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-[100] ${isError ? 'bg-danger text-white' : 'bg-success text-bg'}`;
    toast.classList.remove('hidden');
    toastHideTimer = target.setTimeout(() => {
      toast.classList.add('hidden');
      toastHideTimer = null;
    }, 2500);
  }

  function showOverlay(overlayId) {
    const overlay = byId(overlayId);
    const appRoot = byId('app');
    if (!overlay) return null;
    if (appRoot && overlay.parentElement !== appRoot) appRoot.appendChild(overlay);
    overlay.classList.remove('hidden');
    return overlay;
  }

  function hideOverlay(overlayId) {
    return hideElement(overlayId);
  }

  function setSidebarOpen(isOpen) {
    const overlay = byId('sidebar-overlay');
    const sidebar = byId('sidebar');
    if (!overlay || !sidebar) return Boolean(isOpen);

    if (sidebarAnimationTimer) {
      target.clearTimeout(sidebarAnimationTimer);
      sidebarAnimationTimer = null;
    }

    if (isOpen) {
      overlay.classList.remove('hidden');
      sidebarAnimationTimer = target.setTimeout(() => {
        overlay.classList.remove('opacity-0');
        sidebar.classList.remove('-translate-x-full');
        sidebarAnimationTimer = null;
      }, 10);
    } else {
      overlay.classList.add('opacity-0');
      sidebar.classList.add('-translate-x-full');
      sidebarAnimationTimer = target.setTimeout(() => {
        overlay.classList.add('hidden');
        sidebarAnimationTimer = null;
      }, 300);
    }

    return Boolean(isOpen);
  }

  function toggleSidebar(isCurrentlyOpen) {
    const nextState = !Boolean(isCurrentlyOpen);
    setSidebarOpen(nextState);
    return nextState;
  }

  function updateBackButton(canGoBack) {
    const button = byId('btn-go-back');
    if (button) button.classList.toggle('hidden', !canGoBack);
  }

  function setHidden(id, isHidden) {
    const element = byId(id);
    if (element) element.classList.toggle('hidden', Boolean(isHidden));
    return element;
  }

  function setHtml(id, html) {
    const element = byId(id);
    if (element) element.innerHTML = String(html || '');
    return element;
  }

  function setNodes(id, nodes = []) {
    const element = byId(id);
    if (element) element.replaceChildren(...nodes.filter(Boolean));
    return element;
  }

  function setText(id, text) {
    const element = byId(id);
    if (element) element.textContent = String(text || '');
    return element;
  }

  function renderListState(config = {}) {
    const {
      emptyId,
      hasItems = false,
      html = '',
      listId,
      metaHtml = null,
      metaId,
      metaText = null,
      nodes = null,
      paginationId,
      showPagination = false
    } = config;

    if (Array.isArray(nodes)) setNodes(listId, nodes);
    else setHtml(listId, html);
    setHidden(emptyId, hasItems);
    if (metaHtml !== null) setHtml(metaId, metaHtml);
    if (metaText !== null) setText(metaId, metaText);
    if (paginationId) setHidden(paginationId, !showPagination);
  }

  function renderTotalBox(id, html, isVisible) {
    const element = byId(id);
    if (!element) return null;
    element.classList.toggle('hidden', !isVisible);
    element.innerHTML = isVisible ? String(html || '') : '';
    return element;
  }

  function activateTab(tab, views = DEFAULT_VIEWS) {
    target.document.querySelectorAll('#main-tabs button').forEach((button) => {
      button.className = button.dataset.tab === tab ? TAB_BUTTON_ACTIVE_CLASS : TAB_BUTTON_IDLE_CLASS;
    });

    views.forEach((view) => {
      const element = byId('view-' + view);
      if (element) element.classList.toggle('hidden', view !== tab);
    });
  }

  target.financeUI = {
    activateTab,
    hideElement,
    hideOverlay,
    renderListState,
    renderTotalBox,
    setSidebarOpen,
    setHidden,
    setHtml,
    setNodes,
    setText,
    showElement,
    showOverlay,
    showToast,
    toggleSidebar,
    updateBackButton
  };
})(window);
