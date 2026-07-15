// Image conversion utility — 100% browser-based
import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';

const controls = document.getElementById('controls')!;
const convertBtn = document.getElementById('convertBtn')!;
const downloadZip = document.getElementById('downloadZip')!;
const formatSelect = document.getElementById('targetFormat') as HTMLSelectElement;
const qualitySelect = document.getElementById('quality') as HTMLSelectElement;

// Shared dropzone with file management UX
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
  const quality = parseFloat(qualitySelect.value);
  convertBtn.textContent = '변환 중...';
  (convertBtn as HTMLButtonElement).disabled = true;

  progress.show();
  const results: { blob: Blob; name: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await convertImage(files[i], format, quality);
    results.push(result);
    const el = document.getElementById(`result-${i}`);
    if (el)
      el.innerHTML = `<strong>${formatSize(result.blob.size)}</strong> → ${format.toUpperCase()}`;

    progress.set(((i + 1) / files.length) * 100);
  }

  progress.hide();
  (window as any).__converted = results;
  convertBtn.textContent = '모두 변환';
  (convertBtn as HTMLButtonElement).disabled = false;
});

async function convertImage(
  file: File,
  format: string,
  quality: number,
): Promise<{ blob: Blob; name: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Transparent background for PNG/WebP
      if (format === 'png' || format === 'webp') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      const ext = format === 'jpeg' ? 'jpg' : format;
      canvas.toBlob((blob) => {
        resolve({
          blob: blob!,
          name: file.name.replace(/\.[^.]+$/, `.${ext}`),
        });
      }, `image/${format}`, quality);
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
