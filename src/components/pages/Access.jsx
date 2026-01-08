import React, { useEffect } from 'react';
import useStore from '../../store/useStore';

export default function Access() {
    const accessLogs = useStore(state => state.accessLogs);
    const addAccessLog = useStore(state => state.addAccessLog);

    // Listen for live updates
    useEffect(() => {
        if (window.soubiAPI?.onAccessRead) {
            return window.soubiAPI.onAccessRead((packet) => {
                addAccessLog(packet);
            });
        }
    }, [addAccessLog]);

    return (
        <div className="h-full flex flex-col p-6 animate-in fade-in">
            {/* Header */}
            <h2 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-2 mb-6">
                <span className="text-purple-500">///</span> ACCESS CONTROL
            </h2>

            <div className="flex-1 grid grid-cols-2 gap-6">
                {/* Reader Region */}
                <div className="bg-armor border border-dim p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
                    <div className="w-48 h-48 border-2 border-dashed border-dim rounded-full flex items-center justify-center relative">
                        <div className="w-40 h-40 bg-void rounded-full flex items-center justify-center">
                            <span className="text-4xl">📡</span>
                        </div>
                        <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping"></div>
                    </div>
                    <p className="mt-8 text-dim font-mono tracking-widest text-sm">WAITING FOR TAG...</p>
                    <p className="text-[10px] text-dim/50 font-mono mt-1">13.56 MHz (NFC) / 125 kHz (RFID)</p>
                </div>

                {/* Access Log */}
                <div className="bg-void border border-dim flex flex-col">
                    <div className="bg-armor px-4 py-2 border-b border-dim text-xs font-bold text-dim uppercase">
                        Recent Scans
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-2">
                        {accessLogs.length === 0 ? (
                            <div className="text-center text-dim mt-20">NO SCANS RECORDED</div>
                        ) : (
                            accessLogs.map((log, i) => (
                                <div key={i} className="bg-armor p-3 border-l-2 border-purple-500">
                                    <div className="flex justify-between">
                                        <span className="text-white font-mono font-bold">{log.data}</span>
                                        <span className="text-xs text-dim">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-xs text-purple-400 mt-1">
                                        PROTOCOL: {log.meta?.protocol || 'Generic UID'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
