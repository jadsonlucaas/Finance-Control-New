import '../styles/app.css';
import '../styles/style.css';
import { installFinancialSelectorGlobals } from './application/selectors/financialSelectors.js';
import { installMonthlyDetailSelectorGlobals } from './application/selectors/monthlyDetailSelectors.js';
import { loadLegacyClassicScripts } from './legacy/classicScripts.js';
import { installGlobalBridge } from './legacy/globalBridge.js';
import { installLucideIconScheduler } from './legacy/iconScheduler.js';
import { installRecordHelperGlobals } from './legacy/recordHelpers.js';
import { installCloudMemoryStorage } from './legacy/storageSync.js';
import { installThemeGlobals } from './legacy/theme.js';
import { FinanceRepository } from './domain/FinanceRepository.js';
import { installRecordPayloadBuilderGlobals } from './domain/recordPayloads.js';
import { createFirebaseDataProvider } from './services/data/providers/firebaseDataProvider.js';
import { installFinanceRecordMutationGlobals } from './services/financeRecordMutations.js';
import { installLocalVisualLibraries } from './services/localVisualLibraries.js';
import { appState, installAppStateGlobals } from './state/appState.js';
import { installFinanceRecordIndexGlobals } from './state/financeRecordIndex.js';
import { installActionButtonGlobals } from './ui/components/actionButton.js';
import { installMetricCardGlobals } from './ui/components/metricCard.js';
import { installModalGlobals } from './ui/components/modal.js';
import { installCreateElementGlobals } from './ui/dom/createElement.js';
import { installRecordFormReaderGlobals } from './ui/records/recordFormReader.js';
import { installRecordFormValidationGlobals } from './ui/records/recordFormValidation.js';
import { installRecordListRendererGlobals } from './ui/records/recordListRenderer.js';
import { installInitialTemplates } from './ui/templates/installInitialTemplates.js';

// Application composition entry point for the modular migration.
// The current production app still runs from index.html. Keep bootstrap free of
// automatic side effects until the inline handlers are migrated safely.
export function bootstrapApp() {
  globalThis.__financeFirebaseServicesModulePromise ||= import('./services/installFirebaseServices.js');
  installInitialTemplates(document);
  installLocalVisualLibraries(globalThis);
  installAppStateGlobals(globalThis, appState);
  FinanceRepository.setTarget(globalThis);
  installGlobalBridge(globalThis);
  installCloudMemoryStorage(globalThis);
  installLucideIconScheduler(globalThis);
  installThemeGlobals(globalThis);
  installRecordHelperGlobals(globalThis);
  installFinanceRecordIndexGlobals(globalThis);
  installCreateElementGlobals(globalThis);
  installActionButtonGlobals(globalThis);
  installMetricCardGlobals(globalThis);
  installModalGlobals(globalThis);
  installRecordPayloadBuilderGlobals(globalThis);
  installFinanceRecordMutationGlobals(globalThis);
  installRecordFormReaderGlobals(globalThis);
  installRecordFormValidationGlobals(globalThis);
  installRecordListRendererGlobals(globalThis);
  installFinancialSelectorGlobals(globalThis);
  installMonthlyDetailSelectorGlobals(globalThis);
  globalThis.lucide?.createIcons?.();

  globalThis.financeRepository = FinanceRepository;
  loadLegacyClassicScripts(globalThis)
    .then(() => installFirebaseServicesWhenReady(globalThis))
    .catch((error) => console.error('Falha ao inicializar legado', error));

  return {
    status: 'legacy-compatible-build-ready'
  };
}

export async function installFirebaseServicesWhenReady(target = globalThis) {
  if (target.__financeFirebaseServicesInstalled) return target.__financeFirebaseServicesPromise;

  target.__financeFirebaseServicesInstalled = true;
  target.__financeFirebaseServicesPromise = (target.__financeFirebaseServicesModulePromise || import('./services/installFirebaseServices.js'))
    .then(({ installFirebaseServices }) => {
      const services = installFirebaseServices({ target });
      const rawDataSdk = target.__financeRawDataSdk || target.dataSdk;
      FinanceRepository.setTarget(target);
      FinanceRepository.setDataProvider(createFirebaseDataProvider(rawDataSdk));
      target.__financeRawDataSdk = rawDataSdk;
      target.dataSdk = FinanceRepository.createLegacySdkProxy(target);
      target.financeRepository = FinanceRepository;
      return services;
    })
    .catch((error) => {
      target.__financeFirebaseServicesInstalled = false;
      console.error('Erro ao carregar serviços Firebase', error);
      throw error;
    });

  return target.__financeFirebaseServicesPromise;
}

export function installCoreGlobals(target = globalThis) {
  return installGlobalBridge(target);
}

export { installLocalVisualLibraries };

if (typeof window !== 'undefined') {
  window.financeApp = {
    bootstrapApp,
    appState,
    installInitialTemplates,
    loadLegacyClassicScripts,
    installLocalVisualLibraries,
    installAppStateGlobals,
    installGlobalBridge,
    installCloudMemoryStorage,
    installLucideIconScheduler,
    installRecordHelperGlobals,
    installFinanceRecordIndexGlobals,
    installRecordPayloadBuilderGlobals,
    installFinanceRecordMutationGlobals,
    installRecordFormReaderGlobals,
    installRecordFormValidationGlobals,
    installRecordListRendererGlobals,
    installFinancialSelectorGlobals,
    installMonthlyDetailSelectorGlobals,
    installThemeGlobals,
    installCreateElementGlobals,
    installActionButtonGlobals,
    installMetricCardGlobals,
    installModalGlobals,
    createFirebaseDataProvider,
    FinanceRepository,
    installFirebaseServicesWhenReady,
    installCoreGlobals
  };
  bootstrapApp();
}

