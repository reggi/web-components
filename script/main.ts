import { serveFolders } from "./serve_folders/mod.ts";
import { transform } from "../src/input_repeat_transform.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname

  if (path === '/api' || req.method == 'POST') {
    if (req.method === 'POST') console.log(transform(Object.fromEntries(await req.formData())))
    if (req.method === 'GET') console.log(transform(Object.fromEntries(url.searchParams.entries())))

    return new Response('ok', {
      headers: {
        "content-type": "text/plain",
      }
    })
  }

  return serveFolders(['./dist', './serve'], req)
})