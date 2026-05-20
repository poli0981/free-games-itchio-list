export const REPO = {
  owner: 'poli0981',
  name: 'free-games-itchio-list',
  branch: 'main',
} as const

export const RAW_BASE = `https://raw.githubusercontent.com/${REPO.owner}/${REPO.name}/${REPO.branch}`

export const PATHS = {
  index: 'data_game/index.json',
  chunk: (filename: string) => `data_game/${filename}`,
  countHistory: 'data_game/count_history.json',
  deletedJson: 'scripts/deleted_games.json',
  tempLink: 'scripts/temp_link.json',
} as const

export const MAX_PER_FILE = 500
