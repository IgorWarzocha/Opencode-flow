"use client";

import { useEffect, useId, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { Trash2, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Session {
  id: string;
  name: string;
  status: "active" | "archived" | "failed";
  created_at: string;
  updated_at: string;
}

interface SessionSidebarProps {
  activeSessionId: string | null;
  onSelectSession: (id: string | null) => void;
  className?: string;
}

export function SessionSidebar({
  activeSessionId,
  onSelectSession,
  className,
}: SessionSidebarProps) {
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
        onSelectSession(created.id);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to create session.";
        setError(message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    loadSessions();
  }, [loadSessions]);

  return (
    <div className={`flex flex-col h-full bg-background ${className || ""}`}>
      <div className="p-2 border-b border-border space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sessions
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={loadSessions}
            disabled={isLoading}
            title="Refresh"
            className="h-5 w-5"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <form onSubmit={handleCreate} className="flex gap-1">
          <Input
            id={nameId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New Session..."
            className="h-7 text-xs"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={isSubmitting || !name.trim()}
            variant="secondary"
            className="h-7 w-7 shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </form>
        {error && <p className="text-xs text-destructive truncate">{error}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {!isLoading && sessions.length === 0 && (
          <div className="text-center p-4 text-xs text-muted-foreground">No sessions found.</div>
        )}
        {sessions.map((session) => {
          const isActive = activeSessionId === session.id;
          return (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`
                group flex items-center justify-between p-2 rounded-md cursor-pointer border text-xs transition-colors
                ${
                  isActive
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-card hover:bg-accent border-transparent hover:border-border text-foreground"
                }
              `}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium truncate">{session.name}</span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {new Date(session.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDelete(session.id, e)}
                  disabled={deletingId === session.id}
                  title="Delete Session"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
