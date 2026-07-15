// Image format conversion — jSquash WASM codecs (Squoosh quality)
import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';
import { decode as decodeJpeg } from '@jsquash/jpeg';
import { decode as decodePng } from '@jsquash/png';
import { encode as encodeWebp } from '@jsquash/webp';
import { encode as encodeAvif } from '@jsquash/avif';

const controls = document.getElementById('controls')!;
const convertBtn = document.getElementById('convertBtn')!;
const downloadZip = document.getElementById('downloadZip')!;
const formatSelect = document.getElementById('targetFormat') as HTMLSelectElement;
const qualitySelect = document.getElementById('convertQuality') as HTMLSelectElement;

const dropzone = new FileDropzone('dropzone', 'fileInput', 'preview', {
  onFilesChanged: (files) => {
    controls.style.display = files.length > 0 ? 'flex' : 'none';
  },
});

const progress = new ProgressBar('controls');

convertBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (files.length === 0) return;

  const format = formatSelect.value;
  const quality = parseInt(qualitySelect.value);
  convertBtn.textContent = '변환 중...';
  (convertBtn as HTMLButtonElement).disabled = true;
  progress.show();

  const results: { blob: Blob; name: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    progress.set(((i + 1) / files.length) * 100);
    try {
      const result = await convertImage(files[i], format, quality);
      results.push(result);
      const el = document.getElementById(`result-${i}`);
      if (el) el.innerHTML = `<strong>${formatSize(result.blob.size)}</strong> → ${format.toUpperCase()}`;
    } catch (e) {
      console.error('Convert error:', e);
      // Fallback to Canvas API
      const result = await fallbackConvert(files[i], format, quality);
      results.push(result);
    }
  }

  (window as any).__converted = results;
  progress.hide();
  convertBtn.textContent = '모두 변환';
  (convertBtn as HTMLButtonElement).disabled = false;
});

async function convertImage(file: File, format: string, quality: number): Promise<{ blob: Blob; name: string }> {
  const arrayBuffer = await file.arrayBuffer();
  let imageData: ImageData;

  // Decode based on source format
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'png') {
    imageData = await decodePng(arrayBuffer);
  } else {
    imageData = await decodeJpeg(arrayBuffer);
  }

  // Encode to target format
  let encoded: ArrayBuffer;
  const opts = { quality };

  switch (format) {
    case 'webp':
      encoded = await encodeWebp(imageData, opts);
      break;
    case 'avif':
      encoded = await encodeAvif(imageData, { quality: Math.round(quality / 10) });
      break;
    case 'png':
      // PNG is lossless, use Canvas fallback
      return fallbackConvert(file, 'png', quality);
    default: // jpeg
      return fallbackConvert(file, 'jpeg', quality);
  }

  const blob = new Blob([encoded], { type: `image/${format}` });
  const outExt = format === 'jpeg' ? 'jpg' : format;
  return { blob, name: file.name.replace(/\.[^.]+$/, `.${outExt}`) };
}

async function fallbackConvert(file: File, format: string, quality: number): Promise<{ blob: Blob; name: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      if (format === 'png') ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const ext = format === 'jpeg' ? 'jpg' : format;
      canvas.toBlob((blob) => {
        resolve({ blob: blob!, name: file.name.replace(/\.[^.]+$/, `.${ext}`) });
      }, `image/${format}`, quality / 100);
    };
    img.src = URL.createObjectURL(file);
  });
}

downloadZip.addEventListener('click', () => {
  const results = (window as any).__converted;
  if (!results) return;
  for (const r of results) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.blob);
    a.download = r.name;
    a.click();
  }
});
