// build.ts
import { build } from "bun";
import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";

// Configuration
const OUT_DIR = "./dist";
const ENTRY_POINT = "./src/frontend.tsx"; // The new entry point that renders App
const HTML_TEMPLATE = "./src/index.html"; // Your HTML file

console.info("🚀 Starting build process...");

// 1. Clean output directory
if (existsSync(OUT_DIR)) {
  await rm(OUT_DIR, { recursive: true, force: true });
}
console.info(`🗑️ Cleaning previous build at ${OUT_DIR}`);

// 2. Build the React application
const result = await build({
  entrypoints: [ENTRY_POINT],
  outdir: OUT_DIR,
  minify: true,
  sourcemap: "external",
  target: "browser",
  naming: "chunk-[hash].[ext]", // Cache-busting filenames
  plugins: [], // Add plugins if needed (e.g., SVGs)
});

if (!result.success) {
  console.error("❌ Build failed:");
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

// 3. Process HTML template
// We need to inject the generated JS and CSS files into the HTML
// Bun build returns the outputs, so we can find the filenames
const jsFile = result.outputs.find((o) => o.kind === "entry-point")?.path.split("/").pop();
const cssFile = result.outputs.find((o) => o.kind === "asset" && o.path.endsWith(".css"))?.path.split("/").pop();

if (!jsFile) {
  console.error("❌ Could not find generated JS bundle");
  process.exit(1);
}

console.info("📄 Found 1 HTML file to process");

let htmlContent = await Bun.file(HTML_TEMPLATE).text();

// Inject JS
htmlContent = htmlContent.replace(
  "</body>",
  `<script type="module" src="./${jsFile}"></script></body>`
);

// Inject CSS (if generated)
if (cssFile) {
  htmlContent = htmlContent.replace(
    "</head>",
    `<link rel="stylesheet" href="./${cssFile}"></head>`
  );
}

// Write the final HTML
await Bun.write(`${OUT_DIR}/index.html`, htmlContent);

// Copy static assets if you have a public folder
// await Bun.write(...)

console.info("\n┌───┬────────────────────────────┬─────────────┬───────────┐");
result.outputs.forEach((output, index) => {
  const name = output.path.split("/").slice(-2).join("/");
  const size = (output.size / 1024).toFixed(2) + " KB";
  console.info(`│ ${index} │ ${name.padEnd(26)} │ ${output.kind.padEnd(11)} │ ${size.padEnd(9)} │`);
});
console.info("└───┴────────────────────────────┴─────────────┴───────────┘");

console.info(`\n✅ Build completed in ${(performance.now() | 0) / 1000}s`);