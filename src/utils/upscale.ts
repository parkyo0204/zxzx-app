import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';
import {
  canvasToImageData,
  decodeFile,
  downloadZip,
  encodeImageData,
  imageDataToCanvas,
  mimeToFormat,
  replaceExt,
  resizeImageData,
} from './image-pipeline';

const controls = document.getElementById('controls')!;
const upscaleBtn = document.getElementById('upscaleBtn')!;
const downloadZipBtn = document.getElementById('downloadZip')!;
const scaleSelect = document.getElementById('scale') as HTMLSelectElement;
const statusEl = document.getElementById('ai-status')!;

const dropzone = new FileDropzone('dropzone', 'fileInput', 'preview', {
  maxFiles: 3,
  maxFileSize: 8 * 1024 * 1024,
  onFilesChanged: (files) => {
    controls.style.display = files.length > 0 ? 'flex' : 'none';
  },
});

const progress = new ProgressBar('controls');

upscaleBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (!files.length) return;

  const scale = parseInt(scaleSelect.value, 10) as 2 | 4;
  upscaleBtn.textContent = '모델 로딩...';
  (upscaleBtn as HTMLButtonElement).disabled = true;
  statusEl.textContent =
    'ESRGAN slim 모델을 불러옵니다. 큰 이미지는 메모리 부족이 날 수 있습니다.';
  progress.show();

  const results: { blob: Blob; name: string }[] = [];

  try {
    const Upscaler = (await import('upscaler')).default;
    const model =
      scale === 4
        ? (await import('@upscalerjs/esrgan-slim/4x')).default
        : (await import('@upscalerjs/esrgan-slim/2x')).default;
    const upscaler = new Upscaler({ model });

    for (let i = 0; i < files.length; i++) {
      upscaleBtn.textContent = `업스케일 ${i + 1}/${files.length}`;
      try {
        const imageData = await decodeFile(files[i]);
        if (imageData.width * imageData.height > 4_000_000) {
          throw new Error('image too large');
        }
        const canvas = await imageDataToCanvas(imageData);
        const upscaled = (await upscaler.upscale(canvas, {
          output: 'canvas',
        })) as HTMLCanvasElement;
        const outData = await canvasToImageData(upscaled);
        const format = mimeToFormat(files[i].type);
        const blob = await encodeImageData(outData, format === 'jpeg' ? 'png' : format, 0.92);
        const outFormat = format === 'jpeg' ? 'png' : format;
        const name = replaceExt(files[i].name, outFormat).replace(
          /(\.[^.]+)$/,
          `_${scale}x$1`,
        );
        results.push({ blob, name });
        const el = document.getElementById(`result-${i}`);
        if (el) {
          el.innerHTML = `<strong>${outData.width}×${outData.height}</strong> · ${formatSize(blob.size)}`;
        }
      } catch (err) {
        console.warn('AI upscale failed, falling back to hqx', err);
        try {
          const imageData = await decodeFile(files[i]);
          const w = imageData.width * scale;
          const h = imageData.height * scale;
          const resized = await resizeImageData(imageData, w, h, 'hqx');
          const format = mimeToFormat(files[i].type);
          const blob = await encodeImageData(resized, format, 0.92);
          const name = replaceExt(files[i].name, format).replace(
            /(\.[^.]+)$/,
            `_${scale}x_hqx$1`,
          );
          results.push({ blob, name });
          const el = document.getElementById(`result-${i}`);
          if (el) {
            el.innerHTML = `<strong>${w}×${h} (hqx)</strong> · ${formatSize(blob.size)}`;
          }
        } catch (e2) {
          console.error(e2);
          const el = document.getElementById(`result-${i}`);
          if (el) el.textContent = '실패';
        }
      }
      progress.set(((i + 1) / files.length) * 100);
    }

    await upscaler.dispose();
    statusEl.textContent = '완료.';
  } catch (err) {
    console.error(err);
    statusEl.textContent = '업스케일 모델을 불러오지 못했습니다. hqx 폴백만 시도합니다.';
  }

  (window as unknown as { __upscaled: typeof results }).__upscaled = results;
  progress.hide();
  upscaleBtn.textContent = '업스케일';
  (upscaleBtn as HTMLButtonElement).disabled = false;
});

downloadZipBtn.addEventListener('click', async () => {
  const results = (window as unknown as { __upscaled?: { blob: Blob; name: string }[] })
    .__upscaled;
  if (!results?.length) return;
  await downloadZip(results, 'zxzx-upscaled.zip');
});
