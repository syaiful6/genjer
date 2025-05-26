import typescript from '@rollup/plugin-typescript';
import { dts } from "rollup-plugin-dts";

export default [
  {
	  input: 'src/index.ts',
    external: ['@jonggrang/prelude'],
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
  }
]
