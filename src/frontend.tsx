import { createRoot } from "react-dom/client";
import { App } from "./App";

// Suppress the "ResizeObserver loop completed with undelivered notifications." error
// This is often benign in development when switching layout modes
window.addEventListener("error", (e) => {
  if (e.message === "ResizeObserver loop completed with undelivered notifications.") {
    e.stopImmediatePropagation();
  }
});

const container = document.getElementById("root");
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(<App />);
