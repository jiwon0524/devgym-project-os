import { ShieldAlert } from "lucide-react";
import { getPermissionWarning } from "../permissions/permissions.js";

export function PermissionNotice({ role, actionLabel, visible }) {
  if (!visible) return null;

  return (
    <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{getPermissionWarning(role, actionLabel)}</p>
    </div>
  );
}
