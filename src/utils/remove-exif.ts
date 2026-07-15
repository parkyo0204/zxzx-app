import exifr from 'exifr';
import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';
import {
  decodeFile,
  downloadZip,
  encodeImageData,
  mimeToFormat,
  replaceExt,
} from './image-pipeline';

const controls = document.getElementById('controls')!;
const stripBtn = document.getElementById('stripBtn')!;
const downloadZipBtn = document.getElementById('downloadZip')!;
const metaPanel = document.getElementById('exif-panel')!;

const dropzone = new FileDropzone('dropzone', 'fileInput', 'preview', {
  onFilesChanged: async (files) => {
    controls.style.display = files.length > 0 ? 'flex' : 'none';
    if (files[0]) await showExif(files[0]);
  },
});

const progress = new ProgressBar('controls');

async function showExif(file: File) {
  try {
    const data = await exifr.parse(file, { reviveValues: true });
    if (!data) {
      metaPanel.innerHTML = '<p>EXIF 메타데이터가 없거나 읽을 수 없습니다.</p>';
      return;
    }
    const rows = Object.entries(data)
      .slice(0, 40)
      .map(
        ([k, v]) =>
          `<tr><th>${escapeHtml(String(k))}</th><td>${escapeHtml(stringify(v))}</td></tr>`,
      )
      .join('');
    metaPanel.innerHTML = `<table class="exif-table"><tbody>${rows}</tbody></table>`;
  } catch {
    metaPanel.innerHTML = '<p>EXIF 파싱 실패</p>';
  }
}

function stringify(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

stripBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (!files.length) return;
  stripBtn.textContent = '제거 중...';
  (stripBtn as HTMLButtonElement).disabled = true;
  progress.show();

  const results: { blob: Blob; name: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const imageData = await decodeFile(files[i]);
      const format = mimeToFormat(files[i].type);
      // Re-encode strips EXIF/IPTC/XMP containers
      const blob = await encodeImageData(imageData, format, 0.92);
      const name = replaceExt(files[i].name, format).replace(/(\.[^.]+)$/, '_noexif$1');
      results.push({ blob, name });
      const el = document.getElementById(`result-${i}`);
      if (el) {
        el.innerHTML = `<strong>${formatSize(files[i].size)} → ${formatSize(blob.size)}</strong>`;
      }
    } catch (err) {
      console.error(err);
      const el = document.getElementById(`result-${i}`);
      if (el) el.textContent = '실패';
    }
    progress.set(((i + 1) / files.length) * 100);
  }

  progress.hide();
  (window as unknown as { __stripped: typeof results }).__stripped = results;
  stripBtn.textContent = 'EXIF 제거';
  (stripBtn as HTMLButtonElement).disabled = false;
});

downloadZipBtn.addEventListener('click', async () => {
  const results = (window as unknown as { __stripped?: { blob: Blob; name: string }[] }).__stripped;
  if (!results?.length) return;
  await downloadZip(results, 'zxzx-noexif.zip');
});
