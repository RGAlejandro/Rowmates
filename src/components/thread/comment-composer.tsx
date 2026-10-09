"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { deleteComment, postComment } from "@/server/actions/comments";
import { t } from "@/i18n";

export function CommentComposer({ circleId, filmId }: { circleId: string; filmId: number }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function send() {
    const text = body.trim();
    if (!text) return;
    startTransition(async () => {
      const result = await postComment({ circleId, filmId, body: text });
      if (!result.ok) toast.error(result.error);
      else setBody("");
    });
  }

  return (
    <form
      className="sticky bottom-20 flex items-end gap-2 rounded-2xl border border-border bg-background/95 p-2 backdrop-blur md:bottom-4"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <Textarea
        rows={2}
        maxLength={2000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("threads.placeholder")}
        className="min-h-0 resize-none border-0 bg-transparent focus-visible:ring-0"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
      />
      <Button type="submit" size="icon" disabled={pending || !body.trim()} aria-label={t("threads.send")}>
        <Send />
      </Button>
    </form>
  );
}

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-xs text-muted-foreground hover:text-destructive"
      onClick={() =>
        startTransition(async () => {
          const result = await deleteComment(commentId);
          if (!result.ok) toast.error(result.error);
        })
      }
    >
      {t("common.delete")}
    </button>
  );
}
