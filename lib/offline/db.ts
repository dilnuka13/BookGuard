import type { OfflineLibraryItem, QueuedMutation, MutationType, MutationStatus } from "@/types/shopping";
import { normalizeBookTitle } from "@/lib/books/normalize";
import { trackISBN } from "@/lib/isbn/tracker";

const DB_NAME = "bookguard_offline_v1";
const DB_VERSION = 2;
const STORE_LIBRARY = "library_cache";
const STORE_META = "meta";
const STORE_MUTATION_QUEUE = "mutation_queue";

let dbInstance: IDBDatabase | null = null;

/**
 * Initializes and returns the IndexedDB database connection.
 */
export function openDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is not supported in this environment."));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Library Cache Store (v1)
      if (!db.objectStoreNames.contains(STORE_LIBRARY)) {
        const libStore = db.createObjectStore(STORE_LIBRARY, { keyPath: "id" });
        libStore.createIndex("isbn13", "isbn13", { unique: false });
        libStore.createIndex("isbn10", "isbn10", { unique: false });
        libStore.createIndex("normalized_title", "normalized_title", { unique: false });
        libStore.createIndex("cover_hash", "cover_hash", { unique: false });
      }

      // 2. Metadata Store (v1)
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }

      // 3. Mutation Queue Store (v2) - stores safe offline actions (Add to Wishlist, Add to Cart)
      if (!db.objectStoreNames.contains(STORE_MUTATION_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_MUTATION_QUEUE, { keyPath: "id" });
        queueStore.createIndex("status", "status", { unique: false });
        queueStore.createIndex("created_at", "created_at", { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB."));
    };
  });
}

/**
 * Stores a list of lightweight library items in IndexedDB, replacing existing records.
 */
export async function cacheLibraryItems(
  items: OfflineLibraryItem[],
  userId: string
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_LIBRARY, STORE_META], "readwrite");
    const libStore = tx.objectStore(STORE_LIBRARY);
    const metaStore = tx.objectStore(STORE_META);

    // Clear old records
    libStore.clear();

    // Insert all fresh items
    for (const item of items) {
      libStore.put(item);
    }

    // Update metadata
    const now = new Date().toISOString();
    metaStore.put({ key: "last_synced_at", value: now });
    metaStore.put({ key: "cached_user_id", value: userId });
    metaStore.put({ key: "item_count", value: items.length });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Transaction failed during library caching."));
  });
}

/**
 * Retrieves all cached library items from IndexedDB.
 */
export async function getCachedLibraryItems(): Promise<OfflineLibraryItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LIBRARY, "readonly");
      const store = tx.objectStore(STORE_LIBRARY);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Looks up a cached book by exact ISBN-13 or ISBN-10.
 * Operates offline with zero network requirement.
 */
export async function findCachedBookByISBN(isbn: string): Promise<OfflineLibraryItem | null> {
  const clean = isbn.trim().replace(/[-\s._]/g, "").toUpperCase();
  if (!clean) return null;

  const tracked = trackISBN(clean);
  const target13 = tracked.isbn13 || (clean.length === 13 ? clean : null);
  const target10 = tracked.isbn10 || (clean.length === 10 ? clean : null);

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LIBRARY, "readonly");
      const store = tx.objectStore(STORE_LIBRARY);
      const isbn13Index = store.index("isbn13");
      const isbn10Index = store.index("isbn10");

      const check13 = target13 ? isbn13Index.get(target13) : null;

      const proceedToCheck10 = () => {
        if (!target10) {
          resolve(null);
          return;
        }
        const req10 = isbn10Index.get(target10);
        req10.onsuccess = () => resolve(req10.result || null);
        req10.onerror = () => reject(req10.error);
      };

      if (check13) {
        check13.onsuccess = () => {
          if (check13.result) {
            resolve(check13.result);
          } else {
            proceedToCheck10();
          }
        };
        check13.onerror = () => reject(check13.error);
      } else {
        proceedToCheck10();
      }
    });
  } catch {
    return null;
  }
}

/**
 * Looks up a cached book by normalized title.
 */
export async function findCachedBookByTitle(title: string): Promise<OfflineLibraryItem | null> {
  const normTitle = normalizeBookTitle(title);
  if (!normTitle) return null;

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LIBRARY, "readonly");
      const store = tx.objectStore(STORE_LIBRARY);
      const titleIndex = store.index("normalized_title");
      const req = titleIndex.get(normTitle);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Retrieves sync metadata (last synced timestamp and item count).
 */
export async function getSyncMeta(): Promise<{ lastSyncedAt: string | null; count: number }> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_META, "readonly");
      const store = tx.objectStore(STORE_META);

      const reqDate = store.get("last_synced_at");
      const reqCount = store.get("item_count");

      tx.oncomplete = () => {
        const lastSyncedAt = reqDate.result ? (reqDate.result as { value: string }).value : null;
        const count = reqCount.result ? Number((reqCount.result as { value: number }).value) : 0;
        resolve({ lastSyncedAt, count });
      };

      tx.onerror = () => {
        resolve({ lastSyncedAt: null, count: 0 });
      };
    });
  } catch {
    return { lastSyncedAt: null, count: 0 };
  }
}

/**
 * Clears offline cache.
 */
export async function clearCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_LIBRARY, STORE_META], "readwrite");
    tx.objectStore(STORE_LIBRARY).clear();
    tx.objectStore(STORE_META).clear();
  } catch {
    // Ignore clear error
  }
}

// ============================================================================
// SAFE OFFLINE MUTATION QUEUE (Phase 05 PWA)
// ============================================================================

/**
 * Enqueues a safe offline mutation (Add to Wishlist, Add to Cart).
 */
export async function enqueueMutation(
  type: MutationType,
  payload: Record<string, unknown>
): Promise<QueuedMutation> {
  const db = await openDB();
  const mutation: QueuedMutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    payload,
    created_at: new Date().toISOString(),
    retry_count: 0,
    status: "PENDING",
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MUTATION_QUEUE, "readwrite");
    const store = tx.objectStore(STORE_MUTATION_QUEUE);
    const req = store.put(mutation);

    req.onsuccess = () => resolve(mutation);
    req.onerror = () => reject(req.error || new Error("Failed to enqueue mutation"));
  });
}

/**
 * Retrieves all pending or failed mutations awaiting background replay.
 */
export async function getPendingMutations(): Promise<QueuedMutation[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATION_QUEUE, "readonly");
      const store = tx.objectStore(STORE_MUTATION_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const all = (req.result as QueuedMutation[]) || [];
        // Sort by created_at ascending to guarantee ordered replay
        const sorted = all.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        resolve(sorted);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Updates a mutation's status and optional error in IndexedDB.
 */
export async function updateMutationStatus(
  id: string,
  status: MutationStatus,
  lastError?: string
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATION_QUEUE, "readwrite");
      const store = tx.objectStore(STORE_MUTATION_QUEUE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record = getReq.result as QueuedMutation | undefined;
        if (!record) {
          resolve();
          return;
        }

        record.status = status;
        if (status === "FAILED") {
          record.retry_count = (record.retry_count || 0) + 1;
        }
        if (lastError) {
          record.last_error = lastError;
        }

        const putReq = store.put(record);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    // Ignore error
  }
}

/**
 * Deletes a successfully synced mutation from IndexedDB.
 */
export async function removeMutation(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATION_QUEUE, "readwrite");
      const store = tx.objectStore(STORE_MUTATION_QUEUE);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error
  }
}

/**
 * Gets count of pending mutations in the offline queue.
 */
export async function getMutationQueueCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MUTATION_QUEUE, "readonly");
      const store = tx.objectStore(STORE_MUTATION_QUEUE);
      const req = store.count();

      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}
