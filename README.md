# zxzx.app — browser-local image tools

Live site: **https://zxzx.app**

Privacy-first image utilities that run entirely in your browser. Files are not uploaded to a server for processing.

## Tools

Compress, convert, resize, crop, rotate, strip EXIF, remove background (ONNX), and upscale (ESRGAN) — with batch/ZIP where noted on each page.

## Stack

- Vite + TypeScript
- `@jsquash/*` (MozJPEG, libwebp, libavif, oxipng, Lanczos3 resize)
- cropperjs, exifr, JSZip
- `@imgly/background-removal`, UpscalerJS (lazy-loaded)

## Develop

```bash
npm install
npm run build
npx wrangler pages deploy dist --project-name zxzx-app --branch main
```

`pages_build_output_dir` is `dist`. Deploy the Vite build output, not the source root.

## Privacy

Image bytes stay on-device. Model/WASM assets may be fetched from a CDN on first use. See https://zxzx.app/privacy

## License

MIT — see [LICENSE](./LICENSE)
