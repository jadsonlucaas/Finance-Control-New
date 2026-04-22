function renderConfiguracoes() {
            renderImportReport();
            renderEntradasImportReport();
            renderCategorias();
            renderOvertimeTypesSettings();
            const pessoas = allRecords.filter((r) => r.type === 'pessoa');
            const pessoasList = document.getElementById('pessoas-list');
            const pessoasEmpty = document.getElementById('pessoas-empty');

            if (!pessoas.length) {
                window.financeUI.setHtml('pessoas-list', '');
                window.financeUI.setHidden('pessoas-empty', false);
            } else {
                window.financeUI.setHidden('pessoas-empty', true);
                window.financeUI.setHtml('pessoas-list', pessoas.map((p) => {
                    const salary = getSalarioVigente(p.person, thisMonth).salario;
                    const history = getSalaryHistoryRecords(p.person);
                    const currentHistory = history.find((item) => !item.end_date) || history[0];
                    return `<div class="rounded-xl border border-surfaceLight bg-surfaceLight/30 p-3"><div class="flex items-start justify-between gap-3 flex-wrap"><div><p class="text-sm font-semibold">${escapeHtml(p.person)}</p><p class="text-xl font-bold text-success mt-2">${fmt(salary)}</p><p class="text-xs text-textSecondary mt-1">${currentHistory?.start_date ? `Vigente desde ${currentHistory.start_date}` : 'Sem histórico definido'}</p></div><div class="flex gap-2 flex-wrap"><button type="button" data-open-salary-history-id="${p.id}" data-open-salary-history-person="${escapeHtml(p.person)}" class="px-3 py-1.5 text-xs rounded-lg bg-surfaceLight text-textSecondary hover:text-textPrimary">Ver histórico</button><button type="button" data-open-salary-history-id="${p.id}" data-open-salary-history-person="${escapeHtml(p.person)}" class="px-3 py-1.5 text-xs rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white">Adicionar novo salário</button><button type="button" data-delete-person-id="${p.id}" class="text-textSecondary hover:text-danger p-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div></div></div>`;
                }).join(''));
            }

            const macros = allRecords.filter(r => r.type === 'macro');
            const macroList = document.getElementById('macro-list');
            const macroEmpty = document.getElementById('macro-empty');
            if (!macros.length) {
                window.financeUI.setHtml('macro-list', '');
                window.financeUI.setHidden('macro-empty', false);
            } else {
                window.financeUI.setHidden('macro-empty', true);
                window.financeUI.setHtml('macro-list', macros.map((m) => `<div class="flex items-center justify-between bg-surfaceLight/50 rounded-lg p-2.5"><span class="text-sm">${m.macro_category}</span><button type="button" data-delete-macro-id="${m.id}" class="text-textSecondary hover:text-danger p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`).join(''));
            }
            lucide.createIcons();
        }

        function switchTab(tab, options = {}) {
            const { fromHistory = false } = options;
            if (!fromHistory && currentTab && currentTab !== tab) tabHistory.push(currentTab);
            currentTab = tab;
            window.financeUI.activateTab(tab);
            updateBackButton();
            renderCurrentTab();
            if (isSidebarOpen) toggleSidebar();
        }

        function renderCurrentTab() {
            if (currentTab === 'dashboard') renderDashboard();
            if (currentTab === 'mes-detalhe') renderMonthlyDetailTab();
            if (currentTab === 'saidas') renderSaidas();
            if (currentTab === 'entradas') renderEntradas();
            if (currentTab === 'controle-horas') renderControleHoras();
            if (currentTab === 'configuracoes') renderConfiguracoes();
        }

        function addPerson() {
            document.getElementById('person-input').value = '';
            document.getElementById('person-base-salary').value = '';
            document.getElementById('person-salary-start').value = today;
            document.getElementById('person-salary-note').value = '';
            document.getElementById('add-person-modal').classList.remove('hidden');
            document.getElementById('person-input').focus();
        }

        async function savePerson() {
            const name = document.getElementById('person-input').value.trim();
            const salaryBase = Number(document.getElementById('person-base-salary').value) || 0;
            const salaryStart = document.getElementById('person-salary-start').value || today;
            const note = document.getElementById('person-salary-note').value || '';
            if (!name) { showToast('Informe um nome', true); return; }
            if (countRecordsByType('pessoa') >= MAX_PEOPLE_RECORDS) { showToast(`Limite de ${MAX_PEOPLE_RECORDS} pessoas atingido!`, true); return; }

            const personResult = await window.dataSdk.create({
                type: 'pessoa', person: name, macro_category: '', subcategory: '', description: '', amount: 0, status: '', payment_method: '', occurred_date: '', due_date: '', competence: '', paid_at: '', installment_no: 0, total_installments: 0, parent_id: '', earning_type: '', recurrence: '', created_at: new Date().toISOString(), category_id: '', category_name: '', category_color: '', category_icon: '', salary_base: roundCurrency(salaryBase), ...getHourExtraRecordDefaults()
            });

            if (!personResult.isOk) { showToast('Erro ao adicionar', true); return; }
            if (salaryBase > 0) {
                await window.dataSdk.create({ type: 'salario_historico', person: name, salary_base: roundCurrency(salaryBase), start_date: salaryStart, end_date: '', observation: note, created_at: new Date().toISOString() });
            }
            showToast('Pessoa adicionada!');
            closeAddPersonModal();
        }

        const originalRenderAll = renderAll;
        renderAll = function () {
            originalRenderAll();
            const competenciaField = document.getElementById('controle-horas-competencia');
            if (competenciaField && !competenciaField.value) competenciaField.value = thisMonth;
        };
