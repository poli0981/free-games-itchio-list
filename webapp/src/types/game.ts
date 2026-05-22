export interface Game {
  url: string
  name: string
  dev: string
  description: string
  genre: string
  status: string
  publisher: string
  release_date: string
  rating: string
  rating_count: string
  average_session: string
  nsfw: 'Yes' | 'No' | string
  thumbnail: string
  tags: string[]
  platforms: string[]
  languages: string[]
  inputs: string[]
  made_with: string[]
  safe_virus: '?' | 'Yes' | 'No' | 'Caution' | string
  notes: string
}

export interface GameDbIndex {
  total_games: number
  max_per_file: number
  last_updated: string
  files: Array<{
    name: string
    count: number
  }>
}

export interface DeletedGameEntry {
  url: string
  name: string
  reason: string
  deleted_at: string
}

export interface CountHistoryPoint {
  date: string
  total: number
}

export interface ChunkPlan {
  name: string
  games: Game[]
}
