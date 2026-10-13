import { describe, expect, it, vi } from 'vitest'
import { lazyWithPreload } from './lazy-preload'

const Chart = () => null

describe('lazyWithPreload', () => {
  it('downloads once, however often it is preloaded', async () => {
    const load = vi.fn(async () => ({ default: Chart }))
    const Tab = lazyWithPreload(load)
    await Promise.all([Tab.preload(), Tab.preload()])
    await Tab.preload()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('tries again after a failed download', async () => {
    const load = vi
      .fn<() => Promise<{ default: typeof Chart }>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ default: Chart })
    const Tab = lazyWithPreload(load)
    await expect(Tab.preload()).rejects.toThrow('offline')
    await expect(Tab.preload()).resolves.toBeUndefined()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('renders the module itself once it is loaded (no Suspense fallback)', async () => {
    const Tab = lazyWithPreload(async () => ({ default: Chart }))
    expect((Tab({}) as { type: unknown }).type).not.toBe(Chart) // still the lazy wrapper
    await Tab.preload()
    expect((Tab({}) as { type: unknown }).type).toBe(Chart)
  })
})
