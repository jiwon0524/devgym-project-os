const toneClasses = {
  Todo: "border-slate-200 bg-slate-50 text-slate-700",
  "In Progress": "border-blue-200 bg-blue-50 text-blue-700",
  Done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "할 일": "border-slate-200 bg-slate-50 text-slate-700",
  "진행 중": "border-blue-200 bg-blue-50 text-blue-700",
  완료: "border-emerald-200 bg-emerald-50 text-emerald-700",
  High: "border-red-200 bg-red-50 text-red-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-slate-200 bg-slate-50 text-slate-600",
  높음: "border-red-200 bg-red-50 text-red-700",
  보통: "border-amber-200 bg-amber-50 text-amber-700",
  낮음: "border-slate-200 bg-slate-50 text-slate-600",
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Invited: "border-amber-200 bg-amber-50 text-amber-700",
  활성: "border-emerald-200 bg-emerald-50 text-emerald-700",
  초대됨: "border-amber-200 bg-amber-50 text-amber-700",
};

const statusLabels = {
  Todo: "할 일",
  "In Progress": "진행 중",
  Done: "완료",
  High: "높음",
  Medium: "보통",
  Low: "낮음",
  Active: "활성",
  Invited: "초대됨",
  "할 일": "할 일",
  "진행 중": "진행 중",
  완료: "완료",
  높음: "높음",
  보통: "보통",
  낮음: "낮음",
  활성: "활성",
  초대됨: "초대됨",
};

export function StatusBadge({ value }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium ${toneClasses[value] || toneClasses.Low}`}
    >
      {statusLabels[value] || value}
    </span>
  );
}
