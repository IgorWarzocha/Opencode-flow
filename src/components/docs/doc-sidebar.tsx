import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  RefreshCw,
  Search,
  Book,
  Box,
  Folder,
  Code,
  Terminal,
  Database,
  FileCode,
  Info,
} from "lucide-react";
import { AccordionItem } from "../ui/accordion";
import { cn } from "@/lib/utils";

interface DocFile {
  path: string;
  relativePath: string;
  name: string;
}

interface DocSidebarProps {
  onFileSelect: (path: string, content: string) => void;
  className?: string;
}

const PROJECT_GUIDE_PATTERNS = [
  /^readme(\.md|\.mdx)?$/i,
  /^contributing(\.md|\.mdx)?$/i,
  /^license(\.md|\.mdx|\.txt)?$/i,
  /^changelog(\.md|\.mdx)?$/i,
  /^roadmap(\.md|\.mdx)?$/i,
  /^architecture(\.md|\.mdx)?$/i,
  /^design(\.md|\.mdx)?$/i,
  /^specs?(\.md|\.mdx)?$/i,
  /^security(\.md|\.mdx)?$/i,
  /^code_of_conduct(\.md|\.mdx)?$/i,
  /^authors(\.md|\.mdx)?$/i,
  /^history(\.md|\.mdx)?$/i,
  /^todo(\.md|\.mdx)?$/i,
  /^agents?(\.md|\.mdx)?$/i,
  /^prd(\.md|\.mdx)?$/i,
];

const CATEGORY_ORDER = [
  "Project Guides",
  "Documentation",
  "Packages",
  "Components",
  "Server",
  "Source",
  "Configuration",
];

// Helper to find the common root directory from a list of paths
function findCommonRoot(paths: string[]): string {
  if (paths.length === 0) return "";
  const firstP = paths[0];
  if (paths.length === 1 && firstP) {
    const parts = firstP.split("/");
    parts.pop(); // Remove filename
    return parts.join("/") + "/";
  }

  const splitPaths = paths.map((p) => p.split("/"));
  const firstPath = splitPaths[0];

  if (!firstPath) return "";

  const commonParts = [];

  for (let i = 0; i < firstPath.length; i++) {
    const segment = firstPath[i];
    if (splitPaths.every((p) => p[i] === segment)) {
      commonParts.push(segment);
    } else {
      break;
    }
  }

  const root = commonParts.join("/");
  return root.endsWith("/") ? root : root + "/";
}

function organizeDocs(files: DocFile[]) {
  const categories: Record<string, DocFile[]> = {};

  const addToCategory = (category: string, file: DocFile) => {
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category]?.push(file);
  };

  files.forEach((file) => {
    const { relativePath, name } = file;
    const parts = relativePath.split("/");

    const firstPart = parts[0];
    if (!firstPart) {
      if (parts.length === 1 && PROJECT_GUIDE_PATTERNS.some((p) => p.test(name))) {
        addToCategory("Project Guides", file);
      } else {
        addToCategory("Root", file);
      }
      return;
    }

    // 1. Root files (Project Guides vs Misc)
    if (parts.length === 1) {
      if (PROJECT_GUIDE_PATTERNS.some((p) => p.test(name))) {
        addToCategory("Project Guides", file);
      } else if (name.startsWith(".")) {
        addToCategory("Configuration", file);
      } else {
        addToCategory("Root", file);
      }
      return;
    }

    const topFolder = firstPart.toLowerCase();

    // 2. Standard Directories
    if (["docs", "documentation", "doc"].includes(topFolder)) {
      addToCategory("Documentation", {
        ...file,
        name: parts.slice(1).join("/"), // Strip 'docs/' prefix from display
      });
      return;
    }

    if (["packages", "apps", "libs", "modules"].includes(topFolder)) {
      // Group by package name if possible
      if (parts.length > 2) {
        addToCategory("Packages", {
          ...file,
          name: parts.slice(1).join("/"),
        });
      } else {
        addToCategory("Packages", file);
      }
      return;
    }

    if (topFolder === "src") {
      // Look at the next folder
      const secondPart = parts[1];
      const subFolder = secondPart ? secondPart.toLowerCase() : "";

      if (subFolder === "components") {
        addToCategory("Components", {
          ...file,
          name: parts.slice(2).join("/") || name,
        });
      } else if (subFolder === "server" || subFolder === "api") {
        addToCategory("Server", {
          ...file,
          name: parts.slice(2).join("/") || name,
        });
      } else {
        addToCategory("Source", {
          ...file,
          name: parts.slice(1).join("/"),
        });
      }
      return;
    }

    if (topFolder === "specs" || topFolder === "specifications") {
      addToCategory("Project Guides", file); // Specs are often guides
      return;
    }

    // 3. Fallback: Group by top-level folder name (Capitalized)
    const category = firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
    addToCategory(category, {
      ...file,
      name: parts.slice(1).join("/"),
    });
  });

  // Sort files within categories
  Object.values(categories).forEach((list) => {
    if (list) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  // Return categories in specific order
  const orderedCategories: Record<string, DocFile[]> = {};

  const sortedKeys = Object.keys(categories).sort((a, b) => {
    const idxA = CATEGORY_ORDER.indexOf(a);
    const idxB = CATEGORY_ORDER.indexOf(b);

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    // Misc/Root last
    if (["Misc", "Root"].includes(a)) return 1;
    if (["Misc", "Root"].includes(b)) return -1;

    return a.localeCompare(b);
  });

  sortedKeys.forEach((key) => {
    const items = categories[key];
    if (items) {
      orderedCategories[key] = items;
    }
  });

  return orderedCategories;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Project Guides":
      return <Book className="w-3.5 h-3.5" />;
    case "Documentation":
      return <FileText className="w-3.5 h-3.5" />;
    case "Packages":
      return <Box className="w-3.5 h-3.5" />;
    case "Components":
      return <Code className="w-3.5 h-3.5" />;
    case "Server":
      return <Database className="w-3.5 h-3.5" />;
    case "Source":
      return <FileCode className="w-3.5 h-3.5" />;
    case "Configuration":
      return <Terminal className="w-3.5 h-3.5" />;
    case "Root":
      return <Info className="w-3.5 h-3.5" />;
    default:
      return <Folder className="w-3.5 h-3.5" />;
  }
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
        const data = await res.json();

        // Handle potential different API response structures
        const rawFiles: any[] = Array.isArray(data) ? data : data.files || [];
        const rawPaths: string[] = rawFiles
          .map((item) => (typeof item === "string" ? item : item.path))
          .filter((p): p is string => !!p);

        const commonRoot = findCommonRoot(rawPaths);

        const docs: DocFile[] = rawPaths.map((path) => {
          let relativePath = path;
          if (commonRoot && path.startsWith(commonRoot)) {
            relativePath = path.slice(commonRoot.length);
          }
          const name = relativePath.split("/").pop() || relativePath;
          return { path, relativePath, name };
        });

        // Deduplicate
        const uniqueDocs = Array.from(new Map(docs.map((item) => [item.path, item])).values());
        setFiles(uniqueDocs);
      } catch (error) {
        console.error("Error fetching docs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [refreshKey]);

  const filteredFiles = useMemo(() => {
    if (!filter) return files;
    const lowerFilter = filter.toLowerCase();
    return files.filter(
      (f) =>
        f.name.toLowerCase().includes(lowerFilter) ||
        f.relativePath.toLowerCase().includes(lowerFilter),
    );
  }, [files, filter]);

  const categorizedDocs = useMemo(() => organizeDocs(filteredFiles), [filteredFiles]);
  const isFiltering = filter.length > 0;

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
    <div className={cn("flex flex-col h-full bg-background border-r border-border", className)}>
      <div className="p-3 border-b border-border flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            Documentation
          </span>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search docs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-secondary/50 border-0 rounded-md pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {loading && files.length === 0 ? (
          <div className="text-xs text-muted-foreground p-3 text-center">Loading...</div>
        ) : Object.keys(categorizedDocs).length === 0 ? (
          <div className="text-xs text-muted-foreground p-3 text-center italic">No docs found</div>
        ) : (
          <div className="flex flex-col gap-1">
            {Object.entries(categorizedDocs).map(([category, catFiles]) => (
              <AccordionItem
                key={category}
                title={category}
                defaultOpen={isFiltering || ["Project Guides", "Documentation"].includes(category)}
                icon={getCategoryIcon(category)}
              >
                <div className="flex flex-col gap-0.5 pl-1 py-1">
                  {catFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleFileClick(file.path)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground text-left group transition-all w-full"
                    >
                      <FileText className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-foreground shrink-0" />
                      <span
                        className="text-xs text-muted-foreground group-hover:text-foreground truncate w-full"
                        title={file.relativePath}
                      >
                        {file.name}
                      </span>
                    </button>
                  ))}
                </div>
              </AccordionItem>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
