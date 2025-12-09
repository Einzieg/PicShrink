
import React from 'react';
import { ToolType } from '../types';
import { DownloadIcon, RefreshIcon, HashIcon, ImageIcon, ResizeIcon, CropIcon, RotateIcon } from './Icons';

interface SidebarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTool, onSelectTool }) => {
  const tools: { id: ToolType; label: string; icon: React.ReactNode; desc: string }[] = [
    { 
      id: 'compress', 
      label: '智能压缩', 
      icon: <DownloadIcon className="w-5 h-5" />,
      desc: '自定义大小限制'
    },
    { 
      id: 'resize', 
      label: '修改尺寸', 
      icon: <ResizeIcon className="w-5 h-5" />,
      desc: '调整宽高/百分比'
    },
    { 
      id: 'crop', 
      label: '图片裁剪', 
      icon: <CropIcon className="w-5 h-5" />,
      desc: '常用比例裁剪'
    },
    { 
      id: 'rotate', 
      label: '旋转翻转', 
      icon: <RotateIcon className="w-5 h-5" />,
      desc: '90°旋转与镜像'
    },
    { 
      id: 'convert', 
      label: '格式转换', 
      icon: <RefreshIcon className="w-5 h-5" />,
      desc: '格式互转'
    },
    { 
      id: 'md5', 
      label: 'MD5 修改', 
      icon: <HashIcon className="w-5 h-5" />,
      desc: '生成唯一Hash'
    },
  ];

  return (
    <div className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 z-20 h-auto lg:h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white mr-3">
            <ImageIcon className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Img-Tools</h1>
      </div>

      {/* Nav */}
      <nav className="p-4 flex-1 space-y-2 overflow-y-auto flex lg:block overflow-x-auto">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`flex-1 lg:flex-none lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left min-w-[140px]
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
            >
              <div className={`shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {tool.icon}
              </div>
              <div>
                <div className={`font-semibold ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {tool.label}
                </div>
                <div className={`text-xs mt-0.5 hidden lg:block ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
                  {tool.desc}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 text-xs text-slate-400 text-center border-t border-slate-100 hidden lg:block">
        v2.1.0 • 纯本地处理
      </div>
    </div>
  );
};

export default Sidebar;
