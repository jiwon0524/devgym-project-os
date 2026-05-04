import { sendInvitationEmail } from "../services/emailService.js";
import { authorizeWorkspaceAccess, getBearerToken } from "../services/supabaseAuthService.js";
import { assertRateLimit } from "../utils/rateLimiter.js";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "http://127.0.0.1:5173",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

export async function handleInvitationRoutes(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS" && url.pathname.startsWith("/api/invitations/")) {
    sendJson(response, 204, {});
    return true;
  }

  if (request.method !== "POST" || url.pathname !== "/api/invitations/send") {
    return false;
  }

  try {
    const body = await readJsonBody(request);
    const token = getBearerToken(request);
    const { user } = await authorizeWorkspaceAccess({
      token,
      workspaceId: body.workspaceId,
      allowedRoles: ["owner", "admin"],
    });
    assertRateLimit({ key: `invite-email:${user.id}`, limit: 20 });

    if (!body.email || !body.inviteLink || !body.workspaceName) {
      throw new Error("email, inviteLink, workspaceName이 필요합니다.");
    }

    const delivery = await sendInvitationEmail({
      to: body.email,
      workspaceName: body.workspaceName,
      inviterName: user.email,
      role: body.role || "member",
      inviteLink: body.inviteLink,
    });

    sendJson(response, 200, { success: true, delivery });
  } catch (error) {
    sendJson(response, error.statusCode || 400, {
      success: false,
      error: error.message || "초대 이메일 처리에 실패했습니다.",
      code: error.code || "INVITATION_SEND_FAILED",
    });
  }

  return true;
}
