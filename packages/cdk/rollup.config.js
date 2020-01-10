import typescript from '@wessberg/rollup-plugin-ts';
import pkg from './package.json';
import platformPkg from './platform/package.json'
import browserPkg from './browser/package.json';
import keycodesPkg from './keycodes/package.json';

export default [
  {
    input: 'src/index.ts',
    external: [],
    plugins: [
      typescript()
    ],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ]
  },
  {
    input: 'src/platform/index.ts',
    plugins: [
      typescript()
    ],
    output: [
      { file: platformPkg.main.replace('../', ''), format: 'cjs' },
      { file: platformPkg.module.replace('../', ''), format: 'es' }
    ]
  },
  {
    input: 'src/browser/index.ts',
    plugins: [
      typescript()
    ],
    output: [
      { file: browserPkg.main.replace('../', ''), format: 'cjs' },
      { file: browserPkg.module.replace('../', ''), format: 'es' }
    ]
  },
  {
    input: 'src/keycodes/index.ts',
    plugins: [
      typescript()
    ],
    output: [
      { file: keycodesPkg.main.replace('../', ''), format: 'cjs' },
      { file: keycodesPkg.module.replace('../', ''), format: 'es' }
    ]
  }
]
