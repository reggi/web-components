import nodePath from 'node:path'
import { extname, join } from "https://deno.land/std@0.197.0/path/mod.ts";
import { typeByExtension } from "https://deno.land/std@0.197.0/media_types/type_by_extension.ts";

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
    try {
      const value = await Deno.stat(filePath);
      if (!value.isFile) throw new Error('not a file')
      return filePath; // File found, return full path
    } catch (_error) {
      // noop
    }
    // Check for index files if the main file was not found
    for (const indexFile of indexFiles) {
      const indexPath = join(folder, fileName, indexFile);
      try {
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

export const serveFolders = async (folders: string[], req: Request) => {
  const url = new URL(req.url)
  const path = url.pathname;
  try {
    const match = await findFileOrIndexInFolders(folders, path)
    if (!match) throw new Error('File not found')
    if (match.endsWith('.html') && nodePath.extname(path) !== '.html' && !path.endsWith('/')) {
      // this is so that relative assets work correctly
      return Response.redirect(req.url + '/')
    }
    const content = await Deno.readTextFile(match)
    return new Response(content, { headers: new Headers({ "Content-Type": determineContentType(extname(match)) }) });
  } catch (_error) {
    return new Response('File not found', { status: 404 });
  }
}

export const serveFoldersHandler = (folders: string[]) => {
  return (req: Request) => {
    return serveFolders(folders, req)
  }
}
