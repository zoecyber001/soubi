/**
 * AssetInspector - Detail panel for viewing asset history and files
 * Per FRONTEND_SPEC.md "Detail View"
 * Features: Flight Recorder (history), The Locker (file attachments)
 */

import { useState } from 'react';

// File type icons
const FILE_ICONS = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  txt: '📃',
  md: '📓',
  py: '🐍',
  js: '📜',
  sh: '⚙️',
  bat: '⚙️',
  ps1: '⚙️',
  zip: '📦',
  tar: '📦',
  gz: '📦',
  '7z': '📦',
  default: '📎',
};

// Log type styling
const LOG_STYLES = {
  CREATED: { color: 'text-cyan-neon', icon: '✦' },
  DEPLOYED: { color: 'text-amber-warn', icon: '🎯' },
  RETURNED: { color: 'text-cyan-neon', icon: '↩' },
  COMPROMISED: { color: 'text-red-glitch', icon: '⚠' },
  MODIFICATION: { color: 'text-purple-link', icon: '🔧' },
  FILE_ADDED: { color: 'text-cyan-neon', icon: '📎' },
  FILE_REMOVED: { color: 'text-dim', icon: '🗑' },
  STATUS_CHANGE: { color: 'text-amber-warn', icon: '↔' },
  default: { color: 'text-dim', icon: '•' },
};

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AssetInspector({
  isOpen,
  asset,
  onClose,
  onAddFile,
  onRemoveFile,
  onOpenFile,
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'locker'
  const [isAddingFile, setIsAddingFile] = useState(false);

  if (!isOpen || !asset) return null;

  const logs = asset.logs || [];
  const files = asset.files || [];

  // Sort logs by timestamp descending (newest first)
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  // Handle file selection
  const handleSelectFile = async () => {
    if (!window.soubiAPI?.selectFile) return;
    
    setIsAddingFile(true);
    try {
      const result = await window.soubiAPI.selectFile();
      if (result.success && result.filePath) {
        await onAddFile(asset.id, result.filePath);
      }
    } catch (error) {
      console.error('[Inspector] Select file error:', error);
    } finally {
      setIsAddingFile(false);
    }
  };

  // Handle file open (double-click)
  const handleOpenFile = async (filePath) => {
    if (onOpenFile) {
      await onOpenFile(filePath);
    }
  };

  // Handle file remove
  const handleRemoveFile = async (filePath) => {
    if (confirm('Remove this file from the locker?')) {
      await onRemoveFile(asset.id, filePath);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void/60 backdrop-blur-sm" />

      {/* Inspector Panel - Slide from Left */}
      <div 
        className={`
          relative z-10
          w-[450px] h-full bg-armor border-r border-cyan-neon
          flex flex-col
          shadow-[0_0_40px_rgba(0,255,255,0.2)]
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-dim p-4">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold uppercase text-white truncate pr-4">
              {asset.name}
            </h2>
            <button
              onClick={onClose}
              className="text-dim hover:text-white transition-colors text-xl shrink-0"
            >
              ✕
            </button>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`
              w-2 h-2 rounded-full
              ${asset.status === 'PRISTINE' ? 'bg-cyan-neon' : 
                asset.status === 'COMPROMISED' ? 'bg-red-glitch' :
                asset.status === 'DEPLOYED' ? 'bg-amber-warn' : 'bg-gray-600'}
            `} />
            <span className={`
              uppercase font-semibold
              ${asset.status === 'PRISTINE' ? 'text-cyan-neon' : 
                asset.status === 'COMPROMISED' ? 'text-red-glitch' :
                asset.status === 'DEPLOYED' ? 'text-amber-warn' : 'text-gray-600'}
            `}>
              {asset.status}
            </span>
            <span className="text-dim">|</span>
            <span className="text-dim">{asset.category.replace(/_/g, ' ')}</span>
          </div>

          {/* ID & Serial */}
          <div className="mt-3 text-xs text-dim font-mono">
            <span>ID: {asset.id.substring(0, 8)}...</span>
            {asset.serial_number && (
              <>
                <span className="mx-2">|</span>
                <span>S/N: {asset.serial_number}</span>
              </>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-dim">
          <button
            onClick={() => setActiveTab('history')}
            className={`
              flex-1 py-3 text-xs font-bold uppercase tracking-wide
              transition-colors border-b-2
              ${activeTab === 'history' 
                ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/5' 
                : 'border-transparent text-dim hover:text-white'
              }
            `}
          >
            📜 Flight Recorder
          </button>
          <button
            onClick={() => setActiveTab('locker')}
            className={`
              flex-1 py-3 text-xs font-bold uppercase tracking-wide
              transition-colors border-b-2
              ${activeTab === 'locker' 
                ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/5' 
                : 'border-transparent text-dim hover:text-white'
              }
            `}
          >
            🔒 The Locker ({files.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'history' ? (
            // Flight Recorder Tab
            <div className="p-4">
              {sortedLogs.length === 0 ? (
                <div className="text-center text-dim py-8">
                  <span className="text-2xl">📜</span>
                  <p className="mt-2 text-sm">No history recorded</p>
                </div>
              ) : (
                <div className="relative pl-6">
                  {/* Timeline Line */}
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-cyan-neon via-dim to-transparent" />
                  
                  {/* Log Entries */}
                  <div className="space-y-4">
                    {sortedLogs.map((log, idx) => {
                      const style = LOG_STYLES[log.type] || LOG_STYLES.default;
                      return (
                        <div key={log.id || idx} className="relative">
                          {/* Timeline Dot */}
                          <div className={`
                            absolute -left-4 top-1 w-4 h-4 
                            flex items-center justify-center
                            text-xs
                            ${style.color}
                          `}>
                            {style.icon}
                          </div>
                          
                          {/* Log Content */}
                          <div className="bg-void/50 border border-dim p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold uppercase ${style.color}`}>
                                {log.type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-dim font-mono">
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-white">
                              {log.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // The Locker Tab
            <div className="p-4">
              {/* Drop Zone */}
              <button
                onClick={handleSelectFile}
                disabled={isAddingFile}
                className={`
                  w-full p-4 border-2 border-dashed 
                  flex flex-col items-center justify-center gap-2
                  transition-all cursor-pointer mb-4
                  ${isAddingFile 
                    ? 'border-cyan-neon bg-cyan-neon/10' 
                    : 'border-dim hover:border-bright hover:bg-dim/20'
                  }
                `}
              >
                <span className="text-2xl">{isAddingFile ? '⏳' : '📂'}</span>
                <span className="text-xs text-dim uppercase">
                  {isAddingFile ? 'ADDING FILE...' : 'CLICK TO ATTACH FILE'}
                </span>
              </button>

              {/* File List */}
              {files.length === 0 ? (
                <div className="text-center text-dim py-4">
                  <p className="text-sm">No files attached</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div 
                      key={file.path || idx}
                      className="
                        group flex items-center gap-3 p-3 
                        bg-void border border-dim 
                        hover:border-cyan-neon
                        cursor-pointer transition-colors
                      "
                      onDoubleClick={() => handleOpenFile(file.path)}
                    >
                      <span className="text-xl shrink-0">
                        {getFileIcon(file.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate font-medium">
                          {file.name}
                        </p>
                        <p className="text-xs text-dim">
                          Double-click to open
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(file.path);
                        }}
                        className="
                          opacity-0 group-hover:opacity-100
                          text-dim hover:text-red-glitch
                          transition-all p-1
                        "
                        title="Remove file"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-dim p-3 text-xs text-dim text-center">
          <span>// INSPECTOR v1.0</span>
        </div>
      </div>
    </div>
  );
}
