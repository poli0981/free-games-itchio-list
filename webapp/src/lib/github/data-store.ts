import type {
  Game,
  GameDbIndex,
  ChunkPlan,
  DeletedGameEntry,
  CountHistoryPoint,
} from '@/types/game'
import { MAX_PER_FILE, PATHS } from '../config'
import { fetchRaw } from './raw'

export async function loadIndex(): Promise<GameDbIndex> {
  return fetchRaw<GameDbIndex>(PATHS.index)
}

export async function loadChunk(filename: string): Promise<Game[]> {
  return fetchRaw<Game[]>(PATHS.chunk(filename))
}

export async function loadAllGames(): Promise<{ games: Game[]; index: GameDbIndex }> {
  const index = await loadIndex()
  const chunks = await Promise.all(index.files.map((f) => loadChunk(f.name)))
  const games = chunks.flat()
  return { games, index }
}

export async function loadDeletedLog(): Promise<DeletedGameEntry[]> {
  try {
    return await fetchRaw<DeletedGameEntry[]>(PATHS.deletedJson)
  } catch {
    return []
  }
}

export async function loadCountHistory(): Promise<CountHistoryPoint[]> {
  try {
    return await fetchRaw<CountHistoryPoint[]>(PATHS.countHistory)
  } catch {
    return []
  }
}

export function rebalance(games: Game[]): ChunkPlan[] {
  const numChunks = Math.max(1, Math.ceil(games.length / MAX_PER_FILE))
  return Array.from({ length: numChunks }, (_, i) => ({
    name: `game_info_${String(i + 1).padStart(3, '0')}.json`,
    games: games.slice(i * MAX_PER_FILE, (i + 1) * MAX_PER_FILE),
  }))
}

export function findChunkFor(games: Game[], url: string): {
  chunkIndex: number
  inChunkIndex: number
} | null {
  const allIndex = games.findIndex((g) => g.url === url)
  if (allIndex === -1) return null
  return {
    chunkIndex: Math.floor(allIndex / MAX_PER_FILE),
    inChunkIndex: allIndex % MAX_PER_FILE,
  }
}

export function indexByUrl(games: Game[]): Map<string, Game> {
  return new Map(games.map((g) => [g.url, g]))
}
