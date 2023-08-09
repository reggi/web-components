import { tailwindObjectToGloablStyles } from "https://deno.land/x/resume@0.0.12/src/twind/mod.ts";

export function twindTransform (contents: string) {
  const parsed = JSON.parse(contents)
  return tailwindObjectToGloablStyles(parsed)
}