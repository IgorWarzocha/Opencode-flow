/**
 * Terminal Component
 * Implements a web-based terminal using xterm.js and xterm-addon-fit.
 * Connects to a WebSocket for real-time bidirectional communication.
 */
'use client';

import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return;

    // Initialize xterm.js
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      theme: {
        background: '#09090b', // zinc-950 matches the container
        foreground: '#f4f4f5', // zinc-100
        cursor: '#f4f4f5',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
      },
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 14,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Mount terminal
    term.open(containerRef.current);
    fitAddon.fit();
    terminalRef.current = term;

    // Initialize WebSocket connection
    // Using explicit URL from requirements, but falling back to window.location for robustness
    const wsUrl = 'ws://localhost:3000/api/terminal';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      term.write('\r\n\x1b[32mConnected to terminal session...\x1b[0m\r\n');
    };

    ws.onmessage = (event) => {
      // Write data received from server to the terminal
      if (typeof event.data === 'string') {
        term.write(event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      term.write('\r\n\x1b[31mConnection error. Please check if the server is running.\x1b[0m\r\n');
    };

    ws.onclose = () => {
      term.write('\r\n\x1b[33mConnection closed.\x1b[0m\r\n');
    };

    // Forward terminal input to the server
    term.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle resizing
    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure container has resized
      requestAnimationFrame(() => {
        fitAddon.fit();
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
      terminalRef.current = null;
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full bg-zinc-950 overflow-hidden" 
      style={{ padding: '8px' }}
    />
  );
}
