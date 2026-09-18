import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/stores/auth'
import { createOctokit } from '@/lib/github/client'
import { listWorkflowRuns, type WorkflowFile } from '@/lib/github/workflow'
import type { MessageKey } from '@/lib/i18n'

export const WORKFLOWS: { file: WorkflowFile; labelKey: MessageKey; descriptionKey: MessageKey }[] = [
  { file: 'update.yml', labelKey: 'workflows.update.label', descriptionKey: 'workflows.update.desc' },
  { file: 'refresh.yml', labelKey: 'workflows.refresh.label', descriptionKey: 'workflows.refresh.desc' },
  { file: 'force_update.yml', labelKey: 'workflows.forceUpdate.label', descriptionKey: 'workflows.forceUpdate.desc' },
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
