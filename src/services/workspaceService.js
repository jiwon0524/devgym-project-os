import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { getCurrentSession } from "../lib/supabaseClient.js";
import { currentUserId } from "../features/workspace/workspaceData.js";
import { assertUuid, isUuid } from "./idGuards.js";
import { getAvatarColor, mapInvitation, mapWorkspace, mapWorkspaceMember, toDbRole } from "./mappers.js";
import { getMockUser, makeMockId, readMockStore, updateMockStore } from "./mockStore.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function buildInviteLink(invite) {
  const baseUrl = import.meta.env.VITE_APP_BASE_URL || globalThis.location?.origin || "";
  const token = encodeURIComponent(invite.token || invite.id);
  return `${baseUrl || ""}/?invite=${token}`;
}

async function requestInviteEmail({ workspaceId, workspaceName, invite }) {
  const session = await getCurrentSession();
  if (!session?.access_token) {
    return {
      sent: false,
      provider: "manual-link",
      reason: "AUTH_REQUIRED",
      inviteLink: buildInviteLink(invite),
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/invitations/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      workspaceId,
      workspaceName,
      email: invite.email,
      role: invite.role,
      inviteLink: buildInviteLink(invite),
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) {
    return {
      sent: false,
      provider: "manual-link",
      reason: payload.code || "INVITE_EMAIL_FAILED",
      error: payload.error || "초대 이메일 발송에 실패했습니다.",
      inviteLink: buildInviteLink(invite),
    };
  }

  return payload.delivery;
}

export async function getWorkspaces() {
  if (!isSupabaseConfigured) return readMockStore().workspaces;

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(mapWorkspace);
}

export async function getWorkspaceMembers(workspaceId) {
  if (!isSupabaseConfigured) {
    return readMockStore().workspaceMembers.filter((member) => member.workspaceId === workspaceId);
  }
  if (!isUuid(workspaceId)) return [];

  const { data, error } = await supabase
    .from("workspace_members")
    .select("*, profiles:profiles(id,email,display_name,avatar_url)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(mapWorkspaceMember);
}

export async function createWorkspace({ name, ownerId }) {
  if (!isSupabaseConfigured) {
    const user = getMockUser();
    const workspace = {
      id: makeMockId("workspace"),
      name,
      ownerId: ownerId || currentUserId,
      createdAt: new Date().toISOString(),
    };
    const ownerMember = {
      id: makeMockId("wm"),
      workspaceId: workspace.id,
      userId: ownerId || currentUserId,
      name: user.display_name || "지원",
      email: user.email,
      role: "Owner",
      status: "Active",
      online: true,
      editing: "워크스페이스 설정",
      avatarColor: getAvatarColor(ownerId || currentUserId),
    };

    updateMockStore((store) => ({
      ...store,
      workspaces: [...store.workspaces, workspace],
      workspaceMembers: [...store.workspaceMembers, ownerMember],
    }));

    return { workspace, ownerMember };
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({ name, owner_id: ownerId })
    .select("*")
    .single();

  if (error) throw error;

  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: workspace.id,
      user_id: ownerId,
      role: "owner",
    })
    .select("*, profiles:profiles(id,email,display_name,avatar_url)")
    .single();

  if (memberError) throw memberError;

  return {
    workspace: mapWorkspace(workspace),
    ownerMember: mapWorkspaceMember(member),
  };
}

export async function getInvitations(workspaceId) {
  if (!isSupabaseConfigured) {
    return readMockStore().invitations.filter((invite) => invite.workspaceId === workspaceId);
  }
  if (!isUuid(workspaceId)) return [];

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapInvitation);
}

export async function inviteMember({ workspaceId, workspaceName, email, role, invitedBy }) {
  if (!isSupabaseConfigured) {
    const invite = {
      id: makeMockId("invite"),
      workspaceId,
      email,
      role,
      status: "Pending",
      token: `mock-${globalThis.crypto?.randomUUID?.() || makeMockId("token")}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: invitedBy || "지원",
      createdAt: new Date().toISOString(),
    };

    updateMockStore((store) => ({
      ...store,
      invitations: [invite, ...store.invitations],
    }));

    return {
      ...invite,
      emailDelivery: {
        sent: false,
        provider: "manual-link",
        reason: "MOCK_MODE",
        inviteLink: buildInviteLink(invite),
      },
    };
  }

  assertUuid(workspaceId, "워크스페이스 ID");

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      workspace_id: workspaceId,
      email,
      role: toDbRole(role),
      invited_by: invitedBy,
    })
    .select("*")
    .single();

  if (error) throw error;
  const invite = mapInvitation(data);
  const emailDelivery = await requestInviteEmail({
    workspaceId,
    workspaceName: workspaceName || "ProjectOS",
    invite,
  });

  return { ...invite, emailDelivery };
}

export async function acceptInvitation({ inviteId, userId, userEmail }) {
  if (!isSupabaseConfigured) {
    const mockUser = getMockUser();
    const nextEmail = userEmail || mockUser.email;
    const existingInvite = readMockStore().invitations.find((item) => item.id === inviteId);
    if (!existingInvite) throw new Error("초대를 찾을 수 없습니다.");
    if (existingInvite.status !== "Pending") throw new Error("이미 처리된 초대입니다.");
    if (existingInvite.expiresAt && new Date(existingInvite.expiresAt) < new Date()) throw new Error("만료된 초대입니다.");
    if (existingInvite.email.toLowerCase() !== nextEmail.toLowerCase()) {
      throw new Error("초대받은 이메일 계정으로만 수락할 수 있습니다.");
    }

    const store = updateMockStore((current) => {
      const invite = current.invitations.find((item) => item.id === inviteId);
      if (!invite) return current;

      return {
        ...current,
        invitations: current.invitations.map((item) =>
          item.id === inviteId ? { ...item, status: "Accepted" } : item
        ),
        workspaceMembers: [
          ...current.workspaceMembers,
          {
            id: makeMockId("wm"),
            workspaceId: invite.workspaceId,
            userId: userId || makeMockId("user"),
            name: nextEmail.split("@")[0],
            email: invite.email,
            role: invite.role,
            status: "Active",
            online: false,
            editing: "",
            avatarColor: "bg-slate-700",
          },
        ],
      };
    });

    return store.invitations.find((item) => item.id === inviteId);
  }

  const { data, error } = await supabase.rpc("accept_workspace_invitation", { p_invite_id: inviteId });

  if (error) throw error;
  return mapInvitation(data);
}

export async function updateMemberRole({ memberId, role }) {
  if (!isSupabaseConfigured) {
    updateMockStore((store) => ({
      ...store,
      workspaceMembers: store.workspaceMembers.map((member) =>
        member.id === memberId ? { ...member, role } : member
      ),
    }));
    return;
  }

  const { error } = await supabase
    .from("workspace_members")
    .update({ role: toDbRole(role) })
    .eq("id", memberId);

  if (error) throw error;
}
