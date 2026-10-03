import { afterEach, describe, expect, it, vi } from 'vitest'
import { deflateRaw, inflateRaw } from './compression'

const text = JSON.stringify(Array.from({ length: 4000 }, (_, i) => ({ i, name: `Game ${i}`, tags: ['2D', 'Cozy'] })))
const input = new TextEncoder().encode(text) // > 256 KB: crosses a slice boundary

afterEach(() => vi.unstubAllGlobals())

describe('compression', () => {
  it('round-trips with the native streams', async () => {
    const packed = await deflateRaw(input)
    expect(packed.length).toBeLessThan(input.length / 5)
    expect(new TextDecoder().decode(await inflateRaw(packed))).toBe(text)
  })

  it('falls back to fflate where the streams are missing, interchangeably', async () => {
    const nativePacked = await deflateRaw(input)
    vi.stubGlobal('CompressionStream', undefined)
    vi.stubGlobal('DecompressionStream', undefined)
    const fallbackPacked = await deflateRaw(input, 3)
    expect(new TextDecoder().decode(await inflateRaw(nativePacked))).toBe(text)
    vi.unstubAllGlobals()
    expect(new TextDecoder().decode(await inflateRaw(fallbackPacked))).toBe(text)
  })

  it('falls back when the streams exist but do not know deflate-raw', async () => {
    const packed = await deflateRaw(input)
    class OldStream {
      constructor(format: string) {
        if (format !== 'gzip' && format !== 'deflate') throw new TypeError(`Unsupported format ${format}`)
      }
    }
    vi.stubGlobal('DecompressionStream', OldStream)
    expect(new TextDecoder().decode(await inflateRaw(packed))).toBe(text)
  })

  it('rejects damaged input', async () => {
    await expect(inflateRaw(new Uint8Array([1, 2, 3, 4, 5]))).rejects.toThrow()
  })
})
