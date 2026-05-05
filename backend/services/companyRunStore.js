const SUPABASE_REST_SUFFIX = "/rest/v1";

function normalizeSupabaseUrl(url) {
  return url.replace(/\/$/, "").replace(/\/rest\/v1$/, "");
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  return {
    restUrl: `${normalizeSupabaseUrl(url)}${SUPABASE_REST_SUFFIX}`,
    serviceKey,
  };
}

async function supabaseRequest(path, { method = "GET", body, query } = {}) {
  const config = getSupabaseConfig();
  if (!config) {
    return { ok: false, skipped: true, error: "Supabase service key is not configured." };
  }

  const url = new URL(`${config.restUrl}/${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      return { ok: false, error: data?.message || data?.hint || `Supabase request failed (${response.status})`, data };
    }
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message || "Supabase request failed." };
  }
}

function flattenDeliverables(artifacts = {}) {
  return Object.entries(artifacts).flatMap(([type, rows]) => {
    if (!Array.isArray(rows)) return [];
    return rows.map((row, index) => ({
      type,
      title: row.title,
      body: row.body,
      content: row,
      sort_order: index,
    }));
  });
}

export async function saveCompanyRun({ command, projectName, mission, result }) {
  const runInsert = await supabaseRequest("agent_runs", {
    method: "POST",
    body: [{
      project_name: projectName,
      command,
      mission,
      selected_agents: result.selectedAgents || [],
      status: "completed",
      result,
    }],
  });

  if (!runInsert.ok) return { saved: false, error: runInsert.error, details: runInsert.data };

  const run = Array.isArray(runInsert.data) ? runInsert.data[0] : runInsert.data;
  const runId = run?.id;
  if (!runId) return { saved: false, error: "Supabase did not return agent run id." };

  const deliverables = flattenDeliverables(result.artifacts).map((row) => ({ ...row, run_id: runId }));
  const notifications = (result.notifications || []).map((item) => ({
    run_id: runId,
    title: item.title,
    body: item.body,
    tone: item.tone || "info",
  }));

  const deliverableResult = deliverables.length
    ? await supabaseRequest("deliverables", { method: "POST", body: deliverables })
    : { ok: true, data: [] };
  const notificationResult = notifications.length
    ? await supabaseRequest("notifications", { method: "POST", body: notifications })
    : { ok: true, data: [] };

  return {
    saved: deliverableResult.ok && notificationResult.ok,
    runId,
    deliverables: deliverableResult.ok ? deliverableResult.data : [],
    notifications: notificationResult.ok ? notificationResult.data : [],
    error: deliverableResult.error || notificationResult.error,
  };
}

export async function fetchLatestCompanyRun() {
  const runResult = await supabaseRequest("agent_runs", {
    query: {
      select: "*",
      order: "created_at.desc",
      limit: "1",
    },
  });

  if (!runResult.ok) return { found: false, error: runResult.error };
  const run = Array.isArray(runResult.data) ? runResult.data[0] : null;
  if (!run) return { found: false };

  const deliverablesResult = await supabaseRequest("deliverables", {
    query: {
      select: "*",
      run_id: `eq.${run.id}`,
      order: "type.asc,sort_order.asc",
    },
  });
  const notificationsResult = await supabaseRequest("notifications", {
    query: {
      select: "*",
      run_id: `eq.${run.id}`,
      order: "created_at.desc",
    },
  });

  const artifacts = {};
  for (const item of deliverablesResult.ok ? deliverablesResult.data || [] : []) {
    artifacts[item.type] ||= [];
    artifacts[item.type].push({ title: item.title, body: item.body, ...item.content });
  }

  return {
    found: true,
    run,
    data: {
      ...(run.result || {}),
      artifacts: Object.keys(artifacts).length ? artifacts : run.result?.artifacts,
      notifications: notificationsResult.ok
        ? (notificationsResult.data || []).map((item) => ({ title: item.title, body: item.body, tone: item.tone }))
        : run.result?.notifications,
      persisted: { runId: run.id, saved: true },
    },
  };
}
