"use client";

import { useState, useTransition } from "react";
import { Send, Zap } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { replyAction } from "@/app/dashboard/inbox/actions";
import { QUICK_REPLIES } from "@/lib/quick-replies";
import { renderTemplate } from "@/lib/messaging/tokens";

export function ReplyComposer({
  conversationId,
  bookLink,
}: {
  conversationId: string;
  bookLink?: string;
}) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      await replyAction(conversationId, body);
      setBody("");
    });
  }

  function insert(reply: string) {
    setBody(renderTemplate(reply, { book_link: bookLink }));
    setOpen(false);
  }

  return (
    <form onSubmit={send} className="border-t border-hairline p-3">
      <Textarea
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type a reply…"
        className="text-sm"
      />
      <div className="mt-2 flex items-center justify-between">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-pill bg-black/5 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-black/10"
            >
              <Zap className="h-3.5 w-3.5 text-brand" /> Quick replies
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              sideOffset={6}
              align="start"
              className="z-50 w-72 rounded-card bg-cream p-2 shadow-lg glass"
            >
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => insert(q.body)}
                  className="block w-full rounded-btn px-3 py-2 text-left hover:bg-black/5"
                >
                  <span className="block text-xs font-bold text-ink">{q.label}</span>
                  <span className="block truncate text-xs text-muted">{q.body}</span>
                </button>
              ))}
              <Popover.Arrow className="fill-cream" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          {pending ? "Sending…" : <><Send className="h-4 w-4" /> Send</>}
        </Button>
      </div>
    </form>
  );
}
