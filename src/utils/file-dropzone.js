
  maxFiles?;
  maxFileSize?; // bytes
  onFilesChanged?: (files) => void;
}

export class FileDropzone {
  private files = [];
  private dropzone;
  private fileInput;
  private previewContainer;
  private infoBar | null = null;
  private options;

  constructor(
    dropzoneId,
    fileInputId,
    previewId,
    options: FileDropzoneOptions = {},
  ) {
    this.dropzone = document.getElementById(dropzoneId)!;
    this.fileInput = document.getElementById(fileInputId) as HTMLInputElement;
    this.previewContainer = document.getElementById(previewId)!;
    this.options = {
      maxFiles: options.maxFiles ?? 30,
      maxFileSize: options.maxFileSize ?? 20 * 1024 * 1024,
      onFilesChanged: options.onFilesChanged ?? (() => {}),
    };

    this.init();
  }

  private init() {
    // Create info bar (inserted before preview grid)
    this.infoBar = document.createElement('div');
    this.infoBar.className = 'file-info-bar';
    this.infoBar.style.display = 'none';
    this.previewContainer.before(this.infoBar);

    // Dropzone click → open file dialog
    this.dropzone.addEventListener('click', (e) => {
      // Don't trigger if clicking a button inside dropzone
      if ((e.target as HTMLElement).closest('button')) return;
      this.fileInput.click();
    });

    // Drag events with enhanced visual feedback
    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.dropzone.classList.add('dragover');
    });

    this.dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Only remove class if actually leaving the dropzone boundary
      if (!this.dropzone.contains(e.relatedTarget as Node)) {
        this.dropzone.classList.remove('dragover');
      }
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.dropzone.classList.remove('dragover');
      // Brief success animation
      this.dropzone.classList.add('drop-success');
      setTimeout(() => this.dropzone.classList.remove('drop-success'), 600);
      this.addFiles(Array.from(e.dataTransfer!.files));
    });

    // File input change
    this.fileInput.addEventListener('change', () => {
      this.addFiles(Array.from(this.fileInput.files!));
      // Reset so the same file can be re-selected
      this.fileInput.value = '';
    });

    // Prevent default drag behavior on window (avoid browser opening the file)
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());
  }

  addFiles(newFiles) {
    const valid = newFiles.filter((f) => {
      if (!f.type.startsWith('image/')) return false;
      if (f.size > this.options.maxFileSize) return false;
      return true;
    });

    this.files = [...this.files, ...valid].slice(0, this.options.maxFiles);
    this.render();
    this.options.onFilesChanged(this.files);
  }

  removeFile(index) {
    this.files.splice(index, 1);
    this.render();
    this.options.onFilesChanged(this.files);
  }

  clearAll() {
    this.files = [];
    this.render();
    this.options.onFilesChanged(this.files);
  }

  getFiles() {
    return this.files;
  }

  render() {
    this.renderInfoBar();
    this.renderPreviews();
  }

  private renderInfoBar() {
    if (!this.infoBar) return;

    if (this.files.length === 0) {
      this.infoBar.style.display = 'none';
      return;
    }

    const totalSize = this.files.reduce((sum, f) => sum + f.size, 0);
    this.infoBar.style.display = 'flex';
    this.infoBar.innerHTML = `
      <div class="file-info-stats">
        <span class="file-count">${this.files.length}개 파일</span>
        <span class="file-divider">·</span>
        <span class="file-size-total">${formatSize(totalSize)}</span>
      </div>
      <button class="btn-clear-all" title="전체 삭제">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z"/>
        </svg>
        전체 삭제
      </button>
    `;

    this.infoBar
      .querySelector('.btn-clear-all')!
      .addEventListener('click', () => this.clearAll());
  }

  private renderPreviews() {
    this.previewContainer.innerHTML = this.files
      .map(
        (f, i) => `
      <div class="preview-item" data-index="${i}">
        <div class="preview-img-wrap">
          <img src="${URL.createObjectURL(f)}" alt="${f.name}" loading="lazy">
          <button class="btn-remove" data-index="${i}" title="파일 제거" aria-label="파일 제거">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3l8 8M11 3l-8 8"/>
            </svg>
          </button>
        </div>
        <div class="info">
          <div class="info-name" title="${f.name}">${f.name}</div>
          <div class="info-meta">${formatSize(f.size)}</div>
          <div class="info-result" id="result-${i}"></div>
        </div>
      </div>
    `,
      )
      .join('');

    // Attach remove handlers
    this.previewContainer.querySelectorAll('.btn-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt((btn as HTMLElement).dataset.index!);
        this.removeFile(idx);
      });
    });
  }
}

export function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export class ProgressBar {
  private container;
  private bar;
  private text;

  constructor(insertAfterId) {
    this.container = document.createElement('div');
    this.container.className = 'progress-wrap';
    this.container.style.display = 'none';
    this.container.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <span class="progress-text">0%</span>
    `;
    document.getElementById(insertAfterId)!.after(this.container);
    this.bar = this.container.querySelector('.progress-fill')!;
    this.text = this.container.querySelector('.progress-text')!;
  }

  show() {
    this.container.style.display = 'flex';
    this.set(0);
  }

  hide() {
    this.container.style.display = 'none';
  }

  set(percent) {
    const clamped = Math.min(100, Math.max(0, percent));
    this.bar.style.width = `${clamped}%`;
    this.text.textContent = `${Math.round(clamped)}%`;
  }
}
