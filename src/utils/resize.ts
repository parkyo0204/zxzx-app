// Image resize utility — 100% browser-based
import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';

const controls = document.getElementById('controls')!;
const resizeBtn = document.getElementById('resizeBtn')!;
const downloadZip = document.getElementById('downloadZip')!;
const widthInput = document.getElementById('width') as HTMLInputElement;
const heightInput = document.getElementById('height') as HTMLInputElement;
const lockAspect = document.getElementById('lockAspect') as HTMLInputElement;
const modeSelect = document.getElementById('resizeMode') as HTMLSelectElement;
const percentInput = document.getElementById('percent') as HTMLInputElement;

let aspectRatio = 1;

// Shared dropzone with file management UX
const dropzone = new FileDropzone('dropzone', 'fileInput', 'preview', {
  onFilesChanged: (files) => {
    controls.style.display = files.length > 0 ? 'flex' : 'none';
    // Set aspect ratio from first image
    if (files.length > 0) {
      const img = new Image();
      img.onload = () => {
        aspectRatio = img.width / img.height;
        if (!widthInput.value) widthInput.value = String(img.width);
        if (!heightInput.value) heightInput.value = String(img.height);
      };
      img.src = URL.createObjectURL(files[0]);
    }
  },
});

const progress = new ProgressBar('controls');

widthInput.addEventListener('input', () => {
  if (lockAspect.checked) {
    heightInput.value = String(
      Math.round(parseInt(widthInput.value) / aspectRatio),
    );
  }
});

heightInput.addEventListener('input', () => {
  if (lockAspect.checked) {
    widthInput.value = String(
      Math.round(parseInt(heightInput.value) * aspectRatio),
    );
  }
});

modeSelect.addEventListener('change', () => {
  const isPercent = modeSelect.value === 'percent';
  document.getElementById('pixel-controls')!.style.display = isPercent
    ? 'none'
    : 'flex';
  document.getElementById('percent-controls')!.style.display = isPercent
    ? 'flex'
    : 'none';
});

resizeBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (files.length === 0) return;

  resizeBtn.textContent = '리사이즈 중...';
  (resizeBtn as HTMLButtonElement).disabled = true;

  const isPercent = modeSelect.value === 'percent';
  const percent = parseInt(percentInput.value) / 100;
  const targetW = parseInt(widthInput.value);
  const targetH = parseInt(heightInput.value);

  progress.show();
  const results: { blob: Blob; name: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await resizeImage(files[i], isPercent, percent, targetW, targetH);
    results.push(result);
    const el = document.getElementById(`result-${i}`);
    if (el)
      el.innerHTML = `<strong>${result.name}</strong> · ${formatSize(result.blob.size)}`;

    progress.set(((i + 1) / files.length) * 100);
  }

  progress.hide();
  (window as any).__resized = results;
  resizeBtn.textContent = '모두 리사이즈';
  (resizeBtn as HTMLButtonElement).disabled = false;
});

async function resizeImage(
  file: File,
  isPercent: boolean,
  percent: number,
  targetW: number,
  targetH: number,
): Promise<{ blob: Blob; name: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = isPercent ? Math.round(img.width * percent) : targetW;
      const h = isPercent ? Math.round(img.height * percent) : targetH;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      const ext = file.name.split('.').pop() || 'jpg';
      const mime =
        ext === 'png'
          ? 'image/png'
          : ext === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
      canvas.toBlob((blob) => {
        resolve({
          blob: blob!,
          name: file.name.replace(/\.[^.]+$/, `_${w}x${h}.${ext}`),
        });
      }, mime, 0.92);
    };
    img.src = URL.createObjectURL(file);
  });
}

downloadZip.addEventListener('click', () => {
  const results = (window as any).__resized;
  if (!results) return;
  for (const r of results) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.blob);
    a.download = r.name;
    a.click();
  }
});
