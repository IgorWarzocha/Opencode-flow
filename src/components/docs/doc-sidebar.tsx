import { useState, useEffect } from "react";
import { FileText, RefreshCw, Search } from "lucide-react";

interface DocFile {
  path: string;
  name: string;
}

interface DocSidebarProps {
  onFileSelect: (path: string, content: string) => void;
  className?: string;
}

export function DocSidebar({ onFileSelect, className }: DocSidebarProps) {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/files/search?pattern=**/*.{md,mdx}");
        if (!res.ok) throw new Error("Failed to fetch docs");
        // Assuming the API returns an array of paths or objects
        const data = await res.json();
        // Normalize data to DocFile[]
        const docs: DocFile[] = (Array.isArray(data) ? data : data.files || []).map(
          (item: string | any) => {
            const path = typeof item === "string" ? item : item.path;
            const name = path.split("/").pop() || path;
            return { path, name };
          },
        );
        setFiles(docs);
      } catch (error) {
        console.error("Error fetching docs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [refreshKey]);

  const filteredFiles = files.filter((f) => f.name.toLowerCase().includes(filter.toLowerCase()));

  const handleFileClick = async (path: string) => {
    try {
      const res = await fetch(`/api/files/content?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("Failed to load file content");
      const content = await res.text();
      onFileSelect(path, content);
    } catch (error) {
      console.error("Failed to load file content:", error);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      <div className="p-2 border-b border-border flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Documentation
          </span>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1 hover:bg-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter docs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-background border border-input rounded-md pl-7 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {loading ? (
          <div className="text-xs text-muted-foreground p-2">Loading...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-xs text-muted-foreground p-2 italic">No documentation found.</div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filteredFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => handleFileClick(file.path)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground text-left group transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground truncate w-full">
                  {file.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
