import typescript from 'typescript';
import tsplugin from 'rollup-plugin-typescript2';
import pkg from './package.json';
import routerPkg from './router/package.json'

const tsconfigOverride = {compilerOptions: {module: 'es2015'}}

export default [
  {
    input: 'src/index.ts',
    external: ['@genjer/genjer', 'history'],
    plugins: [
      tsplugin({typescript, tsconfigOverride})
    ],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ]
  },
  {
    input: 'src/router/index.ts',
    external: ['@genjer/navi'],
    plugins: [
      tsplugin({typescript, tsconfigOverride})
    ],
    output: [
      { file: routerPkg.main.replace('../', ''), format: 'cjs' },
      { file: routerPkg.module.replace('../', ''), format: 'es' }
    ]
  }
]
