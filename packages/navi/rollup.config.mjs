import typescript from '@rollup/plugin-typescript';
import { dts } from "rollup-plugin-dts";

export default [
  {
    input: 'src/index.ts',
    external: ['@genjer/genjer', 'history'],
    plugins: [
      typescript()
    ],
    output: [
      { file: "lib/index.js", format: 'cjs' },
      { file: "lib/index.esm.js", format: 'es' }
    ]
  },
  {
    input: "src/index.ts",
    output: [{ file: "lib/index.d.ts", format: "es" }],
    plugins: [
      dts()
    ]
  },
  {
    input: 'src/router/index.ts',
    external: ['@genjer/navi'],
    plugins: [
      typescript()
    ],
    output: [
      { file: "lib/router.js", format: 'cjs' },
      { file: "lib/router.esm.js", format: 'es' }
    ]
  },
  {
    input: "src/router/index.ts",
    output: [{ file: "lib/router.d.ts", format: "es" }],
    plugins: [
      dts()
    ]
  },
]
