/**
 * One catalog entry as the app holds it. The description is not part of it: it
 * lives in separate packs, loaded on demand (hooks/useDescriptions.ts).
 */
export interface Game {
  url: string
  name: string
  dev: string
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
  /** Set by the pipeline when the game was added (ISO-8601, UTC). */
  added_at?: string
  /** itch.io "Updated" date as shown on the game page. */
  updated_at?: string
  /**
   * The creator's generative-AI disclosure on itch.io: "No AI", "AI Assisted"
   * or "N/A" (not disclosed). Absent on records the pipeline has not re-checked
   * since 4.3 (the same as "N/A" for display).
   */
  ai_disclosure?: string
  /** What AI was used for when assisted ("Graphics", "Text", "Code", "Sounds"). */
  ai_content?: string[]
  /** itch.io accessibility features ("Subtitles", "Configurable controls", …). */
  accessibility?: string[]
}

export interface CatalogIndex {
  total_games: number
  last_updated: string
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
