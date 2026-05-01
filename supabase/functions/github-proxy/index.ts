// Supabase Edge Function scaffold for GitHub private repo/write access.
// Use a GitHub App installation token or a fine-grained token stored as a
// Supabase secret. Never expose GitHub tokens in index.html.

type GitHubProxyPayload = {
  method?: "GET" | "POST" | "PATCH";
  path: string;
  body?: unknown;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });

const allowed = [
  /^\/repos\/[^/]+\/[^/]+$/,
  /^\/repos\/[^/]+\/[^/]+\/issues(\?.*)?$/,
  /^\/repos\/[^/]+\/[^/]+\/pulls(\?.*)?$/,
  /^\/repos\/[^/]+\/[^/]+\/commits(\?.*)?$/,
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) return json({ error: "Missing GITHUB_TOKEN secret" }, 500);

  const payload = (await req.json()) as GitHubProxyPayload;
  const method = payload.method || "GET";
  if (!payload.path?.startsWith("/") || !allowed.some((re) => re.test(payload.path))) {
    return json({ error: "GitHub path is not allowed" }, 400);
  }
  if (method !== "GET" && method !== "POST" && method !== "PATCH") {
    return json({ error: "Method is not allowed" }, 400);
  }

  const gh = await fetch(`https://api.github.com${payload.path}`, {
    method,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
    },
    body: method === "GET" ? undefined : JSON.stringify(payload.body || {}),
  });

  const data = await gh.json().catch(() => ({}));
  return json(data, gh.status);
});
