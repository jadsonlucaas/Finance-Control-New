let activeSalaryHistoryPersonId = '';
        let activeSalaryHistoryPersonName = '';

        function normalizeCompetenceFromDate(dateValue = '') {
            if (!dateValue) return '';
            return String(dateValue).slice(0, 7);
        }

        function compareCompetence(a = '', b = '') {
            return String(a || '').localeCompare(String(b || ''));
        }

        function getSalaryHistoryRecords(personName = '') {
            return allRecords
                .filter((record) => record?.type === 'salario_historico' && String(record.person || '').trim() === String(personName || '').trim())
                .sort((a, b) => String(b.start_date || '').localeCompare(String(a.start_date || '')));
        }

        function getSalarioVigente(personName = '', competencia = '') {
            const normalizedCompetence = normalizeCompetenceValue(competencia || thisMonth);
            const history = getSalaryHistoryRecords(personName);
            const match = history.find((item) => {
                const startCompetence = normalizeCompetenceFromDate(item.start_date);
                const endCompetence = normalizeCompetenceFromDate(item.end_date);
                if (startCompetence && compareCompetence(startCompetence, normalizedCompetence) > 0) return false;
                if (endCompetence && compareCompetence(normalizedCompetence, endCompetence) > 0) return false;
                return true;
            });
            if (match) {
                return {
                    salario: roundCurrency(match.salary_base || 0),
                    source: 'historico',
                    start_date: match.start_date || '',
                    end_date: match.end_date || '',
                    observation: match.observation || ''
                };
            }

            const personRecord = getPersonRecord(personName);
            return {
                salario: roundCurrency(personRecord?.salary_base || 0),
                source: 'legacy',
                start_date: '',
                end_date: '',
                observation: ''
            };
        }

        function calcularHoras(horaInicial = '', horaFinal = '') {
            const startMinutes = parseTimeToMinutes(horaInicial);
            const endMinutes = parseTimeToMinutes(horaFinal);
            if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return 0;
            return roundCurrency((endMinutes - startMinutes) / 60);
        }

        function calcularHoraExtra({ person = '', competencia = '', horas = 0, percentual = 0, salaryBase = null } = {}) {
            const salarioBase = salaryBase === null ? getSalarioVigente(person, competencia).salario : Number(salaryBase || 0);
            const valorHoraNormal = roundCurrency(salarioBase / 220);
            const percentualAplicado = parseOvertimePercent(percentual);
            const adicional = roundCurrency(valorHoraNormal * percentualAplicado);
            const valorHoraExtra = roundCurrency(valorHoraNormal + adicional);
            const total = roundCurrency((Number(horas) || 0) * valorHoraExtra);
            return { salarioBase, valorHoraNormal, percentualAplicado, adicional, valorHoraExtra, total };
        }

        function calcularBancoHoras({ horas = 0, natureza = 'Débito' } = {}) {
            const quantity = Number(horas) || 0;
            return roundCurrency(String(natureza || '').toLowerCase().startsWith('c') ? -quantity : quantity);
        }

        function calcularSaldoBanco(person = '', competencia = '') {
            const normalizedCompetence = normalizeCompetenceValue(competencia || thisMonth);
            if (typeof buildHourPeriodSummary === 'function') {
                const summary = buildHourPeriodSummary(allRecords, {
                    start: normalizedCompetence,
                    end: normalizedCompetence,
                    person
                });
                return {
                    saldoAnterior: roundCurrency(summary.openingBankHours || 0),
                    horasDebito: roundCurrency(summary.bankDebitHours || 0),
                    horasCredito: roundCurrency(summary.bankCreditHours || 0),
                    saldoAtual: roundCurrency(summary.bankNetHours || 0)
                };
            }

            const records = allRecords.filter((record) =>
                record?.type === 'controle_horas' &&
                record.person === person &&
                record.hour_entry_type === 'Banco de Horas'
            );

            let saldoAnterior = 0;
            let horasDebito = 0;
            let horasCredito = 0;

            records.forEach((record) => {
                const amount = Number(record.hours_quantity || 0);
                const targetCompetence = normalizeCompetenceValue(record.competence || '');
                if (compareCompetence(targetCompetence, normalizedCompetence) < 0) {
                    saldoAnterior += calcularBancoHoras({ horas: amount, natureza: record.bank_nature });
                    return;
                }
                if (targetCompetence !== normalizedCompetence) return;
                if (String(record.bank_nature || '').toLowerCase().startsWith('c')) horasCredito += amount;
                else horasDebito += amount;
            });

            return {
                saldoAnterior: roundCurrency(saldoAnterior),
                horasDebito: roundCurrency(horasDebito),
                horasCredito: roundCurrency(horasCredito),
                saldoAtual: roundCurrency(saldoAnterior + horasDebito - horasCredito)
            };
        }

        function calcularINSS(base = 0) {
            const value = Number(base) || 0;
            const brackets = [
                { limit: 1621.00, rate: 0.075, deduction: 0 },
                { limit: 2902.84, rate: 0.09, deduction: 24.32 },
                { limit: 4354.27, rate: 0.12, deduction: 59.09 },
                { limit: 8475.55, rate: 0.14, deduction: 234.94 }
            ];
            const bracket = brackets.find((item) => value <= item.limit) || brackets[brackets.length - 1];
            const taxableBase = Math.min(value, brackets[brackets.length - 1].limit);
            return roundCurrency(Math.max(0, taxableBase * bracket.rate - bracket.deduction));
        }

        function calcularIRRF(base = 0, inss = 0) {
            const baseBruta = Number(base) || 0;
            const taxableBase = Math.max(0, roundCurrency((Number(base) || 0) - (Number(inss) || 0)));
            const brackets = [
                { limit: 2428.80, rate: 0, deduction: 0 },
                { limit: 2826.65, rate: 0.075, deduction: 182.16 },
                { limit: 3751.05, rate: 0.15, deduction: 394.16 },
                { limit: 4664.68, rate: 0.225, deduction: 675.49 },
                { limit: Number.POSITIVE_INFINITY, rate: 0.275, deduction: 908.73 }
            ];
            const bracket = brackets.find((item) => taxableBase <= item.limit) || brackets[brackets.length - 1];
            const irrfTradicional = roundCurrency(Math.max(0, (taxableBase * bracket.rate) - bracket.deduction));
            let reducao = 0;
            if (taxableBase > 5000 && taxableBase < 7350) {
                reducao = Math.max(0, roundCurrency(978.62 - (0.133145 * taxableBase)));
            } else if (taxableBase <= 5000) {
                reducao = irrfTradicional;
            }

            if (baseBruta <= 5000) {
                return 0;
            }
            if (baseBruta <= 7350) {
                return roundCurrency(Math.max(0, irrfTradicional - reducao));
            }
            return irrfTradicional;
        }

        function calcularLiquido({ salarioBase = 0, horaExtra = 0, outrosProventos = 0, inss = 0, irrf = 0, outrosDescontos = 0 } = {}) {
            return roundCurrency((Number(salarioBase) || 0) + (Number(horaExtra) || 0) + (Number(outrosProventos) || 0) - (Number(inss) || 0) - (Number(irrf) || 0) - (Number(outrosDescontos) || 0));
        }

        function getMonthlyDiscountRecords(person = '', competencia = '') {
            return window.financeDomain.getMonthlyDiscountRecords(allRecords, person, competencia);
            return allRecords.filter((record) =>
                record?.type === 'entrada' &&
                record.person === person &&
                record.competence === competencia &&
                String(record.macro_category || '') === 'Dedução'
            );
        }
