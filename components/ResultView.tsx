import React from 'react';
import { CompressedResult } from '../types';
import { DownloadIcon, RefreshIcon, ArrowRightIcon } from './Icons';
import { formatBytes } from '../utils/imageCompressor';

interface ResultViewProps {
  originalFile: File;
  result: CompressedResult | null;
  isProcessing: boolean;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ originalFile, result, isProcessing, onReset }) => {
  const [originalUrl, setOriginalUrl] = React.useState<string>('');

  React.useEffect(() => {
    const url = URL.createObjectURL(originalFile);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalFile]);

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.previewUrl;
    link.download = result.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isProcessing) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-white rounded-3xl shadow-sm border border-slate-100 animate-pulse">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium">正在强力压缩中...</p>
      </div>
    );
  }

  if (!result) return null;

  const isSuccess = result.compressedSize <= originalFile.size;
  const savings = ((originalFile.size - result.compressedSize) / originalFile.size) * 100;

  return (
    <div className="space-y-6">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-slate-400 font-semibold uppercase">原始大小</span>
            <span className="text-lg font-bold text-slate-800">{formatBytes(result.originalSize)}</span>
        </div>
        <div className="hidden sm:flex justify-center items-center text-slate-300">
            <ArrowRightIcon className="w-6 h-6" />
        </div>
        <div className={`bg-white p-4 rounded-2xl shadow-sm border flex flex-col justify-center items-center text-center ${isSuccess ? 'border-green-100 bg-green-50' : 'border-amber-100 bg-amber-50'}`}>
            <span className={`text-xs font-semibold uppercase ${isSuccess ? 'text-green-600' : 'text-amber-600'}`}>
                {isSuccess ? '压缩后' : '结果'}
            </span>
            <span className={`text-lg font-bold ${isSuccess ? 'text-green-700' : 'text-amber-700'}`}>
                {formatBytes(result.compressedSize)}
            </span>
            {isSuccess && (
                <span className="text-xs font-bold text-green-600 bg-green-200 px-2 py-0.5 rounded-full mt-1">
                    -{savings.toFixed(1)}%
                </span>
            )}
        </div>
      </div>

      {/* Visual Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500 text-center">原图</p>
            <div className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                <img src={originalUrl} alt="Original" className="w-full h-full object-contain p-2" />
            </div>
        </div>
        <div className="space-y-2">
             <p className="text-sm font-medium text-slate-500 text-center">压缩效果</p>
            <div className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                <img src={result.previewUrl} alt="Compressed" className="w-full h-full object-contain p-2" />
            </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button 
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
        >
          <RefreshIcon className="w-5 h-5" />
          重新开始
        </button>
        <button 
          onClick={handleDownload}
          className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transform hover:-translate-y-0.5 transition-all"
        >
          <DownloadIcon className="w-5 h-5" />
          下载图片
        </button>
      </div>
    </div>
  );
};

export default ResultView;