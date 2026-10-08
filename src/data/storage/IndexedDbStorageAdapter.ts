import { STORE_NAMES, type StorageAdapter, type StoreName } from './StorageAdapter'

export const DATABASE_NAME = 'starry-love-diary'
export const SCHEMA_VERSION = 9

export function ensureObjectStores(database: Pick<IDBDatabase, 'objectStoreNames' | 'createObjectStore'>) {
  for (const storeName of STORE_NAMES) {
    if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName, { keyPath: 'id' })
  }
}

export class IndexedDbStorageAdapter implements StorageAdapter {
  private database?: IDBDatabase
  private opening?: Promise<IDBDatabase>

  constructor(private readonly databaseName = DATABASE_NAME) {}

  async open(): Promise<void> {
    await this.getDatabase()
  }

  private getDatabase(): Promise<IDBDatabase> {
    if (this.database) return Promise.resolve(this.database)
    if (this.opening) return this.opening
    this.opening = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, SCHEMA_VERSION)
      request.onupgradeneeded = () => {
        const database = request.result
        ensureObjectStores(database)
      }
      request.onsuccess = () => {
        const database = request.result
        this.database = database
        database.onversionchange = () => this.invalidate(database)
        resolve(database)
      }
      request.onerror = () => reject(request.error ?? new Error('Unable to open local persistence'))
      request.onblocked = () => reject(new Error('Local persistence upgrade is blocked'))
    })
    return this.opening.then(
      (database) => { this.opening = undefined; return database },
      (error) => { this.opening = undefined; throw error },
    )
  }

  close() {
    this.invalidate()
  }

  get<T>(store: StoreName, key: string): Promise<T | undefined> {
    return this.request<T | undefined>(store, 'readonly', (objectStore) => objectStore.get(key))
  }

  getAll<T>(store: StoreName): Promise<T[]> {
    return this.request<T[]>(store, 'readonly', (objectStore) => objectStore.getAll())
  }

  async put<T>(store: StoreName, value: T & { id: string }): Promise<void> {
    await this.request<IDBValidKey>(store, 'readwrite', (objectStore) => objectStore.put(value))
  }

  async delete(store: StoreName, key: string): Promise<void> {
    await this.request<undefined>(store, 'readwrite', (objectStore) => objectStore.delete(key))
  }

  restoreStoresAtomically(replace: Partial<Record<StoreName, unknown[]>>, clearStores: readonly StoreName[]): Promise<void> {
    const stores = [...new Set([...Object.keys(replace), ...clearStores])] as StoreName[]
    return this.withDatabase((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction(stores, 'readwrite')
      let settled = false
      const fail = (error: unknown) => { if (!settled) { settled = true; reject(error instanceof Error ? error : new Error('Atomic restore failed')) } }
      transaction.oncomplete = () => { if (!settled) { settled = true; resolve() } }
      transaction.onerror = () => fail(transaction.error ?? new Error('Atomic restore failed'))
      transaction.onabort = () => fail(transaction.error ?? new Error('Atomic restore aborted'))
      try {
        for (const store of stores) transaction.objectStore(store).clear().onerror = () => transaction.abort()
        for (const [store, records] of Object.entries(replace) as [StoreName, unknown[]][]) {
          for (const record of records) transaction.objectStore(store).put(record).onerror = () => transaction.abort()
        }
      } catch (error) { try { transaction.abort() } catch (abortError) { void abortError } fail(error) }
    }))
  }

  private request<T>(store: StoreName, mode: IDBTransactionMode, create: (objectStore: IDBObjectStore) => IDBRequest): Promise<T> {
    return this.withDatabase((database) => new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(store, mode)
      const request = create(transaction.objectStore(store))
      request.onsuccess = () => resolve(request.result as T)
      request.onerror = () => reject(request.error ?? new Error(`Storage request failed for ${store}`))
      transaction.onabort = () => reject(transaction.error ?? new Error(`Storage transaction aborted for ${store}`))
    }))
  }

  private async withDatabase<T>(operation: (database: IDBDatabase) => Promise<T>): Promise<T> {
    const database = await this.getDatabase()
    try {
      return await operation(database)
    } catch (error) {
      if (!isInvalidStateError(error)) throw error
      this.invalidate(database)
      return operation(await this.getDatabase())
    }
  }

  private invalidate(database?: IDBDatabase) {
    if (database && this.database !== database) return
    const stale = this.database
    this.database = undefined
    try { stale?.close() } catch { /* stale connections may already be closed */ }
  }
}

function isInvalidStateError(error: unknown) {
  return error instanceof DOMException ? error.name === 'InvalidStateError' : error instanceof Error && error.name === 'InvalidStateError'
}
