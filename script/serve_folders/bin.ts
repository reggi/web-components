import { serveFoldersHandler } from "./mod.ts";

Deno.serve(serveFoldersHandler(Deno.args))