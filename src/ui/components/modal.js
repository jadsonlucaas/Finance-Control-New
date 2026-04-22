import { createElement } from '../dom/createElement.js';

export function ensureModalShell({
  id,
  titleId = '',
  subtitleId = '',
  rootClassName = 'hidden fixed inset-0 bg-black/60 flex items-center justify-center z-[300] p-4',
  panelClassName = 'bg-surface rounded-xl border border-surfaceLight max-w-4xl w-full max-h-[90vh] overflow-y-auto p-5',
  title = '',
  subtitle = '',
  closeAction = '',
  closeButtonId = '',
  summaryId = '',
  listId = '',
  document = globalThis.document
} = {}) {
  if (!id || !document?.body) return null;
  const existing = document.getElementById(id);
  if (existing) return existing;

  const resolvedTitleId = titleId || `${id}-title`;
  const resolvedSubtitleId = subtitleId || `${id}-subtitle`;
  const panel = createElement('div', {
    document,
    className: panelClassName,
    children: [
      createElement('div', {
        document,
        className: 'flex items-start justify-between gap-3 mb-4',
        children: [
          createElement('div', {
            document,
            children: [
              createElement('h3', { document, className: 'font-semibold', attrs: { id: resolvedTitleId }, text: title }),
              createElement('p', { document, className: 'text-xs text-textSecondary mt-1', attrs: { id: resolvedSubtitleId }, text: subtitle })
            ]
          }),
          createElement('button', {
            document,
            className: 'p-2 rounded-lg hover:bg-surfaceLight text-textSecondary',
            attrs: {
              type: 'button',
              id: closeButtonId || null
            },
            dataset: closeAction ? { closeAction } : {},
            children: [
              createElement('i', { document, className: 'w-4 h-4', attrs: { 'data-lucide': 'x' } })
            ]
          })
        ]
      }),
      summaryId
        ? createElement('div', {
            document,
            className: 'grid grid-cols-1 md:grid-cols-3 gap-3 mb-4',
            attrs: { id: summaryId }
          })
        : null,
      listId
        ? createElement('div', {
            document,
            className: 'space-y-2',
            attrs: { id: listId }
          })
        : null
    ]
  });

  const modal = createElement('div', {
    document,
    className: rootClassName,
    attrs: { id },
    children: [panel]
  });

  document.body.appendChild(modal);
  return modal;
}

export function installModalGlobals(target = globalThis) {
  target.financeUiComponents ||= {};
  target.financeUiComponents.ensureModalShell = (options = {}) => ensureModalShell({ document: target.document, ...options });
  return target.financeUiComponents;
}
