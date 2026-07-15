// Image conversion utility — 100% browser-based
const dropzone = document.getElementById('dropzone')!;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const controls = document.getElementById('controls')!;
const preview = document.getElementById('preview')!;
const convertBtn = document.getElementById('convertBtn')!;
const downloadZip = document.getElementById('downloadZip')!;
const formatSelect = document.getElementById('format') as HTMLSelectElement;
const qualitySelect = document.getElementById('quality') as HTMLSelectElement;

let files: File[] = [];

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
        <div>${formatSize(f.size)} • ${f.type.split('/')[1].toUpperCase()}</div>
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

convertBtn.addEventListener('click', async () => {
  const format = formatSelect.value;
  const quality = parseFloat(qualitySelect.value);
  convertBtn.textContent = 'Converting...';
  (convertBtn as HTMLButtonElement).disabled = true;

  const results: { blob: Blob; name: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await convertImage(files[i], format, quality);
    results.push(result);
    const el = document.getElementById(`result-${i}`);
    if (el) el.innerHTML = `<strong>${formatSize(result.blob.size)}</strong> → ${format.toUpperCase()}`;
  }

  (window as any).__converted = results;
  convertBtn.textContent = 'Convert All';
  (convertBtn as HTMLButtonElement).disabled = false;
});

async function convertImage(file: File, format: string, quality: number): Promise<{ blob: Blob; name: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Transparent background for PNG/WebP
      if (format === 'png' || format === 'webp') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      const ext = format === 'jpeg' ? 'jpg' : format;
      canvas.toBlob((blob) => {
        resolve({ blob: blob!, name: file.name.replace(/\.[^.]+$/, `.${ext}`) });
      }, `image/${format}`, quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

downloadZip.addEventListener('click', () => {
  const results = (window as any).__converted;
  if (!results) return;
  for (const r of results) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.blob);
    a.download = r.name;
    a.click();
  }
});
