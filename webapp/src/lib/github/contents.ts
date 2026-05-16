import { Octokit } from '@octokit/rest'
import { PATHS, REPO } from '../config'
import { atomicCommit } from './git-data'
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

/**
 * Single-file commit routed through the Git Data API (so it can be GPG-signed when configured).
 *
 * Replaces the older `putFile` which used `PUT /repos/.../contents/{path}`. That endpoint can
 * never produce a "Verified" commit because GitHub itself authors it from the PAT.
 */
export async function commitSingleFile(
  octokit: Octokit,
  path: string,
  content: string,
  message: string,
): Promise<{ commitSha: string }> {
  return atomicCommit(octokit, [{ path, content }], message)
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

  const { content } = await readFileWithSha(octokit, path)
  const remote = JSON.parse(content) as Game[]
  const remoteIdx = remote.findIndex((g) => g.url === url)
  if (remoteIdx === -1) {
    throw new Error(
      `${url} no longer exists in ${chunkFile}. Refresh and try again — it may have been removed by an automated workflow.`,
    )
  }

  remote[remoteIdx] = { ...remote[remoteIdx], ...edits }
  const newContent = JSON.stringify(remote, null, 4)
  const { commitSha } = await commitSingleFile(octokit, path, newContent, commitMessage)
  return { commitSha, chunkFile }
}
