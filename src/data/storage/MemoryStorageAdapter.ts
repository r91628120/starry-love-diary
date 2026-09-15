import type { StorageAdapter, StoreName } from './StorageAdapter'

export type MemoryStorageBacking = Map<StoreName, Map<string, unknown>>

export function createMemoryStorageBacking(): MemoryStorageBacking {
  return new Map()
}

function cloneMemoryValue<T>(value: T): T {
  if (typeof Blob !== 'undefined' && value instanceof Blob) return value.slice(0, value.size, value.type) as T
  if (Array.isArray(value)) return value.map((item) => cloneMemoryValue(item)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneMemoryValue(item)])) as T
  }
  return value
}

export class MemoryStorageAdapter implements StorageAdapter {
  constructor(private readonly backing = createMemoryStorageBacking()) {}
  async open() {}
  close() {}
  async get<T>(store: StoreName, key: string) { return this.backing.get(store)?.get(key) as T | undefined }
  async getAll<T>(store: StoreName) { return [...(this.backing.get(store)?.values() ?? [])] as T[] }
  async put<T>(store: StoreName, value: T & { id: string }) {
    const records = this.backing.get(store) ?? new Map<string, unknown>()
    records.set(value.id, cloneMemoryValue(value))
    this.backing.set(store, records)
  }
  async delete(store: StoreName, key: string) { this.backing.get(store)?.delete(key) }
}
