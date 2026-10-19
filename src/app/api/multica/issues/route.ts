import { NextRequest, NextResponse } from 'next/server'
import { listIssues, createIssue, updateIssue, deleteIssue, type CreateIssueInput, type IssueStatus } from '@/lib/multica-api'

// ── Load credentials — matches MC's token file pattern ────────────────────────
function loadCredentials(): { token: string; workspaceId: string } {
  // 1. MC's token file
  const tokenPath = `${process.cwd()}/.data/mission-control-tokens.json`
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    const raw = fs.readFileSync(tokenPath, 'utf8')
    const data = JSON.parse(raw) as { multica?: { token: string; workspaceId: string } }
    if (data.multica?.token && data.multica?.workspaceId) {
      return { token: data.multica.token, workspaceId: data.multica.workspaceId }
    }
  } catch {}
  // 2. env vars (absolute paths to avoid HOME drift)
  if (process.env.MULTICA_API_TOKEN && process.env.MULTICA_WORKSPACE_ID) {
    return { token: process.env.MULTICA_API_TOKEN, workspaceId: process.env.MULTICA_WORKSPACE_ID }
  }
  throw new Error('Multica credentials not configured. Set MULTICA_API_TOKEN + MULTICA_WORKSPACE_ID or add multica entry to .data/mission-control-tokens.json')
}

function creds() {
  try {
    return loadCredentials()
  } catch (err) {
    return null
  }
}

// ── GET /api/multica/issues ────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const credentials = creds()
  if (!credentials) return NextResponse.json({ error: 'Credentials not loaded' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') ?? '50'
  const status = searchParams.get('status') as IssueStatus | null
  try {
    const result = await listIssues(credentials.token, credentials.workspaceId, {
      limit: parseInt(limit, 10),
      status: status ?? undefined,
    })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

// ── POST /api/multica/issues ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const credentials = creds()
  if (!credentials) return NextResponse.json({ error: 'Credentials not loaded' }, { status: 401 })
  try {
    const body = (await request.json()) as CreateIssueInput
    const issue = await createIssue(credentials.token, credentials.workspaceId, body)
    return NextResponse.json(issue, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

// ── PATCH /api/multica/issues?id= ────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const credentials = creds()
  if (!credentials) return NextResponse.json({ error: 'Credentials not loaded' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id query param' }, { status: 400 })
  try {
    const body = (await request.json()) as Partial<CreateIssueInput & { status: IssueStatus }>
    const issue = await updateIssue(credentials.token, credentials.workspaceId, id, body)
    return NextResponse.json(issue)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

// ── DELETE /api/multica/issues?id= ───────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const credentials = creds()
  if (!credentials) return NextResponse.json({ error: 'Credentials not loaded' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id query param' }, { status: 400 })
  try {
    await deleteIssue(credentials.token, credentials.workspaceId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
