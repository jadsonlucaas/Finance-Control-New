function getHolidayDatesForCompetence(competencia = '') {
            const normalized = normalizeCompetenceKey(competencia || thisMonth);
            const year = Number(String(normalized).slice(0, 4)) || new Date().getFullYear();
            const holidays = new Set();

            if (typeof getCustomHolidayDates === 'function') {
                getCustomHolidayDates().forEach((date) => holidays.add(date));
            }

            try {
                JSON.parse(localStorage.getItem('finance-control-planner-events-v1') || '[]')
                    .filter((event) => event?.type === 'holiday' && String(event.date || '').startsWith(`${year}-`))
                    .forEach((event) => holidays.add(event.date));
            } catch (error) {
                // Planner local pode estar vazio ou corrompido; nesse caso ficam os feriados customizados salvos.
            }

            return Array.from(holidays).filter((date) => normalizeCompetenceKey(date.slice(0, 7)) === normalized);
        }

        function getDSRCalendarFactors(competencia = '') {
            const normalized = normalizeCompetenceKey(competencia || thisMonth);
            const [year, month] = normalized.split('-').map(Number);
            const holidayDates = new Set(getHolidayDatesForCompetence(normalized));
            const lastDay = new Date(year, month, 0).getDate();
            let diasUteis = 0;
            let domingos = 0;
            let feriados = 0;

            for (let day = 1; day <= lastDay; day += 1) {
                const date = new Date(year, month - 1, day);
                const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const weekDay = date.getDay();
                const isHoliday = holidayDates.has(key);

                if (weekDay === 0) {
                    domingos += 1;
                    continue;
                }

                if (isHoliday) {
                    feriados += 1;
                    continue;
                }

                diasUteis += 1;
            }

            return {
                diasUteis,
                domingos,
                feriados,
                diasDescanso: domingos + feriados
            };
        }

        function getPreviousCompetenceKey(competencia = '') {
            const normalized = normalizeCompetenceKey(competencia || thisMonth);
            const [year, month] = normalized.split('-').map(Number);
            if (!year || !month) return normalized;
            const previous = new Date(year, month - 2, 1);
            return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
        }

        function getHoraExtraTotalForDSR(person = '', competencia = '') {
            const normalized = normalizeCompetenceKey(competencia || thisMonth);
            return roundCurrency(allRecords
                .filter((record) =>
                    record.type === 'controle_horas' &&
                    record.person === person &&
                    normalizeCompetenceKey(record.competence) === normalized &&
                    (record.hour_entry_type === 'Hora Extra' || record.hour_control_type === 'Hora Extra')
                )
                .reduce((sum, record) => sum + Number(record.financial_total || record.valorTotalCalculado || 0), 0));
        }

        function calcularDSRHoraExtra({ person = '', competencia = '', totalHoraExtra = null, incluirLancamentoAtual = 0 } = {}) {
            const heTotal = roundCurrency((totalHoraExtra === null ? getHoraExtraTotalForDSR(person, competencia) : Number(totalHoraExtra) || 0) + (Number(incluirLancamentoAtual) || 0));
            const competenciaCalendario = getPreviousCompetenceKey(competencia);
            const fatores = getDSRCalendarFactors(competenciaCalendario);
            const dsr = fatores.diasUteis > 0 ? roundCurrency((heTotal / fatores.diasUteis) * fatores.diasDescanso) : 0;

            return {
                totalHoraExtra: heTotal,
                competenciaCalendario,
                dsr,
                ...fatores
            };
        }

        const _updateHourControlCalculatedFieldsBeforeDSR = updateHourControlCalculatedFields;
        updateHourControlCalculatedFields = function () {
            _updateHourControlCalculatedFieldsBeforeDSR();

            const dsrInput = document.getElementById('hour-dsr-value');
            const dsrInfoEl = document.getElementById('hour-dsr-info');
            if (!dsrInput || !dsrInfoEl) return;

            const person = document.getElementById('hour-person')?.value || '';
            const competence = document.getElementById('hour-competence')?.value || thisMonth;
            const type = document.getElementById('hour-type')?.value || 'Hora Extra';

            if (type !== 'Hora Extra' || !person) {
                dsrInput.value = '';
                dsrInfoEl.textContent = '';
                return;
            }

            const summary = calculateHourWorkSummary({
                date: document.getElementById('hour-date')?.value || '',
                startTime: document.getElementById('hour-start')?.value || '',
                endTime: document.getElementById('hour-end')?.value || '',
                breakStart: document.getElementById('hour-break-start')?.value || '',
                breakEnd: document.getElementById('hour-break-end')?.value || ''
            });
            const salary = getSalarioVigente(person, competence).salario;
            const currentHE = typeof getHourControlOvertimePreview === 'function'
                ? getHourControlOvertimePreview({
                    person,
                    competence,
                    date: document.getElementById('hour-date')?.value || '',
                    summary,
                    salaryBase: salary,
                    percentage: Number(document.getElementById('hour-percentage')?.value || 0)
                })
                : calcularHoraExtra({
                person,
                competencia: competence,
                horas: summary.quantity,
                percentual: Number(document.getElementById('hour-percentage')?.value || 0),
                salaryBase: salary
                });
            const dsr = calcularDSRHoraExtra({
                person,
                competencia: competence,
                totalHoraExtra: getHoraExtraTotalForDSR(person, competence),
                incluirLancamentoAtual: currentHE.total || currentHE.totalHoraExtra || 0
            });

            dsrInput.value = dsr.dsr ? dsr.dsr.toFixed(2) : '';
            dsrInfoEl.textContent = dsr.diasUteis
                ? `HE realizada ${fmt(dsr.totalHoraExtra)} / ${dsr.diasUteis} dias uteis x ${dsr.diasDescanso} domingos/feriados (${formatCompetence(dsr.competenciaCalendario)})`
                : 'Sem dias ?teis válidos para o mês anterior.';

            const preview = document.getElementById('hour-calculation-preview');
            if (preview && dsr.dsr > 0 && !preview.querySelector('[data-dsr-preview]')) {
                preview.querySelector('.entry-consolidated-grid')?.insertAdjacentHTML('beforeend', `
                    <div data-dsr-preview>
                        <p class="text-xs text-textSecondary">DSR H.E.</p>
                        <p class="text-lg font-semibold text-success">${fmt(dsr.dsr)}</p>
                    </div>
                `);
            }
        };

        const _openHourDetailModalBeforeDSR = openHourDetailModal;
        openHourDetailModal = function (key) {
            _openHourDetailModalBeforeDSR(key);
            const [person, competencia] = String(key || '').split('|');
            const dsr = calcularDSRHoraExtra({ person, competencia });
            const content = document.getElementById('hour-detail-content');
            if (!content || content.querySelector('[data-hour-dsr-summary]')) return;

            content.insertAdjacentHTML('afterbegin', `
                <div data-hour-dsr-summary class="time-metric-card mb-4">
                    <p class="text-xs uppercase tracking-[0.16em] text-textSecondary">DSR da Hora Extra</p>
                    <div class="entry-consolidated-grid mt-3">
                        <div><p class="text-xs text-textSecondary">TTL H.E. realizada</p><p class="text-lg font-semibold text-success">${fmt(dsr.totalHoraExtra)}</p></div>
                        <div><p class="text-xs text-textSecondary">Dias uteis</p><p class="text-lg font-semibold text-textPrimary">${dsr.diasUteis}</p></div>
                        <div><p class="text-xs text-textSecondary">Domingos + feriados</p><p class="text-lg font-semibold text-warn">${dsr.diasDescanso}</p></div>
                        <div><p class="text-xs text-textSecondary">DSR calculado</p><p class="text-lg font-semibold text-success">${fmt(dsr.dsr)}</p></div>
                    </div>
                    <p class="text-xs text-textSecondary mt-3">Calendario usado: ${formatCompetence(dsr.competenciaCalendario)}.</p>
                </div>
            `);
        };

        const _openEntryDetailModalBeforeDSR = openEntryDetailModal;
        openEntryDetailModal = function (person, competencia) {
            _openEntryDetailModalBeforeDSR(person, competencia);
            const consolidated = consolidarEntradaMensal(person, competencia);
            const dsrValue = roundCurrency(consolidated.dsrHoraExtra || 0);
            if (dsrValue <= 0) return;

            const detail = document.getElementById('entry-detail-content');
            const summaryGrid = detail?.querySelector('.money-metric-card .entry-consolidated-grid');
            if (summaryGrid && !summaryGrid.querySelector('[data-entry-dsr-summary]')) {
                const dsrCard = document.createElement('div');
                dsrCard.setAttribute('data-entry-dsr-summary', 'true');
                dsrCard.innerHTML = `<p class="text-xs text-textSecondary">DSR H.E.</p><p class="kpi-value text-success mt-2">${fmt(dsrValue)}</p>`;
                summaryGrid.insertBefore(dsrCard, summaryGrid.children[3] || null);
            }

            const financialRows = detail?.querySelector('.entry-detail-grid .money-metric-card .space-y-2');
            if (financialRows && !financialRows.querySelector('[data-entry-dsr-row]')) {
                Array.from(financialRows.children).find((row) => row.textContent.includes('Hora Extra'))
                    ?.insertAdjacentHTML('afterend', `<div data-entry-dsr-row class="flex justify-between"><span>DSR H.E.</span><strong class="text-success">${fmt(dsrValue)}</strong></div>`);
            }

            const hourBlock = Array.from(detail?.querySelectorAll('.time-metric-card') || [])
                .find((block) => block.textContent.includes('Bloco Hora Extra'));
            if (hourBlock && !hourBlock.querySelector('[data-entry-dsr-hour-block]')) {
                hourBlock.insertAdjacentHTML('beforeend', `
                    <div data-entry-dsr-hour-block class="rounded-lg border border-success/30 bg-success/10 p-3 mt-3 text-sm">
                        <div class="flex justify-between gap-3">
                            <span>DSR H.E. (${consolidated.dsrInfo?.diasUteis || 0} dias uteis, ${consolidated.dsrInfo?.diasDescanso || 0} domingos/feriados)</span>
                            <strong class="text-success">${fmt(dsrValue)}</strong>
                        </div>
                    </div>
                `);
            }
        };
