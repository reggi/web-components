import { formParser } from "../../script/form_parser.ts";

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url)

  const json = (req.method === 'POST') ? formParser(Object.fromEntries(await req.formData()))
   : (req.method === 'GET') ? formParser(Object.fromEntries(url.searchParams.entries())) 
   : {}

  return Response.json(json, {
    headers: {
      "content-type": "text/plain",
    }
  })
}