// packages/schema/tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"], // can also output cjs if you want dual modules
  bundle: true, // everything in one file
  splitting: false, // optional for library
  sourcemap: true,
  clean: true,
  dts: true, // generate type declarations
});
