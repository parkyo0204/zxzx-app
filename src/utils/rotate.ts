import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';
import {
  decodeFile,
  downloadZip,
  encodeImageData,
  flipImageData,
  mimeToFormat,
  replaceExt,
  rotateImageData,
} from './image-pipeline';

type TranslationWindow = Window & {
  translateText?: (key: string, fallback: string) => string;
};

function uiText(key: string, fallback: string): string {
  const translateText = (window as TranslationWindow).translateText;
  return translateText ? translateText(key, fallback) : fallback;
}

const controls = document.getElementById('controls')!;
const applyBtn = document.getElementById('applyBtn')!;
const downloadZipBtn = document.getElementById('downloadZip')!;
const actionSelect = document.getElementById('action') as HTMLSelectElement;

const dropzone = new FileDropzone('dropzone', 'fileInput', 'preview', {
  onFilesChanged: (files) => {
    controls.style.display = files.length > 0 ? 'flex' : 'none';
  },
});

const progress = new ProgressBar('controls');

applyBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (!files.length) return;
  const action = actionSelect.value;
  applyBtn.textContent = uiText('rotate_processing', '처리 중...');
  (applyBtn as HTMLButtonElement).disabled = true;
  progress.show();

  const results: { blob: Blob; name: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    try {
      let imageData = await decodeFile(files[i]);
      if (action === '90') imageData = await rotateImageData(imageData, 90);
      else if (action === '180') imageData = await rotateImageData(imageData, 180);
      else if (action === '270') imageData = await rotateImageData(imageData, 270);
      else if (action === 'flip-h') imageData = await flipImageData(imageData, 'h');
      else if (action === 'flip-v') imageData = await flipImageData(imageData, 'v');

      const format = mimeToFormat(files[i].type);
      const blob = await encodeImageData(imageData, format, 0.92);
      const name = replaceExt(files[i].name, format).replace(/(\.[^.]+)$/, `_${action}$1`);
      results.push({ blob, name });
      const el = document.getElementById(`result-${i}`);
      if (el) {
        el.innerHTML = `<strong>${imageData.width}×${imageData.height}</strong> · ${formatSize(blob.size)}`;
      }
    } catch (err) {
      console.error(err);
      const el = document.getElementById(`result-${i}`);
      if (el) el.textContent = uiText('rotate_failed', '실패');
    }
    progress.set(((i + 1) / files.length) * 100);
  }

  progress.hide();
  (window as unknown as { __rotated: typeof results }).__rotated = results;
  applyBtn.textContent = uiText('rotate_apply', '적용');
  (applyBtn as HTMLButtonElement).disabled = false;
});

downloadZipBtn.addEventListener('click', async () => {
  const results = (window as unknown as { __rotated?: { blob: Blob; name: string }[] }).__rotated;
  if (!results?.length) return;
  await downloadZip(results, 'zxzx-rotated.zip');
});
