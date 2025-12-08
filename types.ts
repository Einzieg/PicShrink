export type ToolType = 'compress' | 'convert' | 'md5';

export interface CompressedResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

export interface ProcessingSettings {
  tool: ToolType;
  // Compression specific
  maxSizeKB: number;
  maxWidthOrHeight: number;
  // Shared / Convert specific
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  // MD5 specific
  addNoise?: boolean;
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