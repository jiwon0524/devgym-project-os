import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInvitationEmailPayload,
  sendInvitationEmail,
} from "../services/emailService.js";

test("invitation email payload includes workspace and invite link", () => {
  const payload = buildInvitationEmailPayload({
    to: "member@example.com",
    workspaceName: "DevGym",
    inviterName: "owner@example.com",
    role: "Member",
    inviteLink: "https://example.com/?invite=abc",
  });

  assert.equal(payload.to, "member@example.com");
  assert.match(payload.subject, /DevGym/);
  assert.match(payload.text, /https:\/\/example.com/);
  assert.match(payload.html, /초대 수락하기/);
});

test("invitation email falls back to manual link when RESEND_API_KEY is missing", async () => {
  const previousKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  const result = await sendInvitationEmail({
    to: "member@example.com",
    workspaceName: "DevGym",
    inviterName: "owner@example.com",
    role: "Member",
    inviteLink: "https://example.com/?invite=abc",
  });

  assert.equal(result.sent, false);
  assert.equal(result.provider, "manual-link");
  assert.equal(result.reason, "RESEND_API_KEY_MISSING");

  if (previousKey) process.env.RESEND_API_KEY = previousKey;
});
