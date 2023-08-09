
import { extname, join } from "https://deno.land/std@0.197.0/path/mod.ts";
import { typeByExtension } from "https://deno.land/std@0.197.0/media_types/type_by_extension.ts";
import { transform } from "../src/input_repeat_transform.ts";

const folders = Deno.args

function determineContentType(filename: string): string {
  const extension = filename.split(".").pop();
  // if (extension === 'ts') return "application/javascript";
  if (!extension) return "text/plain";
  const value = typeByExtension(extension)
  if (value) return value
  return "text/plain";
}

async function findFileOrIndexInFolders(folders: string[], fileName: string): Promise<string | null> {
  for (const folder of folders) {
    const filePath = join(folder, fileName);
    const indexFiles = ["index.html", "index.js"]; // Add other index file types if needed
    console.log({ fileName, folder, filePath })
    try {
      const value = await Deno.stat(filePath);
      if (!value.isFile) throw new Error('not a file')
      return filePath; // File found, return full path
    } catch (_error) {
      // noop
    }
    // Check for index files if the main file was not found
    for (const indexFile of indexFiles) {
      const indexPath = join(folder, indexFile);
      try {
        console.log({ indexPath})
        const value = await Deno.stat(indexPath);
        if (!value.isFile) throw new Error('not a file')
        return indexPath; // Index file found, return full path
      } catch (_error) {
        // noop
      }
    }
  }
  return null; // File and index files not found in any folder
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname;
  if (path === '/api' || req.method == 'POST') {
    if (req.method === 'POST') console.log(transform(Object.fromEntries(await req.formData())))
    if (req.method === 'GET') console.log(transform(Object.fromEntries(url.searchParams.entries())))

    return new Response('ok', {
      headers: {
        "content-type": "text/plain",
      }
    })
  }

  try {
    const match = await findFileOrIndexInFolders(folders, path)
    if (!match) throw new Error('File not found')
    const content = await Deno.readTextFile(match)
    return new Response(content, { headers: new Headers({ "Content-Type": determineContentType(extname(match)) }) });
  } catch (_error) {
    console.log(_error)
    return new Response('File not found', { status: 404 });
  }
})