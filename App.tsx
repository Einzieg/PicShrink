import React, { useState, useEffect, useCallback } from 'react';
import FileUploader from './components/FileUploader';
import ControlPanel from './components/ControlPanel';
import ResultView from './components/ResultView';
import BatchResultView from './components/BatchResultView';
import { compressImage } from './utils/imageCompressor';
import { AppState, CompressionSettings, CompressedResult, BatchItem } from './types';
import { ImageIcon } from './components/Icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  // Batch State
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  
  const [settings, setSettings] = useState<CompressionSettings>({
    maxSizeKB: 250,
    maxWidthOrHeight: 0,
    format: 'image/jpeg'
  });

  // Unique signature for settings to trigger re-compression
  const settingsSignature = JSON.stringify(settings);

  // Process Queue Effect
  useEffect(() => {
    if (batchItems.length === 0) return;

    // Check if we need to process anything
    const pendingItems = batchItems.filter(item => item.status === 'pending');
    
    if (pendingItems.length === 0) {
      if (batchItems.some(i => i.status === 'processing')) {
        setAppState(AppState.PROCESSING);
      } else {
        setAppState(AppState.COMPLETED);
      }
      return;
    }

    setAppState(AppState.PROCESSING);

    // Process one by one (or in small parallel chunks)
    // Here we pick the first pending item
    const itemToProcess = pendingItems[0];
    
    // Mark as processing
    setBatchItems(prev => prev.map(i => 
      i.id === itemToProcess.id ? { ...i, status: 'processing' } : i
    ));

    const processItem = async () => {
      try {
        const compressedFile = await compressImage(itemToProcess.originalFile, settings);
        
        const previewUrl = URL.createObjectURL(compressedFile);
        
        const result: CompressedResult = {
          file: compressedFile,
          previewUrl,
          originalSize: itemToProcess.originalFile.size,
          compressedSize: compressedFile.size,
          compressionRatio: compressedFile.size / itemToProcess.originalFile.size,
          width: 0, 
          height: 0
        };

        setBatchItems(prev => prev.map(i => 
          i.id === itemToProcess.id ? { ...i, status: 'completed', result } : i
        ));
      } catch (error) {
        console.error(`Compression failed for ${itemToProcess.originalFile.name}`, error);
        setBatchItems(prev => prev.map(i => 
          i.id === itemToProcess.id ? { ...i, status: 'error', error: 'Failed' } : i
        ));
      }
    };

    // Small delay to allow UI update
    setTimeout(processItem, 50);

  }, [batchItems, settingsSignature]);

  // If settings change, mark all as pending to re-process (Live Update)
  // We use a debounce here to avoid thrashing if user is typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (batchItems.length > 0) {
         // Only reset items that are completed or error, and if settings actually warrant a change?
         // Simpler: Just mark all completed/error items as pending again to re-apply new settings.
         // We avoid resetting 'processing' to prevent race conditions, they will finish and user can trigger again if needed.
         // Actually, let's just mark everything that isn't pending as pending.
         setBatchItems(prev => prev.map(item => {
            if (item.status === 'completed' || item.status === 'error') {
               // Revoke old URL to avoid memory leaks
               if (item.result?.previewUrl) URL.revokeObjectURL(item.result.previewUrl);
               // Fix: result must be null, not undefined, to match BatchItem interface
               return { ...item, status: 'pending', result: null };
            }
            return item;
         }));
      }
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsSignature]);


  const handleFilesSelect = (files: File[]) => {
    const newItems: BatchItem[] = files.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      originalFile: f,
      status: 'pending',
      result: null
    }));
    
    // If we already have items, we append? Or replace? 
    // Usually bulk upload replaces or appends. Let's replace for simplicity of "Start Over" flow, 
    // or append if we want an accumulator.
    // Given the UI structure, replacement is cleaner for "New Session".
    // But if dragging more files, appending is better. 
    // Let's Replace for now as per `handleReset` logic pattern in previous code.
    // Actually, Append is better UX if user forgot one file.
    // But the `handleReset` clears it. Let's stick to Replace for a clean state, or check if IDLE.
    // Let's do Replace to match the "Result View" modal feeling.
    
    // Clean up old URLs
    batchItems.forEach(i => {
      if (i.result?.previewUrl) URL.revokeObjectURL(i.result.previewUrl);
    });

    setBatchItems(newItems);
    setAppState(AppState.PROCESSING);
  };

  const handleReset = () => {
    // Clean up
    batchItems.forEach(i => {
        if (i.result?.previewUrl) URL.revokeObjectURL(i.result.previewUrl);
    });
    setBatchItems([]);
    setAppState(AppState.IDLE);
  };

  // Derived state for the ControlPanel
  // For batch, we just show the size of the first file as reference, or sum? 
  // Let's show sum or average? ControlPanel expects a single size.
  // We will pass the size of the *currently processing* or first file, or just 0 if many.
  const referenceSizeKB = batchItems.length > 0 
    ? (batchItems[0].originalFile.size / 1024) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 bg-opacity-80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
               <ImageIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              PicShrink
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
            智能图片压缩工具
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {batchItems.length === 0 ? (
          /* Empty State */
          <div className="max-w-xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
                无损画质，<br/> 批量极速压缩。
              </h2>
              <p className="text-lg text-slate-600">
                设定目标大小，我们搞定算法。<br/>
                支持批量上传、修改，一键打包下载。
              </p>
            </div>
            <FileUploader onFileSelect={handleFilesSelect} />
            
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                {[
                    { title: '隐私优先', desc: '无服务器上传，100% 本地处理。' },
                    { title: '批量处理', desc: '一次搞定多张图片，效率倍增。' },
                    { title: '打包下载', desc: '自动生成 ZIP 包，整理更轻松。' },
                ].map((feature, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-1">{feature.title}</h3>
                        <p className="text-sm text-slate-500">{feature.desc}</p>
                    </div>
                ))}
            </div>
          </div>
        ) : (
          /* Workspace */
          <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in">
            
            {/* Left Column: Controls */}
            <div className="w-full lg:w-1/3 space-y-6 lg:sticky lg:top-24">
               <ControlPanel 
                 settings={settings} 
                 setSettings={setSettings} 
                 originalSizeKB={referenceSizeKB} 
               />
               
               <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-sm text-blue-800">
                 <strong>提示:</strong> 设置将应用于所有已上传的图片。
               </div>
            </div>

            {/* Right Column: Result */}
            <div className="w-full lg:w-2/3">
              {batchItems.length === 1 ? (
                 <ResultView 
                    originalFile={batchItems[0].originalFile} 
                    result={batchItems[0].result} 
                    isProcessing={batchItems[0].status === 'processing' || batchItems[0].status === 'pending'}
                    onReset={handleReset}
                 />
              ) : (
                 <BatchResultView 
                   items={batchItems}
                   isProcessing={appState === AppState.PROCESSING}
                   onReset={handleReset}
                 />
              )}
            </div>
          </div>
        )}

      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} PicShrink. 为效率而生。
      </footer>
    </div>
  );
};

export default App;