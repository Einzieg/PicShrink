import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import ControlPanel from './components/ControlPanel';
import BatchResultView from './components/BatchResultView';
import Sidebar from './components/Sidebar';
import { processImage } from './utils/imageCompressor';
import { AppState, ProcessingSettings, CompressedResult, BatchItem, ToolType } from './types';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('compress');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  // Batch State
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  
  const [settings, setSettings] = useState<ProcessingSettings>({
    tool: 'compress',
    maxSizeKB: 250,
    maxWidthOrHeight: 0,
    format: 'image/jpeg'
  });

  // When tool changes, reset state and update settings tool type
  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    setSettings(prev => ({ ...prev, tool: tool }));
    handleReset(); // Clear current files to avoid confusion
  };

  // Unique signature for settings to trigger re-processing
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

    const itemToProcess = pendingItems[0];
    
    // Mark as processing
    setBatchItems(prev => prev.map(i => 
      i.id === itemToProcess.id ? { ...i, status: 'processing' } : i
    ));

    const processItemTask = async () => {
      try {
        const processedFile = await processImage(itemToProcess.originalFile, settings);
        
        const previewUrl = URL.createObjectURL(processedFile);
        
        const result: CompressedResult = {
          file: processedFile,
          previewUrl,
          originalSize: itemToProcess.originalFile.size,
          compressedSize: processedFile.size,
          compressionRatio: processedFile.size / itemToProcess.originalFile.size,
          width: 0, 
          height: 0
        };

        setBatchItems(prev => prev.map(i => 
          i.id === itemToProcess.id ? { ...i, status: 'completed', result } : i
        ));
      } catch (error) {
        console.error(`Processing failed for ${itemToProcess.originalFile.name}`, error);
        setBatchItems(prev => prev.map(i => 
          i.id === itemToProcess.id ? { ...i, status: 'error', error: 'Failed' } : i
        ));
      }
    };

    // Small delay to allow UI update
    setTimeout(processItemTask, 50);

  }, [batchItems, settingsSignature]);

  // If settings change, mark all as pending to re-process (Live Update)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (batchItems.length > 0) {
         setBatchItems(prev => prev.map(item => {
            if (item.status === 'completed' || item.status === 'error') {
               if (item.result?.previewUrl) URL.revokeObjectURL(item.result.previewUrl);
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
    
    batchItems.forEach(i => {
      if (i.result?.previewUrl) URL.revokeObjectURL(i.result.previewUrl);
    });

    setBatchItems(newItems);
    setAppState(AppState.PROCESSING);
  };

  const handleReset = () => {
    batchItems.forEach(i => {
        if (i.result?.previewUrl) URL.revokeObjectURL(i.result.previewUrl);
    });
    setBatchItems([]);
    setAppState(AppState.IDLE);
  };

  const referenceSizeKB = batchItems.length > 0 
    ? (batchItems[0].originalFile.size / 1024) 
    : 0;

  const getToolTitle = () => {
    switch(activeTool) {
      case 'compress': return '智能批量压缩';
      case 'convert': return '万能格式转换';
      case 'md5': return 'MD5 唯一化处理';
    }
  };

  const getToolDesc = () => {
    switch(activeTool) {
      case 'compress': return '在保持画质的前提下，将体积压缩到极致。';
      case 'convert': return '支持 JPG, PNG, WebP 等主流格式的一键互转。';
      case 'md5': return '通过微调图像数据，生成全新的文件 MD5 哈希值，防止查重。';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-900">
      
      {/* Sidebar Navigation */}
      <Sidebar activeTool={activeTool} onSelectTool={handleToolChange} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {batchItems.length === 0 ? (
            /* Empty State */
            <div className="max-w-2xl mx-auto animate-fade-in-up mt-10 lg:mt-20">
              <div className="text-center mb-12">
                <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wide mb-4">
                   {activeTool === 'md5' ? 'Anti-Duplicate' : 'Img-Tools'}
                </span>
                <h2 className="text-4xl font-extrabold text-slate-900 sm:text-5xl mb-6 tracking-tight">
                  {getToolTitle()}
                </h2>
                <p className="text-xl text-slate-500 leading-relaxed">
                  {getToolDesc()}
                </p>
              </div>
              
              <FileUploader onFileSelect={handleFilesSelect} />
              
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  {[
                      { title: '极速处理', desc: '本地运算，无需上传服务器' },
                      { title: '批量操作', desc: '支持多文件并发处理' },
                      { title: '安全隐私', desc: '文件仅在浏览器中流转' },
                  ].map((feature, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <h3 className="font-bold text-slate-800 mb-2">{feature.title}</h3>
                          <p className="text-sm text-slate-500">{feature.desc}</p>
                      </div>
                  ))}
              </div>
            </div>
          ) : (
            /* Workspace */
            <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in">
              
              {/* Left Column: Controls */}
              <div className="w-full lg:w-80 space-y-6 lg:sticky lg:top-10">
                 <ControlPanel 
                   settings={settings} 
                   setSettings={setSettings} 
                   originalSizeKB={referenceSizeKB} 
                 />
                 
                 <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-sm text-indigo-800">
                   <strong>当前模式:</strong> {getToolTitle()}
                   <br/>
                   <span className="text-xs opacity-80">更改设置将自动重新处理所有图片。</span>
                 </div>
              </div>

              {/* Right Column: Result */}
              <div className="flex-1 w-full">
                 <BatchResultView 
                   items={batchItems}
                   isProcessing={appState === AppState.PROCESSING}
                   onReset={handleReset}
                 />
              </div>
            </div>
          )}

        </main>
        
        <footer className="py-6 text-center text-slate-400 text-xs border-t border-slate-200 mt-auto bg-white lg:bg-transparent">
          &copy; {new Date().getFullYear()} Img-Tools. 让图片处理更简单。
        </footer>
      </div>
    </div>
  );
};

export default App;