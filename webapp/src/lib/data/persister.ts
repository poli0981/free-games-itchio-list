import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { deflateRaw, inflateRaw } from './compression'

/**
 * Persists the react-query cache to IndexedDB as compressed bytes rather than
 * readable JSON: byte 0 is the format (1 = deflate-raw of the UTF-8 JSON,
 * 0 = the plain UTF-8 JSON, written only if compressing failed), the rest is
 * the payload. A plain string under the key is the pre-4.2 cache: dropped.
 */
export interface BinaryStore {
  get(key: string): Promise<unknown>
  set(key: string, value: Uint8Array<ArrayBuffer>): Promise<void>
  del(key: string): Promise<void>
}

interface Options {
  key: string
  store: BinaryStore
  throttleMs?: number
  compress?: (bytes: Uint8Array<ArrayBuffer>) => Promise<Uint8Array<ArrayBuffer>>
  decompress?: (bytes: Uint8Array<ArrayBuffer>) => Promise<Uint8Array<ArrayBuffer>>
}

const PLAIN = 0
const DEFLATE = 1

// The fallback compressor (fflate) blocks the main thread: keep it light.
const defaultCompress = (bytes: Uint8Array<ArrayBuffer>) => deflateRaw(bytes, 3)

export function createBinaryPersister({
  key,
  store,
  throttleMs = 1000,
  compress = defaultCompress,
  decompress = inflateRaw,
}: Options): Persister & { flush(): Promise<void> } {
  let pending: PersistedClient | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let writes: Promise<void> = Promise.resolve()
  let lastSignature: string | undefined

  // Data objects keep their identity until a fetch brings different data
  // (structural sharing), so a signature of references tells whether there is
  // anything new to write: status-only events and identical refetches are skipped.
  // The stored timestamp therefore moves when the data does (daily, for the catalog).
  const refIds = new WeakMap<object, number>()
  let nextId = 0
  const refId = (value: unknown) => {
    if (typeof value !== 'object' || value === null) return JSON.stringify(value)
    let id = refIds.get(value)
    if (id === undefined) refIds.set(value, (id = ++nextId))
    return `#${id}`
  }
  const signature = (client: PersistedClient) =>
    [client.buster, ...client.clientState.queries.map((q) => `${q.queryHash}=${refId(q.state.data)}`)].join('|')

  async function write(client: PersistedClient) {
    const sig = signature(client)
    if (sig === lastSignature) return
    const json = new TextEncoder().encode(JSON.stringify(client))
    let format = DEFLATE
    let payload: Uint8Array<ArrayBuffer>
    try {
      payload = await compress(json)
    } catch {
      format = PLAIN
      payload = json
    }
    // A fresh buffer: a view into a bigger one would store all of it.
    const value = new Uint8Array(payload.length + 1)
    value[0] = format
    value.set(payload, 1)
    await store.set(key, value)
    lastSignature = sig
  }

  function flush(): Promise<void> {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    const client = pending
    pending = undefined
    if (client) {
      writes = writes
        .then(() => write(client))
        .catch((e) => console.warn('Query cache: could not save', e))
    }
    return writes
  }

  return {
    persistClient(client) {
      pending = client
      timer ??= setTimeout(() => void flush(), throttleMs)
    },

    async restoreClient() {
      try {
        const value = await store.get(key)
        if (value === undefined || value === null) return undefined
        if (!(value instanceof Uint8Array) || value.length < 2 || (value[0] !== DEFLATE && value[0] !== PLAIN)) {
          await store.del(key)
          return undefined
        }
        const payload = value.slice(1)
        const json = value[0] === DEFLATE ? await decompress(payload) : payload
        const client = JSON.parse(new TextDecoder().decode(json)) as PersistedClient
        // Restored data is hydrated as-is: no need to write it straight back.
        lastSignature = signature(client)
        return client
      } catch (e) {
        console.warn('Query cache: could not restore', e)
        return undefined
      }
    },

    async removeClient() {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      pending = undefined
      lastSignature = undefined
      await writes
      await store.del(key)
    },

    flush,
  }
}
