import { execSync } from "node:child_process";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.ts"], // Matches all files and folders
  format: ["esm"], // Keep ES Modules
  bundle: false, // DO NOT smash into one file (preserves folders)
  splitting: false,
  clean: true,
  shims: true, // Helps with __dirname in ESM
  // Ensure internal monorepo packages are still handled
  noExternal: ["@flashdrop/schema", "@flashdrop/logger", "@flashdrop/utils"],
  // 2. Tell tsup to "copy" the lua files it finds in the tree
  loader: {
    ".lua": "copy",
  },
  async onSuccess() {
    console.log("Successfully transpiled TS. Mirroring Lua scripts...");
    try {
      // 1. Find all .lua files in src
      // 2. Copy them to dist while preserving the folder tree
      // 3. Flatten the 'dist/src' extra folder created by --parents
      execSync(
        'find src -name "*.lua" -exec cp --parents {} dist/ \\; && ' +
          "[ -d dist/src ] && cp -r dist/src/* dist/ && rm -rf dist/src",
        { shell: "/bin/sh" }
      );
      console.log("Lua scripts mirrored to dist/ ✅");
    } catch (err) {
      console.error("Failed to copy Lua scripts:", err.message);
    }
  },
});
