import { createRoot } from "react-dom/client";
import { App } from "./App";

window.addEventListener("error", (e) => {
  if (e.message === "ResizeObserver loop completed with undelivered notifications.") {
    e.stopImmediatePropagation();
  }
});

const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");
const root = createRoot(container);
root.render(<App />);
