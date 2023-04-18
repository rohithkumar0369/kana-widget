import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import external from "rollup-plugin-peer-deps-external";
import typescript from "@rollup/plugin-typescript";
import svgr from "@svgr/rollup";
import image from "@rollup/plugin-image";
import dts from "rollup-plugin-dts";

import packageJson from "./package.json" assert { type: "json" };
import tailwindConfig from "./tailwind.config.js";

export default [
  {
    input: "src/index.tsx",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
        inlineDynamicImports: true,
        interop: "auto",
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
        inlineDynamicImports: true,
        interop: "auto",
      },
    ],
    plugins: [
      image(),
      svgr(),
      external({
        preferBuiltins: true,
        includeDependencies: true,
      }),
      resolve({
        browser: true,
      }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      postcss({
        extensions: [".css", ".module.css"],
        plugins: [autoprefixer(), tailwindcss(tailwindConfig)],
      }),
      terser(),
      json(),
    ],
  },
  {
    input: "lib/esm/lib/index.d.ts",
    output: [{ file: "lib/index.d.ts", format: "esm" }],
    plugins: [dts()],
    external: [/\.css$/],
  },
];
