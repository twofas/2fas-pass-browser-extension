// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

let dbPromise = null;

const isIdbAvailable = () => typeof indexedDB !== 'undefined';

const openDb = () => {
  if (!isIdbAvailable()) {
    return Promise.reject(new Error('IDB not available'));
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(LOGGER_CONSTANTS.IDB.NAME, LOGGER_CONSTANTS.IDB.VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(LOGGER_CONSTANTS.IDB.STORE_LOGS)) {
        const store = db.createObjectStore(LOGGER_CONSTANTS.IDB.STORE_LOGS, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-ts', 'ts', { unique: false });
        store.createIndex('by-level', 'level', { unique: false });
        store.createIndex('by-cat', 'cat', { unique: false });
        store.createIndex('by-ctx', 'ctx', { unique: false });
      }

      if (!db.objectStoreNames.contains(LOGGER_CONSTANTS.IDB.STORE_META)) {
        db.createObjectStore(LOGGER_CONSTANTS.IDB.STORE_META, { keyPath: 'k' });
      }
    };

    req.onsuccess = () => {
      const db = req.result;

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    req.onerror = () => reject(req.error || new Error('IDB open failed'));
    req.onblocked = () => reject(new Error('IDB blocked'));
  }).catch(e => {
    dbPromise = null;
    throw e;
  });

  return dbPromise;
};

const requestPromise = req => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const transactionDone = tx => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error || new Error('IDB transaction aborted'));
});

let broadcastChannel = null;

const getBroadcastChannel = () => {
  if (broadcastChannel) {
    return broadcastChannel;
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel(LOGGER_CONSTANTS.BROADCAST_CHANNEL);
    }
  } catch {
    broadcastChannel = null;
  }

  return broadcastChannel;
};

const broadcast = msg => {
  try {
    const ch = getBroadcastChannel();

    if (ch) {
      ch.postMessage(msg);
    }
  } catch {}
};

const estimateSize = entry => {
  try {
    return JSON.stringify(entry).length;
  } catch {
    return 256;
  }
};

const readBytesUsed = async metaStore => {
  const rec = await requestPromise(metaStore.get(LOGGER_CONSTANTS.IDB.META_BYTES_USED));

  return rec?.v || 0;
};

const writeBytesUsed = (metaStore, bytes) => {
  metaStore.put({ k: LOGGER_CONSTANTS.IDB.META_BYTES_USED, v: Math.max(0, bytes) });
};

const writeLastTrim = (metaStore, ts) => {
  metaStore.put({ k: LOGGER_CONSTANTS.IDB.META_LAST_TRIM, v: ts });
};

const trimIfNeeded = async (db, currentBytes) => {
  if (currentBytes <= LOGGER_CONSTANTS.MAX_BYTES) {
    return currentBytes;
  }

  const tx = db.transaction([LOGGER_CONSTANTS.IDB.STORE_LOGS, LOGGER_CONSTANTS.IDB.STORE_META], 'readwrite');
  const logsStore = tx.objectStore(LOGGER_CONSTANTS.IDB.STORE_LOGS);
  const metaStore = tx.objectStore(LOGGER_CONSTANTS.IDB.STORE_META);
  const tsIndex = logsStore.index('by-ts');

  let removedBytes = 0;
  let bytes = currentBytes;
  const targetBytes = LOGGER_CONSTANTS.MAX_BYTES - LOGGER_CONSTANTS.TRIM_BATCH_BYTES;

  await new Promise((resolve, reject) => {
    const cursorReq = tsIndex.openCursor();

    cursorReq.onsuccess = e => {
      const cursor = e.target.result;

      if (!cursor || bytes <= targetBytes) {
        resolve();
        return;
      }

      const entry = cursor.value;
      const entrySize = typeof entry.size === 'number' ? entry.size : estimateSize(entry);
      removedBytes += entrySize;
      bytes -= entrySize;
      cursor.delete();
      cursor.continue();
    };

    cursorReq.onerror = () => reject(cursorReq.error);
  });

  writeBytesUsed(metaStore, bytes);
  writeLastTrim(metaStore, Date.now());

  await transactionDone(tx);

  if (removedBytes > 0) {
    broadcast({ type: 'trim', removedBytes });
  }

  return bytes;
};

export const writeLogDirect = async entry => {
  if (!isIdbAvailable()) {
    return;
  }

  let db;

  try {
    db = await openDb();
  } catch {
    return;
  }

  const size = estimateSize(entry);
  const record = { ...entry, size };

  const tx = db.transaction([LOGGER_CONSTANTS.IDB.STORE_LOGS, LOGGER_CONSTANTS.IDB.STORE_META], 'readwrite');
  const logsStore = tx.objectStore(LOGGER_CONSTANTS.IDB.STORE_LOGS);
  const metaStore = tx.objectStore(LOGGER_CONSTANTS.IDB.STORE_META);

  const id = await requestPromise(logsStore.add(record));
  const stored = { ...record, id };

  const prev = await readBytesUsed(metaStore);
  writeBytesUsed(metaStore, prev + size);

  await transactionDone(tx);

  broadcast({ type: 'append', entry: stored });

  const next = prev + size;

  if (next > LOGGER_CONSTANTS.MAX_BYTES) {
    try {
      await trimIfNeeded(db, next);
    } catch {}
  }
};

export const readAllLogs = async () => {
  if (!isIdbAvailable()) {
    return [];
  }

  let db;

  try {
    db = await openDb();
  } catch {
    return [];
  }

  const tx = db.transaction([LOGGER_CONSTANTS.IDB.STORE_LOGS], 'readonly');
  const store = tx.objectStore(LOGGER_CONSTANTS.IDB.STORE_LOGS);
  const index = store.index('by-ts');

  const out = [];

  await new Promise((resolve, reject) => {
    const cursorReq = index.openCursor();

    cursorReq.onsuccess = e => {
      const cursor = e.target.result;

      if (!cursor) {
        resolve();
        return;
      }

      out.push(cursor.value);
      cursor.continue();
    };

    cursorReq.onerror = () => reject(cursorReq.error);
  });

  return out;
};

export const getLogStats = async () => {
  if (!isIdbAvailable()) {
    return { entryCount: 0, bytesUsed: 0 };
  }

  let db;

  try {
    db = await openDb();
  } catch {
    return { entryCount: 0, bytesUsed: 0 };
  }

  const tx = db.transaction([LOGGER_CONSTANTS.IDB.STORE_LOGS, LOGGER_CONSTANTS.IDB.STORE_META], 'readonly');
  const logsStore = tx.objectStore(LOGGER_CONSTANTS.IDB.STORE_LOGS);
  const metaStore = tx.objectStore(LOGGER_CONSTANTS.IDB.STORE_META);

  const [entryCount, bytesRec] = await Promise.all([
    requestPromise(logsStore.count()),
    requestPromise(metaStore.get(LOGGER_CONSTANTS.IDB.META_BYTES_USED))
  ]);

  return {
    entryCount,
    bytesUsed: bytesRec?.v || 0
  };
};

export const clearLogs = async () => {
  if (!isIdbAvailable()) {
    return;
  }

  let db;

  try {
    db = await openDb();
  } catch {
    return;
  }

  const tx = db.transaction([LOGGER_CONSTANTS.IDB.STORE_LOGS, LOGGER_CONSTANTS.IDB.STORE_META], 'readwrite');
  tx.objectStore(LOGGER_CONSTANTS.IDB.STORE_LOGS).clear();
  tx.objectStore(LOGGER_CONSTANTS.IDB.STORE_META).put({ k: LOGGER_CONSTANTS.IDB.META_BYTES_USED, v: 0 });

  await transactionDone(tx);

  broadcast({ type: 'clear' });
};
