import type { PersistedClient } from '@tanstack/react-query-persist-client'
import { describe, expect, it, vi } from 'vitest'
import { createBinaryPersister, type BinaryStore } from './persister'

function memoryStore(initial?: unknown) {
  const data = new Map<string, unknown>(initial === undefined ? [] : [['cache', initial]])
  const store: BinaryStore = {
    get: vi.fn(async (key: string) => data.get(key)),
    set: vi.fn(async (key: string, value: Uint8Array<ArrayBuffer>) => void data.set(key, value)),
    del: vi.fn(async (key: string) => void data.delete(key)),
  }
  return { data, store }
}

function client(data: unknown, buster = 'v1'): PersistedClient {
  return {
    timestamp: 1,
    buster,
    clientState: {
      mutations: [],
      queries: [
        {
          queryKey: ['db', 'all'],
          queryHash: '["db","all"]',
          state: { data, dataUpdatedAt: 1, status: 'success' },
        },
      ],
    },
  } as unknown as PersistedClient
}

describe('createBinaryPersister', () => {
  it('stores compressed bytes, not readable JSON, and restores them', async () => {
    const { data, store } = memoryStore()
    const persister = createBinaryPersister({ key: 'cache', store })
    const saved = client({ games: [{ name: 'Café Dreams' }], note: 'x'.repeat(5000) })
    persister.persistClient(saved)
    await persister.flush()
    const value = data.get('cache') as Uint8Array
    expect(value).toBeInstanceOf(Uint8Array)
    expect(value[0]).toBe(1)
    expect(value.length).toBeLessThan(1000)
    expect(new TextDecoder().decode(value)).not.toContain('Café Dreams')
    const restored = await createBinaryPersister({ key: 'cache', store }).restoreClient()
    expect(restored).toEqual(saved)
  })

  it('writes once per throttle window, with the latest client', async () => {
    vi.useFakeTimers()
    try {
      const { store } = memoryStore()
      const persister = createBinaryPersister({ key: 'cache', store, throttleMs: 1000 })
      for (let i = 0; i < 5; i++) persister.persistClient(client({ i }))
      expect(store.set).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1000)
      await persister.flush()
      expect(store.set).toHaveBeenCalledTimes(1)
      const restored = await createBinaryPersister({ key: 'cache', store }).restoreClient()
      expect(restored?.clientState.queries[0].state.data).toEqual({ i: 4 })
    } finally {
      vi.useRealTimers()
    }
  })

  it('skips writing when no query data changed', async () => {
    const { store } = memoryStore()
    const persister = createBinaryPersister({ key: 'cache', store })
    const data = { games: [] }
    persister.persistClient(client(data))
    await persister.flush()
    persister.persistClient({ ...client(data), timestamp: 2 })
    await persister.flush()
    expect(store.set).toHaveBeenCalledTimes(1)
    persister.persistClient(client({ games: [] }))
    await persister.flush()
    expect(store.set).toHaveBeenCalledTimes(2)
  })

  it('does not write restored data straight back', async () => {
    const { store } = memoryStore()
    const first = createBinaryPersister({ key: 'cache', store })
    first.persistClient(client({ games: [1, 2] }))
    await first.flush()
    const second = createBinaryPersister({ key: 'cache', store })
    const restored = await second.restoreClient()
    second.persistClient(restored!)
    await second.flush()
    expect(store.set).toHaveBeenCalledTimes(1)
  })

  it('drops the pre-4.2 plain-JSON cache and anything unknown', async () => {
    const legacy = memoryStore(JSON.stringify(client({ games: [] })))
    expect(await createBinaryPersister({ key: 'cache', store: legacy.store }).restoreClient()).toBeUndefined()
    expect(legacy.data.has('cache')).toBe(false)

    const unknown = memoryStore(new Uint8Array([9, 1, 2, 3]))
    expect(await createBinaryPersister({ key: 'cache', store: unknown.store }).restoreClient()).toBeUndefined()
    expect(unknown.data.has('cache')).toBe(false)

    const empty = memoryStore()
    expect(await createBinaryPersister({ key: 'cache', store: empty.store }).restoreClient()).toBeUndefined()
  })

  it('falls back to plain bytes when compression fails, and still restores', async () => {
    const { data, store } = memoryStore()
    const persister = createBinaryPersister({
      key: 'cache',
      store,
      compress: async () => {
        throw new Error('no compressor')
      },
    })
    const saved = client({ games: ['a'] })
    persister.persistClient(saved)
    await persister.flush()
    expect((data.get('cache') as Uint8Array)[0]).toBe(0)
    expect(await createBinaryPersister({ key: 'cache', store }).restoreClient()).toEqual(saved)
  })

  it('cancels a pending write on remove', async () => {
    vi.useFakeTimers()
    try {
      const { store } = memoryStore()
      const persister = createBinaryPersister({ key: 'cache', store })
      persister.persistClient(client({ games: [] }))
      await persister.removeClient()
      await vi.advanceTimersByTimeAsync(2000)
      expect(store.set).not.toHaveBeenCalled()
      expect(store.del).toHaveBeenCalledWith('cache')
    } finally {
      vi.useRealTimers()
    }
  })

  it('logs instead of throwing when the store fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { store } = memoryStore()
    store.set = vi.fn(async () => {
      throw new Error('quota')
    })
    const persister = createBinaryPersister({ key: 'cache', store })
    persister.persistClient(client({ games: [] }))
    await expect(persister.flush()).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
