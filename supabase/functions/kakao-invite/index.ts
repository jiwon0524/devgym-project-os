// Supabase Edge Function scaffold for KakaoTalk invitations.
// Deploy only after KakaoTalk Message API permissions are approved.

type InvitePayload = {
  accessToken: string;
  receiverUuids: string[];
  workspaceName: string;
  inviteUrl: string;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = (await req.json()) as InvitePayload;
  if (!body.accessToken || !body.receiverUuids?.length || !body.inviteUrl) {
    return json({ error: "accessToken, receiverUuids, and inviteUrl are required" }, 400);
  }

  const templateObject = {
    object_type: "text",
    text: `[ProjectOS] ${body.workspaceName || "협업 워크스페이스"}에 초대되었습니다.\n초대 링크로 들어와 카카오 로그인 후 참여하세요.`,
    link: {
      web_url: body.inviteUrl,
      mobile_web_url: body.inviteUrl,
    },
    button_title: "ProjectOS 열기",
  };

  const form = new URLSearchParams();
  form.set("receiver_uuids", JSON.stringify(body.receiverUuids));
  form.set("template_object", JSON.stringify(templateObject));

  const kakaoRes = await fetch("https://kapi.kakao.com/v1/api/talk/friends/message/default/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${body.accessToken}`,
      "content-type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: form,
  });

  const result = await kakaoRes.json().catch(() => ({}));
  if (!kakaoRes.ok) return json({ error: "Kakao API failed", detail: result }, kakaoRes.status);
  return json({ ok: true, result });
});
