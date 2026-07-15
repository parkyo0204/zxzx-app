import Cropper from 'cropperjs';
import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';
import {
  canvasToImageData,
  decodeFile,
  downloadZip,
  encodeImageData,
  imageDataToCanvas,
  mimeToFormat,
  replaceExt,
} from './image-pipeline';

const controls = document.getElementById('controls')!;
const cropBtn = document.getElementById('cropBtn')!;
const downloadZipBtn = document.getElementById('downloadZip')!;
const aspectSelect = document.getElementById('aspect') as HTMLSelectElement;
const stage = document.getElementById('crop-stage')!;
const stageImg = document.getElementById('crop-image') as HTMLImageElement;

let cropper: Cropper | null = null;
let activeIndex = 0;

const dropzone = new FileDropzone('dropzone', 'fileInput', 'preview', {
  maxFiles: 10,
  onFilesChanged: async (files) => {
    controls.style.display = files.length > 0 ? 'flex' : 'none';
    stage.style.display = files.length > 0 ? 'block' : 'none';
    if (files.length > 0) await loadCropper(files[0], 0);
  },
});

const progress = new ProgressBar('controls');

async function loadCropper(file: File, index: number) {
  activeIndex = index;
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  const url = URL.createObjectURL(file);
  stageImg.src = url;
  await new Promise((r) => {
    stageImg.onload = () => r(null);
  });
  const aspect = aspectSelect.value;
  cropper = new Cropper(stageImg, {
    viewMode: 1,
    autoCropArea: 0.9,
    aspectRatio: aspect === 'free' ? NaN : evalRatio(aspect),
    background: false,
  });
}

function evalRatio(v: string): number {
  const [a, b] = v.split(':').map(Number);
  return a / b;
}

aspectSelect.addEventListener('change', () => {
  if (!cropper) return;
  const aspect = aspectSelect.value;
  cropper.setAspectRatio(aspect === 'free' ? NaN : evalRatio(aspect));
});

document.getElementById('preview')!.addEventListener('click', async (e) => {
  const item = (e.target as HTMLElement).closest('.preview-item') as HTMLElement | null;
  if (!item) return;
  const idx = parseInt(item.dataset.index || '0', 10);
  const files = dropzone.getFiles();
  if (files[idx]) await loadCropper(files[idx], idx);
});

cropBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (!files.length || !cropper) return;
  cropBtn.textContent = '크롭 중...';
  (cropBtn as HTMLButtonElement).disabled = true;
  progress.show();

  const results: { blob: Blob; name: string }[] = [];
  // Crop active image with current cropper, then process remaining with centered crop box ratio
  for (let i = 0; i < files.length; i++) {
    try {
      let canvas: HTMLCanvasElement;
      if (i === activeIndex && cropper) {
        canvas = cropper.getCroppedCanvas({ maxWidth: 4096, maxHeight: 4096 });
      } else {
        const imageData = await decodeFile(files[i]);
        const full = await imageDataToCanvas(imageData);
        // Use same relative crop as active if possible — fallback center square
        const aspect = aspectSelect.value === 'free' ? imageData.width / imageData.height : evalRatio(aspectSelect.value);
        let cw = imageData.width;
        let ch = Math.round(cw / aspect);
        if (ch > imageData.height) {
          ch = imageData.height;
          cw = Math.round(ch * aspect);
        }
        const sx = Math.floor((imageData.width - cw) / 2);
        const sy = Math.floor((imageData.height - ch) / 2);
        const out = document.createElement('canvas');
        out.width = cw;
        out.height = ch;
        out.getContext('2d')!.drawImage(full, sx, sy, cw, ch, 0, 0, cw, ch);
        canvas = out;
      }
      const cropped = await canvasToImageData(canvas);
      const format = mimeToFormat(files[i].type);
      const blob = await encodeImageData(cropped, format === 'jpeg' ? 'png' : format, 0.92);
      const outFormat = format === 'jpeg' ? 'png' : format;
      const name = replaceExt(files[i].name, outFormat).replace(/(\.[^.]+)$/, '_crop$1');
      results.push({ blob, name });
      const el = document.getElementById(`result-${i}`);
      if (el) el.innerHTML = `<strong>${canvas.width}×${canvas.height}</strong> · ${formatSize(blob.size)}`;
    } catch (err) {
      console.error(err);
      const el = document.getElementById(`result-${i}`);
      if (el) el.textContent = '실패';
    }
    progress.set(((i + 1) / files.length) * 100);
  }

  progress.hide();
  (window as unknown as { __cropped: typeof results }).__cropped = results;
  cropBtn.textContent = '크롭 적용';
  (cropBtn as HTMLButtonElement).disabled = false;
});

downloadZipBtn.addEventListener('click', async () => {
  const results = (window as unknown as { __cropped?: { blob: Blob; name: string }[] }).__cropped;
  if (!results?.length) return;
  await downloadZip(results, 'zxzx-cropped.zip');
});
