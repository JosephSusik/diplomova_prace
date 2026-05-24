// src/services/barcode.ts
import convert from "heic-convert";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";
import { readBarcodesFromImageData } from "zxing-wasm/reader";

const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".heic", ".heif"];

/**
 * Normalize ISBN: strip non-digits.
 */
function normalizeISBN(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Convert HEIC/HEIF buffer to JPEG buffer.
 *
 * heic-decode expects a Uint8Array/Buffer (slice returns bytes iterable for UTF-8 sniffing).
 * Passing a raw ArrayBuffer breaks: ArrayBuffer.slice → spread → TypeError (not iterable).
 */
async function heicToJpeg(buffer: Buffer): Promise<Buffer> {
  // @types/heic-convert incorrectly declares `buffer: ArrayBufferLike`, but heic-decode
  // internally spreads `buffer.slice(start, end)` — which requires a Uint8Array, not a
  // plain ArrayBuffer. A Node Buffer IS a Uint8Array, so it works at runtime.
  // We use `as any` to bypass the incompatible DefinitelyTyped declaration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: ArrayBuffer = await (convert as any)({
    buffer,
    format: "JPEG",
    quality: 1,
  });
  return Buffer.from(raw);
}

/**
 * Attempt to decode a barcode/ISBN from a raw image buffer using ZXing WASM.
 * Sharp normalises the image (resize if huge, raw RGBA pixels) before passing
 * to ZXing, which handles rotation and challenging real-world photos.
 */
async function decodeBarcodeFromBuffer(imageBuffer: Buffer): Promise<string | null> {
  // Resize very large images — ZXing works fine on 1200 px wide images and
  // it's much faster than feeding a 12 MP photo.
  const preprocessed = await sharp(imageBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = preprocessed;

  const imageData = {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
    colorSpace: "srgb" as PredefinedColorSpace,
  };

  const results = await readBarcodesFromImageData(imageData, {
    formats: ["EAN-13", "EAN-8", "UPC-A"],
    tryHarder: true,
    tryRotate: true,
    tryInvert: true,
    tryDownscale: true,
  });

  for (const result of results) {
    if (!result.text) continue;
    const digits = normalizeISBN(result.text);
    if (digits.length === 10 || digits.length === 13) {
      return digits;
    }
  }

  return null;
}

/**
 * Scan barcode from a Buffer (e.g. from a multipart upload).
 * Handles HEIC conversion automatically.
 */
export async function scanBarcodeFromBuffer(
  buffer: Buffer,
  originalFilename?: string
): Promise<string | null> {
  const ext = originalFilename ? path.extname(originalFilename).toLowerCase() : "";
  const isHeic = ext === ".heic" || ext === ".heif";

  const imageBuffer = isHeic ? await heicToJpeg(buffer) : buffer;
  return decodeBarcodeFromBuffer(imageBuffer);
}

/**
 * Scan barcode from an image file path.
 */
export async function scanBarcodeFromImage(filePath: string): Promise<string | null> {
  const imageBuffer = await fs.readFile(filePath);
  return scanBarcodeFromBuffer(imageBuffer, filePath);
}

/**
 * Check if file extension is supported for barcode scanning.
 */
export function isSupportedImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
}
