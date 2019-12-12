import typescript from 'typescript';
import tsplugin from 'rollup-plugin-typescript2';
import pkg from './package.json';

const tsconfigOverride = {compilerOptions: {module: 'es2015'}}

export default [
  {
		input: 'src/index.ts',
    external: ['@jonggrang/prelude', "snabbdom"],
    plugins: [
      tsplugin({typescript, tsconfigOverride})
    ],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		]
	}
]
