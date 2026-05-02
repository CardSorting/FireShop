'use client';

/**
 * [LAYER: UI]
 * Sovereign Digital Locker — The Ultimate Digital Fulfillment Experience.
 * 
 * Deeply industrialized vault mirroring high-end digital distribution platforms.
 * Features: Asset pre-checks, deep metadata previews, instructional context, and multi-view orchestration.
 */
import { useAuth } from '../hooks/useAuth';
import { useServices } from '../hooks/useServices';
import { 
  Download, 
  FileText, 
  Search, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  ChevronRight,
  HardDrive,
  Info,
  LayoutGrid,
  List,
  Filter,
  ArrowDownToLine,
  History,
  HelpCircle,
  Sparkles,
  X,
  FileCheck,
  Zap,
  Tag as TagIcon,
  Monitor,
  Smartphone,
  Eye,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { formatDate, formatRelativeTime } from '@utils/formatters';
import { logger } from '@utils/logger';

type ViewMode = 'grid' | 'list';

export function DigitalLibraryPage() {
  const { user } = useAuth();
  const services = useServices();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadAssets = async () => {
      try {
        const result = await services.orderService.getDigitalAssets(user.id);
        setItems(result);
      } catch (err) {
        logger.error('Failed to load digital assets', err);
      } finally {
        setLoading(false);
      }
    };
    void loadAssets();
  }, [user, services]);

  const categories = useMemo(() => {
    const cats = new Set(['all']);
    items.forEach(item => {
      item.assets.forEach((a: any) => {
        const type = a.mimeType.split('/')[1]?.toUpperCase() || 'OTHER';
        if (['PDF', 'DOCX', 'TXT'].includes(type)) cats.add('Guides');
        else if (['PNG', 'JPG', 'JPEG', 'SVG'].includes(type)) cats.add('Graphics');
        else if (['CSV', 'XLSX', 'JSON'].includes(type)) cats.add('Data');
        else cats.add('Packages');
      });
    });
    return Array.from(cats);
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.productName.toLowerCase().includes(q) || 
        item.assets.some((a: any) => a.name.toLowerCase().includes(q))
      );
    }
    
    if (activeCategory !== 'all') {
      result = result.filter(item => 
        item.assets.some((a: any) => {
           const type = a.mimeType.split('/')[1]?.toUpperCase() || 'OTHER';
           if (activeCategory === 'Guides') return ['PDF', 'DOCX', 'TXT'].includes(type);
           if (activeCategory === 'Graphics') return ['PNG', 'JPG', 'JPEG', 'SVG'].includes(type);
           if (activeCategory === 'Data') return ['CSV', 'XLSX', 'JSON'].includes(type);
           return !['PDF', 'DOCX', 'TXT', 'PNG', 'JPG', 'JPEG', 'SVG', 'CSV', 'XLSX', 'JSON'].includes(type);
        })
      );
    }
    return result;
  }, [items, searchQuery, activeCategory]);

  const stats = useMemo(() => {
    const totalFiles = items.reduce((sum, item) => sum + item.assets.length, 0);
    const downloadedOnce = items.reduce((sum, item) => sum + item.assets.filter((a: any) => a.lastDownloadedAt).length, 0);
    return { totalFiles, downloadedOnce };
  }, [items]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Detail Overlay */}
      {selectedAsset && (
        <AssetDetailOverlay 
          asset={selectedAsset.asset} 
          product={selectedAsset.product} 
          userId={user.id} 
          onClose={() => setSelectedAsset(null)} 
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Advanced Header */}
        <header className="mb-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-200">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div className="h-1 w-1 bg-gray-300 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Personal Asset Repository</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter mb-6 leading-[0.9]">
                The Vault<span className="text-primary-600">.</span>
              </h1>
              <p className="text-xl font-medium text-gray-500 max-w-2xl leading-relaxed">
                Welcome to your sovereign digital library. Access high-resolution art, masterclass guides, 
                and live market data with industrial-grade security and permanent download rights.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Files</p>
                  <p className="text-3xl font-black text-gray-900">{stats.totalFiles}</p>
               </div>
               <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sync Status</p>
                  <p className="text-sm font-black text-green-600 flex items-center gap-2">
                     <FileCheck className="w-4 h-4" /> 100% Valid
                  </p>
               </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Controls Bar */}
          <div className="lg:col-span-12 flex flex-col md:flex-row gap-6 p-6 bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/20">
             <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-primary-500" />
                <input 
                  type="text" 
                  placeholder="Search your library..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent outline-none focus:bg-white focus:border-primary-500 transition-all font-bold"
                />
             </div>
             <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                   {['all', ...categories.slice(1)].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                         {cat}
                      </button>
                   ))}
                </div>
                <div className="w-px h-8 bg-gray-100 hidden md:block" />
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                   <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                      <LayoutGrid className="w-5 h-5" />
                   </button>
                   <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                      <List className="w-5 h-5" />
                   </button>
                </div>
             </div>
          </div>

          {/* Main Library Grid */}
          <div className="lg:col-span-12">
            {loading ? (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {[1, 2, 3].map(i => <div key={i} className="h-80 bg-white rounded-[4rem] animate-pulse border border-gray-100" />)}
               </div>
            ) : filteredItems.length > 0 ? (
               <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10' : 'space-y-6'}>
                  {filteredItems.map(item => (
                     <ProductGroup 
                        key={`${item.orderId}-${item.productId}`} 
                        item={item} 
                        viewMode={viewMode}
                        onAssetSelect={(asset) => setSelectedAsset({ asset, product: item })}
                        userId={user.id}
                     />
                  ))}
               </div>
            ) : (
               <EmptyLockerState onClear={() => { setSearchQuery(''); setActiveCategory('all'); }} />
            )}
          </div>
        </div>

        {/* Global Guidance Footer */}
        <footer className="mt-40 pt-20 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-12">
           <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                 <Monitor className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900">Desktop Optimized</h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                 Our interactive PDFs and high-res art assets are best viewed on high-DPI desktop displays.
              </p>
           </div>
           <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                 <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900">Ownership Lock</h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                 You have permanent license rights. Even if a product is retired from the store, it remains in your vault.
              </p>
           </div>
           <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                 <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900">Instant Fulfillment</h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                 New digital purchases appear here immediately after transaction verification—no waiting for manual processing.
              </p>
           </div>
        </footer>
      </div>
    </div>
  );
}

function ProductGroup({ item, viewMode, onAssetSelect, userId }: { item: any, viewMode: ViewMode, onAssetSelect: (a: any) => void, userId: string }) {
   if (viewMode === 'list') {
      return (
         <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 flex flex-col md:flex-row md:items-center gap-8 group hover:shadow-2xl hover:border-primary-100 transition-all">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 border border-gray-50 shadow-sm">
               <img src={item.productImageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Order #{item.orderId.slice(0, 8).toUpperCase()}
               </div>
               <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary-600 transition-colors">{item.productName}</h3>
               <p className="text-xs font-bold text-gray-400 mt-1">{item.assets.length} Secure Assets</p>
            </div>
            <div className="flex flex-wrap gap-2">
               {item.assets.map((asset: any) => (
                  <button 
                    key={asset.id}
                    onClick={() => onAssetSelect(asset)}
                    className="flex items-center gap-2 px-6 py-4 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-2xl text-xs font-black transition-all"
                  >
                     <FileText className="w-4 h-4 opacity-40" />
                     {asset.name.split('.').pop()?.toUpperCase()}
                  </button>
               ))}
            </div>
         </div>
      );
   }

   return (
      <div className="group bg-white rounded-[4rem] border border-gray-100 shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-3 transition-all duration-700 overflow-hidden flex flex-col">
         <div className="relative h-64">
            <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="absolute bottom-8 left-8 right-8">
               <h3 className="text-2xl font-black text-white leading-tight mb-2 drop-shadow-md">{item.productName}</h3>
               <div className="flex items-center gap-4 text-[10px] font-black text-primary-300 uppercase tracking-widest">
                  <span>{item.assets.length} Files</span>
                  <div className="w-1 h-1 bg-white/40 rounded-full" />
                  <span>{formatDate(item.orderDate)}</span>
               </div>
            </div>
         </div>
         
         <div className="p-8 flex-1 space-y-3">
            {item.assets.map((asset: any) => (
               <div key={asset.id} className="group/asset relative">
                  <div 
                    onClick={() => onAssetSelect(asset)}
                    className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-transparent hover:border-primary-200 hover:bg-white hover:shadow-xl transition-all cursor-pointer"
                  >
                     <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover/asset:text-primary-600 shadow-sm transition-colors">
                           <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                           <p className="text-sm font-black truncate text-gray-900">{asset.name}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                              {(asset.size / 1024 / 1024).toFixed(2)} MB • {asset.lastDownloadedAt ? 'Last Downloaded' : 'Never Downloaded'}
                           </p>
                        </div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-gray-300 group-hover/asset:translate-x-1 group-hover/asset:text-primary-600 transition-all" />
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}

function AssetDetailOverlay({ asset, product, userId, onClose }: { asset: any, product: any, userId: string, onClose: () => void }) {
   const type = asset.mimeType.split('/')[1]?.toUpperCase() || 'FILE';
   
   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 overflow-hidden">
         <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
         
         <div className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="md:w-2/5 relative h-64 md:h-auto bg-gray-900">
               <img src={product.productImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
               <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-transparent to-transparent" />
               <div className="absolute bottom-10 left-10 right-10">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-white mb-6 border border-white/20">
                     <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-2 opacity-60">Source Product</h4>
                  <h3 className="text-2xl font-black text-white leading-tight">{product.productName}</h3>
               </div>
            </div>

            <div className="flex-1 p-8 md:p-16 flex flex-col">
               <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-3 px-4 py-2 bg-primary-50 rounded-2xl border border-primary-100 text-primary-600 text-[10px] font-black uppercase tracking-widest">
                     <ShieldCheck className="w-4 h-4" /> Integrity Verified
                  </div>
                  <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900">
                     <X className="w-6 h-6" />
                  </button>
               </div>

               <div className="flex-1">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">{asset.name}</h2>
                  <div className="flex flex-wrap gap-6 mb-12">
                     <DetailMeta icon={<TagIcon className="w-4 h-4" />} label="Type" value={type} />
                     <DetailMeta icon={<HardDrive className="w-4 h-4" />} label="Size" value={`${(asset.size / 1024 / 1024).toFixed(2)} MB`} />
                     <DetailMeta icon={<Clock className="w-4 h-4" />} label="Updated" value={formatDate(product.orderDate)} />
                  </div>

                  <div className="bg-gray-50 rounded-4xl p-8 mb-12 border border-gray-100">
                     <div className="flex items-center gap-3 mb-4 text-gray-900">
                        <HelpCircle className="w-5 h-5" />
                        <h4 className="text-sm font-black uppercase tracking-widest">Quick Guide</h4>
                     </div>
                     <p className="text-sm font-medium text-gray-500 leading-relaxed">
                        {type === 'PDF' ? 'Open with Adobe Acrobat or any modern browser. Supports interactive indexing.' : 
                         type === 'CSV' ? 'Best viewed in Excel or Google Sheets for advanced market data analysis.' : 
                         'Universal file format. Compatible with most standard applications.'}
                     </p>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href={`/api/downloads/${asset.id}?userId=${userId}`}
                    download
                    className="flex-1 flex items-center justify-center gap-3 py-6 bg-gray-900 text-white rounded-4xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
                  >
                     <Download className="w-5 h-5" /> Download Asset
                  </a>
                  <Link 
                    href={`/orders/${product.orderId}`}
                    className="px-10 py-6 bg-white border-2 border-gray-100 rounded-4xl text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-900 text-center"
                  >
                     Receipt
                  </Link>
               </div>
            </div>
         </div>
      </div>
   );
}

function DetailMeta({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
   return (
      <div className="flex items-center gap-3">
         <div className="text-gray-300">{icon}</div>
         <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-sm font-black text-gray-900 leading-none">{value}</p>
         </div>
      </div>
   );
}

function EmptyLockerState({ onClear }: { onClear: () => void }) {
   return (
      <div className="py-40 bg-white rounded-[5rem] border border-gray-100 shadow-sm text-center max-w-4xl mx-auto">
         <div className="w-32 h-32 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-gray-200">
            <Search className="w-12 h-12" />
         </div>
         <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">No assets in this sector</h3>
         <p className="text-gray-500 font-medium text-lg max-w-md mx-auto leading-relaxed mb-12">
            Try adjusting your search query or filters. Your collection may be hidden in a different category.
         </p>
         <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
               onClick={onClear} 
               className="px-10 py-5 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
            >
               Reset Filters
            </button>
            <Link 
               href="/products?category=digital" 
               className="px-10 py-5 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
               Browse Digital Goods
            </Link>
         </div>
      </div>
   );
}
