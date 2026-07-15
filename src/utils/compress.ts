import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';
import {
  decodeFile,
  downloadZip,
  encodeImageData,
  mimeToFormat,
  replaceExt,
  type OutputFormat,
} from './image-pipeline';

const controls = document.getElementById('controls')!;
const compressBtn = document.getElementById('compressBtn')!;
const downloadZipBtn = document.getElementById('downloadZip')!;
const qualitySelect = document.getElementById('quality') as HTMLSelectElement;
const formatSelect = document.getElementById('format') as HTMLSelectElement;

const dropzone = new FileDropzone('dropzone', 'fileInput', 'preview', {
  onFilesChanged: (files) => {
    controls.style.display = files.length > 0 ? 'flex' : 'none';
  },
});

const progress = new ProgressBar('controls');

compressBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (files.length === 0) return;

  const quality = parseFloat(qualitySelect.value);
  const formatChoice = formatSelect.value;
  compressBtn.textContent = '압축 중...';
  (compressBtn as HTMLButtonElement).disabled = true;
  progress.show();

  const results: { blob: Blob; name: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const imageData = await decodeFile(files[i]);
      const format: OutputFormat =
        formatChoice === 'same'
          ? mimeToFormat(files[i].type)
          : (formatChoice as OutputFormat);
      const blob = await encodeImageData(imageData, format, quality);
      const name = replaceExt(files[i].name, format);
      results.push({ blob, name });
      const savings = ((1 - blob.size / files[i].size) * 100).toFixed(0);
      const el = document.getElementById(`result-${i}`);
      if (el) {
        el.innerHTML = `<strong>${formatSize(blob.size)}</strong> (${savings}% 절감)`;
      }
    } catch (err) {
      const el = document.getElementById(`result-${i}`);
      if (el) el.textContent = '실패';
      console.error(err);
    }
    progress.set(((i + 1) / files.length) * 100);
  }

  progress.hide();
  (window as unknown as { __compressed: typeof results }).__compressed = results;
  compressBtn.textContent = '모두 압축';
  (compressBtn as HTMLButtonElement).disabled = false;
});

downloadZipBtn.addEventListener('click', async () => {
  const results = (window as unknown as { __compressed?: { blob: Blob; name: string }[] })
    .__compressed;
  if (!results?.length) return;
  await downloadZip(results, 'zxzx-compressed.zip');
});
