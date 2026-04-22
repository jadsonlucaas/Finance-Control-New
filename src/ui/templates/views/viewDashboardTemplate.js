export function viewDashboardTemplate() {
  return `
<!-- DASHBOARD -->
            <section id="view-dashboard" class="fade-in">
                <div class="glass rounded-2xl p-4 mb-4">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                            <p class="text-xs uppercase tracking-[0.18em] text-textSecondary">Visão Estratégica</p>
                            <h2 class="text-xl font-bold text-textPrimary">Seu desempenho financeiro</h2>
                            <p class="text-sm text-textSecondary mt-1">Acompanhe seus resultados em tempo real e refine a análise quando necessário.</p>
                        </div>
                        <div class="flex gap-2 flex-wrap">
                            <button type="button" id="btn-planner" class="text-xs bg-surfaceLight hover:bg-surfaceLight/80 px-3 py-2 rounded-lg text-textSecondary hover:text-textPrimary flex items-center gap-1 transition-colors font-medium">
                                <i data-lucide="calendar-days" class="w-4 h-4"></i> Planner
                            </button>
                            <button type="button" id="btn-advanced-filters" class="text-xs bg-surfaceLight hover:bg-surfaceLight/80 px-3 py-2 rounded-lg text-textSecondary hover:text-textPrimary flex items-center gap-1 transition-colors font-medium">
                                <i data-lucide="sliders-horizontal" class="w-4 h-4"></i> Filtros avançados
                            </button>
                            <button id="btn-clear-dashboard-filters" type="button" class="text-xs bg-accent/10 text-accent hover:bg-accent hover:text-white px-3 py-2 rounded-lg transition-colors font-medium">Limpar filtros</button>
                        </div>
                    </div>
                    <div class="mobile-filter-bar flex flex-wrap gap-2 mt-4 items-center">
                        <div class="mobile-filter-period flex items-center gap-1 bg-surfaceLight/30 rounded-lg px-2 shadow-sm border border-surfaceLight/50">
                        <button id="btn-dashboard-prev-month" type="button" class="w-8 h-8 rounded-lg flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-surface transition-colors" title="Mês anterior">
                            <i data-lucide="chevron-left" class="w-4 h-4"></i>
                        </button>
                        <span class="text-xs text-textSecondary font-medium">De</span>
                        <input type="month" id="f-comp-start" class="text-sm bg-transparent border-0 ring-0 focus:ring-0 text-textPrimary py-1.5 w-[110px] cursor-pointer">
                        <span class="text-xs text-textSecondary font-medium">Até</span>
                        <input type="month" id="f-comp-end" class="text-sm bg-transparent border-0 ring-0 focus:ring-0 text-textPrimary py-1.5 w-[110px] cursor-pointer">
                        <button id="btn-dashboard-next-month" type="button" class="w-8 h-8 rounded-lg flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-surface transition-colors" title="Próximo mês">
                            <i data-lucide="chevron-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                        <div id="dashboard-active-filters" class="flex flex-wrap gap-2"></div>
                    </div>
                    <div id="advanced-filters-panel" class="hidden mt-4 pt-4 border-t border-surfaceLight/70">
                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            <select id="f-person" class="text-sm">
                                <option value="">Todas Pessoas</option>
                            </select>
                            <select id="f-macro" class="text-sm">
                                <option value="">Todas Categorias</option>
                            </select>
                            <select id="f-cycle" class="text-sm">
                                <option value="">Todos Ciclos</option>
                                <option value="INICIO_MES">Início do mês</option>
                                <option value="QUINZENA">Quinzena</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="mobile-summary-grid grid grid-cols-2 md:grid-cols-4 gap-3 mb-4" id="summary-cards"></div>
                <div class="glass rounded-xl p-4 mb-4">
                    <div class="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <h3 class="text-sm font-semibold text-textSecondary">Saldo por Pessoa no Período Filtrado</h3>
                            <p id="person-balance-meta" class="text-xs text-textSecondary mt-1"></p>
                        </div>
                    </div>
                    <div id="person-balance-cards" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"></div>
                </div>
                <div id="dashboard-chart-grid" class="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
                    <div class="glass rounded-xl p-4 cursor-pointer hover:border-accent/40 transition-colors" title="Clique no gráfico para filtrar">
                        <h3 class="text-sm font-semibold text-textSecondary mb-4">Distribuição por Categoria</h3>
                        <div class="chart-container">
                            <canvas id="chart-category"></canvas>
                        </div>
                    </div>
                    <div class="glass rounded-xl p-4" title="Distribuição detalhada por subcategoria">
                        <h3 class="text-sm font-semibold text-textSecondary mb-4">Detalhe por Subcategoria</h3>
                        <div class="chart-container">
                            <canvas id="chart-category-detail"></canvas>
                        </div>
                    </div>
                    <div class="glass rounded-xl p-4 cursor-pointer hover:border-accent/40 transition-colors" title="Clique no gráfico para filtrar">
                        <h3 class="text-sm font-semibold text-textSecondary mb-4">Gastos por Pessoa</h3>
                        <div class="chart-container">
                            <canvas id="chart-person"></canvas>
                        </div>
                    </div>
                </div>
                <div class="glass rounded-xl p-4 mb-4">
                    <h3 id="chart-trend-title" class="text-sm font-semibold text-textSecondary mb-4">Fluxo do Mês Atual</h3>
                    <div id="trend-insights" class="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4"></div>
                    <div class="chart-container" style="height: 300px;">
                        <canvas id="chart-trend"></canvas>
                    </div>
                </div>
                <div class="glass rounded-xl p-4" id="recent-container">
                    <div class="flex justify-between items-center mb-3">
                        <h3 id="recent-title" class="text-sm font-semibold text-textSecondary">Lançamentos Recentes</h3>
                        <button id="btn-clear-card" type="button" class="hidden text-xs text-accent hover:text-accentLight hover:underline px-2 py-1">Limpar Seleção</button>
                    </div>
                    <div id="recent-list" class="space-y-2 max-h-[400px] overflow-y-auto pr-1"></div>
                </div>
            </section>`;
}
