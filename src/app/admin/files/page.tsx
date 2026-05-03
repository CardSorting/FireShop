'use client';
import React, { useEffect, useState } from 'react';
import { 
  FileImageIcon, 
  Trash2, 
  Search, 
  Filter, 
  Copy, 
  ExternalLink, 
  Check, 
  Loader2,
  AlertCircle,
  HardDrive,
  LayoutGrid,
  List as ListIcon,
  X,
  ChevronDown
} from 'lucide-react';
import { formatBytes } from '@utils/formatters';
import { useToast } from '@ui/components/admin/AdminComponents';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  folder: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFilesPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/media');
      const data = await response.json();
      if (response.ok) setFiles(data.files);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFiles(); }, []);

  const deleteFiles = async (urls: string[]) => {
    if (!confirm(`Permanently delete ${urls.length} file(s)? This cannot be undone.`)) return;

    try {
      for (const url of urls) {
        await fetch('/api/admin/media', {
          method: 'DELETE',
          body: JSON.stringify({ url }),
        });
      }
      setFiles(prev => prev.filter(f => !urls.includes(f.url)));
      setSelectedUrls([]);
      toast('success', `${urls.length} file(s) deleted`);
    } catch (err) {
      toast('error', 'Failed to delete some files');
    }
  };

  const copyUrl = (url: string, id: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast('success', 'URL copied');
  };

  const toggleSelect = (url: string) => {
    setSelectedUrls(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUrls.length === filtered.length) setSelectedUrls([]);
    else setSelectedUrls(filtered.map(f => f.url));
  };

  const filtered = files.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase()) || 
    f.folder.toLowerCase().includes(query.toLowerCase())
  );

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Files</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Merchandise Assets</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border bg-white px-5 py-2.5 shadow-sm">
            <HardDrive className="h-4 w-4 text-primary-500" />
            <div>
              <p className="text-[9px] font-black uppercase text-gray-400 leading-none mb-1">Total Storage</p>
              <p className="text-sm font-bold text-gray-900 leading-none">{formatBytes(totalSize)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename or folder..." 
            className="w-full rounded-xl border bg-gray-50 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border bg-gray-50 p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-2 transition ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`rounded-lg p-2 transition ${viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
          <button className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition">
            <Filter className="h-4 w-4 text-gray-400" /> Filter
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border-2 border-dashed bg-gray-50/50">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 text-gray-300">
            <FileImageIcon className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No files found</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-xs">We couldn't find any assets matching your search criteria. Try a different query.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((file) => {
            const isSelected = selectedUrls.includes(file.url);
            return (
              <div 
                key={file.id} 
                onClick={() => toggleSelect(file.url)}
                className={`group relative flex flex-col rounded-2xl border bg-white p-2 transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary-500 ring-offset-4' : 'hover:border-gray-300 hover:shadow-md'}`}
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50">
                  <img src={file.url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className={`absolute left-2 top-2 h-5 w-5 rounded-md border bg-white transition flex items-center justify-center ${isSelected ? 'bg-primary-600 border-primary-600' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100 backdrop-blur-[2px]">
                    <button onClick={(e) => { e.stopPropagation(); copyUrl(file.url, file.id); }} className="rounded-lg bg-white p-2 text-gray-700 shadow-xl hover:bg-primary-600 hover:text-white transition"><Copy className="h-3.5 w-3.5" /></button>
                    <a href={file.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="rounded-lg bg-white p-2 text-gray-700 shadow-xl hover:bg-primary-600 hover:text-white transition"><ExternalLink className="h-3.5 w-3.5" /></a>
                  </div>
                </div>
                <div className="mt-3 px-1 pb-1">
                  <p className="truncate text-[10px] font-bold text-gray-900 leading-tight">{file.name}</p>
                  <p className="text-[9px] font-medium text-gray-400 mt-0.5 uppercase tracking-tighter">{file.folder} • {formatBytes(file.size)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" checked={selectedUrls.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                </th>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Folder</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Modified</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((file) => {
                const isSelected = selectedUrls.includes(file.url);
                return (
                  <tr key={file.id} className={`group hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-primary-50/30' : ''}`} onClick={() => toggleSelect(file.url)}>
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(file.url)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-gray-50 shadow-sm">
                          <img src={file.url} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-gray-900 leading-tight">{file.name}</p>
                          <p className="truncate text-[10px] text-gray-400 font-medium font-mono">{file.url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-tight text-gray-600 ring-1 ring-black/5">
                        {file.folder}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-gray-600">
                      {formatBytes(file.size)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-medium text-gray-400">
                      {new Date(file.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyUrl(file.url, file.id)} className="rounded-lg border bg-white p-2 text-gray-500 shadow-sm hover:text-primary-600 hover:border-primary-200 transition">{copiedId === file.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
                        <button onClick={() => deleteFiles([file.url])} className="rounded-lg border bg-white p-2 text-gray-500 shadow-sm hover:text-red-600 hover:border-red-200 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedUrls.length > 0 && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-6 rounded-2xl bg-gray-900 px-6 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-600 text-[10px] font-black text-white">{selectedUrls.length}</span>
              <p className="text-xs font-bold text-white">Files Selected</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => deleteFiles(selectedUrls)}
                className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition"
              >
                <Trash2 className="h-4 w-4" /> Delete Permanently
              </button>
              <button 
                onClick={() => setSelectedUrls([])}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition"
              >
                <X className="h-4 w-4" /> Deselect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Tip */}
      <div className="rounded-3xl border border-amber-100 bg-linear-to-br from-amber-50 to-orange-50 p-6 shadow-sm">
        <div className="flex gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-md ring-1 ring-black/5">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-amber-900">Professional Asset Guard</h4>
            <p className="mt-1 text-xs leading-relaxed text-amber-800 font-medium">
              Files are automatically optimized via **Lean Local Strategy**. 
              Deleting assets here will permanently remove them from the host. Active products using these assets will fall back to default placeholders to prevent checkout friction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
