// ── Multica Cloud REST client ──────────────────────────────────────────────────
// Server-side only: credentials are loaded by the API route, not here.

const BASE_URL = 'https://api.multica.ai/api'

export type IssueStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'blocked'
  | 'done'
  | 'cancelled'

export interface MulticaIssue {
  id: string
  workspace_id: string
  number: number
  identifier: string
  title: string
  description: string | null
  status: IssueStatus
  priority: string | null
  assignee_type: string | null
  assignee_id: string | null
  creator_type: string | null
  creator_id: string | null
  parent_issue_id: string | null
  project_id: string | null
  position: number
  stage: string | null
  start_date: string | null
  due_date: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
  labels: string[]
}

export interface CreateIssueInput {
  title: string
  description?: string
  status?: IssueStatus
  priority?: string
  assignee_type?: string
  assignee_id?: string
  parent_issue_id?: string
  project_id?: string
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(token), ...options.headers },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Multica API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function listIssues(
  token: string,
  workspaceId: string,
  opts: { limit?: number; status?: IssueStatus } = {}
): Promise<{ issues: MulticaIssue[]; total: number }> {
  const params = new URLSearchParams({ workspace_id: workspaceId })
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.status) params.set('status', opts.status)
  return request(`/issues?${params}`, token)
}

export async function createIssue(
  token: string,
  workspaceId: string,
  input: CreateIssueInput
): Promise<MulticaIssue> {
  return request(`/issues?workspace_id=${workspaceId}`, token, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateIssue(
  token: string,
  workspaceId: string,
  id: string,
  patch: Partial<CreateIssueInput & { status: IssueStatus }>
): Promise<MulticaIssue> {
  return request(`/issues/${id}?workspace_id=${workspaceId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteIssue(token: string, workspaceId: string, id: string): Promise<void> {
  await request(`/issues/${id}?workspace_id=${workspaceId}`, token, { method: 'DELETE' })
}
