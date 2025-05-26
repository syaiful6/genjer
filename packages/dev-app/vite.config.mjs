import { defineConfig  } from "vite"
import commonJs from "@rollup/plugin-commonjs"
import { nodeResolve } from '@rollup/plugin-node-resolve'
import tailwindcss from '@tailwindcss/vite';


export default defineConfig({
  base: '',
  plugins: [
    tailwindcss(),
    commonJs({ include: [] }),
    nodeResolve(),
  ],
  build: {
    commonjsOptions: { include: [] }
  }
})