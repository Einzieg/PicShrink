import React from 'react';
import { CompressionSettings } from '../types';

interface ControlPanelProps {
  settings: CompressionSettings;
  setSettings: (settings: CompressionSettings) => void;
  originalSizeKB: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, setSettings, originalSizeKB }) => {
  
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSettings({ ...settings, maxSizeKB: isNaN(val) ? 100 : val });
  };

  const handleDimChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({ ...settings, maxWidthOrHeight: parseInt(e.target.value) });
  };

  const presets = [
    { label: '极限 (50KB)', value: 50 },
    { label: '图标 (100KB)', value: 100 },
    { label: '网页 (250KB)', value: 250 },
    { label: '高清 (500KB)', value: 500 },
    { label: '最大 (1MB)', value: 1024 },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">压缩设置</h2>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">配置</span>
      </div>

      {/* Target Size Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          目标文件大小 (KB)
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            min="10"
            max="5000"
            value={settings.maxSizeKB}
            onChange={handleSizeChange}
            className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-medium shadow-sm"
          />
          <div className="text-sm text-slate-400 whitespace-nowrap">
             原大小: {Math.round(originalSizeKB)} KB
          </div>
        </div>
        
        {/* Presets */}
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setSettings({ ...settings, maxSizeKB: preset.value })}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                settings.maxSizeKB === preset.value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Max Dimensions */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          最大尺寸 (宽/高)
        </label>
        <select
          value={settings.maxWidthOrHeight}
          onChange={handleDimChange}
          className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm shadow-sm"
        >
          <option value={0}>原始尺寸</option>
          <option value={2048}>2048px (2K)</option>
          <option value={1920}>1920px (Full HD)</option>
          <option value={1280}>1280px (HD)</option>
          <option value={800}>800px (Web)</option>
        </select>
        <p className="mt-2 text-xs text-slate-500">
          调整尺寸可以在不明显降低画质的情况下显著减小文件体积。
        </p>
      </div>

       {/* Output Format */}
       <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          输出格式
        </label>
        <div className="flex bg-slate-100 p-1 rounded-xl">
            {['image/jpeg', 'image/webp'].map((fmt) => (
                <button
                    key={fmt}
                    onClick={() => setSettings({...settings, format: fmt as any})}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                        settings.format === fmt 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    {fmt.split('/')[1].toUpperCase()}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;