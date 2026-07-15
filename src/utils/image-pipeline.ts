/** Shared image decode/encode pipeline (jSquash + canvas fallback). */
import { decode as decodeJpeg, encode as encodeJpeg } from '@jsquash/jpeg';
import { decode as decodeWebp, encode as encodeWebp } from '@jsquash/webp';
import { decode as decodePng, encode as encodePng } from '@jsquash/png';
import { decode as decodeAvif, encode as encodeAvif } from '@jsquash/avif';
import { optimise as optimisePng } from '@jsquash/oxipng';
import resize from '@jsquash/resize';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif';
export type ResizeMethod =
  | 'triangle'
  | 'catrom'
  | 'mitchell'
  | 'lanczos3'
  | 'hqx';

export interface EncodedFile {
  blob: Blob;
  name: string;
}

export function mimeToFormat(mime: string): OutputFormat {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/avif') return 'avif';
  return 'jpeg';
}

export function formatExt(format: OutputFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

export function replaceExt(name: string, format: OutputFormat): string {
  return name.replace(/\.[^.]+$/, `.${formatExt(format)}`);
}

async function decodeWithJsquash(buffer: ArrayBuffer, mime: string): Promise<ImageData | null> {
  try {
    if (mime === 'image/jpeg' || mime === 'image/jpg') return await decodeJpeg(buffer);
    if (mime === 'image/webp') return await decodeWebp(buffer);
    if (mime === 'image/png') return await decodePng(buffer);
    if (mime === 'image/avif') return await decodeAvif(buffer);
  } catch {
    return null;
  }
  return null;
}

async function decodeWithCanvas(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export async function decodeFile(file: File): Promise<ImageData> {
  const buffer = await file.arrayBuffer();
  const viaWasm = await decodeWithJsquash(buffer, file.type);
  if (viaWasm) return viaWasm;
  return decodeWithCanvas(file);
}

export async function encodeImageData(
  imageData: ImageData,
  format: OutputFormat,
  quality = 0.8,
): Promise<Blob> {
  const q = Math.round(Math.min(1, Math.max(0.01, quality)) * 100);
  let encoded: ArrayBuffer;

  if (format === 'jpeg') {
    encoded = await encodeJpeg(imageData, { quality: q });
  } else if (format === 'webp') {
    encoded = await encodeWebp(imageData, { quality: q });
  } else if (format === 'avif') {
    encoded = await encodeAvif(imageData, { quality: Math.max(1, Math.round(q / 2)), speed: 8 });
  } else {
    const png = await encodePng(imageData);
    encoded = await optimisePng(png, { level: 2 });
  }

  return new Blob([new Uint8Array(encoded)], {
    type: `image/${format === 'jpeg' ? 'jpeg' : format}`,
  });
}

export async function resizeImageData(
  imageData: ImageData,
  width: number,
  height: number,
  method: ResizeMethod = 'lanczos3',
): Promise<ImageData> {
  return resize(imageData, { width, height, method });
}

export async function imageDataToCanvas(imageData: ImageData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext('2d')!.putImageData(imageData, 0, 0);
  return canvas;
}

export async function canvasToImageData(canvas: HTMLCanvasElement): Promise<ImageData> {
  return canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
}

export async function rotateImageData(
  imageData: ImageData,
  degrees: 90 | 180 | 270,
): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  const rad = (degrees * Math.PI) / 180;
  const swap = degrees === 90 || degrees === 270;
  canvas.width = swap ? imageData.height : imageData.width;
  canvas.height = swap ? imageData.width : imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  const tmp = document.createElement('canvas');
  tmp.width = imageData.width;
  tmp.height = imageData.height;
  tmp.getContext('2d')!.putImageData(imageData, 0, 0);
  ctx.drawImage(tmp, -imageData.width / 2, -imageData.height / 2);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export async function flipImageData(
  imageData: ImageData,
  axis: 'h' | 'v',
): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(axis === 'h' ? canvas.width : 0, axis === 'v' ? canvas.height : 0);
  ctx.scale(axis === 'h' ? -1 : 1, axis === 'v' ? -1 : 1);
  const tmp = document.createElement('canvas');
  tmp.width = imageData.width;
  tmp.height = imageData.height;
  tmp.getContext('2d')!.putImageData(imageData, 0, 0);
  ctx.drawImage(tmp, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export async function downloadZip(files: EncodedFile[], zipName = 'zxzx-images.zip'): Promise<void> {
  if (!files.length) return;
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, f.blob);
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, zipName);
}

export function downloadBlob(blob: Blob, name: string): void {
  saveAs(blob, name);
}
