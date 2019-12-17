import typescript from '@wessberg/rollup-plugin-ts';
import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    external: ['@genjer/genjer', 'mithril', 'mithril/render'],
    plugins: [
      typescript()
    ],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ]
  },
]
