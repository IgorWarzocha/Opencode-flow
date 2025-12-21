# File Browser

The File Browser component provides a hierarchical view of the project's file system.

## Components

- **FileBrowser**: The main container that manages the current directory and selection state.
- **FileTree**: A recursive component that renders the file structure.

## Features

- Browse files and directories from the server root.
- Load file content into the main editor.
- Visual distinction between files and folders.
- Collapsible directories.

## API Integration

- `GET /api/files?path=...`: Lists directory contents.
- `GET /api/files/content?path=...`: Fetches file content.
