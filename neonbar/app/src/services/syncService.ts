import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'barize-offline';
const DB_VERSION = 1;
const QUEUE_STORE = 'pending-requests';

interface PendingRequest {
  id?: number;
  url: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
  createdAt: number;
  retries: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

/** Add request to offline queue */
export async function enqueueRequest(req: Omit<PendingRequest, 'id' | 'createdAt' | 'retries'>) {
  const db = await getDB();
  await db.add(QUEUE_STORE, {
    ...req,
    body: req.body ? JSON.stringify(req.body) : undefined,
    createdAt: Date.now(),
    retries: 0,
  });
}

/** Get all pending requests */
export async function getPendingRequests(): Promise<PendingRequest[]> {
  const db = await getDB();
  return db.getAll(QUEUE_STORE);
}

/** Remove a request from queue by id */
export async function removeRequest(id: number) {
  const db = await getDB();
  await db.delete(QUEUE_STORE, id);
}

/** Clear all pending requests */
export async function clearQueue() {
  const db = await getDB();
  await db.clear(QUEUE_STORE);
}

/** Sync all pending requests (called when back online) */
export async function syncPendingRequests(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingRequests();
  let synced = 0;
  let failed = 0;

  for (const req of pending) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          ...req.headers,
        },
        body: req.body || undefined,
      });

      if (response.ok) {
        await removeRequest(req.id!);
        synced++;
      } else {
        // Server error — increment retries, keep in queue
        const db = await getDB();
        const updated = { ...req, retries: (req.retries || 0) + 1 };
        if (updated.retries < 5) {
          await db.put(QUEUE_STORE, updated);
        } else {
          await removeRequest(req.id!);
          failed++;
        }
      }
    } catch {
      // Network error — keep in queue
      failed++;
    }
  }

  return { synced, failed };
}

/** Get queue count */
export async function getQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count(QUEUE_STORE);
}
