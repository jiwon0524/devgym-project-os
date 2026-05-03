import { AlertCircle, CheckCircle2, Database, Loader2, Wifi } from "lucide-react";

export function BackendBanner({ mode, loading, error, realtimeStatus }) {
  const isMock = mode !== "supabase";

  if (!loading && !error && !isMock && realtimeStatus === "SUBSCRIBED") return null;

  const Icon = loading ? Loader2 : error ? AlertCircle : isMock ? Database : Wifi;
  const title = loading
    ? "데이터를 불러오는 중입니다"
    : error
      ? "데이터 동기화 오류"
      : isMock
        ? "Mock 모드로 실행 중"
        : "Realtime 연결 대기 중";
  const description = loading
    ? "워크스페이스, 프로젝트, 작업, 댓글을 백엔드에서 확인하고 있습니다."
    : error
      ? error
      : isMock
        ? "Supabase 환경변수가 없어서 브라우저 로컬 데이터로 저장됩니다. 앱은 멈추지 않고 계속 사용할 수 있습니다."
        : "Supabase Realtime 구독을 준비하고 있습니다.";

  return (
    <div className="border-b border-surface-line bg-white px-6 py-3">
      <div
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
          error
            ? "border-red-200 bg-red-50 text-red-700"
            : isMock
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-blue-200 bg-blue-50 text-blue-800"
        }`}
      >
        <Icon size={17} className={loading ? "mt-0.5 shrink-0 animate-spin" : "mt-0.5 shrink-0"} aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 leading-5 opacity-90">{description}</p>
        </div>
        {!loading && !error && !isMock ? (
          <CheckCircle2 size={17} className="ml-auto shrink-0" aria-hidden="true" />
        ) : null}
      </div>
    </div>
  );
}
