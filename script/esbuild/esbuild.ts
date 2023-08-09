import {
  denoPlugins,
  esbuild,
  esbuildTypes,
  esbuildWasmURL,
} from "./deps.ts";

export interface EsbuildBuilderOptions {
  /** The entrypoints, mapped from name to URL. */
  entrypoints: Record<string, string>;
  /** Whether or not this is a dev build. */
  dev: boolean;
  /** The path to the deno.json / deno.jsonc config file. */
  configPath?: string;
  /** The JSX configuration. */
  jsxConfig: JSXConfig;

  outDir?: string
  write: boolean
}

export interface JSXConfig {
  jsx: "react" | "react-jsx";
  jsxImportSource?: string;
}

export class EsbuildBuilder {
  #options: EsbuildBuilderOptions;

  constructor(options: EsbuildBuilderOptions) {
    this.#options = options;
  }

  async build() {
    const opts = this.#options;
    try {
      await initEsbuild();

      const absWorkingDir = Deno.cwd();

      // In dev-mode we skip identifier minification to be able to show proper
      // component names in Preact DevTools instead of single characters.
      const minifyOptions: Partial<esbuildTypes.BuildOptions> = opts.dev
        ? {
          minifyIdentifiers: false,
          minifySyntax: true,
          minifyWhitespace: true,
        }
        : { minify: true };

      const options = {
        entryPoints: opts.entrypoints,

        platform: "browser",
        target: ["chrome99", "firefox99", "safari15"],

        format: "esm",
        bundle: true,
        splitting: opts.outDir ? true : false,
        treeShaking: true,
        sourcemap: opts.dev ? "linked" : false,
        ...minifyOptions,

        jsx: JSX_RUNTIME_MODE[opts.jsxConfig.jsx],
        jsxImportSource: opts.jsxConfig.jsxImportSource,

        absWorkingDir,
        outdir: opts.outDir,
        write: opts.write,
        metafile: true,

        plugins: [
          ...denoPlugins({ configPath: opts.configPath }),
        ],
      } satisfies esbuildTypes.BuildOptions;

      const bundle = await esbuild.build(options);

      return bundle
    } finally {
      stopEsbuild();
    }
  }
}

const JSX_RUNTIME_MODE = {
  "react": "transform",
  "react-jsx": "automatic",
} as const;

async function initEsbuild() {
  // deno-lint-ignore no-deprecated-deno-api
  if (Deno.run === undefined) {
    await esbuild.initialize({
      wasmURL: esbuildWasmURL,
      worker: false,
    });
  } else {
    await esbuild.initialize({});
  }
}

function stopEsbuild() {
  esbuild.stop();
}

