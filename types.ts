export interface CompressedResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

export interface CompressionSettings {
  maxSizeKB: number;
  maxWidthOrHeight: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface BatchItem {
  id: string;
  originalFile: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result: CompressedResult | null;
  error?: string;
}