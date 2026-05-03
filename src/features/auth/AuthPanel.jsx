import { LogIn, LogOut, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button.jsx";
import { FormField, inputClassName } from "../../components/FormField.jsx";

export function AuthPanel({ mode, user, loading, error, onLogin, onSignUp, onLogout }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    email: "jiwon@devgym.dev",
    password: "",
    displayName: "지원",
  });

  const connected = mode === "supabase";
  const signedIn = Boolean(user);

  const submitLogin = (event) => {
    event.preventDefault();
    onLogin?.({ email: form.email, password: form.password });
  };

  const submitSignUp = (event) => {
    event.preventDefault();
    onSignUp?.({ email: form.email, password: form.password, displayName: form.displayName });
  };

  return (
    <section className="rounded-lg border border-surface-line bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-ink-faint">계정</p>
          <p className="mt-1 truncate text-sm font-semibold text-ink-strong">
            {signedIn ? user.name || user.email : connected ? "로그인이 필요합니다" : "Mock 사용자"}
          </p>
          <p className="mt-1 truncate text-xs text-ink-muted">
            {signedIn ? user.email : connected ? "Supabase Auth 연결됨" : "로컬 모드"}
          </p>
        </div>

        {signedIn && connected ? (
          <button
            type="button"
            className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-muted hover:text-ink-strong"
            onClick={onLogout}
            aria-label="로그아웃"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {connected && !signedIn ? (
        <>
          <button
            type="button"
            className="mt-3 text-xs font-medium text-brand hover:text-brand-strong"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "로그인 폼 닫기" : "이메일로 로그인"}
          </button>

          {expanded ? (
            <form className="mt-3 space-y-3" onSubmit={submitLogin}>
              <FormField label="이메일">
                <input
                  className={inputClassName}
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="name@company.com"
                />
              </FormField>
              <FormField label="비밀번호">
                <input
                  className={inputClassName}
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="8자 이상"
                />
              </FormField>
              <FormField label="이름">
                <input
                  className={inputClassName}
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                  placeholder="지원"
                />
              </FormField>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="primary" disabled={loading || !form.email || !form.password}>
                  <LogIn size={16} aria-hidden="true" />
                  로그인
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading || !form.email || !form.password}
                  onClick={submitSignUp}
                >
                  <UserPlus size={16} aria-hidden="true" />
                  가입
                </Button>
              </div>
            </form>
          ) : null}
        </>
      ) : null}

      {error ? <p className="mt-3 text-xs leading-5 text-red-600">{error}</p> : null}
    </section>
  );
}
