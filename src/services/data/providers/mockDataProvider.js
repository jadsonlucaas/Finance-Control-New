function createResult(id) {
  return { isOk: true, id };
}

function cloneRecord(record) {
  return record && typeof record === 'object' ? { ...record } : record;
}

export function createMockDataProvider(initialRecords = []) {
  const records = new Map();
  let nextId = 1;

  initialRecords.forEach((record) => {
    if (!record?.id) return;
    records.set(String(record.id), cloneRecord(record));
  });

  function emit(dataHandler) {
    dataHandler?.onDataChanged?.(Array.from(records.values()).map(cloneRecord));
  }

  return {
    records,
    init: async (dataHandler) => {
      emit(dataHandler);
      return { isOk: true };
    },
    create: async (record) => {
      const id = String(record?.id || `mock_${nextId++}`);
      records.set(id, { ...cloneRecord(record), id });
      return createResult(id);
    },
    update: async (record) => {
      if (!record?.id) return { isOk: false, error: 'Documento precisa de um ID' };
      records.set(String(record.id), cloneRecord(record));
      return { isOk: true };
    },
    upsert: async (record) => {
      if (!record?.id) return { isOk: false, error: 'Documento precisa de um ID' };
      records.set(String(record.id), cloneRecord(record));
      return createResult(String(record.id));
    },
    delete: async (record) => {
      if (!record?.id) return { isOk: false, error: 'Documento precisa de um ID' };
      records.delete(String(record.id));
      return { isOk: true };
    },
    list: () => Array.from(records.values()).map(cloneRecord)
  };
}
