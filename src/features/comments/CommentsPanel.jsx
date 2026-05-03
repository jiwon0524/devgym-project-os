import { Edit3, MessageSquare, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button.jsx";
import { textareaClassName } from "../../components/FormField.jsx";
import { canUserPerformAction, getPermissionWarning } from "../permissions/permissions.js";

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function CommentsPanel({
  comments,
  currentUser,
  currentRole,
  onAddComment,
  onEditComment,
  onDeleteComment,
}) {
  const safeUser = currentUser || { userId: "anonymous", name: "사용자" };
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingBody, setEditingBody] = useState("");
  const canComment = canUserPerformAction(currentRole, "comment.create");

  const submitComment = (event) => {
    event.preventDefault();
    if (!draft.trim() || !canComment) return;
    onAddComment(draft.trim());
    setDraft("");
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditingBody(comment.body);
  };

  const saveEdit = (commentId) => {
    if (!editingBody.trim()) return;
    onEditComment(commentId, editingBody.trim());
    setEditingId(null);
    setEditingBody("");
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
        <MessageSquare size={16} aria-hidden="true" />
        댓글
      </div>

      <form className="space-y-2" onSubmit={submitComment}>
        <textarea
          className={`${textareaClassName} min-h-20`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="팀과 공유할 메모를 남기세요"
          disabled={!canComment}
        />
        {!canComment ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
            {getPermissionWarning(currentRole, "댓글 작성")}
          </p>
        ) : null}
        <Button type="submit" variant="primary" disabled={!draft.trim() || !canComment}>
          <Send size={14} aria-hidden="true" />
          댓글 남기기
        </Button>
      </form>

      <div className="space-y-3">
        {comments.length ? (
          comments.map((comment) => {
            const isOwn = comment.authorId === safeUser.userId;
            const canEditOwn = isOwn && canUserPerformAction(currentRole, "comment.edit.own");
            const canDeleteOwn = isOwn && canUserPerformAction(currentRole, "comment.delete.own");

            return (
              <div key={comment.id} className="rounded-lg border border-surface-line bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-strong">{comment.authorName}</p>
                    <p className="text-xs text-ink-muted">
                      {formatTime(comment.updatedAt || comment.createdAt)}
                      {comment.updatedAt ? " · 수정됨" : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {canEditOwn ? (
                      <button
                        type="button"
                        className="rounded-md p-1 text-ink-muted transition hover:bg-surface-muted hover:text-ink-strong"
                        onClick={() => startEdit(comment)}
                        aria-label="댓글 수정"
                      >
                        <Edit3 size={14} aria-hidden="true" />
                      </button>
                    ) : null}
                    {canDeleteOwn ? (
                      <button
                        type="button"
                        className="rounded-md p-1 text-ink-muted transition hover:bg-red-50 hover:text-red-700"
                        onClick={() => onDeleteComment(comment.id)}
                        aria-label="댓글 삭제"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
                {editingId === comment.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      className={`${textareaClassName} min-h-20`}
                      value={editingBody}
                      onChange={(event) => setEditingBody(event.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button variant="primary" onClick={() => saveEdit(comment.id)}>
                        저장
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingId(null);
                          setEditingBody("");
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-ink-base">{comment.body}</p>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-surface-line bg-white p-4 text-center text-sm text-ink-muted">
            첫 댓글을 남겨 팀 맥락을 공유하세요.
          </div>
        )}
      </div>
    </section>
  );
}
