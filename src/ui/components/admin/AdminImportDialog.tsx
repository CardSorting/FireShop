'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Download,
  ShieldAlert
} from 'lucide-react';
import { AdminConfirmDialog, useToast } from './AdminComponents';

interface AdminImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  title: string;
  templateUrl?: string;
  description?: string;
}

export function AdminImportDialog({ 
  open, 
  onClose, 
  onImport, 
  title, 
  templateUrl,
  description = "Upload a CSV file to import records in bulk. Ensure your file follows the required format."
}: AdminImportDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResults(null);
    } else {
      toast('error', 'Please select a valid CSV file');
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Industrialized Header Mapping (Case-insensitive, allows spaces/underscores)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s_]+/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const obj: any = {};
      headers.forEach((header, index) => {
        let val = values[index];
        if (val && val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        
        // Data Type Normalization
        if (header === 'price' || header === 'cost' || header === 'stock' || header === 'weightgrams') {
          obj[header] = val ? Math.round(parseFloat(val)) : 0;
        } else if (header === 'isdigital' || header === 'hasvariants') {
          obj[header] = val?.toLowerCase() === 'true' || val === '1';
        } else {
          obj[header] = val || '';
        }
      });
      data.push(obj);
    }
    return data;
  };

  const validateData = (data: any[]): string[] => {
    const errors: string[] = [];
    data.forEach((row, index) => {
      if (!row.name) errors.push(`Row ${index + 1}: Name is required`);
      if (row.price === undefined || isNaN(row.price)) errors.push(`Row ${index + 1}: Valid price is required`);
      if (row.stock === undefined || isNaN(row.stock)) errors.push(`Row ${index + 1}: Valid stock is required`);
    });
    return errors;
  };

  const handleUpload = async () => {
    if (!file) return;

    setImporting(true);
    setResults(null);
    try {
      const text = await file.text();
      const rawData = parseCSV(text);
      
      if (rawData.length === 0) {
        toast('error', 'The CSV file is empty or invalid');
        setImporting(false);
        return;
      }

      const validationErrors = validateData(rawData);
      if (validationErrors.length > 0) {
        setResults({ success: 0, failed: rawData.length, errors: validationErrors });
        toast('error', 'Validation failed for some records');
        setImporting(false);
        return;
      }

      // Convert to Domain Models
      const drafts = rawData.map(row => ({
        name: row.name,
        description: row.description || 'No description provided.',
        imageUrl: row.imageurl || row.image || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=500',
        price: row.price || 0,
        cost: row.cost || 0,
        stock: row.stock || 0,
        category: row.category || 'Uncategorized',
        rarity: row.rarity || 'Common',
        sku: row.sku || '',
        isDigital: row.isdigital || false,
        status: 'draft',
      }));

      await onImport(drafts);
      setResults({ success: drafts.length, failed: 0, errors: [] });
      toast('success', `Successfully ingested ${drafts.length} records to forensic chain`);
      setTimeout(onClose, 2000);
    } catch (error: any) {
      toast('error', error.message || 'Failed to import records');
      setResults({ success: 0, failed: 1, errors: [error.message] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 mb-6">{description}</p>

          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 transition hover:border-primary-500 hover:bg-primary-50/30 cursor-pointer group"
            >
              <div className="rounded-xl bg-white p-3 shadow-sm group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6 text-gray-400 group-hover:text-primary-600" />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-900">Click to upload or drag and drop</p>
              <p className="mt-1 text-xs text-gray-500">CSV files only (max. 10MB)</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-primary-100 bg-primary-50/30 p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-red-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          {results && (
            <div className={`mt-6 rounded-2xl border p-4 animate-in slide-in-from-top-4 duration-300 ${results.errors.length > 0 ? 'border-red-100 bg-red-50/50' : 'border-green-100 bg-green-50/50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {results.errors.length > 0 ? <AlertCircle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  <span className={`text-xs font-bold uppercase tracking-widest ${results.errors.length > 0 ? 'text-red-900' : 'text-green-900'}`}>
                    Ingestion Results
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase text-gray-400">
                  {results.success} Success • {results.failed} Failed
                </span>
              </div>
              
              {results.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg bg-white/50 p-3 ring-1 ring-black/5">
                  {results.errors.map((err, i) => (
                    <p key={i} className="text-[10px] font-medium text-red-700 flex items-start gap-2">
                      <span className="shrink-0">•</span> {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {templateUrl && !results && (
            <div className="mt-6 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Download className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-600">Need a template?</span>
              </div>
              <a 
                href={templateUrl} 
                download 
                className="text-xs font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4"
              >
                Download CSV Template
              </a>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              disabled={importing}
              className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || importing}
              className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Start Import'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
