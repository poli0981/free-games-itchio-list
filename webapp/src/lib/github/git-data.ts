import type { Octokit } from '@octokit/rest'
import { PATHS, REPO } from '../config'
import { rebalance } from './data-store'
import { buildCommitObject, currentTzOffsetMin, isoFromTs } from '../gpg/canonicalize'
import { getSignerIfEnabled, type CommitSigner } from './signer'
import type { Game } from '@/types/game'

export interface FileChange {
  path: string
  content: string | null
}

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

export async function atomicCommit(
  octokit: Octokit,
  changes: FileChange[],
  message: string,
  signerOverride?: CommitSigner | null,
): Promise<{ commitSha: string }> {
  if (changes.length === 0) throw new Error('No changes to commit')
  // null = caller explicitly opts out of signing; undefined = use default
  const signer =
    signerOverride === null
      ? undefined
      : signerOverride ?? getSignerIfEnabled()

  const { data: refData } = await octokit.git.getRef({
    owner: REPO.owner,
    repo: REPO.name,
    ref: `heads/${REPO.branch}`,
  })
  const baseSha = refData.object.sha

  const { data: baseCommit } = await octokit.git.getCommit({
    owner: REPO.owner,
    repo: REPO.name,
    commit_sha: baseSha,
  })
  const baseTreeSha = baseCommit.tree.sha

  const treeEntries: {
    path: string
    mode: '100644'
    type: 'blob'
    sha: string | null
  }[] = []

  for (const change of changes) {
    if (change.content === null) {
      treeEntries.push({
        path: change.path,
        mode: '100644',
        type: 'blob',
        sha: null,
      })
    } else {
      const { data: blob } = await octokit.git.createBlob({
        owner: REPO.owner,
        repo: REPO.name,
        content: utf8ToBase64(change.content),
        encoding: 'base64',
      })
      treeEntries.push({
        path: change.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      })
    }
  }

  const { data: newTree } = await octokit.git.createTree({
    owner: REPO.owner,
    repo: REPO.name,
    base_tree: baseTreeSha,
    tree: treeEntries,
  })

  const createOpts: Parameters<typeof octokit.git.createCommit>[0] = {
    owner: REPO.owner,
    repo: REPO.name,
    message,
    tree: newTree.sha,
    parents: [baseSha],
  }

  if (signer) {
    const ts = Math.floor(Date.now() / 1000)
    const tzOffsetMin = currentTzOffsetMin()
    // Normalize message to strip any trailing newlines — GitHub stores commit messages
    // verbatim (no auto-trailing-newline), so the canonical bytes we sign must match what
    // GitHub will re-derive from the stored message.
    const normalizedMessage = message.replace(/\n+$/, '')
    createOpts.message = normalizedMessage
    const canonical = buildCommitObject({
      tree: newTree.sha,
      parents: [baseSha],
      author: signer.identity,
      committer: signer.identity,
      ts,
      tzOffsetMin,
      message: normalizedMessage,
    })
    const signature = await signer.sign(canonical)
    const dateIso = isoFromTs(ts, tzOffsetMin)
    createOpts.author = { ...signer.identity, date: dateIso }
    createOpts.committer = { ...signer.identity, date: dateIso }
    createOpts.signature = signature
  }

  const { data: newCommit } = await octokit.git.createCommit(createOpts)

  await octokit.git.updateRef({
    owner: REPO.owner,
    repo: REPO.name,
    ref: `heads/${REPO.branch}`,
    sha: newCommit.sha,
  })

  return { commitSha: newCommit.sha }
}

export interface BulkEditPatch {
  url: string
  patch: Partial<Pick<Game, 'safe_virus' | 'notes' | 'nsfw'>>
}

export async function bulkUpdateGames(
  octokit: Octokit,
  allGames: Game[],
  edits: BulkEditPatch[],
  message: string,
): Promise<{ commitSha: string; touchedFiles: string[] }> {
  if (edits.length === 0) throw new Error('No edits to apply')

  const editsByUrl = new Map(edits.map((e) => [e.url, e.patch]))
  const updated = allGames.map((g) => {
    const patch = editsByUrl.get(g.url)
    return patch ? { ...g, ...patch } : g
  })

  const chunks = rebalance(updated)
  const changedIdx = new Set<number>()
  for (const e of edits) {
    const idx = updated.findIndex((g) => g.url === e.url)
    if (idx >= 0) changedIdx.add(Math.floor(idx / 500))
  }
  const changes: FileChange[] = Array.from(changedIdx).map((i) => ({
    path: PATHS.chunk(chunks[i].name),
    content: JSON.stringify(chunks[i].games, null, 4),
  }))

  const { commitSha } = await atomicCommit(octokit, changes, message)
  return { commitSha, touchedFiles: changes.map((c) => c.path) }
}

export async function bulkDeleteGames(
  octokit: Octokit,
  allGames: Game[],
  urlsToDelete: string[],
  reason: string,
  message: string,
): Promise<{ commitSha: string; touchedFiles: string[] }> {
  if (urlsToDelete.length === 0) throw new Error('No deletions to apply')

  const toDeleteSet = new Set(urlsToDelete)
  const surviving = allGames.filter((g) => !toDeleteSet.has(g.url))
  const removedRecords = allGames.filter((g) => toDeleteSet.has(g.url))

  const oldChunks = rebalance(allGames)
  const newChunks = rebalance(surviving)

  const changes: FileChange[] = []

  for (let i = 0; i < newChunks.length; i++) {
    const oldGames = oldChunks[i]?.games ?? []
    const newGames = newChunks[i].games
    const sameLength = oldGames.length === newGames.length
    const sameContent =
      sameLength && oldGames.every((g, j) => g.url === newGames[j].url)
    if (!sameContent) {
      changes.push({
        path: PATHS.chunk(newChunks[i].name),
        content: JSON.stringify(newGames, null, 4),
      })
    }
  }

  for (let i = newChunks.length; i < oldChunks.length; i++) {
    changes.push({ path: PATHS.chunk(oldChunks[i].name), content: null })
  }

  let deletedLog: { url: string; name: string; reason: string; deleted_at: string }[] = []
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO.owner,
      repo: REPO.name,
      path: PATHS.deletedJson,
      ref: REPO.branch,
    })
    if (!Array.isArray(data) && data.type === 'file' && 'content' in data) {
      const decoded = atob(data.content.replace(/\n/g, ''))
      deletedLog = JSON.parse(decoded || '[]')
    }
  } catch {
    deletedLog = []
  }
  const now = new Date().toISOString()
  for (const g of removedRecords) {
    deletedLog.push({ url: g.url, name: g.name, reason, deleted_at: now })
  }
  changes.push({
    path: PATHS.deletedJson,
    content: JSON.stringify(deletedLog, null, 4),
  })

  const { commitSha } = await atomicCommit(octokit, changes, message)
  return { commitSha, touchedFiles: changes.map((c) => c.path) }
}
