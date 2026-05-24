declare module "heic-convert" {
  function convert(options: {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  }): Promise<Buffer | ArrayBuffer>;

  namespace convert {
    function all(options: {
      buffer: Buffer;
      format: "JPEG" | "PNG";
    }): Promise<Array<{ convert: () => Promise<Buffer> }>>;
  }
  export = convert;
}

declare module "multer" {
  import { RequestHandler } from "express";

  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
  }

  interface StorageEngine {
    _handleFile: unknown;
    _removeFile: unknown;
  }

  interface Multer {
    (options?: { storage?: StorageEngine; limits?: { fileSize?: number } }): {
      single: (field: string) => RequestHandler;
      array: (field: string, maxCount?: number) => RequestHandler;
    };
    memoryStorage: () => StorageEngine;
  }

  const multer: Multer;
  export = multer;
}

declare module "javascript-barcode-reader" {
  function javascriptBarcodeReader(options: {
    image: string | { data: Uint8ClampedArray; width: number; height: number };
    barcode: string;
    options?: {
      detectRotation?: boolean;
      locateBarcode?: boolean;
      useAdaptiveThreshold?: boolean;
      singlePass?: boolean;
    };
  }): Promise<string>;
  export default javascriptBarcodeReader;
}
