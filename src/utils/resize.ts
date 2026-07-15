// Image resize utility — 100% browser-based
const dropzone = document.getElementById('dropzone')!;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const controls = document.getElementById('controls')!;
const preview = document.getElementById('preview')!;
const resizeBtn = document.getElementById('resizeBtn')!;
const downloadZip = document.getElementById('downloadZip')!;
const widthInput = document.getElementById('width') as HTMLInputElement;
const heightInput = document.getElementById('height') as HTMLInputElement;
const lockAspect = document.getElementById('lockAspect') as HTMLInputElement;
const modeSelect = document.getElementById('mode') as HTMLSelectElement;
const percentInput = document.getElementById('percent') as HTMLInputElement;

let files: File[] = [];
let aspectRatio = 1;

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  handleFiles(Array.from(e.dataTransfer!.files));
});
fileInput.addEventListener('change', () => handleFiles(Array.from(fileInput.files!)));

function handleFiles(newFiles: File[]) {
  const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
  files = [...files, ...imageFiles].slice(0, 30);
  renderPreviews();
  if (files.length > 0) {
    controls.style.display = 'flex';
    // Set aspect ratio from first image
    const img = new Image();
    img.onload = () => {
      aspectRatio = img.width / img.height;
      if (!widthInput.value) widthInput.value = String(img.width);
      if (!heightInput.value) heightInput.value = String(img.height);
    };
    img.src = URL.createObjectURL(files[0]);
  }
}

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
  document.getElementById('pixel-controls')!.style.display = isPercent ? 'none' : 'flex';
  document.getElementById('percent-controls')!.style.display = isPercent ? 'flex' : 'none';
});

function renderPreviews() {
  preview.innerHTML = files.map((f, i) => `
    <div class="preview-item">
      <img src="${URL.createObjectURL(f)}" alt="${f.name}">
      <div class="info">
        <div>${f.name}</div>
        <div>${formatSize(f.size)}</div>
        <div id="result-${i}"></div>
      </div>
    </div>
  `).join('');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

resizeBtn.addEventListener('click', async () => {
  resizeBtn.textContent = 'Resizing...';
  (resizeBtn as HTMLButtonElement).disabled = true;

  const isPercent = modeSelect.value === 'percent';
  const percent = parseInt(percentInput.value) / 100;
  const targetW = parseInt(widthInput.value);
  const targetH = parseInt(heightInput.value);

  const results: { blob: Blob; name: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await resizeImage(files[i], isPercent, percent, targetW, targetH);
    results.push(result);
    const el = document.getElementById(`result-${i}`);
    if (el) el.innerHTML = `<strong>${result.name}</strong> • ${formatSize(result.blob.size)}`;
  }

  (window as any).__resized = results;
  resizeBtn.textContent = 'Resize All';
  (resizeBtn as HTMLButtonElement).disabled = false;
});

async function resizeImage(file: File, isPercent: boolean, percent: number, targetW: number, targetH: number): Promise<{ blob: Blob; name: string }> {
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
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      canvas.toBlob((blob) => {
        resolve({ blob: blob!, name: file.name.replace(/\.[^.]+$/, `_${w}x${h}.${ext}`) });
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
