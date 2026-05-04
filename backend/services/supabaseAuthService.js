import { createClient } from "@supabase/supabase-js";
import { ApiError } from "../utils/apiError.js";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new ApiError("Supabase 환경변수가 설정되지 않았습니다.", {
      statusCode: 503,
      code: "SUPABASE_CONFIG_MISSING",
    });
  }

  return { url, anonKey };
}

export function getBearerToken(request) {
  const authHeader = request.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new ApiError("로그인 후 AI 분석을 사용할 수 있습니다.", {
      statusCode: 401,
      code: "AUTH_REQUIRED",
    });
  }

  return token;
}

export async function authorizeProjectAccess({ token, projectId }) {
  if (!projectId) {
    throw new ApiError("projectId가 필요합니다.", {
      statusCode: 400,
      code: "PROJECT_ID_REQUIRED",
    });
  }

  const { url, anonKey } = getSupabaseConfig();
  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    throw new ApiError("로그인 세션이 유효하지 않습니다.", {
      statusCode: 401,
      code: "INVALID_SESSION",
    });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, workspace_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    throw new ApiError("프로젝트 접근 권한을 확인하지 못했습니다.", {
      statusCode: 403,
      code: "PROJECT_AUTH_CHECK_FAILED",
    });
  }

  if (!project) {
    throw new ApiError("이 프로젝트에 접근할 권한이 없습니다.", {
      statusCode: 403,
      code: "PROJECT_FORBIDDEN",
    });
  }

  return {
    user: userData.user,
    project,
  };
}

export async function authorizeWorkspaceAccess({
  token,
  workspaceId,
  allowedRoles = ["owner", "admin", "member", "viewer"],
}) {
  if (!workspaceId) {
    throw new ApiError("workspaceId가 필요합니다.", {
      statusCode: 400,
      code: "WORKSPACE_ID_REQUIRED",
    });
  }

  const { url, anonKey } = getSupabaseConfig();
  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    throw new ApiError("로그인 세션이 유효하지 않습니다.", {
      statusCode: 401,
      code: "INVALID_SESSION",
    });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new ApiError("워크스페이스 접근 권한이 없습니다.", {
      statusCode: 403,
      code: "WORKSPACE_FORBIDDEN",
    });
  }

  if (!allowedRoles.includes(membership.role)) {
    throw new ApiError("이 작업을 수행할 권한이 없습니다.", {
      statusCode: 403,
      code: "WORKSPACE_ROLE_FORBIDDEN",
    });
  }

  return {
    user: userData.user,
    membership,
  };
}
