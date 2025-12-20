import { useState } from 'react';
import { GraphCanvas } from "./components/canvas/GraphCanvas";
import { CodeEditor } from "./components/editor/CodeEditor";
import { Terminal } from "./components/terminal/Terminal";
import "./index.css";

export function App() {
  const [code, setCode] = useState<string>("// Start coding here...\n\nfunction hello() {\n  console.log('Hello OpenCode Flow!');\n}");

  return (
    <div className="w-screen h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <header className="border-b border-border px-4 py-2 bg-muted/20 h-12 flex items-center shrink-0">
        <h1 className="text-lg font-bold flex items-center gap-2">
           OpenCode Flow
        </h1>
      </header>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Main Split View: Graph & Editor */}
        <div className="flex-1 flex flex-row overflow-hidden">
            <div className="w-1/2 h-full border-r border-border relative">
                <GraphCanvas />
            </div>
            <div className="w-1/2 h-full relative">
                <CodeEditor 
                    value={code} 
                    onChange={(val) => setCode(val || "")} 
                />
            </div>
        </div>
        
        {/* Bottom Terminal */}
        <div className="h-[250px] border-t border-border shrink-0 bg-zinc-950 relative">
            <Terminal />
        </div>
      </main>
    </div>
  );
}

export default App;
