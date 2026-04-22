import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const MAX_DETAIL_STRING_LENGTH = 300;

function truncate(value) {
  const text = String(value ?? '');
  return text.length > MAX_DETAIL_STRING_LENGTH
    ? `${text.slice(0, MAX_DETAIL_STRING_LENGTH)}...`
    : text;
}

function sanitizeDetails(value, depth = 0) {
  if (depth > 3) return '[truncated]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return truncate(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => sanitizeDetails(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !['password', 'token', 'accessToken', 'refreshToken'].includes(key))
        .map(([key, item]) => [key, sanitizeDetails(item, depth + 1)])
    );
  }
  return truncate(value);
}

export function buildAuditLogEntry(action, details = {}, context = {}) {
  const user = context.user || null;
  const now = context.now instanceof Date ? context.now.toISOString() : new Date().toISOString();
  return {
    action: String(action || 'unknown'),
    actor_uid: context.uid || user?.uid || '',
    actor_email: context.email || user?.email || '',
    created_at: now,
    status: context.status || 'success',
    source: context.source || 'web',
    details: sanitizeDetails(details)
  };
}

export function summarizeFinanceRecord(record = {}) {
  return {
    record_id: record.id || '',
    record_type: record.type || '',
    person: record.person || '',
    competence: record.competence || '',
    status: record.status || '',
    amount: Number.isFinite(Number(record.amount)) ? Number(record.amount) : 0,
    macro_category: record.macro_category || '',
    import_source: record.import_source || '',
    archived: Boolean(record.archived)
  };
}

export function classifyFinanceRecordAuditAction(operation, record = {}) {
  if (record.type === 'percentage_rule') {
    if (operation === 'delete') return 'percentage_rule.delete';
    if (operation === 'upsert') return 'percentage_rule.save';
    if (operation === 'update') return 'percentage_rule.update';
    return 'percentage_rule.create';
  }

  if (record.import_source && operation === 'create') return 'import.record_create';

  if (['pessoa', 'macro', 'categoria', 'salario_historico'].includes(record.type)) {
    if (operation === 'delete') return 'settings.record_delete';
    if (operation === 'update' || operation === 'upsert') return 'settings.record_update';
    return 'settings.record_create';
  }

  if (operation === 'delete') return 'finance_record.delete';
  if (operation === 'create') return 'finance_record.create';
  if (operation === 'upsert') return 'finance_record.upsert';
  if (operation === 'update' && record.archived === true) return 'finance_record.archive';
  if (operation === 'update' && record.status === 'Pago') return 'finance_record.mark_paid';
  return 'finance_record.update';
}

export function createAuditService({ auth, db, target = globalThis } = {}) {
  async function log(action, details = {}, context = {}) {
    const user = context.user || auth?.currentUser || null;
    const uid = context.uid || user?.uid || '';
    if (!uid || !db) return { isOk: false, error: 'AUDIT_AUTH_REQUIRED' };

    const entry = buildAuditLogEntry(action, details, {
      ...context,
      user,
      uid,
      email: context.email || user?.email || ''
    });

    try {
      const docRef = await addDoc(collection(db, 'users', uid, 'audit_logs'), {
        ...entry,
        created_server_at: serverTimestamp()
      });
      return { isOk: true, id: docRef.id };
    } catch (error) {
      target?.console?.warn?.('Falha ao registrar auditoria', error);
      return { isOk: false, error: error.message };
    }
  }

  function logLater(action, details = {}, context = {}) {
    log(action, details, context).catch((error) => {
      target?.console?.warn?.('Falha inesperada na auditoria', error);
    });
  }

  return {
    log,
    logLater
  };
}

export function installAuditGlobals(target = globalThis, auditService = null) {
  if (auditService) target.auditSdk = auditService;
  target.auditAction = (action, details = {}, context = {}) =>
    target.auditSdk?.logLater?.(action, details, context);
  return target.auditSdk || null;
}
