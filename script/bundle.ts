import { EsbuildBuilder, JSXConfig, EsbuildBuilderOptions } from "./esbuild/mod.ts";
import path from "node:path";
import { parse } from "https://deno.land/std@0.197.0/flags/mod.ts";

const args = parse(Deno.args, {
  string: ['srcDir', 'outDir'],
  collect: ['ext']
});

const srcDir = args["srcDir"];
const outDir = args["outDir"];
const extNames = args["ext"];

if (!srcDir) throw new Error("srcDir is required")
if (!outDir) throw new Error("outDir is required")
if (extNames.length == 0) throw new Error("ext is required")

const cwd = Deno.cwd()
const entrypoints: Record<string, string> = {};

for (const file of Deno.readDirSync(srcDir)) {
  const ext = path.extname(file.name)
  if (extNames.includes(ext)) {
    const filePath = path.join(srcDir, file.name)
    entrypoints[file.name.replace(".ts", "")] = filePath
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await Deno.stat(filePath);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error; // Unexpected error, rethrow it
  }
}

const denoConfig = path.join(cwd, 'deno.json')
const denoConfigExists = await fileExists(denoConfig)

const options: EsbuildBuilderOptions = {
  entrypoints: entrypoints,
  dev: false,
  configPath: denoConfigExists ? path.join(cwd, 'deno.json') : undefined,
  jsxConfig: {
    jsx: "react",
  } as JSXConfig,
  outDir: outDir,
  write: true,
}

const builder = new EsbuildBuilder(options)
await builder.build()