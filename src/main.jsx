import React from "react";
import { createRoot } from "react-dom/client";
import AICompanyApp from "./AICompanyApp.jsx";
import "./index.css";

const CLIENT_VERSION = "2026.05.06-api-automation";
const versionKey = "devgym-client-version";
const previousVersion = localStorage.getItem(versionKey);

if (previousVersion !== CLIENT_VERSION) {
  Object.keys(localStorage)
    .filter((key) => key.startsWith("ai-company-") || key.startsWith("projectos."))
    .forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(versionKey, CLIENT_VERSION);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

if ("caches" in window) {
  caches.keys?.().then((keys) => keys.forEach((key) => caches.delete(key)));
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
          <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase text-red-600">Render error</p>
            <h1 className="mt-2 text-xl font-semibold">화면을 다시 불러오지 못했습니다</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              브라우저에 저장된 이전 테스트 데이터가 깨졌을 수 있습니다. 아래 버튼을 누르면 로컬 저장소를 지우고 새 버전으로 다시 시작합니다.
            </p>
            <pre className="mt-4 overflow-auto rounded-md bg-slate-100 p-3 text-xs text-slate-700">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              저장 데이터 지우고 새로고침
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AICompanyApp />
    </AppErrorBoundary>
  </React.StrictMode>
);

