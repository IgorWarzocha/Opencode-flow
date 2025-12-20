# Editor

The Editor module provides a rich code editing experience powered by Monaco Editor. It is designed to be a robust, controlled component that integrates seamlessly with AI capabilities.

## Architecture

The core component `CodeEditor` wraps the `@monaco-editor/react` library, adapting it to the project's React 19 patterns.

### Key Features

*   **Monaco Editor Integration**: Uses `@monaco-editor/react` for a full-featured VS Code-like editing experience.
*   **AI Completions**: Integrates with `monaco.languages.registerCompletionItemProvider` to provide AI-driven code suggestions.
*   **Controlled Component**: Follows the controlled input pattern, accepting `value` and `onChange` props for external state management.

## API Reference

### CodeEditor

The main component export.

```tsx
interface CodeEditorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
}
```

*   `value`: The current code content (controlled).
*   `onChange`: Callback fired when content changes.
*   `language`: The syntax highlighting language (default: "typescript").

## Implementation Details

The editor manages its own lifecycle for Monaco disposables, ensuring that completion providers are correctly registered on mount and disposed on unmount to prevent memory leaks.
