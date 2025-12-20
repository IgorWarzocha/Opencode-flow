/**
 * Code Editor Component
 * Wraps Monaco Editor with React 19 patterns and integrates Supermaven AI completions.
 * Provides a controlled input interface for code editing.
 */
import { Editor, type OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useEffect, useRef } from "react";

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "typescript",
}: CodeEditorProps) {
  // Refs to manage lifecycle of Monaco disposables
  const completionProviderRef = useRef<Monaco.IDisposable | null>(null);

  // Cleanup provider on unmount
  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
        console.info("Supermaven: Completion provider disposed");
      }
    };
  }, []);

  const handleEditorDidMount: OnMount = (_editor, monaco) => {
    console.info("CodeEditor: Mounted");

    // Register a dummy "Supermaven" completion provider
    // In a real implementation, this would connect to the Supermaven sidecar/agent
    completionProviderRef.current = monaco.languages.registerCompletionItemProvider(
      language,
      {
        provideCompletionItems: (
          model: Monaco.editor.ITextModel,
          position: Monaco.Position
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
      }
    );

    console.info("Supermaven: Completion provider registered");
  };

  // Cast Editor to any to avoid React 19 type incompatibility
  const MonacoEditor = Editor as any;

  return (
    <MonacoEditor
      height="100%"
      theme="vs-dark"
      defaultLanguage={language}
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: true },
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
      }}
    />
  );
}


