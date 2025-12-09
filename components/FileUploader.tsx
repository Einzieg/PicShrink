
import React, { useRef, useState } from 'react';
import { UploadIcon } from './Icons';

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files);
    }
  };

  const validateAndProcess = (fileList: FileList) => {
    const validFiles: File[] = [];
    Array.from(fileList).forEach(file => {
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    } else {
      alert('请上传有效的图片文件 (JPG, PNG, WebP)');
    }
  };

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 ease-in-out border-2 border-dashed rounded-3xl h-64 flex flex-col items-center justify-center p-6 text-center
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
          : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50 bg-white'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
      />
      
      <div className={`p-4 rounded-full bg-indigo-100 text-indigo-600 mb-4 transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
        <UploadIcon className="w-8 h-8" />
      </div>
      
      <h3 className="text-xl font-semibold text-slate-800 mb-2">
        点击或拖拽上传图片
      </h3>
      <p className="text-slate-500 max-w-xs mx-auto">
        支持批量处理 <br/>
        <span className="text-sm text-slate-400 mt-1 block">支持 JPG, PNG, WebP</span>
      </p>
    </div>
  );
};

export default FileUploader;
