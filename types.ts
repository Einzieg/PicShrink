
export type ToolType = 'compress' | 'convert' | 'md5' | 'resize' | 'crop' | 'rotate';

export interface CompressedResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

export type CropRatioType = 'original' | '1:1' | '16:9' | '4:3' | '3:4' | '9:16' | '3:2' | '2:3';

export interface ProcessingSettings {
  tool: ToolType;
  
  // Compression specific
  maxSizeKB: number;
  maxWidthOrHeight: number; // Used for "Smart Compress" simple resize
  
  // Shared / Convert specific
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  
  // MD5 specific
  addNoise?: boolean;

  // Resize Tool
  resizeMode: 'dimensions' | 'percentage';
  resizeWidth: number;
  resizeHeight: number;
  resizePercentage: number;
  maintainAspectRatio: boolean;

  // Crop Tool
  cropRatio: CropRatioType;

  // Rotate Tool
  rotateAngle: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
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
