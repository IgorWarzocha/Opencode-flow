/**
 * Monaco Editor - Core editing component
 * Integrated with TypeScript support and custom AI completion hooks.
 */
import Editor from "@monaco-editor/react";

export const CodeEditor = () => {
  return <Editor height="90vh" defaultLanguage="typescript" />;
};
