import { FileDropzone, ProgressBar, formatSize } from './file-dropzone';
import { downloadZip, replaceExt } from './image-pipeline';

type TranslationWindow = Window & {
  translateText?: (key: string, fallback: string) => string;
};

function uiText(key: string, fallback: string): string {
  const translateText = (window as TranslationWindow).translateText;
  return translateText ? translateText(key, fallback) : fallback;
}

const controls = document.getElementById('controls')!;
const removeBtn = document.getElementById('removeBtn')!;
const downloadZipBtn = document.getElementById('downloadZip')!;
const statusEl = document.getElementById('ai-status')!;

const dropzone = new FileDropzone('dropzone', 'fileInput', 'preview', {
  maxFiles: 5,
  maxFileSize: 12 * 1024 * 1024,
  onFilesChanged: (files) => {
    controls.style.display = files.length > 0 ? 'flex' : 'none';
  },
});

const progress = new ProgressBar('controls');

removeBtn.addEventListener('click', async () => {
  const files = dropzone.getFiles();
  if (!files.length) return;

  removeBtn.textContent = uiText('remove_background_loading', '모델 로딩...');
  (removeBtn as HTMLButtonElement).disabled = true;
  statusEl.textContent = uiText(
    'remove_background_status_loading',
    '첫 실행 시 ONNX 모델을 다운로드합니다. 파일이 기기를 떠나지 않습니다.',
  );
  progress.show();

  try {
    const { removeBackground } = await import('@imgly/background-removal');
    const results: { blob: Blob; name: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      removeBtn.textContent = uiText(
        'remove_background_processing',
        '처리 중 {current}/{total}',
      )
        .replace('{current}', String(i + 1))
        .replace('{total}', String(files.length));
      try {
        const blob = await removeBackground(files[i], {
          progress: (_key, current, total) => {
            if (total) progress.set((current / total) * 100);
          },
        });
        const name = replaceExt(files[i].name, 'png').replace(/(\.[^.]+)$/, '_nobg$1');
        results.push({ blob, name });
        const el = document.getElementById(`result-${i}`);
        if (el) el.innerHTML = `<strong>PNG</strong> · ${formatSize(blob.size)}`;
      } catch (err) {
        console.error(err);
        const el = document.getElementById(`result-${i}`);
        if (el) el.textContent = uiText('remove_background_failed', '실패');
      }
      progress.set(((i + 1) / files.length) * 100);
    }

    (window as unknown as { __nobg: typeof results }).__nobg = results;
    statusEl.textContent = uiText('remove_background_status_done', '완료. ZIP으로 다운로드하세요.');
  } catch (err) {
    console.error(err);
    statusEl.textContent = uiText(
      'remove_background_status_error',
      '배경 제거 모델을 불러오지 못했습니다. 네트워크 후 다시 시도하세요.',
    );
  }

  progress.hide();
  removeBtn.textContent = uiText('remove_background_remove', '배경 제거');
  (removeBtn as HTMLButtonElement).disabled = false;
});

downloadZipBtn.addEventListener('click', async () => {
  const results = (window as unknown as { __nobg?: { blob: Blob; name: string }[] }).__nobg;
  if (!results?.length) return;
  await downloadZip(results, 'zxzx-nobg.zip');
});
