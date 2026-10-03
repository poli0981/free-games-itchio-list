/**
 * deflate-raw in both directions, for the catalog packs and the IndexedDB
 * cache. Uses the browser's Compression Streams when they know the format,
 * else fflate, loaded on demand (Safari / iOS 15.4–16.3, older WebViews).
 */
type Bytes = Uint8Array<ArrayBuffer>
type Codec = { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> }

// Feed big inputs in slices so the page keeps responding between them.
const SLICE = 256 * 1024

function nativeCodec(kind: 'inflate' | 'deflate'): Codec | null {
  try {
    // Throws where the API is missing (ReferenceError) or 'deflate-raw' isn't known (TypeError).
    const codec = kind === 'inflate' ? new DecompressionStream('deflate-raw') : new CompressionStream('deflate-raw')
    return codec as unknown as Codec
  } catch {
    return null
  }
}

async function run(codec: Codec, bytes: Bytes): Promise<Bytes> {
  const writer = codec.writable.getWriter()
  const writing = (async () => {
    for (let at = 0; at < bytes.length; at += SLICE) await writer.write(bytes.subarray(at, at + SLICE))
    await writer.close()
  })()
  const [out] = await Promise.all([new Response(codec.readable).arrayBuffer(), writing])
  return new Uint8Array(out)
}

export async function inflateRaw(bytes: Bytes): Promise<Bytes> {
  const codec = nativeCodec('inflate')
  if (codec) return run(codec, bytes)
  const { inflateSync } = await import('fflate')
  return inflateSync(bytes) as Bytes
}

/** `fallbackLevel` applies to fflate only, which blocks the main thread while it works. */
export async function deflateRaw(bytes: Bytes, fallbackLevel: 1 | 3 | 6 | 9 = 6): Promise<Bytes> {
  const codec = nativeCodec('deflate')
  if (codec) return run(codec, bytes)
  const { deflateSync } = await import('fflate')
  return deflateSync(bytes, { level: fallbackLevel }) as Bytes
}
