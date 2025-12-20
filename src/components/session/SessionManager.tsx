/**
 * SessionManager provides a lightweight UI for browsing and managing sessions.
 * It calls the session REST endpoints and keeps local selection state in sync.
 * The component renders as an overlay panel that can be dismissed by the user.
 */
"use client";

import { useEffect, useId, useState, useCallback } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Session {
  id: string;
  name: string;
  status: "active" | "archived" | "failed";
  created_at: string;
  updated_at: string;
}

interface SessionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessionId: string | null;
  onSelectSession: (id: string | null) => void;
}

export function SessionManager({
  isOpen,
  onClose,
  activeSessionId,
  onSelectSession,
}: SessionManagerProps) {
  const nameId = useId();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetch("/api/sessions")
      .then(async (res) => {
        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || "Failed to load sessions.");
        }
        return (await res.json()) as Session[];
      })
      .then((data) => {
        setSessions(data);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load sessions.";
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);

    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || "Failed to create session.");
        }
        return (await res.json()) as Session;
      })
      .then((created) => {
        setSessions((prev) => [created, ...prev.filter((session) => session.id !== created.id)]);
        setName("");
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to create session.";
        setError(message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setError(null);

    fetch(`/api/sessions/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to delete session.");
        }
      })
      .then(() => {
        setSessions((prev) => prev.filter((session) => session.id !== id));
        if (activeSessionId === id) {
          onSelectSession(null);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to delete session.";
        setError(message);
      })
      .finally(() => {
        setDeletingId(null);
      });
  };

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
  }, [isOpen, loadSessions]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative ml-auto flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Sessions</h2>
            <p className="text-xs text-muted-foreground">Manage saved sessions and switch context.</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close sessions">
            ✕
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
          <form className="space-y-3" onSubmit={handleCreate}>
            <div className="space-y-2">
              <label htmlFor={nameId} className="text-sm font-medium text-foreground">
                New session name
              </label>
              <Input
                id={nameId}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Describe this session"
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create session"}
            </Button>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Saved sessions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSessions}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {isLoading && <p className="text-sm text-muted-foreground">Loading sessions...</p>}
            {!isLoading && sessions.length === 0 && (
              <p className="text-sm text-muted-foreground">No sessions yet. Create one to get started.</p>
            )}

            <ul className="space-y-3">
              {sessions.map((session) => {
                const isActive = activeSessionId === session.id;
                return (
                  <li
                    key={session.id}
                    className="rounded-lg border border-border bg-card p-3 text-card-foreground"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{session.name}</span>
                          {isActive && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {session.status} · Updated {new Date(session.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isActive ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => onSelectSession(session.id)}
                        >
                          Load
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(session.id)}
                          disabled={deletingId === session.id}
                        >
                          {deletingId === session.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}