import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";

export function APITester() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("/api/hello");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponse("Loading...");
    setStatus(null);

    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (method !== "GET" && method !== "HEAD") {
        options.body = body;
      }

      const res = await fetch(url, options);
      setStatus(res.status);

      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = (await res.json()) as unknown;
        setResponse(JSON.stringify(data, null, 2));
      } else {
        setResponse(await res.text());
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setResponse(`Error: ${err.message}`);
      } else {
        setResponse("An unknown error occurred");
      }
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">API Tester</h1>
        <p className="text-muted-foreground">Test your backend endpoints directly.</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 border p-4 rounded-lg bg-card">
        <div className="grid grid-cols-[100px_1fr] gap-4">
          <div className="space-y-2">
            <Label htmlFor="method">Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="method">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/api/..."
            />
          </div>
        </div>

        {method !== "GET" && method !== "HEAD" && (
          <div className="space-y-2">
            <Label htmlFor="body">Body (JSON)</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="font-mono text-sm h-32"
            />
          </div>
        )}

        <Button type="submit" className="w-full">
          Send Request
        </Button>
      </form>

      {response !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Response</Label>
            {status !== null && (
              <span
                className={`text-xs px-2 py-1 rounded-sm ${
                  status >= 200 && status < 300
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                }`}
              >
                Status: {status}
              </span>
            )}
          </div>
          <pre className="p-4 rounded-lg bg-muted overflow-auto max-h-96 text-sm font-mono whitespace-pre-wrap break-all">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
