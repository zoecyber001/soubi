import React from 'react';
import useStore from '../../store/useStore';

export default function Sidebar({ currentView, setCurrentView, deviceStatus }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '⚡' },
        { id: 'armory', label: 'Armory', icon: '📦' },
        // Loadouts is usually a mode, but let's add a placeholder or link to mission mode
        // For now we just stick to existing views plus Vault
    ];

    const fieldOpsItems = [
        { id: 'spectrum', label: 'Spectrum', icon: '📡' }, // Was Radar
        { id: 'access', label: 'Access', icon: '🔓' }, // Was Cloner
        { id: 'hijacker', label: 'Hijacker', icon: '☠️' },
        { id: 'vault', label: 'The Vault', icon: '💾' },
    ];

    return (
        <div className="w-64 bg-black border-r border-dim flex flex-col h-full font-mono">
            <div className="p-6 border-b border-dim">
                <h1 className="text-xl font-bold tracking-tighter text-white">
                    SOUBI <span className="text-cyan-neon text-xs align-top">v0.2</span>
                </h1>
                <p className="text-[10px] text-dim tracking-widest mt-1">FIELD COMMANDER</p>
            </div>

            {/* ZONE 1: LOGISTICS */}
            <div className="p-4">
                <h3 className="text-xs font-bold text-dim uppercase tracking-widest mb-4 px-2">Logistics</h3>
                <div className="space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={`
                w-full text-left px-4 py-2 text-sm font-medium transition-all
                flex items-center gap-3
                ${currentView === item.id
                                    ? 'bg-cyan-neon/10 text-cyan-neon border-l-2 border-cyan-neon'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                                }
              `}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ZONE 2: FIELD OPS (Conditional) */}
            {deviceStatus.connected && (
                <div className="p-4 mt-4 border-t border-dim/30 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-xs font-bold text-amber-warn uppercase tracking-widest">Field Ops</h3>
                        <span className="w-2 h-2 rounded-full bg-amber-warn animate-pulse"></span>
                    </div>

                    <div className="space-y-1">
                        {fieldOpsItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => !item.disabled && setCurrentView(item.id)}
                                disabled={item.disabled}
                                className={`
                  w-full text-left px-4 py-2 text-sm font-medium transition-all
                  flex items-center gap-3
                  ${currentView === item.id
                                        ? 'bg-amber-warn/10 text-amber-warn border-l-2 border-amber-warn'
                                        : item.disabled
                                            ? 'text-dim/30 cursor-not-allowed'
                                            : 'text-gray-400 hover:text-amber-warn hover:bg-amber-warn/5 border-l-2 border-transparent'
                                    }
                `}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-auto p-6 border-t border-dim">
                <div className="flex items-center gap-2 text-xs text-dim">
                    <div className={`w-2 h-2 rounded-full ${deviceStatus.connected ? 'bg-cyan-neon' : 'bg-red-glitch'}`} />
                    <span>{deviceStatus.connected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
            </div>
        </div>
    );
}
