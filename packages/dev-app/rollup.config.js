import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from '@wessberg/rollup-plugin-ts';

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
    typescript()
  ]
}
