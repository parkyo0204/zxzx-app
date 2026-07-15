
const Compressor = window.Compressor;
const picaFactory = window.pica;

const controls = document.getElementById('controls')!;
const compressBtn = document.getElementById('compressBtn')!;
const downloadZip = document.getElementById('downloadZip')!;
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
  const format = formatSelect.value;
  compressBtn.textContent = '압축 중...';
  (compressBtn as HTMLButtonElement).disabled = true;
  progress.show();

  const results: { blob; name }[] = [];

  for (let i = 0; i < files.length; i++) {
    progress.set(((i + 1) / files.length) * 100);
    const result = await compressImage(files[i], quality, format);
    results.push(result);

    const savings = ((1 - result.blob.size / files[i].size) * 100).toFixed(0);
    const el = document.getElementById(`result-${i}`);
    if (el) el.innerHTML = `<strong>${formatSize(result.blob.size)}</strong> <span style="color:#10b981">${savings}% 절약</span>`;
  }

  (window as any).__compressed = results;
  progress.hide();
  compressBtn.textContent = '모두 압축';
  (compressBtn as HTMLButtonElement).disabled = false;
});

async function compressImage(file, quality, format): Promise<{ blob; name }> {
  return new Promise((resolve, reject) => {
    const mimeType = format === 'same' ? undefined : `image/${format}`;
    new Compressor(file, {
      quality,
      mimeType: mimeType as any,
      success(result) {
        const ext = format === 'same' ? getExt(file.name) : (format === 'jpeg' ? 'jpg' : format);
        resolve({ blob: result as Blob, name: file.name.replace(/\.[^.]+$/, `.${ext}`) });
      },
      error() {
        fallbackCompress(file, quality, format).then(resolve).catch(reject);
      },
    });
  });
}

async function fallbackCompress(file, quality, format): Promise<{ blob; name }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      const ext = format === 'same' ? getExt(file.name) : (format === 'jpeg' ? 'jpg' : format);
      const mime = format === 'same' ? getMime(file.type) : `image/${format}`;
      canvas.toBlob((blob) => {
        resolve({ blob: blob!, name: file.name.replace(/\.[^.]+$/, `.${ext}`) });
      }, mime, quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

function getMime(type) {
  if (type === 'image/png') return 'image/png';
  if (type === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function getExt(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  return 'jpg';
}

downloadZip.addEventListener('click', () => {
  const results = (window as any).__compressed;
  if (!results) return;
  for (const r of results) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.blob);
    a.download = r.name;
    a.click();
  }
});
