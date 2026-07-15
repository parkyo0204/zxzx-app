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
        'blog/squoosh-wasm-compression': 'blog/squoosh-wasm-compression.html',
        'blog/what-is-webp': 'blog/what-is-webp.html',
        'blog/lossy-vs-lossless': 'blog/lossy-vs-lossless.html',
        'blog/exif-metadata-guide': 'blog/exif-metadata-guide.html',
        'blog/image-compression-speed': 'blog/image-compression-speed.html',
        'blog/resize-for-mobile': 'blog/resize-for-mobile.html',
        'blog/image-privacy-tips': 'blog/image-privacy-tips.html',
        'blog/jpg-vs-png-vs-webp': 'blog/jpg-vs-png-vs-webp.html',
        'blog/batch-image-processing': 'blog/batch-image-processing.html',
        'blog/browser-based-tools-advantage': 'blog/browser-based-tools-advantage.html',
        'blog/free-image-tools-2026': 'blog/free-image-tools-2026.html',
        'blog/website-speed-seo': 'blog/website-speed-seo.html',
        'blog/avif-format-explained': 'blog/avif-format-explained.html',
      }
    }
  }
});
