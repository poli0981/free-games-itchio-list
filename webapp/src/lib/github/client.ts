import { Octokit } from '@octokit/rest'
import { useAuth } from '@/stores/auth'
import { REPO } from '../config'

export function createOctokit(): Octokit {
  const pat = useAuth.getState().pat
  if (!pat) throw new Error('Not authenticated. Open Settings and unlock your PAT.')
  return new Octokit({ auth: pat, userAgent: 'free-games-itchio-webapp' })
}

export async function fetchAuthenticatedUser(pat: string) {
  const octokit = new Octokit({ auth: pat, userAgent: 'free-games-itchio-webapp' })
  const { data } = await octokit.users.getAuthenticated()
  return {
    login: data.login,
    avatar_url: data.avatar_url,
    name: data.name,
  }
}

export async function checkRepoAccess(pat: string): Promise<boolean> {
  try {
    const octokit = new Octokit({ auth: pat, userAgent: 'free-games-itchio-webapp' })
    await octokit.repos.get({ owner: REPO.owner, repo: REPO.name })
    return true
  } catch {
    return false
  }
}
