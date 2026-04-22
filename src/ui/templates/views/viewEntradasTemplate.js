export function viewEntradasTemplate() {
  return `
<!-- ENTRADAS LIST -->
            <section id="view-entradas" class="fade-in hidden">
                <div class="flex justify-between items-center mb-3 gap-3 flex-wrap">
                    <div>
                        <h2 class="font-semibold">Entradas</h2>
                        <p id="entradas-meta" class="text-xs text-textSecondary mt-1">Visão consolidada mensal por pessoa e competência.</p>
                    </div>
                    <div class="mobile-section-actions flex gap-2 flex-wrap">
                        <input
                            id="entradas-search"
                            type="search"
                            placeholder="Buscar pessoa ou competência"
                            class="text-xs rounded-lg border border-surfaceLight bg-surfaceLight/40 text-textPrimary placeholder:text-textSecondary px-3 py-1.5 min-w-[180px]">
                        <input id="entradas-competence-filter" type="month" class="text-xs rounded-lg min-w-[150px]">
                        <button
                            id="btn-new-entrada"
                            type="button"
                            class="bg-success hover:bg-success/80 text-bg text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"><i
                                data-lucide="plus" class="w-4 h-4"></i> Novo Ajuste</button>
                    </div>
                </div>
                <div id="entradas-list" class="space-y-3"></div>
                <p id="entradas-empty" class="text-textSecondary text-sm text-center py-8 hidden">Nenhuma entrada
                    consolidada encontrada.</p>
            </section>`;
}
