import type { StorageAdapter, StoreName } from './StorageAdapter'

export type MemoryStorageBacking = Map<StoreName, Map<string, unknown>>

export function createMemoryStorageBacking(): MemoryStorageBacking {
  return new Map()
}

export class MemoryStorageAdapter implements StorageAdapter {
  constructor(private readonly backing = createMemoryStorageBacking()) {}
  async open() {}
  close() {}
  async get<T>(store: StoreName, key: string) { return this.backing.get(store)?.get(key) as T | undefined }
  async getAll<T>(store: StoreName) { return [...(this.backing.get(store)?.values() ?? [])] as T[] }
  async put<T>(store: StoreName, value: T & { id: string }) {
    const records = this.backing.get(store) ?? new Map<string, unknown>()
    records.set(value.id, structuredClone(value))
    this.backing.set(store, records)
  }
  async delete(store: StoreName, key: string) { this.backing.get(store)?.delete(key) }
}

