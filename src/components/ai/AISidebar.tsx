import { useState, useCallback } from 'react';

interface SearchResult {
  filePath: string;
  distance: number;
}

interface IndexResponse {
  count?: number;
  [key: string]: unknown;
}

interface SearchResponse {
  results?: SearchResult[];
  [key: string]: unknown;
}

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISidebar({ isOpen, onClose }: AISidebarProps) {
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState<string | null>(null);
  
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleIndex = async () => {
    setIsIndexing(true);
    setIndexingStatus("Indexing...");
    try {
      const res = await fetch('/api/ai/index', { method: 'POST' });
      if (!res.ok) throw new Error('Indexing failed');
      const data = (await res.json()) as IndexResponse;
      setIndexingStatus(`Indexed ${data.count ?? 'all'} files successfully.`);
    } catch (e) {
      setIndexingStatus('Error indexing codebase.');
      console.error(e);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error('Search failed');
      const data = (await res.json()) as SearchResponse;
      setResults(data.results ?? []);
    } catch (e) {
      console.error(e);
      // setResults([]); // Optional: clear or keep previous
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-sidebar border-l border-sidebar-border shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <h2 className="font-semibold text-sidebar-foreground">AI Tools</h2>
        <button 
          onClick={onClose}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          aria-label="Close AI Sidebar"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        {/* Indexing Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-sidebar-foreground">Codebase Indexing</h3>
          <button
            onClick={() => void handleIndex()}
            disabled={isIndexing}
            className="w-full px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isIndexing ? 'Indexing...' : 'Index Codebase'}
          </button>
          {indexingStatus && (
            <p className="text-xs text-muted-foreground">{indexingStatus}</p>
          )}
        </div>

        {/* Search Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-sidebar-foreground">Semantic Search</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about your code..."
              className="flex-1 px-3 py-2 bg-input text-foreground border border-border rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            />
          </div>
          <button
            onClick={() => void handleSearch()}
            disabled={isSearching}
             className="w-full px-3 py-2 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Results</h4>
            <ul className="space-y-2">
              {results.map((result, idx) => (
                <li key={idx} className="p-2 bg-card border border-border rounded-md hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="text-sm font-medium text-card-foreground break-all">{result.filePath}</div>
                  <div className="text-xs text-muted-foreground mt-1">Distance: {result.distance.toFixed(4)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}