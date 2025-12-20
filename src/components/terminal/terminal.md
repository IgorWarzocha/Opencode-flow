# Terminal Module

The Terminal module provides a real-time console interface for agent interactions and process monitoring.

## Architecture

### Frontend
- **Library**: Uses `xterm.js` for the terminal emulator.
- **Responsive**: Integrates `xterm-addon-fit` to automatically adjust the terminal dimensions to match the container size.
- **Communication**: Connects via WebSocket to `/api/terminal` to transmit input and receive output.

### Backend
- **Route**: The `/api/terminal` endpoint handles WebSocket connection upgrades.
- **Process Management**: Spawns a persistent shell process using `Bun.spawn(["bash"])`.
- **Data Flow**:
  - **Output**: Standard output (`stdout`) and standard error (`stderr`) from the shell are streamed directly to the WebSocket client.
  - **Input**: Messages received from the WebSocket client are written to the shell's standard input (`stdin`).
