// Image compression utility — 100% browser-based
import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';

const controls = document.getElementById('controls')!;
const compressBtn = document.getElementById('compressBtn')!;
const downloadZip = document.getElementById('downloadZip')!;
const qualitySelect = document.getElementById('quality') as HTMLSelectElement;
const formatSelect = document.getElementById('format') as HTMLSelectElement;

// Shared dropzone with file management UX
const dropzone = new FileDropzone('dropzone', 'fileInput', 'preview', {
  onFilesChanged: (files) => {
    controls.style.display = files.length > 0 ? 'flex' : 'none';
  },
});

const progress = new ProgressBar('controls');

// Compress
compressBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (files.length === 0) return;

  const quality = parseFloat(qualitySelect.value);
  const format = formatSelect.value;
  compressBtn.textContent = '압축 중...';
  (compressBtn as HTMLButtonElement).disabled = true;

  progress.show();
  const results: { blob: Blob; name: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await compressImage(files[i], quality, format);
    results.push(result);

    const savings = ((1 - result.blob.size / files[i].size) * 100).toFixed(0);
    const el = document.getElementById(`result-${i}`);
    if (el)
      el.innerHTML = `<strong>${formatSize(result.blob.size)}</strong> (${savings}% 절감)`;

    progress.set(((i + 1) / files.length) * 100);
  }

  progress.hide();
  (window as any).__compressed = results;
  compressBtn.textContent = '모두 압축';
  (compressBtn as HTMLButtonElement).disabled = false;
});

async function compressImage(
  file: File,
  quality: number,
  format: string,
): Promise<{ blob: Blob; name: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const outputFormat =
        format === 'same' ? getMime(file.type) : `image/${format}`;
      const ext =
        format === 'same'
          ? getExt(file.name)
          : format === 'jpeg'
            ? 'jpg'
            : format;

      canvas.toBlob((blob) => {
        resolve({
          blob: blob!,
          name: file.name.replace(/\.[^.]+$/, `.${ext}`),
        });
      }, outputFormat, quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

function getMime(type: string): string {
  if (type === 'image/png') return 'image/png';
  if (type === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function getExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  return 'jpg';
}

// ZIP download
downloadZip.addEventListener('click', async () => {
  const results = (window as any).__compressed;
  if (!results) return;

  for (const r of results) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.blob);
    a.download = r.name;
    a.click();
  }
});
