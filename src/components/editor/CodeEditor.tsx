/**
 * Code Editor Component
 * Wraps Monaco Editor with React 19 patterns and integrates Supermaven AI completions.
 * Provides a controlled input interface for code editing.
 */
import { Editor, type OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "../theme/theme-provider";

// Define strict types for Monaco namespace subsets used
type MonacoNamespace = typeof Monaco;

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
}

export function CodeEditor({ value, onChange, language = "typescript" }: CodeEditorProps) {
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      setResolvedTheme(media.matches ? "dark" : "light");
      const listener = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? "dark" : "light");
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    setResolvedTheme(theme);
    return undefined;
  }, [theme]);

  // Refs to manage lifecycle of Monaco disposables
  const completionProviderRef = useRef<Monaco.IDisposable | null>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cleanup provider on unmount
  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
        console.info("Supermaven: Completion provider disposed");
      }
    };
  }, []);

  // Custom ResizeObserver to handle layout changes without crashing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to avoid "ResizeObserver loop completed with undelivered notifications"
      // and ensure layout happens in the next frame
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) return;
        if (editorRef.current) {
          editorRef.current.layout();
        }
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleEditorDidMount: OnMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: MonacoNamespace) => {
      console.info("CodeEditor: Mounted");
      editorRef.current = editor;

      // Register a dummy "Supermaven" completion provider
      // In a real implementation, this would connect to the Supermaven sidecar/agent
      completionProviderRef.current = monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: (
          model: Monaco.editor.ITextModel,
          position: Monaco.Position,
        ): Monaco.languages.ProviderResult<Monaco.languages.CompletionList> => {
          const word = model.getWordUntilPosition(position);
          const range: Monaco.IRange = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          return {
            suggestions: [
              {
                label: "Supermaven Suggestion",
                kind: monaco.languages.CompletionItemKind.Event,
                documentation: "AI-powered completion by Supermaven",
                insertText: 'console.info("Hello from Supermaven 🚀");',
                detail: "AI Autocomplete",
                range: range,
              },
            ],
          };
        },
      });

      console.info("Supermaven: Completion provider registered");
    },
    [language],
  );

  // Cast Editor to any to avoid React 19 type incompatibility with current library version
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const MonacoEditor = Editor as any;

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <MonacoEditor
        height="100%"
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        defaultLanguage={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: false, // We handle this manually now
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
        }}
      />
    </div>
  );
}
