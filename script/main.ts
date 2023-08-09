import nodePath from 'node:path'
import { serveFolders } from "./serve_folders/mod.ts";
import { transform } from "../src/input_repeat_transform.ts";
import { twindTransform } from './twind/transform.ts'

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

  if (path.startsWith('/tailwind')) {
    const items = path.split('/')
    const last = items[items.length - 1]
    const core = nodePath.basename(last, '.css')
    const filePath = nodePath.join('./tailwind', `${core}.tailwind.json`)
    const file = await Deno.readTextFile(filePath)
    const { style } = await twindTransform(file)
    return new Response(style, { headers: { 'content-type': 'text/css' }})
  }

  return serveFolders(['./dist', './serve'], req)
})