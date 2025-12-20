# AI Module

## Overview
The AI module provides semantic intelligence to the application by generating embeddings for code and text, enabling vector-based search and discovery.

## Technical Implementation
- **Library**: `@xenova/transformers`
- **Mechanism**: In-process embedding generation (no external API calls required).
- **Model**: `Xenova/all-MiniLM-L6-v2`
  - Selected for its balance of performance and size for local inference.

## Key Functions
- `generateEmbedding`: Generates vector embeddings from text input.
