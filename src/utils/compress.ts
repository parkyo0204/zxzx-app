// Image compression utility — 100% browser-based
const dropzone = document.getElementById('dropzone')!;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const controls = document.getElementById('controls')!;
const preview = document.getElementById('preview')!;
const compressBtn = document.getElementById('compressBtn')!;
const downloadZip = document.getElementById('downloadZip')!;
const qualitySelect = document.getElementById('quality') as HTMLSelectElement;
const formatSelect = document.getElementById('format') as HTMLSelectElement;

let files: File[] = [];

// Dropzone events
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
  if (files.length > 0) controls.style.display = 'flex';
}

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

// Compress
compressBtn.addEventListener('click', async () => {
  const quality = parseFloat(qualitySelect.value);
  const format = formatSelect.value;
  compressBtn.textContent = 'Compressing...';
  (compressBtn as HTMLButtonElement).disabled = true;

  const results: { blob: Blob; name: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await compressImage(files[i], quality, format);
    results.push(result);

    const savings = ((1 - result.blob.size / files[i].size) * 100).toFixed(0);
    const el = document.getElementById(`result-${i}`);
    if (el) el.innerHTML = `<strong>${formatSize(result.blob.size)}</strong> (${savings}% saved)`;
  }

  // Store for ZIP download
  (window as any).__compressed = results;
  compressBtn.textContent = 'Compress All';
  (compressBtn as HTMLButtonElement).disabled = false;
});

async function compressImage(file: File, quality: number, format: string): Promise<{ blob: Blob; name: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const outputFormat = format === 'same' ? getMime(file.type) : `image/${format}`;
      const ext = format === 'same' ? getExt(file.name) : format === 'jpeg' ? 'jpg' : format;

      canvas.toBlob((blob) => {
        resolve({
          blob: blob!,
          name: file.name.replace(/\.[^.]+$/, `.${ext}`)
        });
      }, outputFormat, quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

function getMime(type: string): string {
  if (type === 'image/png') return 'image/png';
  if (type === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function getExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  return 'jpg';
}

// ZIP download
downloadZip.addEventListener('click', async () => {
  const results = (window as any).__compressed;
  if (!results) return;

  // Simple ZIP using Blob (no library needed for small sets)
  // For production, use JSZip
  for (const r of results) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.blob);
    a.download = r.name;
    a.click();
  }
});
