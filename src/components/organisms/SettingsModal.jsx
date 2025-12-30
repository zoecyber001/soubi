import React from 'react';

export default function SettingsModal({ onClose, onReplayOnboarding }) {
  const handleFactoryReset = async () => {
    // Standard JS confirm dialogs (simple and effective for this critical action)
    if (confirm('WARNING: PERMANENT DATA LOSS.\n\nThis will delete ALL assets, loadouts, and history logs.\nAre you absolutely sure?')) {
      if (confirm('FINAL WARNING: This action cannot be undone.\n\nProceed with Factory Reset?')) {
        if (window.soubiAPI?.factoryReset) {
          await window.soubiAPI.factoryReset();
          onClose(); // Window should reload, but cleanup state
        }
      }
    }
  };

  const handleExport = async () => {
    if (window.soubiAPI?.exportData) {
      const result = await window.soubiAPI.exportData();
      if (result.success) {
        alert('Database exported successfully.');
      } else if (!result.cancelled) {
        alert('Export failed: ' + result.error);
      }
    }
  };

  const handleImport = async () => {
    if (confirm('WARNING: IMPORT OVERWRITE.\n\nImporting data will completely replace your current database.\nAny unsaved changes will be lost.\n\nProceed?')) {
      if (window.soubiAPI?.importData) {
        const result = await window.soubiAPI.importData();
        if (result.success) {
          // App will reload automatically
        } else if (!result.cancelled) {
          alert('Import failed: ' + result.error);
        }
      }
    }
  };

  const handleReplayOnboarding = () => {
    localStorage.removeItem('soubi_onboarding_complete');
    onClose();
    if (onReplayOnboarding) onReplayOnboarding();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-void border border-dim rounded-lg w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-10 bg-armor border-b border-dim flex items-center justify-between px-4">
          <h2 className="text-sm font-bold tracking-widest text-dim flex items-center gap-2">
            <span>⚙️</span> SYSTEM SETTINGS
          </h2>
          <button onClick={onClose} className="text-dim hover:text-white transition-colors">✕</button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* HELP & INFO */}
          <div className="p-4 border border-purple-link/30 rounded bg-purple-link/5">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2 uppercase tracking-wider text-sm">
              <span className="text-purple-link">📖</span> Help & Info
            </h3>
            
            <button 
              onClick={handleReplayOnboarding}
              className="w-full h-10 border border-purple-link text-purple-link hover:bg-purple-link hover:text-black font-bold tracking-widest text-xs transition-all flex items-center justify-center gap-2 uppercase"
            >
              <span>🎯</span> Replay Onboarding Tour
            </button>
            <p className="text-[10px] text-dim mt-2 text-center">
              New to SOUBI? Re-watch the welcome tour to learn the basics.
            </p>
          </div>

          {/* DATA PORT */}
          <div className="p-4 border border-dim rounded bg-armor/50">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
              <span className="text-cyan-neon">💾</span> Data Operations
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleExport}
                className="h-10 border border-cyan-neon text-cyan-neon hover:bg-cyan-neon hover:text-black font-bold tracking-widest text-xs transition-all flex items-center justify-center gap-2 uppercase"
              >
                <span>⬆</span> Export Data
              </button>
              
              <button 
                onClick={handleImport}
                className="h-10 border border-amber-warn text-amber-warn hover:bg-amber-warn hover:text-black font-bold tracking-widest text-xs transition-all flex items-center justify-center gap-2 uppercase"
              >
                <span>⬇</span> Import Data
              </button>
            </div>
            <p className="text-[10px] text-dim mt-2 text-center">
              Backup your Armory to a .JSON file or restore from a backup.
            </p>
          </div>

          <div className="p-4 border border-red-glitch/30 bg-red-glitch/5 rounded relative overflow-hidden group">
            <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />
            
            <h3 className="text-red-glitch font-bold mb-2 flex items-center gap-2 uppercase tracking-wider text-sm">
              <span className="animate-pulse">⚠</span> Danger Zone
            </h3>
            
            <p className="text-xs text-dim mb-4 leading-relaxed">
              Performing a factory reset will completely wipe the local database (`soubi_db.json`). 
              All assets, files, and loadouts will be permanently destroyed.
            </p>
            
            <button 
              onClick={handleFactoryReset}
              className="w-full h-10 border border-red-glitch text-red-glitch hover:bg-red-glitch hover:text-black font-bold tracking-widest text-xs transition-all flex items-center justify-center gap-2 uppercase"
            >
              <span>☢</span> Initialize Factory Reset
            </button>
          </div>
          
          <div className="text-center">
             <p className="text-[10px] text-dim/50 font-mono">SOUBI SYSTEM v0.1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
