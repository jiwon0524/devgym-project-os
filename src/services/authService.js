import { getBackendMode, getCurrentSession, getCurrentUser, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { getMockUser } from "./mockStore.js";
import { mapProfile } from "./mappers.js";

export async function getSession() {
  if (!isSupabaseConfigured) {
    return {
      user: mapProfile(getMockUser()),
      mode: "mock",
    };
  }

  const session = await getCurrentSession();
  const user = await getCurrentUser();

  return {
    session,
    user,
    mode: getBackendMode(),
  };
}

export async function getCurrentProfile() {
  if (!isSupabaseConfigured) return mapProfile(getMockUser());

  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return mapProfile(data);
}

export async function signUp({ email, password, displayName }) {
  if (!isSupabaseConfigured) {
    return {
      user: mapProfile({
        ...getMockUser(),
        email,
        display_name: displayName || email.split("@")[0],
      }),
      mode: "mock",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split("@")[0],
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      display_name: displayName || email.split("@")[0],
    });
  }

  return data;
}

export async function login({ email, password }) {
  if (!isSupabaseConfigured) {
    return {
      user: mapProfile({
        ...getMockUser(),
        email,
        display_name: email.split("@")[0],
      }),
      mode: "mock",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
