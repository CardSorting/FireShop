/**
 * [LAYER: UI]
 * Database Migration Component for Admin Panel
 */
import { useState } from 'react';
import { Database, Cloud, RefreshCw, CheckCircle } from 'lucide-react';
import { MigrationService } from '@infrastructure/services/MigrationService';
import { getSelectedProvider } from '@infrastructure/dbProvider';

export function DatabaseMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const provider = getSelectedProvider();

  const handleMigrate = async () => {
    if (!window.confirm('Are you sure you want to migrate all data to Firebase? This will overwrite matching records in Firestore.')) {
      return;
    }

    setIsMigrating(true);
    setLogs([]);
    setComplete(false);

    try {
      const migrator = new MigrationService();
      await migrator.migrateToFirebase((msg) => {
        setLogs((prev) => [...prev, msg]);
      });
      setComplete(true);
    } catch (error: any) {
      setLogs((prev) => [...prev, `ERROR: ${error.message}`]);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Database Migration</h2>
            <p className="text-sm text-gray-500">Current Provider: <span className="font-semibold uppercase">{provider}</span></p>
          </div>
        </div>
        
        {provider === 'sqlite' && !complete && (
          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
          >
            {isMigrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
            Migrate to Firebase
          </button>
        )}
      </div>

      {(logs.length > 0 || isMigrating) && (
        <div className="p-6 bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Migration Status</h3>
            {complete && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-blue-300 max-h-64 overflow-y-auto space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                <span className={log.startsWith('ERROR') ? 'text-red-400' : ''}>{log}</span>
              </div>
            ))}
            {isMigrating && (
              <div className="animate-pulse flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Processing...
              </div>
            )}
          </div>

          {complete && (
            <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">Success!</p>
                <p className="text-sm text-green-700">Data has been successfully pushed to Firebase. To finish, please update your environment variables and restart the application.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {provider === 'firebase' && (
        <div className="p-6 bg-blue-50/50 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Connected to Firebase</p>
            <p className="text-sm text-blue-800">You are currently using the cloud database. SQLite local storage is in standby.</p>
          </div>
        </div>
      )}
    </div>
  );
}
