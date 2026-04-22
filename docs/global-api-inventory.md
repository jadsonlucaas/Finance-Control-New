# Inventário de API Global

Gerado em: 2026-04-17T23:36:32.488Z

Este documento congela as funções globais e handlers inline conhecidos antes da migração para módulos. A regra de segurança é: qualquer item usado por HTML, template string ou outro script legado deve continuar disponível até que o uso seja migrado para imports explícitos.

## Baseline de Comandos

Executar e atualizar esta seção sempre que uma fase de migração terminar:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run smoke
```

## Globais Críticos

| Nome | Origem atual | Quem usa | Tipo | Pode migrar agora? |
| --- | --- | --- | --- | --- |
| `renderDashboard` | src/legacy/inline/part-03.js:2680 (function declaration) | Chamado por scripts legados e/ou testes; sem handler inline direto encontrado. | renderização / evento | Não agora; migrar com bridge global e smoke test cobrindo. |
| `renderEntradas` | src/legacy/inline/part-03.js:3325 (function declaration) | Chamado por scripts legados e/ou testes; sem handler inline direto encontrado. | renderização / evento | Não agora; migrar com bridge global e smoke test cobrindo. |
| `renderSaidas` | src/legacy/inline/part-03.js:3278 (function declaration) | Chamado por scripts legados e/ou testes; sem handler inline direto encontrado. | renderização / evento | Não agora; migrar com bridge global e smoke test cobrindo. |
| `switchTab` | src/ui/router.js:10 (window assignment) | Chamado por scripts legados e/ou testes; sem handler inline direto encontrado. | renderização / evento | Não agora; migrar com bridge global e smoke test cobrindo. |
| `handleSubmit` | src/legacy/inline/part-03.js:611 (function declaration) | Chamado por scripts legados e/ou testes; sem handler inline direto encontrado. | evento / operação | Não agora; migrar com bridge global e smoke test cobrindo. |
| `consolidarEntradaMensal` | src/legacy/inline/part-03.js:1955 (function declaration) | Chamado por scripts legados e/ou testes; sem handler inline direto encontrado. | cálculo / dados | Não agora; migrar com bridge global e smoke test cobrindo. |
| `calcularINSS` | src/legacy/inline/part-04.js:101 (function declaration) | Chamado por scripts legados e/ou testes; sem handler inline direto encontrado. | cálculo / dados | Não agora; migrar com bridge global e smoke test cobrindo. |
| `calcularIRRF` | src/legacy/inline/part-04.js:114 (function declaration) | Chamado por scripts legados e/ou testes; sem handler inline direto encontrado. | cálculo / dados | Não agora; migrar com bridge global e smoke test cobrindo. |
| `calcularLiquido` | src/legacy/inline/part-04.js:142 (function declaration) | Chamado por scripts legados e/ou testes; sem handler inline direto encontrado. | cálculo / dados | Não agora; migrar com bridge global e smoke test cobrindo. |
| `openEntryDetailModal` | src/legacy/inline/part-03.js:3773 (function declaration) | Chamado por scripts legados e/ou testes; sem handler inline direto encontrado. | renderização / evento | Não agora; migrar com bridge global e smoke test cobrindo. |
| `exportPDF` | src/legacy/inline/part-03.js:4211 (function declaration) | Chamado por scripts legados e/ou testes; sem handler inline direto encontrado. | evento / operação | Não agora; migrar com bridge global e smoke test cobrindo. |

## Handlers e APIs Globais Detectados

| Nome | Origem atual | Quem usa | Tipo | Pode migrar agora? |
| --- | --- | --- | --- | --- |
| `__financeDataVersion` | src/legacy/inline/part-03.js:132 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `__legacyRenderDashboardPersonBalanceCards` | src/ui/dashboard/dashboardCards.js:43 (window assignment) | Sem handler inline direto encontrado. | renderização / evento | Sim, se não for API consumida por outro script legado. |
| `buildPercentageExitRecord` | src/ui/dashboard/dashboardData.js:119 (window assignment) | Sem handler inline direto encontrado. | cálculo / dados | Sim, se não for API consumida por outro script legado. |
| `cancelEditPercentageExitRule` | src/legacy/inline/part-29.js:971 (window assignment) | Sem handler inline direto encontrado. | evento / operação | Sim, se não for API consumida por outro script legado. |
| `dashboardDataLabelPlugin` | src/legacy/inline/part-03.js:2319 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `dedupePercentageExitRecords` | src/ui/dashboard/dashboardData.js:161 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `deleteEntryIncomeSource` | src/legacy/inline/part-29.js:166 (window assignment) | Sem handler inline direto encontrado. | evento / operação | Sim, se não for API consumida por outro script legado. |
| `deletePercentageExitRule` | src/legacy/inline/part-29.js:1038 (window assignment) | Sem handler inline direto encontrado. | evento / operação | Sim, se não for API consumida por outro script legado. |
| `editPercentageExitRule` | src/legacy/inline/part-29.js:975 (window assignment) | Sem handler inline direto encontrado. | evento / operação | Sim, se não for API consumida por outro script legado. |
| `filterOrphanPercentageExitRecords` | src/ui/dashboard/dashboardData.js:158 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `financeApp` | src/app.js:63 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `fmt` | src/ui/dashboard/dashboardCharts.js:193 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `fmtCompactCurrency` | src/ui/dashboard/dashboardCharts.js:197 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `formatCompetence` | src/ui/dashboard/dashboardCharts.js:201 (window assignment) | Sem handler inline direto encontrado. | cálculo / dados | Sim, se não for API consumida por outro script legado. |
| `getPeopleRecords` | src/ui/dashboard/dashboardData.js:202 (window assignment) | Sem handler inline direto encontrado. | cálculo / dados | Sim, se não for API consumida por outro script legado. |
| `getPercentageCycleBaseValue` | src/ui/dashboard/dashboardData.js:84 (window assignment) | Sem handler inline direto encontrado. | cálculo / dados | Sim, se não for API consumida por outro script legado. |
| `getPercentageRuleBaseValue` | src/ui/dashboard/dashboardData.js:81 (window assignment) | Sem handler inline direto encontrado. | cálculo / dados | Sim, se não for API consumida por outro script legado. |
| `getSalarioVigente` | src/ui/dashboard/dashboardData.js:210 (window assignment) | Sem handler inline direto encontrado. | cálculo / dados | Sim, se não for API consumida por outro script legado. |
| `getSyncedPercentageExitRules` | src/legacy/inline/part-29.js:351 (window assignment) | Sem handler inline direto encontrado. | cálculo / dados | Sim, se não for API consumida por outro script legado. |
| `getThemeTextSecondaryColor` | src/ui/dashboard/dashboardCharts.js:47 (window assignment) | Sem handler inline direto encontrado. | cálculo / dados | Sim, se não for API consumida por outro script legado. |
| `goBackTab` | src/ui/router.js:22 (window assignment) | Sem handler inline direto encontrado. | renderização / evento | Sim, se não for API consumida por outro script legado. |
| `hasPersistedPercentageExitRecord` | src/ui/dashboard/dashboardData.js:118 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `isFinancialEntradaRecord` | src/ui/dashboard/dashboardData.js:323 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `openMonthlyDetailTab` | src/ui/dashboard/dashboardCharts.js:219 (window assignment) | Sem handler inline direto encontrado. | renderização / evento | Sim, se não for API consumida por outro script legado. |
| `renderDashboardPersonBalanceCards` | src/ui/dashboard/dashboardCards.js:45 (window assignment) | Sem handler inline direto encontrado. | renderização / evento | Sim, se não for API consumida por outro script legado. |
| `saveEntryDiscountAdjustmentByEntry` | src/legacy/inline/part-11.js:75 (window assignment) | Sem handler inline direto encontrado. | evento / operação | Sim, se não for API consumida por outro script legado. |
| `saveEntryIncomeSource` | src/legacy/inline/part-29.js:145 (window assignment) | Sem handler inline direto encontrado. | evento / operação | Sim, se não for API consumida por outro script legado. |
| `savePercentageExitRule` | src/legacy/inline/part-29.js:998 (window assignment) | Sem handler inline direto encontrado. | evento / operação | Sim, se não for API consumida por outro script legado. |
| `setFocusedCard` | src/ui/dashboard/dashboardEvents.js:36 (window assignment) | Sem handler inline direto encontrado. | renderização / evento | Sim, se não for API consumida por outro script legado. |
| `shiftControleHorasMonthFilter` | src/legacy/inline/part-29.js:252 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `shiftEntradasMonthFilter` | src/legacy/inline/part-29.js:214 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `shiftMonthValue` | src/ui/dashboard/dashboardRenderer.js:39 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `showToast` | src/ui/toast.js:34 (window assignment) | Sem handler inline direto encontrado. | renderização / evento | Sim, se não for API consumida por outro script legado. |
| `sortRecordsNewestFirst` | src/ui/dashboard/dashboardCharts.js:209 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |
| `syncPercentageRuleCategoryOptions` | src/legacy/inline/part-29.js:888 (window assignment) | Sem handler inline direto encontrado. | evento / global | Sim, se não for API consumida por outro script legado. |

## Observações de Migração

- Itens com uso em `onclick`, `onchange` ou `onsubmit` devem continuar em `window` até que o handler seja movido para `src/ui/legacy-events.js` ou módulo equivalente.
- Funções críticas de cálculo devem ser migradas primeiro para `src/domain`/`src/core`, mas expostas por uma bridge global enquanto scripts legados dependerem delas.
- Antes de remover qualquer global, procurar pelo nome em `index.html`, `src/legacy/inline`, `src/ui` e nos testes de smoke.
