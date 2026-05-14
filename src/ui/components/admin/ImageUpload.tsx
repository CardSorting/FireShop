'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { sanitizeImageUrl } from '@utils/sanitizer';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: 'products' | 'collections';
  label?: string;
}

export function ImageUpload({ value, onChange, folder = 'products', label = 'Media gallery' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.path);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <ImageIcon className="h-4 w-4" /> {label}
      </h2>
      
      <div className="grid gap-6 md:grid-cols-[1fr_160px]">
        <div 
          className={`
            relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all
            ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center text-center">
            {isUploading ? (
              <>
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary-600" />
                <p className="text-sm font-bold text-gray-900">Processing image...</p>
                <p className="text-xs text-gray-500">Optimizing for lean delivery</p>
              </>
            ) : (
              <>
                <div className="mb-3 rounded-full bg-white p-3 shadow-sm ring-1 ring-black/5">
                  <Upload className="h-6 w-6 text-primary-600" />
                </div>
                <p className="text-sm font-bold text-gray-900">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary-600 hover:underline"
                  >
                    Click to upload
                  </button>
                  {' '}or drag and drop
                </p>
                <p className="mt-1 text-xs text-gray-500">WebP, PNG, JPG up to 10MB</p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="group relative aspect-square w-full overflow-hidden rounded-xl border bg-gray-100 shadow-inner">
            {value ? (
              <>
                <Image 
                  src={sanitizeImageUrl(value)} 
                  alt="Preview" 
                  fill
                  className="object-contain transition duration-500 group-hover:scale-110" 
                  sizes="160px"
                />
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-red-600 opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-2 right-2 rounded-full bg-green-500 p-1 text-white shadow-lg">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-gray-300">
                <ImageIcon className="h-8 w-8" />
                <span className="mt-2 text-[10px] font-bold uppercase tracking-widest">No preview</span>
              </div>
            )}
          </div>
          
          {value && (
            <div className="truncate rounded-lg bg-gray-50 px-2 py-1.5 text-[10px] font-medium text-gray-400">
              {value}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/50 p-3">
        <div className="rounded-full bg-amber-100 p-1">
          <Upload className="h-3 w-3 text-amber-600" />
        </div>
        <p className="text-[10px] font-medium text-amber-800">
          <strong>Lean Strategy:</strong> Images are automatically converted to WebP and optimized for high-speed delivery.
        </p>
      </div>
    </section>
  );
}
