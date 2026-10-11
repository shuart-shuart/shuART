// Large archive drafts (including staged images/PDFs) belong in IndexedDB,
// rather than the small localStorage quota shared with editor preferences.
export function createDraftStore<T>(legacyKey: string, fallback: T, databaseName = 'shuart-editor-drafts') {
  let database: IDBDatabase | undefined;
  let cached: T | undefined;
  let opening: Promise<void> | undefined;
  let queue: Promise<unknown> = Promise.resolve();
  const legacy = (): T => {
    const raw = localStorage.getItem(legacyKey);
    return raw ? JSON.parse(raw) : fallback;
  };
  function transaction<R>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<R>): Promise<R> {
    return new Promise((resolve, reject) => {
      const tx = database!.transaction('drafts', mode);
      const request = action(tx.objectStore('drafts'));
      // Request success alone is not proof that a write has committed.
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('Draft transaction failed.'));
    });
  }
  async function initialize() {
    if (typeof indexedDB === 'undefined') return;
    if (!opening) opening = (async () => {
      try {
        database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(databaseName, 1);
          request.onupgradeneeded = () => request.result.createObjectStore('drafts');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
          request.onblocked = () => reject(new Error('Draft database is blocked by another tab.'));
        });
        const stored = await transaction<T | undefined>('readonly', store => store.get(legacyKey));
        cached = stored ?? legacy();
        if (localStorage.getItem(legacyKey)) {
          if (stored === undefined) await transaction('readwrite', store => store.put(cached, legacyKey));
          try { localStorage.removeItem(legacyKey); } catch { /* retained backup */ }
        }
      } catch {
        database?.close();
        database = undefined;
        // Retain support for browsers that disable IndexedDB. Existing drafts
        // remain untouched until a replacement has committed successfully.
      }
    })();
    await opening;
  }
  function read(): T { return database && cached !== undefined ? cached : legacy(); }
  function update(patch: Partial<T>): Promise<void> {
    const write = queue.catch(() => {}).then(async () => {
      await initialize();
      const next = { ...read(), ...patch };
      try {
        if (database) {
          await transaction('readwrite', store => store.put(next, legacyKey));
          cached = next;
          // Free the old quota only after the full draft is safely stored.
          try { localStorage.removeItem(legacyKey); } catch { /* retained backup */ }
        } else {
          localStorage.setItem(legacyKey, JSON.stringify(next));
        }
      } catch {
        throw new Error('Browser draft storage is unavailable or full. Export a backup of your unsaved entry; your previous saved draft has been retained.');
      }
    });
    queue = write;
    return write;
  }
  return { initialize, read, update };
}
