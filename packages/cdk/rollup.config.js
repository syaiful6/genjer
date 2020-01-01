import typescript from '@wessberg/rollup-plugin-ts';
import platformPkg from './platform/package.json'

export default [
  {
    input: 'src/platform/index.ts',
    plugins: [
      typescript()
    ],
    output: [
      { file: platformPkg.main.replace('../', ''), format: 'cjs' },
      { file: platformPkg.module.replace('../', ''), format: 'es' }
    ]
  }
]
