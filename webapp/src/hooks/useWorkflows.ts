import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/stores/auth'
import { createOctokit } from '@/lib/github/client'
import { listWorkflowRuns, type WorkflowFile } from '@/lib/github/workflow'
import type { MessageKey } from '@/lib/i18n'

export const WORKFLOWS: { file: WorkflowFile; labelKey: MessageKey; descriptionKey: MessageKey }[] = [
  { file: 'update.yml', labelKey: 'workflows.update.label', descriptionKey: 'workflows.update.desc' },
  { file: 'check_paid.yml', labelKey: 'workflows.checkPaid.label', descriptionKey: 'workflows.checkPaid.desc' },
  { file: 'check_alive.yml', labelKey: 'workflows.checkAlive.label', descriptionKey: 'workflows.checkAlive.desc' },
  { file: 'generate_table.yml', labelKey: 'workflows.generateTables.label', descriptionKey: 'workflows.generateTables.desc' },
  { file: 'log_deleted.yml', labelKey: 'workflows.logDeleted.label', descriptionKey: 'workflows.logDeleted.desc' },
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
