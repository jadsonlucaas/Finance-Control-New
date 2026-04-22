function syncHourControlPersonOptions() {
            const select = document.getElementById('hour-person');
            if (!select) return;
            const people = allRecords.filter((record) => record.type === 'pessoa').map((record) => record.person).sort((a, b) => a.localeCompare(b));
            const current = select.value;
            select.innerHTML = people.map((name) => `<option value="${escapeHtml(name)}" ${name === current ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('');
        }

        function openHourControlModal() {
            const modal = document.getElementById('hour-control-modal');
            const appRoot = document.getElementById('app');
            if (modal && appRoot && modal.parentElement?.id === 'view-configuracoes') appRoot.appendChild(modal);
            syncHourControlPersonOptions();
            document.getElementById('hour-control-title').textContent = 'Novo Lançamento de Horas';
            document.getElementById('hour-competence').value = document.getElementById('controle-horas-competencia')?.value || thisMonth;
            document.getElementById('hour-date').value = today;
            document.getElementById('hour-type').value = 'Hora Extra';
            document.getElementById('hour-start').value = '';
            document.getElementById('hour-end').value = '';
            document.getElementById('hour-quantity').value = '';
            document.getElementById('hour-bank-nature').value = 'Débito';
            document.getElementById('hour-percentage').value = '110';
            document.getElementById('hour-note').value = '';
            handleHourControlTypeChange();
            document.getElementById('hour-control-modal').classList.remove('hidden');
            lucide.createIcons();
        }

        function closeHourControlModal() {
            document.getElementById('hour-control-modal').classList.add('hidden');
        }

        function handleHourControlTypeChange() {
            const type = document.getElementById('hour-type')?.value || 'Hora Extra';
            document.getElementById('hour-nature-wrap')?.classList.toggle('hidden', type !== 'Banco de Horas');
            document.getElementById('hour-percentage-wrap')?.classList.toggle('hidden', type !== 'Hora Extra');
            updateHourControlCalculatedFields();
        }

        function updateHourControlCalculatedFields() {
            const person = document.getElementById('hour-person')?.value || '';
            const competence = document.getElementById('hour-competence')?.value || thisMonth;
            const type = document.getElementById('hour-type')?.value || 'Hora Extra';
            const hours = calcularHoras(document.getElementById('hour-start')?.value || '', document.getElementById('hour-end')?.value || '');
            const salary = getSalarioVigente(person, competence).salario;
            document.getElementById('hour-quantity').value = hours ? hours.toFixed(2) : '';
            document.getElementById('hour-salary-base').value = salary ? salary.toFixed(2) : '';
            const preview = document.getElementById('hour-calculation-preview');
            if (!preview) return;

            if (type === 'Banco de Horas') {
                const natureza = document.getElementById('hour-bank-nature')?.value || 'Débito';
                preview.innerHTML = `<div class="bank-metric-card"><p class="text-xs uppercase tracking-[0.16em] text-textSecondary">Banco de Horas</p><p class="kpi-value text-warn mt-2">${hours ? formatHoursDecimal(hours) : '00:00'}</p><p class="text-xs text-textSecondary mt-2">${natureza} ${natureza === 'Débito' ? 'reduz' : 'soma'} no saldo e não gera valor financeiro.</p></div>`;
                return;
            }

            const calc = calcularHoraExtra({ person, competencia: competence, horas: hours, percentual: Number(document.getElementById('hour-percentage')?.value || 0), salaryBase: salary });
            preview.innerHTML = `<div class="time-metric-card"><p class="text-xs uppercase tracking-[0.16em] text-textSecondary">Memória de cálculo da H.E.</p><div class="entry-consolidated-grid mt-3"><div><p class="text-xs text-textSecondary">Horas</p><p class="text-lg font-semibold text-accent">${hours ? formatHoursDecimal(hours) : '00:00'}</p></div><div><p class="text-xs text-textSecondary">Valor hora normal</p><p class="text-lg font-semibold text-textPrimary">${fmt(calc.valorHoraNormal)}</p></div><div><p class="text-xs text-textSecondary">Valor hora extra</p><p class="text-lg font-semibold text-success">${fmt(calc.valorHoraExtra)}</p></div><div><p class="text-xs text-textSecondary">Total</p><p class="text-lg font-semibold text-success">${fmt(calc.total)}</p></div></div></div>`;
        }

        async function saveHourControlRecord() {
            const person = document.getElementById('hour-person').value || '';
            const competence = document.getElementById('hour-competence').value || '';
            const occurredDate = document.getElementById('hour-date').value || '';
            const type = document.getElementById('hour-type').value || 'Hora Extra';
            const startTime = document.getElementById('hour-start').value || '';
            const endTime = document.getElementById('hour-end').value || '';
            const hours = calcularHoras(startTime, endTime);
            const note = document.getElementById('hour-note').value || '';
            if (!person || !competence || !occurredDate) { showToast('Preencha pessoa, competência e data', true); return; }
            if (!hours || hours <= 0) { showToast('Informe um intervalo de horas válido', true); return; }

            const salaryInfo = getSalarioVigente(person, competence);
            const payload = {
                type: 'controle_horas',
                person,
                competence,
                occurred_date: occurredDate,
                start_time: startTime,
                end_time: endTime,
                hours_quantity: hours,
                hours_formatted: formatHoursDecimal(hours),
                hour_entry_type: type,
                observation: note,
                salary_base_snapshot: salaryInfo.salario,
                created_at: new Date().toISOString()
            };

            if (type === 'Hora Extra') {
                const percentual = Number(document.getElementById('hour-percentage').value || 0);
                const calc = calcularHoraExtra({ person, competencia: competence, horas: hours, percentual, salaryBase: salaryInfo.salario });
                Object.assign(payload, { overtime_percentage: percentual, financial_hour_value: calc.valorHoraExtra, financial_total: calc.total, hour_value_base: calc.valorHoraNormal });
            } else {
                Object.assign(payload, { bank_nature: document.getElementById('hour-bank-nature').value || 'Débito', overtime_percentage: 0, financial_hour_value: 0, financial_total: 0, hour_value_base: 0 });
            }

            const result = await window.dataSdk.create(payload);
            if (!result.isOk) { showToast('Erro ao salvar lançamento de horas', true); return; }

            if (type === 'Hora Extra') {
                const entradaPayload = {
                    type: 'entrada',
                    person,
                    macro_category: 'Rendimento',
                    subcategory: 'Hora Extra',
                    description: note || `Hora Extra • ${formatHoursDecimal(hours)}`,
                    amount: roundCurrency(payload.financial_total || 0),
                    status: 'Pago',
                    payment_method: '',
                    occurred_date: occurredDate,
                    due_date: occurredDate,
                    competence,
                    paid_at: occurredDate,
                    installment_no: 0,
                    total_installments: 0,
                    parent_id: '',
                    earning_type: 'Hora Extra',
                    cycle: '',
                    recurrence: '',
                    created_at: new Date().toISOString(),
                    category_id: '',
                    category_name: '',
                    category_color: '',
                    category_icon: '',
                    generated_from_hour_control: true,
                    ...getHourExtraRecordDefaults(),
                    quantidadeHoras: hours,
                    quantidadeHorasFormatada: formatHoursDecimal(hours),
                    percentualUsado: Number(payload.overtime_percentage || 0),
                    valorBaseHora: Number(payload.hour_value_base || 0),
                    valorHoraCalculado: Number(payload.financial_hour_value || 0),
                    valorTotalCalculado: Number(payload.financial_total || 0),
                    salary_base_reference: Number(payload.salary_base_snapshot || 0),
                    horaInicial: startTime,
                    horaFinal: endTime,
                    tipoFinanceiroUsado: true,
                    nomeTipo: 'Hora Extra'
                };
                await window.dataSdk.create(entradaPayload);
            }

            showToast(type === 'Hora Extra' ? 'Hora extra salva!' : 'Banco de horas salvo!');
            closeHourControlModal();
        }

        function getControleHorasRecords() {
            const competenceFilter = document.getElementById('controle-horas-competencia')?.value || '';
            const searchTerm = normalizeListSearchValue(document.getElementById('controle-horas-search')?.value || '');
            return allRecords.filter((record) =>
                record?.type === 'controle_horas' &&
                (!competenceFilter || record.competence === competenceFilter) &&
                (!searchTerm || normalizeListSearchValue(`${record.person} ${record.competence} ${record.observation || ''}`).includes(searchTerm))
            );
        }

        function toggleHourControlDetails(person, competence) {
            const target = document.getElementById(`hour-detail-${slugifySharedId(`${person}-${competence}`)}`);
            if (target) target.classList.toggle('hidden');
        }
