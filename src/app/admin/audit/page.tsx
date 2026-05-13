'use client';

import { useEffect, useState } from 'react';
import { AdminPageHeader, AdminAuditLogs } from '@ui/components/admin/AdminComponents';
import { Shield, RefreshCw, Search } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  async function loadLogs() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit');
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.userEmail.toLowerCase().includes(filter.toLowerCase()) ||
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.targetId.toLowerCase().includes(filter.toLowerCase())
  );

  async function verifyIntegrity() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit', { method: 'POST' });
      const result = await res.json();
      if (result.valid) {
        alert(`Forensic Integrity Verified: Successfully validated ${result.total} blocks. Zero corruption detected.`);
      } else {
        alert(`CRITICAL CORRUPTION DETECTED: ${result.reason} at block ${result.corruptedId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Audit Logs" 
        subtitle="System-wide activity and forensic logs"
        category="Security"
        actions={
          <div className="flex gap-2">
            <button 
              onClick={verifyIntegrity}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 hover:bg-primary-100 disabled:opacity-50"
            >
              <Shield className="h-4 w-4" />
              Verify Integrity
            </button>
            <button 
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by actor, action, or target..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition"
            />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <Shield className="h-3 w-3 text-primary-500" />
            Immutability Guaranteed
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Scanning blockchain ledger...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-sm font-bold text-red-500 uppercase tracking-widest">{error}</p>
          </div>
        ) : (
          <AdminAuditLogs logs={filteredLogs} />
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <Shield className="h-5 w-5 text-blue-600 shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-tight">BroccoliQ Level 9 Forensics</h4>
          <p className="text-[10px] text-blue-700 leading-relaxed mt-0.5">
            These logs are system-generated and reflect every critical mutation within the DreamBees engine. 
            Modifying or deleting these logs directly via the interface is restricted to Sovereign-level credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
