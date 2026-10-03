import { useCallback, useEffect, useMemo } from 'react'
import { skipToken, useQueries, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import {
  CATALOG_KEY,
  descriptionLookup,
  loadDescriptions,
  locate,
  type CatalogChunk,
} from '@/lib/data/catalog'
import { HttpError } from '@/lib/http-error'
import type { Game } from '@/types/game'
import { useAllGames } from './useGames'

/**
 * Game descriptions live in their own packs (about 40 % of the catalog's
 * bytes), one per chunk, fetched only when a page needs them: a game page
 * asks for its chunk, a search for all of them. A pack's name is a hash of its
 * content, so a loaded one never goes stale (`staleTime: Infinity`).
 */

const isGone = (error: unknown) => error instanceof HttpError && error.status === 404

const descKey = (chunk: CatalogChunk) => ['desc', chunk.desc] as const

const descQuery = (chunk: CatalogChunk) => ({
  queryKey: descKey(chunk),
  queryFn: () => loadDescriptions(chunk),
  staleTime: Infinity,
  retry: (failures: number, error: unknown) => !isGone(error) && failures < 1,
})

/**
 * A description pack that is gone belongs to a catalog from an older deploy
 * (restored from IndexedDB, say): reload the catalog, whose chunks then name
 * the current packs. Never fetch another generation's descriptions for the
 * games on screen — they are matched by row.
 */
function useReloadOnGone(gone: boolean) {
  const client = useQueryClient()
  useEffect(() => {
    if (gone) void client.invalidateQueries({ queryKey: CATALOG_KEY })
  }, [gone, client])
}

/** The description of one game; `description` is undefined until it has loaded. */
export function useGameDescription(game: Game) {
  const all = useAllGames()
  const spot = all.data ? locate(all.data, game) : undefined
  const query = useQuery({
    queryKey: spot ? descKey(spot.chunk) : ['desc', null],
    queryFn: spot ? () => loadDescriptions(spot.chunk) : skipToken,
    staleTime: Infinity,
    retry: (failures, error) => !isGone(error) && failures < 1,
  })
  useReloadOnGone(isGone(query.error))
  return {
    description: spot && query.data ? query.data[spot.row] : undefined,
    loading: !!spot && query.isPending && !query.isError,
    failed: query.isError && !isGone(query.error),
    retry: () => void query.refetch(),
  }
}

const NO_CHUNKS: CatalogChunk[] = []

function combine(results: UseQueryResult<string[]>[]) {
  return {
    data: results.map((r) => r.data),
    // 'paused' (offline) doesn't count: the page shouldn't wait for it.
    pending: results.some((r) => r.isPending && r.fetchStatus === 'fetching'),
    failed: results.some((r) => r.isError && !isGone(r.error)),
    gone: results.some((r) => isGone(r.error)),
  }
}

/**
 * Descriptions for searching: loads every chunk's pack while `enabled` (a
 * search query is typed). `lookup` maps the catalog's game objects to the
 * descriptions loaded so far, so it works on any filtered list of them.
 */
export function useSearchDescriptions(enabled: boolean) {
  const all = useAllGames()
  const chunks = all.data?.chunks ?? NO_CHUNKS
  const client = useQueryClient()
  const combined = useQueries({
    queries: chunks.map((chunk) => ({ ...descQuery(chunk), enabled })),
    combine,
  })
  useReloadOnGone(combined.gone)
  const lookup = useMemo(() => descriptionLookup(all.data, combined.data), [all.data, combined.data])
  const retry = useCallback(() => {
    for (const chunk of chunks) {
      if (client.getQueryState(descKey(chunk))?.status === 'error') {
        void client.refetchQueries({ queryKey: descKey(chunk), exact: true })
      }
    }
  }, [client, chunks])
  return {
    lookup,
    pending: enabled && combined.pending,
    failed: enabled && combined.failed,
    retry,
  }
}
