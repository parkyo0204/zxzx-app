import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';
import {
  decodeFile,
  downloadZip,
  encodeImageData,
  replaceExt,
  type OutputFormat,
} from './image-pipeline';

const controls = document.getElementById('controls')!;
const convertBtn = document.getElementById('convertBtn')!;
const downloadZipBtn = document.getElementById('downloadZip')!;
const formatSelect = document.getElementById('targetFormat') as HTMLSelectElement;
const qualitySelect = document.getElementById('quality') as HTMLSelectElement;

const dropzone = new FileDropzone('dropzone', 'fileInput', 'preview', {
  onFilesChanged: (files) => {
    controls.style.display = files.length > 0 ? 'flex' : 'none';
  },
});

const progress = new ProgressBar('controls');

convertBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (files.length === 0) return;

  const format = formatSelect.value as OutputFormat;
  const quality = parseFloat(qualitySelect.value);
  convertBtn.textContent = '변환 중...';
  (convertBtn as HTMLButtonElement).disabled = true;
  progress.show();

  const results: { blob: Blob; name: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const imageData = await decodeFile(files[i]);
      const blob = await encodeImageData(imageData, format, quality);
      const name = replaceExt(files[i].name, format);
      results.push({ blob, name });
      const el = document.getElementById(`result-${i}`);
      if (el) {
        el.innerHTML = `<strong>${formatSize(blob.size)}</strong> → ${format.toUpperCase()}`;
      }
    } catch (err) {
      const el = document.getElementById(`result-${i}`);
      if (el) el.textContent = '실패';
      console.error(err);
    }
    progress.set(((i + 1) / files.length) * 100);
  }

  progress.hide();
  (window as unknown as { __converted: typeof results }).__converted = results;
  convertBtn.textContent = '모두 변환';
  (convertBtn as HTMLButtonElement).disabled = false;
});

downloadZipBtn.addEventListener('click', async () => {
  const results = (window as unknown as { __converted?: { blob: Blob; name: string }[] })
    .__converted;
  if (!results?.length) return;
  await downloadZip(results, 'zxzx-converted.zip');
});
