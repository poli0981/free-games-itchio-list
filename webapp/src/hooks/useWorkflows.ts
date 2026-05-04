import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/stores/auth'
import { createOctokit } from '@/lib/github/client'
import { listWorkflowRuns, type WorkflowFile } from '@/lib/github/workflow'

export const WORKFLOWS: { file: WorkflowFile; label: string; description: string }[] = [
  { file: 'update.yml', label: 'Update', description: 'Scrape new URLs from temp_link.json + INPUT_URL' },
  { file: 'check_paid.yml', label: 'Check Paid', description: 'Re-verify free/paid status' },
  { file: 'check_alive.yml', label: 'Check Alive', description: 'Verify URLs return 2xx/3xx' },
  { file: 'generate_table.yml', label: 'Generate Tables', description: 'Regenerate lists/*.md' },
  { file: 'log_deleted.yml', label: 'Log Deleted', description: 'Update deleted_games.txt' },
]

export function useWorkflowRuns(workflow: WorkflowFile, enabled = true) {
  const pat = useAuth((s) => s.pat)
  return useQuery({
    queryKey: ['workflows', 'runs', workflow],
    queryFn: () => listWorkflowRuns(createOctokit(), workflow),
    enabled: enabled && !!pat,
    refetchInterval: (q) => {
      const data = q.state.data
      if (data?.some((r) => r.status !== 'completed')) return 5_000
      return 30_000
    },
  })
}
