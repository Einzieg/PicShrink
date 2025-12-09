
import React from 'react';
import { ProcessingSettings, ToolType, CropRatioType } from '../types';
import { SettingsIcon } from './Icons';

interface ControlPanelProps {
  settings: ProcessingSettings;
  setSettings: (settings: ProcessingSettings) => void;
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

  const updateSetting = (key: keyof ProcessingSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const presets = [
    { label: '极限 (50KB)', value: 50 },
    { label: '图标 (100KB)', value: 100 },
    { label: '网页 (250KB)', value: 250 },
    { label: '高清 (500KB)', value: 500 },
    { label: '最大 (1MB)', value: 1024 },
  ];

  const getTitle = () => {
    switch (settings.tool) {
      case 'compress': return '压缩设置';
      case 'convert': return '格式转换';
      case 'md5': return 'MD5 处理';
      case 'resize': return '修改尺寸';
      case 'crop': return '图片裁剪';
      case 'rotate': return '旋转翻转';
      default: return '设置';
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-500"/>
          {getTitle()}
        </h2>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">配置</span>
      </div>

      {/* --- 1. COMPRESS MODE --- */}
      {settings.tool === 'compress' && (
        <>
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
                 原: {Math.round(originalSizeKB)} KB
              </div>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => updateSetting('maxSizeKB', preset.value)}
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
          </div>
        </>
      )}

      {/* --- 2. RESIZE MODE --- */}
      {settings.tool === 'resize' && (
        <div className="space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button 
                onClick={() => updateSetting('resizeMode', 'dimensions')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${settings.resizeMode === 'dimensions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
             >
                固定尺寸
             </button>
             <button 
                onClick={() => updateSetting('resizeMode', 'percentage')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${settings.resizeMode === 'percentage' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
             >
                百分比缩放
             </button>
          </div>

          {settings.resizeMode === 'dimensions' ? (
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-slate-500 mb-1 block">宽度 (px)</label>
                  <input 
                    type="number" 
                    value={settings.resizeWidth || ''} 
                    placeholder="Auto"
                    onChange={(e) => updateSetting('resizeWidth', parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm"
                  />
               </div>
               <div>
                  <label className="text-xs text-slate-500 mb-1 block">高度 (px)</label>
                  <input 
                    type="number" 
                    value={settings.resizeHeight || ''} 
                    placeholder="Auto"
                    onChange={(e) => updateSetting('resizeHeight', parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm"
                  />
               </div>
               <div className="col-span-2 flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   id="ratio" 
                   checked={settings.maintainAspectRatio}
                   onChange={(e) => updateSetting('maintainAspectRatio', e.target.checked)}
                   className="rounded text-indigo-600 focus:ring-indigo-500"
                 />
                 <label htmlFor="ratio" className="text-sm text-slate-600">保持原始宽高比</label>
               </div>
            </div>
          ) : (
            <div>
               <label className="text-sm text-slate-700 mb-2 block">缩放比例: {settings.resizePercentage}%</label>
               <input 
                 type="range" 
                 min="1" 
                 max="200" 
                 value={settings.resizePercentage}
                 onChange={(e) => updateSetting('resizePercentage', parseInt(e.target.value))}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
               />
               <div className="flex justify-between text-xs text-slate-400 mt-1">
                 <span>1%</span>
                 <span>100% (原图)</span>
                 <span>200%</span>
               </div>
            </div>
          )}
        </div>
      )}

      {/* --- 3. CROP MODE --- */}
      {settings.tool === 'crop' && (
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              裁剪比例 (居中裁剪)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '原图', val: 'original' },
                { label: '1:1', val: '1:1' },
                { label: '16:9', val: '16:9' },
                { label: '4:3', val: '4:3' },
                { label: '3:4', val: '3:4' },
                { label: '9:16', val: '9:16' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => updateSetting('cropRatio', opt.val)}
                  className={`py-2 px-3 text-xs rounded-lg font-medium border transition-all ${
                    settings.cropRatio === opt.val 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
               注意：批量裁剪将自动居中并尽可能保留图片内容。
            </p>
         </div>
      )}

      {/* --- 4. ROTATE MODE --- */}
      {settings.tool === 'rotate' && (
        <div className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">旋转角度</label>
              <div className="flex gap-2">
                 {[0, 90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => updateSetting('rotateAngle', deg)}
                      className={`flex-1 py-2 text-xs rounded-lg font-medium border transition-all ${
                        settings.rotateAngle === deg
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {deg}°
                    </button>
                 ))}
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => updateSetting('flipHorizontal', !settings.flipHorizontal)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                   settings.flipHorizontal 
                   ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                   : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                 ↔ 水平镜像
              </button>
              <button 
                onClick={() => updateSetting('flipVertical', !settings.flipVertical)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                   settings.flipVertical 
                   ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                   : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                 ↕ 垂直镜像
              </button>
           </div>
        </div>
      )}

      {/* --- 5. MD5 MODE --- */}
      {settings.tool === 'md5' && (
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
           <p className="text-sm text-indigo-700 leading-relaxed">
             <strong>MD5 修改说明：</strong><br/>
             工具将对图片像素进行人眼无法感知的微调（修改 1 个像素点的 RGB 值），从而彻底改变文件的 MD5 哈希值，确保文件的唯一性。
           </p>
        </div>
      )}

       {/* OUTPUT FORMAT (Shared) */}
       <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {settings.tool === 'convert' ? '目标转换格式' : '输出格式'}
        </label>
        <div className="flex bg-slate-100 p-1 rounded-xl">
            {['image/jpeg', 'image/png', 'image/webp'].map((fmt) => (
                <button
                    key={fmt}
                    onClick={() => updateSetting('format', fmt)}
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
