import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        compress: 'compress.html',
        convert: 'convert.html',
        resize: 'resize.html',
        about: 'about.html',
        contact: 'contact.html',
        privacy: 'privacy.html',
        terms: 'terms.html',
        blog: 'blog/index.html',
      }
    }
  }
});
