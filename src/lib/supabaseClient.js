import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export function getBackendMode() {
  return isSupabaseConfigured ? "supabase" : "mock";
}

export function getBackendWarning() {
  if (isSupabaseConfigured) return "";
  return "Supabase 환경변수가 없어 로컬 mock 데이터로 실행 중입니다. VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 설정하면 실제 DB에 저장됩니다.";
}

export async function getCurrentUser() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function getCurrentSession() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

export function ensureSupabase() {
  if (!supabase) {
    throw new Error("Supabase가 설정되지 않아 mock 모드로 동작합니다.");
  }

  return supabase;
}
