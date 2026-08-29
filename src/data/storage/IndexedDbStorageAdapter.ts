import { STORE_NAMES, type StorageAdapter, type StoreName } from './StorageAdapter'

export const DATABASE_NAME = 'starry-love-diary'
export const SCHEMA_VERSION = 4

export function ensureObjectStores(database: Pick<IDBDatabase, 'objectStoreNames' | 'createObjectStore'>) {
  for (const storeName of STORE_NAMES) {
    if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName, { keyPath: 'id' })
  }
}

export class IndexedDbStorageAdapter implements StorageAdapter {
  private database?: IDBDatabase

  constructor(private readonly databaseName = DATABASE_NAME) {}

  open(): Promise<void> {
    if (this.database) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, SCHEMA_VERSION)
      request.onupgradeneeded = () => {
        const database = request.result
        ensureObjectStores(database)
      }
      request.onsuccess = () => {
        this.database = request.result
        this.database.onversionchange = () => this.close()
        resolve()
      }
      request.onerror = () => reject(request.error ?? new Error('Unable to open local persistence'))
      request.onblocked = () => reject(new Error('Local persistence upgrade is blocked'))
    })
  }

  close() {
    this.database?.close()
    this.database = undefined
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

  private request<T>(store: StoreName, mode: IDBTransactionMode, create: (objectStore: IDBObjectStore) => IDBRequest): Promise<T> {
    if (!this.database) return Promise.reject(new Error('Storage adapter is not open'))
    return new Promise((resolve, reject) => {
      const transaction = this.database!.transaction(store, mode)
      const request = create(transaction.objectStore(store))
      request.onsuccess = () => resolve(request.result as T)
      request.onerror = () => reject(request.error ?? new Error(`Storage request failed for ${store}`))
      transaction.onabort = () => reject(transaction.error ?? new Error(`Storage transaction aborted for ${store}`))
    })
  }
}
