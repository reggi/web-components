import path from 'node:path'
import { bundle } from "../bundle/mod.ts";
import { twindTransformAll } from "../twind/mod.ts";
import { walk } from "https://deno.land/std@0.197.0/fs/walk.ts";
import { parse } from "https://deno.land/std@0.197.0/flags/mod.ts";

export function flags () {
  const args = parse(Deno.args, {
    string: ['srcDir', 'outDir'],
  });
  const srcDir = args["srcDir"];
  const outDir = args["outDir"];
  if (!srcDir) throw new Error("srcDir is required")
  if (!outDir) throw new Error("outDir is required")
  return { srcDir, outDir }
}

const moveFiles = async (props: { srcDir: string, outDir: string, extNames: string[] }) => {
  const { srcDir, outDir, extNames } = props;
  const entrypoints: Record<string, string> = {};
  for await (const entry of walk(srcDir)) {
    if (entry.isFile) {
      const extname = path.extname(entry.name)
      if (extNames.includes(extname)) {
        const relativePath = path.relative(srcDir, entry.path);
        const newPath = path.join(outDir, relativePath);
        entrypoints[entry.path] = newPath
      }
    }
  }
  for (const [src, dest] of Object.entries(entrypoints)) {
    await Deno.mkdir(path.dirname(dest), { recursive: true });
    await Deno.copyFile(src, dest);
  }
}

function createManifest(manifest: Record<string, string>): string {
  let importStatements = '';
  let exportMapping = 'export default {\n';

  let counter = 1;

  for (const [key, value] of Object.entries(manifest)) {
    const manifestItem = `manifestItem${counter}`;
    importStatements += `import ${manifestItem} from "../${value}"\n`;
    exportMapping += `  "/${key}": ${manifestItem},\n`;
    counter++;
  }

  exportMapping += '}\n';

  return importStatements + '\n' + exportMapping;
}

const manifest = async (props: { srcDir: string, outDir: string }) => {
  const { srcDir, outDir } = props;
  const entrypoints: Record<string, string> = {};
  for await (const entry of walk(srcDir)) {
    const dirname = path.dirname(entry.path)
    if (entry.isFile) {
      if (entry.name.endsWith('.route.ts')) {
        const core = entry.name.replace('.route.ts', '')
        entrypoints[path.relative(srcDir, path.join(dirname, core))] = entry.path
      }
    }
  }
  await Deno.writeTextFile(path.join(outDir, `manifest.ts`), createManifest(entrypoints))
}

const main = `
import { serveFolders } from "../script/serve_folders/mod.ts";
import manifest from './manifest.ts'

type ManifestType = {
  [key: string]: (req: Request) => Promise<Response>;
};

const nerfedManifest: ManifestType = manifest

Deno.serve((req) => {
  const url = new URL(req.url)
  const path = url.pathname

  if (path in nerfedManifest) {
    const file = nerfedManifest[path]
    return file(req)
  }

  return serveFolders(['./dist/static'], req)
})`

const writeMain = async (props: { outDir: string }) => {
  const { outDir } = props;
  await Deno.writeTextFile(path.join(outDir, `main.ts`), main)
}

export const build = async (props: {
  srcDir: string,
  outDir: string,
}) => {
  const { srcDir, outDir } = props;
  const staticDir = path.join(outDir, 'static')
  try {
    await Deno.mkdirSync(staticDir, { recursive: true });
  } catch (_e) {
    // noop
  }
  await bundle({ srcDir, outDir: staticDir, extNames: ['.ts'] });
  await twindTransformAll({ srcDir, outDir: staticDir });
  await moveFiles({ srcDir, outDir: staticDir, extNames: ['.html'] });
  await manifest({ srcDir, outDir});
  await writeMain({ outDir });
}
