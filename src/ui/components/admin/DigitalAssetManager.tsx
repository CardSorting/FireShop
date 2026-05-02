'use client';

/**
 * [LAYER: UI]
 * Industrialized Digital Asset Manager
 * 
 * Provides a high-velocity, secure interface for merchants to manage digital fulfillment assets.
 * Features: Multi-file orchestration, metadata editing, secure allocation previews, and LARGE FILE progress tracking.
 */
import React, { useState, useRef, useMemo } from 'react';
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
  ExternalLink,
  Edit3,
  ShieldCheck,
  Check,
  Zap,
  Tag as TagIcon,
  ChevronDown,
  Info,
  ArrowUpCircle
} from 'lucide-react';
import { DigitalAsset } from '@domain/models';
import { formatBytes } from '@utils/formatters';

interface DigitalAssetManagerProps {
  assets: DigitalAsset[];
  onChange: (assets: DigitalAsset[]) => void;
}

interface UploadState {
  fileName: string;
  progress: number;
}

export function DigitalAssetManager({ assets, onChange }: DigitalAssetManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<UploadState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFileWithProgress = (file: File): Promise<DigitalAsset> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'digital-assets');

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded * 100) / e.total);
          setCurrentUpload({ fileName: file.name, progress });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Invalid server response'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || 'Upload failed'));
          } catch (e) {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.open('POST', '/api/admin/upload');
      xhr.send(formData);
    });
  };

  const handleUpload = async (files: FileList | File[]) => {
    setIsUploading(true);
    setError(null);
    const newAssets: DigitalAsset[] = [...assets];
    
    try {
      for (const file of Array.from(files)) {
        setCurrentUpload({ fileName: file.name, progress: 0 });
        const result = await uploadFileWithProgress(file);
        
        newAssets.push({
          ...result,
          id: crypto.randomUUID(), // Local ID for UI management if needed
          createdAt: new Date()
        });
      }
      onChange(newAssets);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setCurrentUpload(null);
    }
  };

  const removeAsset = (id: string) => {
    onChange(assets.filter(a => a.id !== id));
  };

  const updateAsset = (id: string, updates: Partial<DigitalAsset>) => {
    onChange(assets.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const getFileIcon = (mimeType: string) => {
    const type = mimeType.toLowerCase();
    if (type.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (type.startsWith('video/')) return <FileVideo className="h-5 w-5 text-purple-500" />;
    if (type.startsWith('audio/')) return <FileAudio className="h-5 w-5 text-pink-500" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className="h-5 w-5 text-amber-500" />;
    if (type.includes('json')) return <FileJson className="h-5 w-5 text-yellow-500" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    return <FileCode className="h-5 w-5 text-emerald-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div 
        className={`
          relative group flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed p-10 transition-all duration-300
          ${dragActive ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-500/10' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'}
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
          <div className={`
             mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-3
             ${isUploading ? 'animate-pulse' : ''}
          `}>
             {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-primary-600" /> : <FileUp className="h-8 w-8 text-primary-600" />}
          </div>
          <p className="text-sm font-black text-gray-900 uppercase tracking-widest">
            {isUploading ? 'Uploading assets...' : 'Deploy digital assets'}
          </p>
          <p className="mt-2 text-xs font-medium text-gray-500">Drag files here or click to open the hangar</p>
          <div className="mt-6 flex items-center gap-6">
             <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secure Gateway</span>
             </div>
             <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Streaming Sync</span>
             </div>
          </div>
        </div>
      </div>

      {/* Upload Progress Overlay */}
      {currentUpload && (
         <div className="bg-white rounded-3xl border border-primary-100 p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
                     <ArrowUpCircle className="h-5 w-5 animate-bounce" />
                  </div>
                  <div>
                     <p className="text-xs font-black text-gray-900 uppercase tracking-widest truncate max-w-[200px]">{currentUpload.fileName}</p>
                     <p className="text-[10px] font-bold text-gray-400">Transmitting to Private Hangar...</p>
                  </div>
               </div>
               <span className="text-sm font-black text-primary-600">{currentUpload.progress}%</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50">
               <div 
                  className="h-full bg-primary-600 transition-all duration-300 rounded-full"
                  style={{ width: `${currentUpload.progress}%` }}
               />
            </div>
         </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100 animate-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Asset List */}
      {assets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Allocated Assets ({assets.length})</h3>
             <button onClick={() => onChange([])} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Clear all</button>
          </div>
          
          <div className="space-y-3">
            {assets.map((asset) => (
              <div key={asset.id} className="group relative bg-white rounded-3xl border border-gray-100 p-5 transition-all hover:shadow-xl hover:border-primary-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-500 transition-colors group-hover:bg-primary-50">
                      {getFileIcon(asset.mimeType)}
                    </div>
                    <div className="min-w-0">
                      {editingId === asset.id ? (
                        <input 
                           autoFocus
                           value={asset.name}
                           onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
                           onBlur={() => setEditingId(null)}
                           onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                           className="bg-transparent border-b border-primary-500 text-sm font-black text-gray-900 outline-none"
                        />
                      ) : (
                        <p className="truncate text-sm font-black text-gray-900 group-hover:text-primary-600 transition-colors flex items-center gap-2">
                           {asset.name}
                           <button onClick={() => setEditingId(asset.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-900 transition-all">
                              <Edit3 className="h-3.5 w-3.5" />
                           </button>
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatBytes(asset.size)}</p>
                         <div className="w-1 h-1 bg-gray-200 rounded-full" />
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{asset.mimeType.split('/')[1] || 'BINARY'}</p>
                         <div className="w-1 h-1 bg-gray-200 rounded-full" />
                         <span className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-widest">
                            <ShieldCheck className="h-3 w-3" /> Protected
                         </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <a 
                      href={asset.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
                      title="Direct Link (Secure)"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button 
                      onClick={() => removeAsset(asset.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                      title="Deallocate"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Industrial Metadata Row */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-6">
                   <div className="flex items-center gap-2">
                      <TagIcon className="h-3.5 w-3.5 text-gray-300" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Allocation Type:</span>
                      <select className="bg-transparent text-[10px] font-black text-gray-900 uppercase tracking-widest outline-none cursor-pointer hover:text-primary-600 transition-colors">
                         <option>Lifetime Download</option>
                         <option>Time-Limited (30 Days)</option>
                         <option>One-Time Access</option>
                      </select>
                   </div>
                   <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-gray-300" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trigger:</span>
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Post-Purchase</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="rounded-2xl bg-primary-500/5 p-6 border border-primary-500/10">
             <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary-600 shrink-0" />
                <p className="text-xs font-medium text-gray-600 leading-relaxed">
                   These assets are stored in the <span className="font-bold text-gray-900">private hangar</span>. 
                   Customers cannot guess these URLs; they will only receive ephemeral, authenticated keys via the download gateway.
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
