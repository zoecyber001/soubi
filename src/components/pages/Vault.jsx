import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';

const Vault = () => {
    const { intel, setIntel, deviceStatus, liveDeviceData } = useStore();
    const [selectedIntel, setSelectedIntel] = useState(null);

    useEffect(() => {
        // Initial fetch
        window.soubiAPI.getIntel().then((res) => {
            if (res.success) setIntel(res.data);
        });
    }, [setIntel]);

    const handleDelete = async (id) => {
        if (confirm('Delete this intel record?')) {
            const res = await window.soubiAPI.deleteIntel(id);
            if (res.success) setIntel(res.data);
            if (selectedIntel?.id === id) setSelectedIntel(null);
        }
    };

    const handleLoadToDevice = async (item) => {
        if (!deviceStatus.connected) {
            alert('Ghost Node not connected!');
            return;
        }

        // Simulate loading to device via serial
        // In real implementation: window.soubiAPI.sendSerial({ action: 'EMULATE', type: item.type, data: item.data })
        const res = await window.soubiAPI.sendSerial({
            command: 'LOAD',
            payload: { type: item.type, data: item.data }
        });

        if (res.success) {
            alert(`Loaded ${item.type} to Ghost Node.`);
        } else {
            alert(`Failed to load: ${res.error}`);
        }
    };

    return (
        <div className="h-full w-full bg-[#050505] text-cyan-500 p-6 overflow-hidden flex flex-col">
            <div className="mb-6 flex justify-between items-center border-b border-cyan-900/30 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                        THE VAULT
                    </h1>
                    <p className="text-sm text-cyan-700/60 uppercase tracking-widest mt-1">
                        SECURE INTEL STORAGE // GHOST NODE SYNC
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 text-xs font-mono border ${deviceStatus.connected ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20' : 'border-red-900 text-red-900'} rounded-sm`}>
                        {deviceStatus.connected ? 'GHOST NODE ACTIVE' : 'NO DEVICE'}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Intel List */}
                <div className="w-1/3 overflow-y-auto pr-2 space-y-2">
                    {intel.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedIntel(item)}
                            className={`p-4 border bg-gray-900/40 cursor-pointer transition-all hover:bg-cyan-900/10 ${selectedIntel?.id === item.id ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-cyan-900/30 hover:border-cyan-700'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold bg-cyan-900/40 px-2 py-0.5 rounded text-cyan-300">
                                    {item.type}
                                </span>
                                <span className="text-[10px] text-cyan-600 font-mono">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="font-mono text-sm truncate text-gray-300">
                                {item.data}
                            </div>
                            {item.notes && (
                                <div className="mt-2 text-xs text-cyan-700 italic truncate">
                                    "{item.notes}"
                                </div>
                            )}
                        </div>
                    ))}
                    {intel.length === 0 && (
                        <div className="text-center text-cyan-900/50 py-10 italic">
                            No intel captured. Connect Ghost Node to scan.
                        </div>
                    )}
                </div>

                {/* Detail View */}
                <div className="flex-1 border border-cyan-900/30 bg-black/40 p-6 relative">
                    <div className="absolute top-0 right-0 p-2">
                        <div className="w-4 h-4 border-t border-r border-cyan-500/50" />
                    </div>
                    <div className="absolute bottom-0 left-0 p-2">
                        <div className="w-4 h-4 border-b border-l border-cyan-500/50" />
                    </div>

                    {selectedIntel ? (
                        <div className="h-full flex flex-col">
                            <div className="flex-1">
                                <h2 className="text-xl font-mono text-cyan-300 mb-6 border-b border-cyan-900/30 pb-2">
                                    {selectedIntel.type} // {selectedIntel.id.slice(0, 8)}
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs text-cyan-700 uppercase tracking-widest block mb-2">
                                            Raw Data Payload
                                        </label>
                                        <div className="bg-black border border-cyan-900/50 p-4 font-mono text-sm break-all text-cyan-100 shadow-inner">
                                            {selectedIntel.data}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-cyan-700 uppercase tracking-widest block mb-2">
                                            Field Notes
                                        </label>
                                        <div className="text-gray-400 text-sm">
                                            {selectedIntel.notes || "No notes attached."}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-cyan-700 uppercase tracking-widest block mb-2">
                                            Metadata
                                        </label>
                                        <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-500">
                                            <div>CAPTURED: {new Date(selectedIntel.timestamp).toLocaleString()}</div>
                                            <div>SOURCE: {selectedIntel.source}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-cyan-900/30 flex gap-4">
                                <button
                                    onClick={() => handleLoadToDevice(selectedIntel)}
                                    disabled={!deviceStatus.connected}
                                    className={`flex-1 py-3 font-bold tracking-widest uppercase transition-all ${deviceStatus.connected
                                            ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                                            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                        }`}
                                >
                                    {deviceStatus.connected ? 'Load to Device' : 'Device Offline'}
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedIntel.id)}
                                    className="px-6 py-3 border border-red-900/50 text-red-900 hover:bg-red-900/10 hover:text-red-500 transition-colors uppercase text-xs font-bold tracking-widest"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-cyan-900/40 text-sm font-mono uppercase tracking-widest">
                            Select an item to analyze
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Vault;
