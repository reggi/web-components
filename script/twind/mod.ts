import path from 'node:path'
import { tailwindObjectToGloablStyles } from "https://deno.land/x/resume@0.0.12/src/twind/mod.ts";
import { walk } from "https://deno.land/std@0.197.0/fs/walk.ts";
import { parse } from "https://deno.land/std@0.197.0/flags/mod.ts";

export function twindTransform (contents: string) {
  const parsed = JSON.parse(contents)
  return tailwindObjectToGloablStyles(parsed)
}

export function flags () {
  const args = parse(Deno.args, {
    string: ['srcDir', 'outDir'],
  });
  const srcDir = args["srcDir"];
  const outDir = args["outDir"];
  if (!srcDir) throw new Error("srcDir is required")
  if (!outDir) throw new Error("outDir is required")
  return { srcDir, outDir,  }
}

export async function twindTransformAll (props: {
  srcDir: string,
  outDir: string,
}) {
  const { srcDir, outDir } = props;

  const entrypoints: Record<string, string> = {};
  for await (const entry of walk(srcDir)) {
    if (entry.isFile) {
      if (entry.name.endsWith('tailwind.json')) {
        const relativePath = path.relative(srcDir, entry.path);
        const newPath = path.join(outDir, relativePath);
        const dirname = path.dirname(newPath)
        const newName = entry.name.replace(/\.tailwind\.json$/, '.css')
        entrypoints[entry.path] = path.join(dirname, newName)
      }
    }
  }

  await Promise.all(Object.entries(entrypoints).map(async ([src, out]) => {
    const contents = await Deno.readTextFile(src);
    const { style } = twindTransform(contents)
    await Deno.writeTextFile(out, style)
  }))
}