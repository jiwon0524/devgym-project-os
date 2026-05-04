import { ApiError } from "../utils/apiError.js";

export function buildInvitationEmailPayload({
  to,
  workspaceName,
  inviterName,
  role,
  inviteLink,
}) {
  const subject = `[ProjectOS] ${workspaceName} 워크스페이스 초대`;
  const text = [
    `${inviterName || "팀 관리자"}님이 ${workspaceName} 워크스페이스에 ${role} 권한으로 초대했습니다.`,
    "",
    `초대 수락: ${inviteLink}`,
    "",
    "이 링크는 초대 만료 전까지만 사용할 수 있습니다.",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px">ProjectOS 워크스페이스 초대</h2>
      <p>${inviterName || "팀 관리자"}님이 <strong>${workspaceName}</strong> 워크스페이스에 <strong>${role}</strong> 권한으로 초대했습니다.</p>
      <p>
        <a href="${inviteLink}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#111827;color:#ffffff;text-decoration:none">
          초대 수락하기
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280">버튼이 열리지 않으면 아래 링크를 브라우저에 붙여넣으세요.</p>
      <p style="font-size:12px;color:#374151;word-break:break-all">${inviteLink}</p>
    </div>
  `;

  return {
    from: process.env.INVITE_EMAIL_FROM || "ProjectOS <onboarding@resend.dev>",
    to,
    subject,
    text,
    html,
  };
}

export async function sendInvitationEmail({
  to,
  workspaceName,
  inviterName,
  role,
  inviteLink,
}) {
  if (!process.env.RESEND_API_KEY) {
    return {
      sent: false,
      provider: "manual-link",
      reason: "RESEND_API_KEY_MISSING",
      inviteLink,
    };
  }

  const payload = buildInvitationEmailPayload({
    to,
    workspaceName,
    inviterName,
    role,
    inviteLink,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data?.message || "초대 이메일 발송에 실패했습니다.", {
      statusCode: response.status,
      code: "INVITE_EMAIL_FAILED",
    });
  }

  return {
    sent: true,
    provider: "resend",
    id: data.id,
  };
}
