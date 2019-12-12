import typescript from '@wessberg/rollup-plugin-ts';
import pkg from './package.json';
import routerPkg from './router/package.json'

export default [
  {
    input: 'src/index.ts',
    external: ['@genjer/genjer', 'history'],
    plugins: [
      typescript()
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
      typescript()
    ],
    output: [
      { file: routerPkg.main.replace('../', ''), format: 'cjs' },
      { file: routerPkg.module.replace('../', ''), format: 'es' }
    ]
  }
]
