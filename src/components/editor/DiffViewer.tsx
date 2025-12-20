import { Suspense, use, Component, type ReactNode, useState, useTransition } from "react";
import { CodeEditor } from "./CodeEditor";

// --- Actions ---

async function mergeSession(sessionId: string) {
  const res = await fetch(`/api/sessions/${sessionId}/merge`, {
    method: "POST",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to merge changes");
  }
  return res.json();
}

// --- Resource Cache (Simple Promise Caching) ---

const diffCache = new Map<string, Promise<string>>();

function getDiffResource(sessionId: string): Promise<string> {
  let resource = diffCache.get(sessionId);
  if (!resource) {
    resource = fetch(`/api/sessions/${sessionId}/diff`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Error ${res.status}`);
        }
        const text = await res.text();
        return text || "No changes found.";
      })
      // If it fails, remove from cache so we can retry later if needed
      .catch((err) => {
        diffCache.delete(sessionId);
        throw err;
      });
    diffCache.set(sessionId, resource);
  }
  return resource;
}

// --- Components ---

interface DiffViewerProps {
  sessionId: string;
  onClose: () => void;
}

// 1. Error Boundary to catch Suspense/Fetch errors
class DiffErrorBoundary extends Component<
  { children: ReactNode; fallback: (error: Error) => ReactNode },
  { error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

// 2. The Inner Content that Suspends
function DiffContent({ sessionId }: { sessionId: string }) {
  // "use" unwraps the promise. If pending, it suspends. If rejected, it throws.
  const diff = use(getDiffResource(sessionId));

  return (
    <CodeEditor 
      value={diff} 
      language="diff" 
    />
  );
}

// 3. Main Component
export function DiffViewer({ sessionId, onClose }: DiffViewerProps) {
  const [isPending, startTransition] = useTransition();
  const [mergeError, setMergeError] = useState<string | null>(null);

  const handleMerge = () => {
    if (confirm("Are you sure you want to merge these changes into the main branch?")) {
      setMergeError(null);
      startTransition(async () => {
        try {
          await mergeSession(sessionId);
          alert("Merge successful! The session will now be archived.");
          onClose();
        } catch (err) {
          setMergeError(err instanceof Error ? err.message : "An unknown error occurred");
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="bg-background border border-border w-full h-full max-w-6xl flex flex-col rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/20">
          <h2 className="font-bold">Review Changes</h2>
          <button 
            onClick={onClose}
            disabled={isPending}
            className="text-sm px-3 py-1 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
          >
            Close
          </button>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 relative">
          <DiffErrorBoundary
            fallback={(error) => (
              <div className="p-4 text-destructive flex flex-col gap-2">
                <h3 className="font-bold">Error loading diff</h3>
                <pre className="bg-destructive/10 p-2 rounded text-sm overflow-auto">
                  {String(error)}
                </pre>
                <button 
                  onClick={() => {
                     // Simple retry: clear cache and force re-render (by remounting or state)
                     // Since this is a simple implementation, asking user to close/reopen or 
                     // implementing a retry state at the top level would be needed. 
                     // For now, just showing the error is sufficient per requirements.
                  }}
                  className="hidden text-xs underline"
                >
                  Retry
                </button>
              </div>
            )}
          >
            <Suspense 
              fallback={
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                    <p>Loading changes...</p>
                  </div>
                </div>
              }
            >
              <DiffContent sessionId={sessionId} />
            </Suspense>
          </DiffErrorBoundary>
        </div>
        
        {/* Footer */}
        <div className="h-12 border-t border-border flex items-center justify-between px-4 gap-2 bg-muted/20">
          <div className="text-destructive text-sm font-medium truncate max-w-[500px]">
            {mergeError}
          </div>
          <button 
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleMerge}
            disabled={isPending}
          >
            {isPending && <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />}
            {isPending ? "Merging..." : "Merge Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
