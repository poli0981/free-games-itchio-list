import type { Game, GameDbIndex, DeletedGameEntry, CountHistoryPoint } from '@/types/game'
import { DATA_FILES } from '../config'
import { fetchData } from './fetch-json'

export async function loadAllGames(): Promise<{ games: Game[]; index: GameDbIndex }> {
  const index = await fetchData<GameDbIndex>(DATA_FILES.index)
  const results = await Promise.allSettled(index.files.map((f) => fetchData<Game[]>(f.name)))
  const failed = results.filter((r) => r.status === 'rejected')
  if (failed.length > 0 && failed.length === results.length) throw failed[0].reason
  if (failed.length > 0) {
    // One missing chunk (e.g. a deploy in flight) must not blank the whole catalog.
    console.warn(`Catalog: ${failed.length} of ${results.length} chunks failed to load`)
  }
  const games = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  return { games, index }
}

export async function loadDeletedLog(): Promise<DeletedGameEntry[]> {
  try {
    return await fetchData<DeletedGameEntry[]>(DATA_FILES.deleted)
  } catch {
    return []
  }
}

export async function loadCountHistory(): Promise<CountHistoryPoint[]> {
  try {
    return await fetchData<CountHistoryPoint[]>(DATA_FILES.countHistory)
  } catch {
    return []
  }
}
