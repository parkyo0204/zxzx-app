// Image resize — pica for high-quality Lanczos3 downsampling
import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';
import picaFactory from 'pica';

const controls = document.getElementById('controls')!;
const resizeBtn = document.getElementById('resizeBtn')!;
const downloadZip = document.getElementById('downloadZip')!;
const widthInput = document.getElementById('width') as HTMLInputElement;
const heightInput = document.getElementById('height') as HTMLInputElement;
const lockAspect = document.getElementById('lockAspect') as HTMLInputElement;
const modeSelect = document.getElementById('resizeMode') as HTMLSelectElement;
const percentInput = document.getElementById('percent') as HTMLInputElement;

let aspectRatio = 1;

const dropzone = new FileDropzone('dropzone', 'fileInput', 'preview', {
  onFilesChanged: (files) => {
    controls.style.display = files.length > 0 ? 'flex' : 'none';
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
    heightInput.value = String(Math.round(parseInt(widthInput.value) / aspectRatio));
  }
});

heightInput.addEventListener('input', () => {
  if (lockAspect.checked) {
    widthInput.value = String(Math.round(parseInt(heightInput.value) * aspectRatio));
  }
});

modeSelect.addEventListener('change', () => {
  const isPercent = modeSelect.value === 'percent';
  const pixelControls = document.getElementById('pixel-controls');
  const percentControls = document.getElementById('percent-controls');
  if (pixelControls) pixelControls.style.display = isPercent ? 'none' : 'flex';
  if (percentControls) percentControls.style.display = isPercent ? 'flex' : 'none';
});

resizeBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (files.length === 0) return;

  const pica = picaFactory();
  const isPercent = modeSelect.value === 'percent';
  const percent = parseInt(percentInput.value) / 100;
  const targetW = parseInt(widthInput.value);
  const targetH = parseInt(heightInput.value);

  resizeBtn.textContent = '리사이즈 중...';
  (resizeBtn as HTMLButtonElement).disabled = true;
  progress.show();

  const results: { blob: Blob; name: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    progress.set(((i + 1) / files.length) * 100);
    try {
      const result = await resizeWithPica(pica, files[i], isPercent, percent, targetW, targetH);
      results.push(result);
      const el = document.getElementById(`result-${i}`);
      if (el) el.innerHTML = `<strong>${result.name}</strong> · ${formatSize(result.blob.size)}`;
    } catch (e) {
      console.error('Resize error:', e);
    }
  }

  (window as any).__resized = results;
  progress.hide();
  resizeBtn.textContent = '모두 리사이즈';
  (resizeBtn as HTMLButtonElement).disabled = false;
});

async function resizeWithPica(
  pica: any,
  file: File,
  isPercent: boolean,
  percent: number,
  targetW: number,
  targetH: number,
): Promise<{ blob: Blob; name: string }> {
  const img = await loadImage(file);
  const w = isPercent ? Math.round(img.width * percent) : targetW;
  const h = isPercent ? Math.round(img.height * percent) : targetH;

  const src = document.createElement('canvas');
  src.width = img.width;
  src.height = img.height;
  src.getContext('2d')!.drawImage(img, 0, 0);

  const dst = document.createElement('canvas');
  dst.width = w;
  dst.height = h;

  await pica.resize(src, dst, { filter: 'lanczos3' });
  const blob = await pica.toBlob(dst, file.type, 0.92);

  const ext = file.name.split('.').pop() || 'jpg';
  return { blob, name: file.name.replace(/\.[^.]+$/, `_${w}x${h}.${ext}`) };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
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
