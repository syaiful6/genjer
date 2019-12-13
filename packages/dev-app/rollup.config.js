import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from '@wessberg/rollup-plugin-ts';
import injectEnv from 'rollup-plugin-inject-process-env';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundled.js',
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    injectEnv({
      NODE_ENV: 'production'
    }),
  ]
}
