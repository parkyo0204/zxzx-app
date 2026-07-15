import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';
import {
  decodeFile,
  downloadZip,
  encodeImageData,
  mimeToFormat,
  replaceExt,
  resizeImageData,
} from './image-pipeline';

const controls = document.getElementById('controls')!;
const resizeBtn = document.getElementById('resizeBtn')!;
const downloadZipBtn = document.getElementById('downloadZip')!;
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
      decodeFile(files[0]).then((img) => {
        aspectRatio = img.width / img.height;
        if (!widthInput.value) widthInput.value = String(img.width);
        if (!heightInput.value) heightInput.value = String(img.height);
      });
    }
  },
});

const progress = new ProgressBar('controls');

widthInput.addEventListener('input', () => {
  if (lockAspect.checked) {
    heightInput.value = String(Math.round(parseInt(widthInput.value, 10) / aspectRatio));
  }
});

heightInput.addEventListener('input', () => {
  if (lockAspect.checked) {
    widthInput.value = String(Math.round(parseInt(heightInput.value, 10) * aspectRatio));
  }
});

modeSelect.addEventListener('change', () => {
  const isPercent = modeSelect.value === 'percent';
  document.getElementById('pixel-controls')!.style.display = isPercent ? 'none' : 'flex';
  document.getElementById('percent-controls')!.style.display = isPercent ? 'flex' : 'none';
});

resizeBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (files.length === 0) return;

  resizeBtn.textContent = '리사이즈 중...';
  (resizeBtn as HTMLButtonElement).disabled = true;

  const isPercent = modeSelect.value === 'percent';
  const percent = parseInt(percentInput.value, 10) / 100;
  const targetW = parseInt(widthInput.value, 10);
  const targetH = parseInt(heightInput.value, 10);

  progress.show();
  const results: { blob: Blob; name: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const imageData = await decodeFile(files[i]);
      const w = isPercent ? Math.round(imageData.width * percent) : targetW;
      const h = isPercent ? Math.round(imageData.height * percent) : targetH;
      const resized = await resizeImageData(imageData, Math.max(1, w), Math.max(1, h), 'lanczos3');
      const format = mimeToFormat(files[i].type);
      const blob = await encodeImageData(resized, format, 0.92);
      const name = replaceExt(files[i].name, format).replace(
        /(\.[^.]+)$/,
        `_${w}x${h}$1`,
      );
      results.push({ blob, name });
      const el = document.getElementById(`result-${i}`);
      if (el) el.innerHTML = `<strong>${w}×${h}</strong> · ${formatSize(blob.size)}`;
    } catch (err) {
      const el = document.getElementById(`result-${i}`);
      if (el) el.textContent = '실패';
      console.error(err);
    }
    progress.set(((i + 1) / files.length) * 100);
  }

  progress.hide();
  (window as unknown as { __resized: typeof results }).__resized = results;
  resizeBtn.textContent = '모두 리사이즈';
  (resizeBtn as HTMLButtonElement).disabled = false;
});

downloadZipBtn.addEventListener('click', async () => {
  const results = (window as unknown as { __resized?: { blob: Blob; name: string }[] }).__resized;
  if (!results?.length) return;
  await downloadZip(results, 'zxzx-resized.zip');
});
