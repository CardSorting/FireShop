import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  X, 
  Loader2, 
  AlertCircle, 
  FileText,
  Trash2,
  Download,
  FileArchive,
  FileCode,
  FileJson,
  FileAudio,
  FileVideo,
  FileImage,
  ExternalLink
} from 'lucide-react';
import { DigitalAsset } from '@domain/models';
import { formatBytes } from '@utils/formatters';

interface DigitalAssetManagerProps {
  assets: DigitalAsset[];
  onChange: (assets: DigitalAsset[]) => void;
}

export function DigitalAssetManager({ assets, onChange }: DigitalAssetManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | File[]) => {
    setIsUploading(true);
    setError(null);
    const newAssets: DigitalAsset[] = [...assets];
    
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'digital-assets');
        
        // Using existing upload endpoint - we might need a more secure one for digital products
        const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Upload failed');
        
        newAssets.push({
          id: crypto.randomUUID(),
          name: file.name,
          url: data.path,
          size: file.size,
          mimeType: file.type,
          createdAt: new Date()
        });
      }
      onChange(newAssets);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAsset = (id: string) => {
    onChange(assets.filter(a => a.id !== id));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="h-5 w-5" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="h-5 w-5" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-5 w-5" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className="h-5 w-5" />;
    if (mimeType.includes('json')) return <FileJson className="h-5 w-5" />;
    if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('html')) return <FileCode className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  return (
    <div className="space-y-4">
      <div 
        className={`
          relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all
          ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files) handleUpload(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" multiple onChange={(e) => e.target.files && handleUpload(e.target.files)} className="hidden" />
        <div className="flex flex-col items-center text-center cursor-pointer">
          {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-primary-600" /> : (
            <>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
                <FileUp className="h-6 w-6 text-primary-600" />
              </div>
              <p className="text-sm font-bold text-gray-900">Upload digital assets</p>
              <p className="mt-1 text-xs text-gray-500">Drag and drop files here, or click to browse</p>
              <p className="mt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">PDF, ZIP, MP4, PNG, etc. up to 50MB</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-xs font-bold text-red-600 border border-red-100">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {assets.length > 0 && (
        <div className="divide-y rounded-xl border bg-white overflow-hidden shadow-sm">
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between p-4 transition hover:bg-gray-50">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {getFileIcon(asset.mimeType)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{asset.name}</p>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{formatBytes(asset.size)} • {asset.mimeType.split('/')[1] || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={asset.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
                  title="Preview"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button 
                  onClick={() => removeAsset(asset.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
