import React, { useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileDropZoneProps {
  onFile: (file: File) => void;
  className?: string;
}

export function FileDropZone({ onFile, className = '' }: FileDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.eml')) {
        onFile(file);
      }
    },
    [onFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.name.endsWith('.eml')) {
        onFile(file);
      }
    },
    [onFile]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed border-gray-300 rounded-lg p-12 text-center 
        hover:border-indigo-500 transition-colors duration-200 cursor-pointer ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".eml"
        onChange={handleFileInput}
        className="hidden"
        id="file-input"
      />
      <div className="flex flex-col items-center">
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-xl font-medium text-gray-700 mb-2">
          EMLファイルをドロップ
        </p>
        <p className="text-sm text-gray-500">
          またはクリックしてファイルを選択
        </p>
      </div>
    </div>
  );
}