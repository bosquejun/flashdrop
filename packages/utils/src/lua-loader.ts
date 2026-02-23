import fs from "node:fs";
import fsPromises from "node:fs/promises";

export async function loadLuaScriptAsync(filePath: string): Promise<string> {
  const script = await fsPromises.readFile(filePath, "utf8");
  return script;
}

export function loadLuaScript(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}
