import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { currentUserId } from "../features/workspace/workspaceData.js";
import { getAvatarColor, mapInvitation, mapWorkspace, mapWorkspaceMember, toDbRole } from "./mappers.js";
import { getMockUser, makeMockId, readMockStore, updateMockStore } from "./mockStore.js";

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

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapInvitation);
}

export async function inviteMember({ workspaceId, email, role, invitedBy }) {
  if (!isSupabaseConfigured) {
    const invite = {
      id: makeMockId("invite"),
      workspaceId,
      email,
      role,
      status: "Pending",
      invitedBy: invitedBy || "지원",
      createdAt: new Date().toISOString(),
    };

    updateMockStore((store) => ({
      ...store,
      invitations: [invite, ...store.invitations],
    }));

    return invite;
  }

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
  return mapInvitation(data);
}

export async function acceptInvitation({ inviteId, userId }) {
  if (!isSupabaseConfigured) {
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
            userId: makeMockId("user"),
            name: invite.email.split("@")[0],
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

  const { data: invite, error: inviteError } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (inviteError) throw inviteError;

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: invite.workspace_id,
    user_id: userId,
    role: invite.role,
  });

  if (memberError && memberError.code !== "23505") throw memberError;

  const { data, error } = await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", inviteId)
    .select("*")
    .single();

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
