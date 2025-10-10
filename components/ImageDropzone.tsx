import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UploadIcon, CloseIcon } from './icons';

interface ImageDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ files, onFilesChange }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleIncomingFiles = useCallback((incomingFiles: FileList | File[]) => {
    const imageFiles = Array.from(incomingFiles).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      onFilesChange([...files, ...imageFiles]);
    }
  }, [files, onFilesChange]);
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIncomingFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [handleIncomingFiles]);

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFiles(e.target.files);
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    }
  };

  return (
    <div>
        {/* Input file invisível */}
        <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
        />

        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`w-full p-6 border-2 border-dashed rounded-lg transition-colors duration-200 cursor-pointer ${
            isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-600 hover:border-gray-400 hover:bg-gray-800/30'
            }`}
        >
            <div className="flex flex-col items-center justify-center text-center">
                <UploadIcon className="w-12 h-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-300">
                    <span className="font-semibold text-indigo-400">Clique aqui</span>, <span className="font-semibold text-indigo-400">arraste e solte</span> imagens, ou cole (Ctrl+V)
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
            </div>
        </div>

        {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
                <div key={index} className="relative group">
                <div className="aspect-w-1 aspect-h-1">
                    <img
                    src={preview}
                    alt={`Preview ${index}`}
                    className="object-cover w-full h-full rounded-md"
                    />
                </div>
                <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                >
                    <CloseIcon className="w-4 h-4" />
                </button>
                </div>
            ))}
            </div>
        )}
    </div>
  );
};
