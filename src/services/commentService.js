import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { mapComment } from "./mappers.js";
import { makeMockId, readMockStore, updateMockStore } from "./mockStore.js";

export async function getComments(projectId) {
  if (!projectId) return [];

  if (!isSupabaseConfigured) {
    return readMockStore().comments.filter((comment) => !comment.projectId || comment.projectId === projectId);
  }

  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles:profiles(id,email,display_name,avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapComment);
}

export async function createComment({ projectId, targetType, targetId, body, createdBy, authorName = "지원" }) {
  if (!isSupabaseConfigured) {
    const comment = {
      id: makeMockId("comment"),
      projectId,
      targetType,
      targetId,
      authorId: createdBy,
      authorName,
      body,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };

    updateMockStore((store) => ({
      ...store,
      comments: [comment, ...store.comments],
    }));

    return comment;
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      project_id: projectId,
      target_type: targetType,
      target_id: targetId || null,
      body,
      created_by: createdBy,
    })
    .select("*, profiles:profiles(id,email,display_name,avatar_url)")
    .single();

  if (error) throw error;
  return mapComment(data);
}

export async function updateComment({ commentId, body }) {
  if (!isSupabaseConfigured) {
    updateMockStore((store) => ({
      ...store,
      comments: store.comments.map((comment) =>
        comment.id === commentId ? { ...comment, body, updatedAt: new Date().toISOString() } : comment
      ),
    }));
    return;
  }

  const { error } = await supabase.from("comments").update({ body }).eq("id", commentId);
  if (error) throw error;
}

export async function deleteComment(commentId) {
  if (!isSupabaseConfigured) {
    updateMockStore((store) => ({
      ...store,
      comments: store.comments.filter((comment) => comment.id !== commentId),
    }));
    return;
  }

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}
