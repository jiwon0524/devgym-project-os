const SUPABASE_REST_SUFFIX = "/rest/v1";
const artifactOwner = { prd: "pm", wbs: "dev", uml: "ux", api: "arch", qa: "qa", risk: "strategy", release: "ops", integrations: "ops", final: "ceo" };

function normalizeSupabaseUrl(url) {
  return url.replace(/\/$/, "").replace(/\/rest\/v1$/, "");
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceKey) return null;
  return { restUrl: `${normalizeSupabaseUrl(url)}${SUPABASE_REST_SUFFIX}`, serviceKey };
}

async function supabaseRequest(path, { method = "GET", body, query, prefer = "return=representation" } = {}) {
  const config = getSupabaseConfig();
  if (!config) return { ok: false, skipped: true, error: "Supabase service key is not configured." };
  const url = new URL(`${config.restUrl}/${path}`);
  if (query) for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== null) url.searchParams.set(key, value);
  try {
    const response = await fetch(url, {
      method,
      headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, "Content-Type": "application/json", Prefer: prefer },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) return { ok: false, error: data?.message || data?.hint || `Supabase request failed (${response.status})`, data };
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message || "Supabase request failed." };
  }
}

function rows(data) { return Array.isArray(data) ? data : data ? [data] : []; }
function isMissingSchema(error = "") { return /schema cache|could not find|ai_company_projects|column|agent_id|revision|current_agent|current_phase|completed_at|updated_at|error_message|method|ai_project_id/i.test(error); }

function flattenDeliverables(artifacts = {}) {
  return Object.entries(artifacts).flatMap(([type, items]) => {
    if (!Array.isArray(items)) return [];
    return items.map((item, index) => ({ type, agent_id: item.ownerId || artifactOwner[type] || "ceo", title: item.title, body: item.body, content: item, revision: item.revision || 1, sort_order: index }));
  });
}

export function isSupabaseConfigured() { return Boolean(getSupabaseConfig()); }

export async function upsertAiCompanyProject({ projectName, mission, method = "agile" }) {
  const existing = await supabaseRequest("ai_company_projects", { query: { select: "*", name: `eq.${projectName}`, order: "created_at.desc", limit: "1" } });
  if (!existing.ok && isMissingSchema(existing.error)) return { ok: true, data: null, skipped: true };
  if (existing.ok && rows(existing.data)[0]) {
    const project = rows(existing.data)[0];
    await supabaseRequest("ai_company_projects", { method: "PATCH", query: { id: `eq.${project.id}` }, body: { mission, method, updated_at: new Date().toISOString() } });
    return { ok: true, data: project };
  }
  const created = await supabaseRequest("ai_company_projects", { method: "POST", body: [{ name: projectName, mission, method, owner_label: "JIWON", status: "active" }] });
  if (!created.ok && isMissingSchema(created.error)) return { ok: true, data: null, skipped: true };
  if (!created.ok) return created;
  return { ok: true, data: rows(created.data)[0] };
}

export async function createQueuedCompanyRun({ command, projectName, mission, method = "agile", selectedAgents = [] }) {
  const projectResult = await upsertAiCompanyProject({ projectName, mission, method });
  if (!projectResult.ok) return { ok: false, error: projectResult.error, data: projectResult.data };
  const resultSeed = { messages: [], notifications: [], artifacts: {}, automationLog: [] };
  const fullBody = { ai_project_id: projectResult.data?.id || null, project_name: projectName, command, mission, method, selected_agents: selectedAgents, status: "queued", current_phase: "OWNER command accepted", result: resultSeed };
  let runResult = await supabaseRequest("agent_runs", { method: "POST", body: [fullBody] });
  if (!runResult.ok && isMissingSchema(runResult.error)) {
    runResult = await supabaseRequest("agent_runs", { method: "POST", body: [{ project_name: projectName, command, mission, selected_agents: selectedAgents, status: "queued", result: resultSeed }] });
  }
  if (!runResult.ok) return { ok: false, error: runResult.error, data: runResult.data };
  return { ok: true, project: projectResult.data, run: rows(runResult.data)[0] };
}

export async function updateCompanyRun(runId, patch) {
  const fullPatch = { ...patch, updated_at: new Date().toISOString() };
  let result = await supabaseRequest("agent_runs", { method: "PATCH", query: { id: `eq.${runId}` }, body: fullPatch });
  if (!result.ok && isMissingSchema(result.error)) {
    const { current_agent, current_phase, error_message, completed_at, updated_at, method, ...legacyPatch } = fullPatch;
    result = await supabaseRequest("agent_runs", { method: "PATCH", query: { id: `eq.${runId}` }, body: legacyPatch });
  }
  return result;
}

export async function appendRunNotification(runId, item) {
  let result = await supabaseRequest("notifications", { method: "POST", body: [{ run_id: runId, agent_id: item.agentId, title: item.title, body: item.body, tone: item.tone || "info" }] });
  if (!result.ok && isMissingSchema(result.error)) {
    result = await supabaseRequest("notifications", { method: "POST", body: [{ run_id: runId, title: item.title, body: item.body, tone: item.tone || "info" }] });
  }
  return result;
}

export async function replaceRunDeliverables(runId, artifacts) {
  await supabaseRequest("deliverables", { method: "DELETE", query: { run_id: `eq.${runId}` }, prefer: "return=minimal" });
  const deliverables = flattenDeliverables(artifacts).map((item) => ({ ...item, run_id: runId }));
  if (!deliverables.length) return { ok: true, data: [] };
  let result = await supabaseRequest("deliverables", { method: "POST", body: deliverables });
  if (!result.ok && isMissingSchema(result.error)) {
    result = await supabaseRequest("deliverables", { method: "POST", body: deliverables.map(({ agent_id, revision, ...item }) => item) });
  }
  return result;
}

export async function replaceRunNotifications(runId, notifications) {
  await supabaseRequest("notifications", { method: "DELETE", query: { run_id: `eq.${runId}` }, prefer: "return=minimal" });
  const body = (notifications || []).map((item) => ({ run_id: runId, agent_id: item.agentId, title: item.title, body: item.body, tone: item.tone || "info" }));
  if (!body.length) return { ok: true, data: [] };
  let result = await supabaseRequest("notifications", { method: "POST", body });
  if (!result.ok && isMissingSchema(result.error)) result = await supabaseRequest("notifications", { method: "POST", body: body.map(({ agent_id, ...item }) => item) });
  return result;
}

export async function saveCompanyRun({ command, projectName, mission, method = "agile", result }) {
  const selectedAgents = result.selectedAgents || [];
  const queued = await createQueuedCompanyRun({ command, projectName, mission, method, selectedAgents });
  if (!queued.ok) return { saved: false, error: queued.error, details: queued.data };
  await replaceRunDeliverables(queued.run.id, result.artifacts);
  await replaceRunNotifications(queued.run.id, result.notifications);
  const updated = await updateCompanyRun(queued.run.id, { selected_agents: selectedAgents, status: "completed", current_agent: "ceo", current_phase: "Completed", result, completed_at: new Date().toISOString() });
  return { saved: updated.ok, runId: queued.run.id, projectId: queued.project?.id || null, error: updated.error };
}

export async function fetchCompanyRun(runId) {
  const runResult = await supabaseRequest("agent_runs", { query: { select: "*", id: `eq.${runId}`, limit: "1" } });
  if (!runResult.ok) return { found: false, error: runResult.error };
  const run = rows(runResult.data)[0];
  if (!run) return { found: false };
  return hydrateRun(run);
}

export async function fetchLatestCompanyRun(projectName) {
  const query = { select: "*", order: "created_at.desc", limit: "1" };
  if (projectName) query.project_name = `eq.${projectName}`;
  const runResult = await supabaseRequest("agent_runs", { query });
  if (!runResult.ok) return { found: false, error: runResult.error };
  const run = rows(runResult.data)[0];
  if (!run) return { found: false };
  return hydrateRun(run);
}

async function hydrateRun(run) {
  const deliverablesResult = await supabaseRequest("deliverables", { query: { select: "*", run_id: `eq.${run.id}`, order: "type.asc,sort_order.asc" } });
  const notificationsResult = await supabaseRequest("notifications", { query: { select: "*", run_id: `eq.${run.id}`, order: "created_at.desc" } });
  const artifacts = {};
  for (const item of deliverablesResult.ok ? deliverablesResult.data || [] : []) {
    artifacts[item.type] ||= [];
    artifacts[item.type].push({ title: item.title, body: item.body, ownerId: item.agent_id, revision: item.revision, ...item.content });
  }
  const notifications = notificationsResult.ok ? (notificationsResult.data || []).map((item) => ({ id: item.id, agentId: item.agent_id, title: item.title, body: item.body, tone: item.tone, createdAt: item.created_at })) : run.result?.notifications;
  return { found: true, run, data: { ...(run.result || {}), selectedAgents: run.selected_agents || run.result?.selectedAgents || [], artifacts: Object.keys(artifacts).length ? artifacts : run.result?.artifacts, notifications, persisted: { runId: run.id, projectId: run.ai_project_id || null, saved: true, status: run.status } } };
}

export async function checkSupabaseConnection() {
  const config = getSupabaseConfig();
  if (!config) return { configured: false, connected: false, error: "Supabase URL or service role key is not configured." };
  const result = await supabaseRequest("agent_runs", { query: { select: "id", limit: "1" } });
  return { configured: true, connected: result.ok, error: result.ok ? null : result.error };
}
