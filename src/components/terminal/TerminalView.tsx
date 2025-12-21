/**
 * Terminal Component
 * Implements a web-based terminal using xterm.js and xterm-addon-fit.
 * Connects to a WebSocket for real-time bidirectional communication.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useTheme } from "../theme/theme-provider";

/**
 * Safely attempts to fit the terminal, checking renderer readiness.
 * Returns true if fit succeeded, false otherwise.
 */
function safeFit(term: XTerm, fitAddon: FitAddon): boolean {
  // Check if the terminal's internal renderer is ready by verifying
  // the core dimensions exist (this is what causes the error when undefined)
  const core = term as unknown as { _core?: { _renderService?: { dimensions?: unknown } } };
  if (!core._core?._renderService?.dimensions) {
    return false;
  }

  try {
    fitAddon.fit();
    return true;
  } catch {
    return false;
  }
}

export function Terminal({
  sessionId,
  onFirstLine,
}: {
  sessionId?: string | null;
  onFirstLine?: (line: string) => void;
}) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const textDecoderRef = useRef<TextDecoder | null>(null);
  const onFirstLineRef = useRef<typeof onFirstLine>(onFirstLine);
  const isInitializedRef = useRef(false);

  // Buffer for capturing the first command
  const lineBufferRef = useRef("");
  const hasCapturedFirstLineRef = useRef(false);

  useEffect(() => {
    onFirstLineRef.current = onFirstLine;
  }, [onFirstLine]);

  // State to trigger re-render when container becomes visible
  const [isContainerReady, setIsContainerReady] = useState(false);

  // Effect to detect when container has dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isContainerReady) return;

    const checkDimensions = () => {
      const { offsetWidth, offsetHeight } = container;
      if (offsetWidth > 0 && offsetHeight > 0) {
        setIsContainerReady(true);
      }
    };

    // Check immediately
    checkDimensions();

    // Use ResizeObserver to detect when container becomes visible
    const observer = new ResizeObserver(checkDimensions);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isContainerReady]);

  // Main terminal initialization effect - only runs when container is ready
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isContainerReady) return;

    // If we are already initialized, we might need to reconnect if session changed
    // But since this effect depends on [isContainerReady, sessionId], it will re-run.
    // However, we need to cleanup previous instance first.
    // The cleanup function does that.

    isInitializedRef.current = true;

    // Initialize xterm.js
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: "block",
      theme: {
        background: "#09090b", // zinc-950 matches the container
        foreground: "#f4f4f5", // zinc-100
        cursor: "#f4f4f5",
        selectionBackground: "rgba(255, 255, 255, 0.3)",
      },
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 14,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    // Mount terminal
    term.open(container);
    terminalRef.current = term;

    // focus the terminal to allow typing immediately
    term.focus();

    // Wait for terminal renderer to be fully ready before fitting
    // Poll until the internal dimensions are available
    let fitAttempts = 0;
    const maxAttempts = 20;
    const attemptFit = () => {
      fitAttempts++;
      if (safeFit(term, fitAddon)) {
        return; // Success
      }
      if (fitAttempts < maxAttempts) {
        requestAnimationFrame(attemptFit);
      }
    };

    // Start attempting fit on next frame (after renderer initializes)
    const rafId = requestAnimationFrame(attemptFit);

    // Initialize WebSocket connection
    const wsUrl = sessionId
      ? `ws://localhost:3000/api/terminal?sessionId=${sessionId}`
      : "ws://localhost:3000/api/terminal";

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      term.write(
        `\r\n\x1b[32mConnected to terminal session${sessionId ? ` (${sessionId.slice(0, 8)})` : ""}...\x1b[0m\r\n`,
      );
      if (sessionId) {
        term.write('\x1b[90mEnvironment isolated. Type "exit" to close connection.\x1b[0m\r\n');
      }
    };

    const handleMessage = async (data: unknown) => {
      if (typeof data === "string") {
        term.write(data);
        return;
      }

      if (data instanceof ArrayBuffer) {
        const decoder = textDecoderRef.current ?? new TextDecoder();
        textDecoderRef.current = decoder;
        term.write(decoder.decode(data));
        return;
      }

      if (data instanceof Blob) {
        const buffer = await data.arrayBuffer();
        const decoder = textDecoderRef.current ?? new TextDecoder();
        textDecoderRef.current = decoder;
        term.write(decoder.decode(buffer));
      }
    };

    ws.onmessage = (event: MessageEvent<unknown>) => {
      void handleMessage(event.data);
    };

    ws.onerror = () => {
      term.write("\r\n\x1b[31mConnection error. Please check if the server is running.\x1b[0m\r\n");
    };

    ws.onclose = () => {
      term.write("\r\n\x1b[33mConnection closed.\x1b[0m\r\n");
    };

    // Forward terminal input to the server
    const dataDisposable = term.onData((data: string) => {
      if (ws.readyState !== WebSocket.OPEN) {
        return;
      }
      ws.send(data);

      // Capture first line for the title
      const firstLineHandler = onFirstLineRef.current;
      if (firstLineHandler && !hasCapturedFirstLineRef.current) {
        if (data === "\r") {
          // Enter key pressed
          if (lineBufferRef.current.trim()) {
            firstLineHandler(lineBufferRef.current.trim());
            hasCapturedFirstLineRef.current = true;
          }
        } else if (data === "\u007F") {
          // Backspace
          lineBufferRef.current = lineBufferRef.current.slice(0, -1);
        } else if (data >= " " && data <= "~") {
          // Printable characters
          lineBufferRef.current += data;
        }
      }
    });

    // Handle resizing with debounce to prevent rapid fits
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (terminalRef.current && fitAddonRef.current) {
          safeFit(terminalRef.current, fitAddonRef.current);
          terminalRef.current.focus(); // Re-focus after resize/fit
        }
      }, 100);
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      dataDisposable.dispose();
      ws.close();
      term.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      isInitializedRef.current = false;
      hasCapturedFirstLineRef.current = false;
      lineBufferRef.current = "";
    };
  }, [isContainerReady, sessionId]);

  // Dynamic Theme Update
  useEffect(() => {
    if (!terminalRef.current) return;

    const updateTheme = () => {
      const isDark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

      const xtermTheme = isDark
        ? {
            background: "#09090b", // zinc-950
            foreground: "#f4f4f5", // zinc-100
            cursor: "#f4f4f5",
            selectionBackground: "rgba(255, 255, 255, 0.3)",
          }
        : {
            background: "#ffffff",
            foreground: "#09090b", // zinc-950
            cursor: "#09090b",
            selectionBackground: "rgba(0, 0, 0, 0.1)",
          };

      if (terminalRef.current) {
        terminalRef.current.options.theme = xtermTheme;
      }
    };

    updateTheme();

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => updateTheme();
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    return undefined;
  }, [theme, isContainerReady]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-background overflow-hidden terminal-wrapper"
      style={{ padding: "8px" }}
    />
  );
}
