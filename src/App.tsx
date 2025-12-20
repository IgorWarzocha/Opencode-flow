import { GraphCanvas } from "./components/canvas/GraphCanvas";
import "./index.css";

export function App() {
  return (
    <div className="w-screen h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border p-4 bg-muted/20">
        <h1 className="text-xl font-bold flex items-center gap-2">
           OpenCode Flow
        </h1>
      </header>
      <main className="flex-1 overflow-hidden relative">
        <GraphCanvas />
      </main>
    </div>
  );
}

export default App;
