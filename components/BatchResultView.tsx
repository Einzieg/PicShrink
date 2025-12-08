import React, { useState } from 'react';
import JSZip from 'jszip';
import { BatchItem } from '../types';
import { DownloadIcon, RefreshIcon } from './Icons';
import { formatBytes } from '../utils/imageCompressor';

interface BatchResultViewProps {
  items: BatchItem[];
  isProcessing: boolean;
  onReset: () => void;
}

const BatchResultView: React.FC<BatchResultViewProps> = ({ items, isProcessing, onReset }) => {
  const [isZipping, setIsZipping] = useState(false);

  const completedItems = items.filter(i => i.status === 'completed' && i.result);
  const totalOriginalSize = completedItems.reduce((acc, curr) => acc + (curr.result?.originalSize || 0), 0);
  const totalCompressedSize = completedItems.reduce((acc, curr) => acc + (curr.result?.compressedSize || 0), 0);
  
  // Only show savings if we are actually saving space (mostly for compression)
  const totalSavings = totalOriginalSize > 0 
    ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100 
    : 0;
  
  const showSavings = totalSavings > 0;

  const handleDownloadAll = async () => {
    if (completedItems.length === 0) return;
    
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // Add files to zip
      completedItems.forEach(item => {
        if (item.result) {
          zip.file(item.result.file.name, item.result.file);
        }
      });

      // Generate zip blob
      const content = await zip.generateAsync({ type: "blob" });
      
      // Trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `imgtools_processed_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (e) {
      console.error("Zip generation failed", e);
      alert("打包下载失败，请重试");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-8 text-center md:text-left">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">原始总大小</p>
            <p className="text-xl font-bold text-slate-800">{formatBytes(totalOriginalSize)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">处理后大小</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-indigo-600">{formatBytes(totalCompressedSize)}</p>
              {showSavings && (
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  -{totalSavings.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs text-slate-400 font-semibold uppercase">数量</p>
            <p className="text-xl font-bold text-slate-800">{completedItems.length} / {items.length}</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
           <button 
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors flex items-center gap-2"
          >
            <RefreshIcon className="w-4 h-4" />
            <span className="hidden sm:inline">重新上传</span>
          </button>
          <button 
            onClick={handleDownloadAll}
            disabled={isZipping || completedItems.length === 0}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-white font-medium text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5
              ${isZipping || completedItems.length === 0 ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isZipping ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                正在打包...
              </>
            ) : (
              <>
                <DownloadIcon className="w-4 h-4" />
                批量下载 (ZIP)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            {/* Thumbnail */}
            <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
               {item.result ? (
                 <img src={item.result.previewUrl} alt="Preview" className="w-full h-full object-cover" />
               ) : (
                 <div className="text-xs text-slate-400">...</div>
               )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-slate-900 truncate" title={item.originalFile.name}>
                {item.originalFile.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                 {item.status === 'processing' && (
                    <span className="text-xs text-indigo-500 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                      处理中...
                    </span>
                 )}
                 {item.status === 'completed' && item.result && (
                   <>
                    <span className="text-xs text-slate-400 line-through">{formatBytes(item.result.originalSize)}</span>
                    <span className="text-xs font-bold text-indigo-600">{formatBytes(item.result.compressedSize)}</span>
                   </>
                 )}
                 {item.status === 'error' && (
                   <span className="text-xs text-red-500">处理失败</span>
                 )}
              </div>
            </div>

            {/* Status Icon */}
            <div className="shrink-0">
              {item.status === 'completed' && (
                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchResultView;