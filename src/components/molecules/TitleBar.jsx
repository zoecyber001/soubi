import React from 'react';

export default function TitleBar({ onOpenSettings, onHome }) {
  return (
    <header 
      className="h-10 bg-armor border-b border-dim flex items-center justify-between px-4 select-none transition-colors hover:bg-armor/80"
      style={{ WebkitAppRegion: 'drag' }}
      onDoubleClick={() => window.soubiAPI?.maximize?.()}
    >
      <div 
        className="flex items-center gap-3 cursor-pointer group" 
        style={{ WebkitAppRegion: 'no-drag' }}
        onClick={onHome}
        title="Go to Dashboard"
      >
        <span className="text-cyan-neon text-sm font-bold tracking-widest group-hover:text-white transition-colors">SOUBI</span>
        <span className="text-xs text-dim group-hover:text-cyan-neon transition-colors">装備</span>
      </div>
      
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={onHome}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-cyan-neon hover:bg-cyan-neon/10 transition-colors mr-1 rounded-sm"
          title="Go to Dashboard"
        >
          ⌂
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-cyan-neon hover:bg-cyan-neon/10 transition-colors mr-2 rounded-sm"
          title="Settings"
        >
          ⚙️
        </button>

        <div className="w-px h-4 bg-dim mx-2" />

        <button 
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dim/50 transition-colors rounded-sm"
          onClick={() => window.soubiAPI?.minimize?.()}
          title="Minimize"
        >─</button>
        <button 
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dim/50 transition-colors rounded-sm"
          onClick={() => window.soubiAPI?.maximize?.()}
          title="Maximize"
        >□</button>
        <button 
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-glitch hover:bg-red-glitch/10 transition-colors rounded-sm"
          onClick={() => window.soubiAPI?.close?.()}
          title="Close"
        >✕</button>
      </div>
    </header>
  );
}
