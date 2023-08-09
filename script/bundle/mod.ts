import path from "node:path";
import { EsbuildBuilder, JSXConfig, EsbuildBuilderOptions } from "../esbuild/mod.ts";
import { parse } from "https://deno.land/std@0.197.0/flags/mod.ts";
import { walk } from "https://deno.land/std@0.197.0/fs/walk.ts";

const cwd = Deno.cwd()

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

export function bundleFlags () {
  const args = parse(Deno.args, {
    string: ['srcDir', 'outDir', 'ext'],
    collect: ['ext']
  });
  const srcDir = args["srcDir"];
  const outDir = args["outDir"];
  const extNames = args["ext"];
  if (!srcDir) throw new Error("srcDir is required")
  if (!outDir) throw new Error("outDir is required")
  if (extNames.length == 0) throw new Error("ext is required")
  return { srcDir, outDir, extNames }
}

export async function bundle (props: { 
  srcDir: string,
  outDir: string,
  extNames: string[]
}) {
  const { srcDir, outDir, extNames } = props

  const entrypoints: Record<string, string> = {};
  for await (const entry of walk(srcDir)) {
    if (entry.isFile) {
      const ext = path.extname(entry.name);
      const exclude = entry.name.split('.').length > 2;
      if (extNames.includes(ext) && !exclude) {
        const id = path.relative(srcDir, entry.path)
        const core = path.basename(id, ext)
        const dirname = path.dirname(id)
        entrypoints[path.join(dirname, core)] = entry.path;
      }
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
}

export async function bundleSingle (parent: string, fileName: string) {
  const entrypoints: Record<string, string> = {};

  const filePath = path.join(parent, fileName)
  entrypoints[fileName.replace(".ts", "")] = filePath
  
  const denoConfig = path.join(cwd, 'deno.json')
  const denoConfigExists = await fileExists(denoConfig)
  
  const options: EsbuildBuilderOptions = {
    entrypoints: entrypoints,
    dev: false,
    configPath: denoConfigExists ? path.join(cwd, 'deno.json') : undefined,
    jsxConfig: {
      jsx: "react",
    } as JSXConfig,
    write: false,
  }
  
  const builder = new EsbuildBuilder(options)
  const results = await builder.build()
  
  return results.outputFiles && results.outputFiles[0].text
}
