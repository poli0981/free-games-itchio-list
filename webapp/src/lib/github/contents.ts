import { Octokit } from '@octokit/rest'
import { PATHS, REPO } from '../config'
import { rebalance } from './data-store'
import type { Game } from '@/types/game'

interface FileWithSha {
  content: string
  sha: string
}

export async function readFileWithSha(octokit: Octokit, path: string): Promise<FileWithSha> {
  const { data } = await octokit.repos.getContent({
    owner: REPO.owner,
    repo: REPO.name,
    path,
    ref: REPO.branch,
  })
  if (Array.isArray(data) || data.type !== 'file' || !('content' in data)) {
    throw new Error(`${path} is not a file`)
  }
  const content = atob(data.content.replace(/\n/g, ''))
  return { content, sha: data.sha }
}

export async function putFile(
  octokit: Octokit,
  path: string,
  content: string,
  sha: string,
  message: string,
): Promise<{ commitSha: string }> {
  const utf8 = new TextEncoder().encode(content)
  let binary = ''
  for (let i = 0; i < utf8.length; i++) binary += String.fromCharCode(utf8[i])
  const b64 = btoa(binary)
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner: REPO.owner,
    repo: REPO.name,
    path,
    message,
    content: b64,
    sha,
    branch: REPO.branch,
  })
  return { commitSha: data.commit.sha ?? '' }
}

export interface UpdateGameResult {
  commitSha: string
  chunkFile: string
}

export async function updateGameInChunk(
  octokit: Octokit,
  allGames: Game[],
  url: string,
  edits: Partial<Pick<Game, 'safe_virus' | 'notes' | 'nsfw'>>,
  commitMessage: string,
): Promise<UpdateGameResult> {
  const idx = allGames.findIndex((g) => g.url === url)
  if (idx === -1) throw new Error(`Game ${url} not found in cache`)

  const chunks = rebalance(allGames)
  const chunkIndex = chunks.findIndex((c) => c.games.some((g) => g.url === url))
  if (chunkIndex === -1) throw new Error('Chunk lookup failed')

  const chunkFile = chunks[chunkIndex].name
  const path = PATHS.chunk(chunkFile)

  const { content, sha } = await readFileWithSha(octokit, path)
  const remote = JSON.parse(content) as Game[]
  const remoteIdx = remote.findIndex((g) => g.url === url)
  if (remoteIdx === -1) {
    throw new Error(
      `${url} no longer exists in ${chunkFile}. Refresh and try again — it may have been removed by an automated workflow.`,
    )
  }

  remote[remoteIdx] = { ...remote[remoteIdx], ...edits }
  const newContent = JSON.stringify(remote, null, 4)
  const { commitSha } = await putFile(octokit, path, newContent, sha, commitMessage)
  return { commitSha, chunkFile }
}
