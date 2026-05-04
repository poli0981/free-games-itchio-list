import type { Octokit } from '@octokit/rest'
import { REPO } from '../config'

export type WorkflowFile =
  | 'update.yml'
  | 'check_paid.yml'
  | 'check_alive.yml'
  | 'generate_table.yml'
  | 'log_deleted.yml'

export interface WorkflowRunSummary {
  id: number
  name: string
  status: 'queued' | 'in_progress' | 'completed' | string
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null
  event: string
  created_at: string
  updated_at: string
  html_url: string
  run_number: number
  display_title: string
}

export async function dispatchWorkflow(
  octokit: Octokit,
  workflow: WorkflowFile,
  inputs?: Record<string, string>,
): Promise<void> {
  await octokit.actions.createWorkflowDispatch({
    owner: REPO.owner,
    repo: REPO.name,
    workflow_id: workflow,
    ref: REPO.branch,
    inputs,
  })
}

export async function listWorkflowRuns(
  octokit: Octokit,
  workflow: WorkflowFile,
  perPage = 20,
): Promise<WorkflowRunSummary[]> {
  const { data } = await octokit.actions.listWorkflowRuns({
    owner: REPO.owner,
    repo: REPO.name,
    workflow_id: workflow,
    per_page: perPage,
  })
  return data.workflow_runs.map((r) => ({
    id: r.id,
    name: r.name ?? workflow,
    status: r.status ?? 'queued',
    conclusion: r.conclusion as WorkflowRunSummary['conclusion'],
    event: r.event,
    created_at: r.created_at,
    updated_at: r.updated_at,
    html_url: r.html_url,
    run_number: r.run_number,
    display_title: r.display_title ?? r.name ?? '',
  }))
}

export async function getWorkflowRun(
  octokit: Octokit,
  runId: number,
): Promise<WorkflowRunSummary> {
  const { data } = await octokit.actions.getWorkflowRun({
    owner: REPO.owner,
    repo: REPO.name,
    run_id: runId,
  })
  return {
    id: data.id,
    name: data.name ?? '',
    status: data.status ?? 'queued',
    conclusion: data.conclusion as WorkflowRunSummary['conclusion'],
    event: data.event,
    created_at: data.created_at,
    updated_at: data.updated_at,
    html_url: data.html_url,
    run_number: data.run_number,
    display_title: data.display_title ?? data.name ?? '',
  }
}

export async function findRecentDispatchedRun(
  octokit: Octokit,
  workflow: WorkflowFile,
  sinceMs: number,
): Promise<WorkflowRunSummary | null> {
  const runs = await listWorkflowRuns(octokit, workflow, 5)
  const since = new Date(sinceMs).toISOString()
  return (
    runs.find((r) => r.event === 'workflow_dispatch' && r.created_at >= since) ?? null
  )
}
